// GST invoice maths. Prices on the store include GST, so tax is worked backwards from each line.

export interface InvoiceInputLine {
  name: string;
  hsn: string | null;
  qty: number;
  lineTotal: number; // incl. GST, before order discount
  gstRate: number; // percent
}

export interface InvoiceLine extends InvoiceInputLine {
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Spreads the order discount over the lines in proportion to their value, then splits each
 * discounted line into taxable value and GST. The last line absorbs rounding so totals match.
 */
export function buildInvoiceLines(lines: InvoiceInputLine[], orderDiscount: number): InvoiceLine[] {
  const gross = lines.reduce((s, l) => s + l.lineTotal, 0);
  let given = 0;
  return lines.map((l, i) => {
    const share = gross > 0 ? (i === lines.length - 1 ? round2(orderDiscount - given) : round2((orderDiscount * l.lineTotal) / gross)) : 0;
    given = round2(given + share);
    const total = round2(Math.max(0, l.lineTotal - share));
    const taxable = round2(total / (1 + (l.gstRate || 0) / 100));
    return { ...l, discount: share, total, taxable, tax: round2(total - taxable) };
  });
}

/** Same state = CGST + SGST (half each); otherwise IGST. Unknown seller state = IGST. */
export function isIntraState(sellerState: string | null | undefined, buyerState: string | null | undefined): boolean {
  const a = (sellerState ?? '').trim().toLowerCase();
  const b = (buyerState ?? '').trim().toLowerCase();
  return !!a && a === b;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ');
}

/** Indian numbering: 1,25,000 → "One Lakh Twenty Five Thousand". */
export function rupeesInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  const words = [
    crore ? `${threeDigits(crore)} Crore` : '',
    lakh ? `${twoDigits(lakh)} Lakh` : '',
    thousand ? `${twoDigits(thousand)} Thousand` : '',
    rest ? threeDigits(rest) : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `Rupees ${words || 'Zero'}${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
}
