import { occasionLabel } from "@/lib/domain/occasions";
import type { Locale } from "@/lib/i18n";

const tag = (l: Locale) => (l === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB");

/** Latin digits in both languages, Riyadh time (the platform's operating zone). */
export function fmtDateTime(iso: string | null | undefined, l: Locale): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(tag(l), { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(iso));
}
export function fmtDate(iso: string | null | undefined, l: Locale): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(tag(l), { dateStyle: "medium", timeZone: "Asia/Riyadh" }).format(new Date(iso));
}
export function fmtTime(iso: string | null | undefined, l: Locale): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(tag(l), { timeStyle: "medium", timeZone: "Asia/Riyadh" }).format(new Date(iso));
}
export const fmtSar = (minor: number, l: Locale) =>
  new Intl.NumberFormat(l === "ar" ? "ar-SA-u-nu-latn" : "en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(minor / 100);
export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);
export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
export const occName = (key: string, l: Locale, custom?: string | null) => occasionLabel(key, l, custom);
export const eventTitle = (title: string, fallback: string) => title.trim() || fallback;
