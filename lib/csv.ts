/** Minimal RFC 4180 parser/serialiser (quotes, escaped quotes, CRLF, BOM). No dependency needed. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", i = 0, quoted = false;
  const src = text.replace(/^﻿/, "");
  while (i < src.length) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { quoted = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === "," || c === ";") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/** Spreadsheet formula injection guard: prefix risky leading characters when exporting. */
const safeCell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) => r.map((v) => {
      const s = safeCell(String(v ?? ""));
      return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\r\n");
}

export const GUEST_CSV_HEADERS = ["first_name", "last_name", "country_code", "phone", "language", "companions", "notes"];
export const GUEST_CSV_TEMPLATE = toCsv([
  GUEST_CSV_HEADERS,
  ["Sample", "Guest", "+966", "500000101", "ar", "1", "Fictional example row — delete me"],
  ["Example", "Guest", "+971", "500000102", "en", "0", ""],
]);
