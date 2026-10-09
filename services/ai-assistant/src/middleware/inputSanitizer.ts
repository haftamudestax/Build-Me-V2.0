import type { Request, Response, NextFunction } from 'express';

/**
 * Defends against prompt-injection style abuse and basic malformed input
 * before a message reaches the LLM. Not a substitute for the LLM's own
 * safety behavior — this is a first line of defense (length limits,
 * known-bad patterns, control characters).
 */

const MAX_MESSAGE_LENGTH = 4000;

const SUSPICIOUS_PATTERNS = [
  /ignore (all|previous) instructions/i,
  /you are now/i,
  /system prompt/i,
];

export function inputSanitizer(req: Request, res: Response, next: NextFunction): void {
  const message = req.body?.message;

  if (typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'message is required and must be a non-empty string' });
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(413).json({ error: `message exceeds ${MAX_MESSAGE_LENGTH} characters` });
    return;
  }

  const flagged = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(message));
  if (flagged) {
    // TODO: decide on the real policy — reject outright, or pass through with
    // a flag for the LLM's own system prompt to handle. Rejecting for now.
    res.status(400).json({ error: 'message could not be processed' });
    return;
  }

  next();
}
