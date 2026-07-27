import { useSocketRoom } from './useSocketRoom';

/**
 * Convenience wrapper around useSocketRoom for the LAN broadcast mode
 * (Mode 1). Kept as a separate hook so existing LAN-room components don't
 * need to know about the private-room join configuration.
 */
export function useRoom(displayName: string | null) {
  return useSocketRoom(displayName, displayName ? { mode: 'lan' } : null);
}
