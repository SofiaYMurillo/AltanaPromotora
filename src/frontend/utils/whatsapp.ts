/** Digits-only international number for https://wa.me/ links. */
export function phoneToWhatsAppDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function buildWhatsAppHref(phone: string) {
  const digits = phoneToWhatsAppDigits(phone);
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}`;
}
