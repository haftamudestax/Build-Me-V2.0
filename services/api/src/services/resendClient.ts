
import { Resend } from "resend";

/**
 * Creates the Resend email client.
 *
 * Keeping this behind a local adapter makes the email provider
 * straightforward to mock in unit tests.
 */
export function createResendClient(apiKey: string) {
  return new Resend(apiKey);
}
