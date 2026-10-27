import { supabase } from "./supabaseClient";

export class ProtectedApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProtectedApiError";
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export async function protectedApiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ProtectedApiError(
      "Unable to retrieve your authentication session. Please sign in again.",
      401,
    );
  }

  if (!session?.access_token) {
    throw new ProtectedApiError(
      "Your session has expired. Please sign in again.",
      401,
    );
  }

  // Use a relative URL so Vite proxies /api requests to the Express API.
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, window.location.origin);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    signal: options.signal,
  });

  if (response.status === 401) {
    throw new ProtectedApiError(
      "Authentication failed. Please sign in again.",
      401,
    );
  }

  if (response.status === 403) {
    throw new ProtectedApiError(
      "Administrator access is required to view analytics.",
      403,
    );
  }

  if (!response.ok) {
    let message = `Analytics request failed (${response.status}).`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        message = body.error;
      } else if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {
      // Keep the fallback message when the response isn't JSON.
    }

    throw new ProtectedApiError(message, response.status);
  }

  return (await response.json()) as T;
}
