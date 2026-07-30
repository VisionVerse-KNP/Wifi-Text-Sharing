import { useEffect } from 'react';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../lib/seoConfig';

export interface SEOOptions {
  /** Page title. SITE_NAME is appended automatically unless the title already includes it. */
  title: string;
  description: string;
  keywords?: string;
  /** Absolute or root-relative path, e.g. "/wifi". Combined with SITE_URL for canonical + OG url. */
  path: string;
  robots?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  /** Zero or more JSON-LD objects to inject as separate <script type="application/ld+json"> tags. */
  jsonLd?: Record<string, unknown>[];
}

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets document title + meta/canonical/OG/Twitter tags + per-route JSON-LD for the
 * current page, and restores the previous document title on unmount. Dependency-free
 * (no react-helmet) — this is a single-page app so there's only ever one "route" of
 * head tags active at a time, which a plain DOM upsert handles without extra libs.
 */
export function useSEO(options: SEOOptions) {
  const {
    title,
    description,
    keywords,
    path,
    robots = 'index, follow, max-image-preview:large',
    ogType = 'website',
    ogImage = DEFAULT_OG_IMAGE,
    jsonLd = [],
  } = options;

  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    upsertMetaByName('description', description);
    if (keywords) upsertMetaByName('keywords', keywords);
    upsertMetaByName('robots', robots);
    upsertCanonical(url);

    upsertMetaByProperty('og:type', ogType);
    upsertMetaByProperty('og:site_name', SITE_NAME);
    upsertMetaByProperty('og:title', fullTitle);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:url', url);
    upsertMetaByProperty('og:image', ogImage);

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', fullTitle);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', ogImage);

    // Inject this route's JSON-LD, tagged so we can clean up on unmount/route change
    // without touching the global Organization/WebApplication scripts in index.html.
    const injectedNodes: HTMLScriptElement[] = [];
    jsonLd.forEach((data, i) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-route', path);
      script.setAttribute('data-seo-index', String(i));
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      injectedNodes.push(script);
    });

    return () => {
      document.title = previousTitle;
      injectedNodes.forEach((node) => node.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, keywords, path, robots, ogType, ogImage, JSON.stringify(jsonLd)]);
}
