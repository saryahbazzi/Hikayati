import { formatDate, formatTime } from "@/lib/domain/time";
import type { Locale } from "@/lib/i18n";
import type { portalCopy } from "@/lib/i18n/portal";

export type PT = ReturnType<typeof portalCopy>;
export type ActionRes<T = unknown> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string>; code?: string };

/** "12 March 2027" in the event zone, Latin digits. */
export const fmtDate = (iso: string | null, locale: Locale, tz = "Asia/Riyadh") => (iso ? formatDate(iso, locale, tz) : "");
export const fmtDateTime = (iso: string | null, locale: Locale, tz = "Asia/Riyadh") => (iso ? `${formatDate(iso, locale, tz)} · ${formatTime(iso, locale, tz)}` : "");

/** Turn an action failure into a sentence in the user's language. Field codes win over the generic error. */
export function errText(t: PT, r: { error: string; fields?: Record<string, string> } | null | undefined): string | null {
  if (!r) return null;
  const err = t.err as Record<string, string>;
  const f = r.fields ?? {};
  for (const [k, v] of Object.entries(f)) {
    if (k === "phone" && v === "invalid") return err.invalidPhone;
    if (k === "email" && v === "invalid") return err.invalidEmail;
    if (err[v]) return err[v];
    if (err[k]) return err[k];
  }
  return err[r.error] ?? err.unknown;
}

/** Copy to the clipboard, with a textarea fallback for non-secure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const statusTone = (s: string): "neutral" | "olive" | "champagne" | "danger" | "ink" =>
  s === "cancelled" ? "danger" : s === "live" ? "olive" : s === "confirmed" ? "champagne" : s === "completed" ? "ink" : "neutral";

/** { day: "12", month: "Mar" } in the event zone with Latin digits (calendar block on cards). */
export function dayMonth(iso: string | null, locale: Locale, tz = "Asia/Riyadh") {
  if (!iso) return null;
  const tag = (locale === "ar" ? "ar-SA" : "en-GB") + "-u-ca-gregory-nu-latn";
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(tag, { timeZone: tz, day: "numeric" }).format(d),
    month: new Intl.DateTimeFormat(tag, { timeZone: tz, month: "short" }).format(d),
    year: new Intl.DateTimeFormat(tag, { timeZone: tz, year: "numeric" }).format(d),
  };
}
