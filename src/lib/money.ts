/** Display a rupee amount the way the storefront always has: "RS. 1,25,000". */
export function formatRupees(amount: number): string {
  return `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;
}

export function formatINR(amount: number): string {
  return `RS. ${Math.round(amount).toLocaleString('en-IN')}`;
}
