import dgram from 'dgram';
import { getPrimaryLanIp } from './network-info';
import { getSetting } from '../db';

export class UdpBeaconService {
  private socket: dgram.Socket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private readonly targetPort = 5001;
  private readonly broadcastAddress = '255.255.255.255';
  private readonly intervalMs = 3000;
  private isRunning = false;
  private lastBroadcast: number = 0;
  private broadcastCount: number = 0;

  public start(): Promise<void> {
    if (this.isRunning) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.socket.on('error', (err) => {
          console.error('[UDP Beacon] Socket error:', err);
        });

        this.socket.bind(() => {
          if (!this.socket) return resolve();
          try {
            this.socket.setBroadcast(true);
            this.isRunning = true;
            console.log(`[UDP Beacon] Broadcaster started. Broadcasting to ${this.broadcastAddress}:${this.targetPort} every 3s.`);

            this.broadcast();

            this.timer = setInterval(() => {
              this.broadcast();
            }, this.intervalMs);
          } catch (err) {
            console.error('[UDP Beacon] Failed to set broadcast option:', err);
          }
          resolve();
        });
      } catch (err) {
        console.error('[UDP Beacon] Error initializing socket:', err);
        resolve();
      }
    });
  }

  private broadcast(): void {
    if (!this.socket || !this.isRunning) return;

    try {
      const serverName = getSetting('store_name', "OCTOPIZZA'S Fast Food");
      const lanIp = getPrimaryLanIp();

      const payload = JSON.stringify({
        service: 'POS_LOCAL_SERVER',
        port: 5000,
        name: serverName,
        hostIp: lanIp,
        timestamp: Date.now(),
      });

      const message = Buffer.from(payload);
      this.socket.send(message, 0, message.length, this.targetPort, this.broadcastAddress, (err) => {
        if (err) {
          // If the network interface doesn't support subnet broadcast temporarily, log debug
          // (common on some Windows VPN/virtual adapters)
        } else {
          this.lastBroadcast = Date.now();
          this.broadcastCount++;
        }
      });
    } catch (err) {
      console.error('[UDP Beacon] Broadcast error:', err);
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    console.log('[UDP Beacon] Broadcaster stopped.');
  }

  public getStatus() {
    return {
      active: this.isRunning,
      targetPort: this.targetPort,
      intervalMs: this.intervalMs,
      lastBroadcast: this.lastBroadcast,
      broadcastCount: this.broadcastCount,
      hostIp: getPrimaryLanIp(),
    };
  }
}

export const udpBeaconService = new UdpBeaconService();
