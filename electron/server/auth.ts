import { Request, Response, NextFunction } from 'express';
import { getSetting } from '../db';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow /api/ping to be queried without auth (or to test auth)
  if (req.path === '/api/ping') {
    return next();
  }

  // Internal localhost calls from the desktop UI itself
  const clientIp = req.socket.remoteAddress || '';
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';

  // Check X-API-Key header
  const configuredPin = getSetting('pairing_pin', '1234');
  const providedKey = req.headers['x-api-key'] || req.headers['x-pairing-pin'] || req.query.apiKey;

  if (providedKey === configuredPin || isLocalhost) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid or missing X-API-Key (Pairing PIN). Check POS Desktop settings.',
  });
}
