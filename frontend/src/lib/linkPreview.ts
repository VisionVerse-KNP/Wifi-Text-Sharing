import { LinkPreview } from '../types';
import { getServerUrl } from './serverUrl';

const URL_REGEX = /(https?:\/\/[^\s<>"]+)/i;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[1] : null;
}

const cache = new Map<string, Promise<LinkPreview | null>>();

export function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  const existing = cache.get(url);
  if (existing) return existing;

  const promise = fetch(`${getServerUrl()}/api/link-preview?url=${encodeURIComponent(url)}`)
    .then((res) => (res.ok ? (res.json() as Promise<LinkPreview>) : null))
    .catch(() => null);

  cache.set(url, promise);
  return promise;
}
