const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

export function isDialable(number: string): boolean {
  const count = digitsOf(number).length;
  return count >= MIN_DIGITS && count <= MAX_DIGITS;
}

/** tel: link, or null when the number is missing or not a real phone number. */
export function buildTelUrl(number: string): string | null {
  if (!isDialable(number)) return null;

  const plus = number.trim().startsWith("+") ? "+" : "";

  return `tel:${plus}${digitsOf(number)}`;
}

/** wa.me link with a prefilled message, or null when the number is unusable. */
export function buildWhatsAppUrl(number: string, text: string): string | null {
  if (!isDialable(number)) return null;

  return `https://wa.me/${digitsOf(number)}?text=${encodeURIComponent(text)}`;
}