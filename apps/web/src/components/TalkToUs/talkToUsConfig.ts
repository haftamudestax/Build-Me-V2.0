/** Contact details come from env vars, so no number is hard-coded in the repo. */
export interface TalkToUsConfig {
  /** Digits with the country code. Empty hides WhatsApp. */
  whatsappNumber: string;
  /** Any readable format. Empty hides Call. */
  phoneNumber: string;
  /** URL that accepts the message form. Empty switches messages off. */
  messageEndpoint: string;
}

function readEnv(name: string): string {
  const value: unknown = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

// Read on every call (not at import time) so tests can change the values.
export function getTalkToUsConfig(): TalkToUsConfig {
  return {
    whatsappNumber: readEnv("VITE_TALK_TO_US_WHATSAPP"),
    phoneNumber: readEnv("VITE_TALK_TO_US_PHONE"),
    messageEndpoint: readEnv("VITE_TALK_TO_US_MESSAGE_ENDPOINT"),
  };
}

export const WHATSAPP_GREETING =
  "Hello, I found you on your website and would like to talk about my technology.";