/**
 * Resolves the Socket.IO / API server URL.
 *
 * Priority:
 *  1. VITE_SERVER_URL or VITE_BACKEND_URL env var, if set at build time.
 *  2. Otherwise, assume the backend runs on the SAME host the page was
 *     loaded from on port 4000.
 */
export function getServerUrl(): string {
  const rawEnvUrl =
    (import.meta.env.VITE_SERVER_URL as string | undefined) ??
    (import.meta.env.VITE_BACKEND_URL as string | undefined);

  const envUrl = rawEnvUrl?.trim().replace(/^['\"]|['\"]$/g, '').replace(/\/$/, '');
  if (envUrl) return envUrl;

  const { protocol, hostname } = window.location;
  const backendPort = import.meta.env.VITE_SERVER_PORT || '4000';
  return `${protocol}//${hostname}:${backendPort}`;
}
