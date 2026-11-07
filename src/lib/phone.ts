/** Mirrors public.normalize_indian_phone in SQL. Returns 10 digits or null. */
export function normalizeIndianPhone(input: string): string | null {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function formatIndianPhone(tenDigits: string | null | undefined): string {
  if (!tenDigits) return '';
  return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
}
