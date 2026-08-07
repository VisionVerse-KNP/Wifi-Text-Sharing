/**
 * Site-wide SEO constants.
 *
 * SITE_URL should be updated to the real production domain once deployed.
 * It's used to build canonical URLs, Open Graph URLs, and JSON-LD @id/item
 * values. Falling back to window.location.origin keeps things correct on
 * previews/staging without code changes.
 */
export const SITE_NAME = 'Local WiFi Share';

export const SITE_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'https://localwifishare.netlify.app';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
