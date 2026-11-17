import os from 'os';

export interface NetworkAddress {
  interfaceName: string;
  ip: string;
  family: string;
  isInternal: boolean;
}

export function getLocalIpAddresses(): NetworkAddress[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkAddress[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    for (const net of netList) {
      // IPv4 and not loopback (127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interfaceName: name,
          ip: net.address,
          family: net.family,
          isInternal: net.internal,
        });
      }
    }
  }

  // Fallback if no non-internal found (e.g. offline standalone with no Wi-Fi router)
  if (results.length === 0) {
    results.push({
      interfaceName: 'Loopback',
      ip: '127.0.0.1',
      family: 'IPv4',
      isInternal: true,
    });
  }

  return results;
}

export function getPrimaryLanIp(): string {
  const ips = getLocalIpAddresses();
  // Prioritize typical LAN subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const wifiOrEth = ips.find((i) => !i.isInternal && (i.ip.startsWith('192.168.') || i.ip.startsWith('10.') || i.ip.startsWith('172.')));
  if (wifiOrEth) return wifiOrEth.ip;
  return ips[0]?.ip || '127.0.0.1';
}
