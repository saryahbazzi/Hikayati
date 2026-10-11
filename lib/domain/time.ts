/** Convert a local wall-clock date+time in an IANA zone to a UTC Date (Saudi Arabia has no DST, but other zones may). */
export function zonedToUtc(date: string, time: string, tz = "Asia/Riyadh"): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - offset);
}

function tzOffsetMs(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - at.getTime();
}

/** UTC instant → { date: "YYYY-MM-DD", time: "HH:MM" } in the event zone. */
export function utcToZoned(d: Date | string | null, tz = "Asia/Riyadh"): { date: string; time: string } {
  if (!d) return { date: "", time: "" };
  const dt = typeof d === "string" ? new Date(d) : d;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(dt);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(dt);
  return { date, time };
}

export function formatDate(d: Date | string | null, locale: "ar" | "en", tz = "Asia/Riyadh", opts: { hijri?: boolean; weekday?: boolean } = {}): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  const tag = locale === "ar" ? "ar-SA" : "en-GB";
  const cal = opts.hijri ? "-u-ca-islamic-umalqura-nu-latn" : "-u-ca-gregory-nu-latn";
  return new Intl.DateTimeFormat(tag + cal, { timeZone: tz, day: "numeric", month: "long", year: "numeric", ...(opts.weekday ? { weekday: "long" } : {}) }).format(dt);
}

export function formatTime(d: Date | string | null, locale: "ar" | "en", tz = "Asia/Riyadh"): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat((locale === "ar" ? "ar-SA" : "en-GB") + "-u-nu-latn", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(dt);
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
