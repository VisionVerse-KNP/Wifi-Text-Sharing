import { Helmet } from 'react-helmet-async';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../lib/seoConfig';

interface SEOProps {
  title: string;
  description: string;
  /** Array of keyword phrases — joined into the keywords meta tag. */
  keywords?: string[];
  /** Root-relative path, e.g. "/wifi" — combined with SITE_URL for canonical + OG/Twitter url. */
  path: string;
  author?: string;
  image?: string;
  /** Defaults to indexable. Private/dead-end routes (invite links, 404) pass 'noindex, nofollow'. */
  robots?: string;
  ogType?: 'website' | 'article';
  /** Extra JSON-LD blocks for this route (BreadcrumbList, FAQPage, etc). Site-wide Organization/WebSite schema lives in index.html. */
  jsonLd?: Record<string, unknown>[];
}

export default function SEO({
  title,
  description,
  keywords = [],
  path,
  author = SITE_NAME,
  image = DEFAULT_OG_IMAGE,
  robots = 'index, follow, max-image-preview:large',
  ogType = 'website',
  jsonLd = [],
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Per-route structured data (breadcrumbs, FAQ, etc) */}
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
