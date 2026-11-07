// CSV that opens cleanly in Excel and Google Sheets (UTF-8 with BOM, quoted where needed, formula-safe).

const FORMULA = /^[=+\-@\t\r]/;
/** Byte-order mark so Excel reads the file as UTF-8 (₹, accents). */
const BOM = String.fromCharCode(0xfeff);

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // A cell starting with = + - @ would run as a formula in a spreadsheet; prefix it so it stays text.
  if (FORMULA.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [cols.map(csvCell).join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))];
  return BOM + lines.join('\r\n') + '\r\n';
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
