import { z } from 'zod';
import { normalizeIndianPhone } from '../../lib/phone';
import { INDIAN_STATES } from '../../lib/indianStates';

const todayIso = () => new Date().toISOString().slice(0, 10);
const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  full_name: z.string().trim().min(2, "Enter the recipient's name."),
  phone: z
    .string()
    .transform((v, ctx) => {
      const n = normalizeIndianPhone(v);
      if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a 10-digit Indian mobile number.' });
      return n ?? '';
    }),
  line1: z.string().trim().min(3, 'Enter the house number and street.'),
  line2: optionalText,
  landmark: optionalText,
  city: z.string().trim().min(2, 'Enter the city.'),
  state: z.string().refine((v) => (INDIAN_STATES as readonly string[]).includes(v), 'Choose a state.'),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a 6-digit pincode.'),
});
export type AddressInput = z.input<typeof addressSchema>;
export type AddressValues = z.output<typeof addressSchema>;

export const personalDetailsSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name.'),
  phone: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return null;
      const n = normalizeIndianPhone(v);
      if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a 10-digit Indian mobile number.' });
      return n;
    }),
  date_of_birth: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      if (v < '1900-01-01' || v > todayIso()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a real date of birth.' });
      return v;
    }),
  whatsapp_opt_in: z.boolean(),
});
export type PersonalDetailsValues = z.output<typeof personalDetailsSchema>;

/** First zod message per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
