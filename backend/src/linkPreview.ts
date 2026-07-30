import dns from 'dns';
import net from 'net';
import { LinkPreview } from './types';

const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1.5 * 1024 * 1024; // 1.5MB — plenty for <head>, avoids downloading huge pages
const MAX_REDIRECTS = 3;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_ENTRIES = 500;

const cache = new Map<string, { data: LinkPreview | null; expiresAt: number }>();

function cacheSet(key: string, data: LinkPreview | null) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
    if (lower.startsWith('::ffff:')) return isPrivateIp(lower.replace('::ffff:', '')); // IPv4-mapped
    return false;
  }
  return true; // not a valid IP literal at all — treat cautiously
}

async function hostnameIsSafe(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.local') || lower.endsWith('.internal')) return false;

  const literalVersion = net.isIP(hostname);
  if (literalVersion) return !isPrivateIp(hostname);

  try {
    const results = await dns.promises.lookup(hostname, { all: true });
    if (results.length === 0) return false;
    return results.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const tagRegex = /<meta\s+[^>]*>/gi;
  const attrRegex = /([a-zA-Z][\w:-]*)\s*=\s*"([^"]*)"|([a-zA-Z][\w:-]*)\s*=\s*'([^']*)'/g;

  for (const tagMatch of html.matchAll(tagRegex)) {
    const tag = tagMatch[0];
    const attrs: Record<string, string> = {};
    for (const attrMatch of tag.matchAll(attrRegex)) {
      const name = (attrMatch[1] ?? attrMatch[3])?.toLowerCase();
      const value = attrMatch[2] ?? attrMatch[4];
      if (name) attrs[name] = value;
    }
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content !== undefined) meta[key.toLowerCase()] = attrs.content;
  }
  return meta;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function resolveUrl(base: string, maybeRelative: string): string | null {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WiFiTextShareLinkPreview/1.0; +https://wifitextshare.example.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readBodyCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    text += decoder.decode(value, { stream: true });
    if (received >= MAX_RESPONSE_BYTES) {
      reader.cancel();
      break;
    }
  }
  return text;
}

/**
 * Fetches OpenGraph/meta preview data for a URL. Returns null if the URL is
 * unsafe (private/loopback network, non-http(s)), unreachable, or not HTML.
 * Results are cached in-memory for CACHE_TTL_MS.
 */
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview | null> {
  const cached = cache.get(rawUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    cacheSet(rawUrl, null);
    return null;
  }

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') {
      cacheSet(rawUrl, null);
      return null;
    }
    // eslint-disable-next-line no-await-in-loop
    if (!(await hostnameIsSafe(current.hostname))) {
      cacheSet(rawUrl, null);
      return null;
    }

    let res: Response;
    try {
      // eslint-disable-next-line no-await-in-loop
      res = await fetchOnce(current.toString());
    } catch {
      cacheSet(rawUrl, null);
      return null;
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        cacheSet(rawUrl, null);
        return null;
      }
      const next = resolveUrl(current.toString(), location);
      if (!next) {
        cacheSet(rawUrl, null);
        return null;
      }
      current = new URL(next);
      continue;
    }

    if (!res.ok) {
      cacheSet(rawUrl, null);
      return null;
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      cacheSet(rawUrl, null);
      return null;
    }

    // eslint-disable-next-line no-await-in-loop
    const html = await readBodyCapped(res);
    const meta = extractMetaTags(html);
    const finalUrl = current.toString();

    const preview: LinkPreview = {
      url: rawUrl,
      title: meta['og:title'] || meta['twitter:title'] || extractTitleTag(html),
      description: meta['og:description'] || meta['twitter:description'] || meta.description || null,
      image: (() => {
        const img = meta['og:image'] || meta['twitter:image'];
        return img ? resolveUrl(finalUrl, img) : null;
      })(),
      domain: current.hostname.replace(/^www\./, ''),
    };

    cacheSet(rawUrl, preview);
    return preview;
  }

  cacheSet(rawUrl, null);
  return null;
}
