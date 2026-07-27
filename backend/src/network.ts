/**
 * Determines a "room id" for a connecting socket based on its network.
 *
 * In practice, every device that opens this app is talking to the SAME
 * server instance running on someone's laptop/PC on the LAN (e.g.
 * http://192.168.1.20:4000). That alone already scopes everyone to the
 * same physical WiFi network. On top of that, we bucket clients by the
 * /24 subnet of their IP address, so if this server is ever exposed on
 * a machine with multiple interfaces (e.g. VPN + WiFi), devices are
 * still grouped with only their real local-network peers instead of
 * being mixed together.
 *
 * This keeps the design ready to swap in a smarter strategy later
 * (e.g. matching BSSID via a companion mobile check, or explicit room
 * codes) without touching the socket handlers.
 */

const DEFAULT_ROOM = 'lan-room';

export function resolveClientIp(rawAddress: string | undefined): string {
  if (!rawAddress) return '0.0.0.0';
  // Strip IPv6-mapped IPv4 prefix e.g. ::ffff:192.168.1.10
  const cleaned = rawAddress.replace('::ffff:', '');
  return cleaned;
}

export function subnetKeyForIp(ip: string): string {
  // IPv4: bucket by first 3 octets (a typical /24 home/office WiFi subnet)
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (ipv4Match) {
    return `v4-${ipv4Match[1]}.${ipv4Match[2]}.${ipv4Match[3]}`;
  }

  // Loopback / same-machine testing (multiple browser tabs on one PC)
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') {
    return 'local-loopback';
  }

  // IPv6: bucket by first 4 groups (rough approximation of a local prefix)
  const ipv6Groups = ip.split(':').filter(Boolean);
  if (ipv6Groups.length >= 4) {
    return `v6-${ipv6Groups.slice(0, 4).join(':')}`;
  }

  return DEFAULT_ROOM;
}

export function resolveRoomId(rawAddress: string | undefined): string {
  const ip = resolveClientIp(rawAddress);
  return subnetKeyForIp(ip);
}
