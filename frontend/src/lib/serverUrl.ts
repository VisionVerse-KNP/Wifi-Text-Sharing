/**
 * Resolves the Socket.IO / API server URL.
 *
 * Priority:
 *  1. VITE_SERVER_URL env var, if set at build time (recommended for prod
 *     deployments where frontend and backend run on different ports/hosts).
 *  2. Otherwise, assume the backend runs on the SAME host the page was
 *     loaded from (crucial for LAN use: whatever IP a phone used to reach
 *     the frontend, e.g. 192.168.1.20, is also used to reach the backend),
 *     on port 4000.
 */
export function getServerUrl(): string {
  const envUrl = import.meta.env.VITE_SERVER_URL as string | undefined;
  if (envUrl && envUrl.length > 0) return envUrl;

  const { protocol, hostname } = window.location;
  const backendPort = import.meta.env.VITE_SERVER_PORT || '4000';
  return `${protocol}//${hostname}:${backendPort}`;
}
