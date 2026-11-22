import { getTalkToUsConfig } from "./talkToUsConfig";

const REQUEST_TIMEOUT_MS = 15_000;

export type TalkToUsErrorCode =
  | "not_configured"
  | "network"
  | "timeout"
  | "rejected";

export class TalkToUsSubmitError extends Error {
  readonly code: TalkToUsErrorCode;

  constructor(code: TalkToUsErrorCode, message: string) {
    super(message);
    this.name = "TalkToUsSubmitError";
    this.code = code;
  }
}

export interface TalkToUsSubmission {
  name: string;
  email: string;
  message: string;
  idempotencyKey: string;
}

export interface TalkToUsReceipt {
  reference: string;
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function serverMessage(body: Record<string, unknown>): string | null {
  // `message` (custom APIs) or `detail` (FastAPI).
  for (const key of ["message", "detail"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return null;
}

/**
 * The single place that sends a Talk To Us message. If your referral or Work
 * With Me flows already have a shared request helper (base URL, visitor
 * session), call it from here instead of fetch.
 */
export async function submitTalkToUsMessage(
  input: TalkToUsSubmission,
): Promise<TalkToUsReceipt> {
  const { messageEndpoint } = getTalkToUsConfig();

  if (!messageEndpoint) {
    throw new TalkToUsSubmitError(
      "not_configured",
      "Messages are not available right now. Please use WhatsApp or call us instead.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(messageEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        message: input.message,
        source: "website",
      }),
      signal: controller.signal,
    });

    const body = await readBody(response);

    if (!response.ok) {
      throw new TalkToUsSubmitError(
        "rejected",
        serverMessage(body) ??
          "We could not send your message. Please try again.",
      );
    }

    return {
      reference:
        typeof body.reference === "string" && body.reference
          ? body.reference
          : input.idempotencyKey.slice(0, 8).toUpperCase(),
    };
  } catch (error) {
    if (error instanceof TalkToUsSubmitError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TalkToUsSubmitError(
        "timeout",
        "This is taking too long. Please check your connection and try again.",
      );
    }

    throw new TalkToUsSubmitError(
      "network",
      "We could not reach the server. Please check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }
}