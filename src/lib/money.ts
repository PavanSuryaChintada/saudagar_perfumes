/** A rupee amount as shoppers expect to read it: "₹1,25,000". */
export function formatRupees(amount: number): string {
  return `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;
}

/** Same as formatRupees; kept as the name most screens already import. */
export function formatINR(amount: number): string {
  return formatRupees(amount);
}
