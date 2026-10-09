import type { Request, Response, NextFunction } from 'express';

/**
 * Basic per-user rate limiting for assistant messages, to prevent abuse
 * and control LLM provider cost. Replace the in-memory map with Redis
 * (or similar) once running more than one instance of this service.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const requestLog = new Map<string, number[]>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as any).userId ?? req.ip ?? 'anonymous';
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  next();
}
