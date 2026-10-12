import type { Request, Response, NextFunction } from 'express';

/**
 * Central error handler. Never leak provider error details, stack traces,
 * or internal messages to the client — log them server-side and return a
 * clean, generic error to the caller.
 */

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ai-assistant] error:', err);

  if (err instanceof Error && err.message === 'LLM_API_KEY is not set') {
    res.status(503).json({ error: 'Assistant is temporarily unavailable.' });
    return;
  }

  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
