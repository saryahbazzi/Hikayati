import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

export interface Country { iso: CountryCode; dial: string; en: string; ar: string }

/** Saudi Arabia first, then the Gulf, then common origins of guests. */
export const COUNTRIES: Country[] = [
  { iso: "SA", dial: "+966", en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  { iso: "AE", dial: "+971", en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  { iso: "KW", dial: "+965", en: "Kuwait", ar: "الكويت" },
  { iso: "BH", dial: "+973", en: "Bahrain", ar: "البحرين" },
  { iso: "QA", dial: "+974", en: "Qatar", ar: "قطر" },
  { iso: "OM", dial: "+968", en: "Oman", ar: "عُمان" },
  { iso: "JO", dial: "+962", en: "Jordan", ar: "الأردن" },
  { iso: "LB", dial: "+961", en: "Lebanon", ar: "لبنان" },
  { iso: "EG", dial: "+20", en: "Egypt", ar: "مصر" },
  { iso: "SD", dial: "+249", en: "Sudan", ar: "السودان" },
  { iso: "YE", dial: "+967", en: "Yemen", ar: "اليمن" },
  { iso: "IQ", dial: "+964", en: "Iraq", ar: "العراق" },
  { iso: "SY", dial: "+963", en: "Syria", ar: "سوريا" },
  { iso: "MA", dial: "+212", en: "Morocco", ar: "المغرب" },
  { iso: "TN", dial: "+216", en: "Tunisia", ar: "تونس" },
  { iso: "DZ", dial: "+213", en: "Algeria", ar: "الجزائر" },
  { iso: "TR", dial: "+90", en: "Türkiye", ar: "تركيا" },
  { iso: "PK", dial: "+92", en: "Pakistan", ar: "باكستان" },
  { iso: "IN", dial: "+91", en: "India", ar: "الهند" },
  { iso: "PH", dial: "+63", en: "Philippines", ar: "الفلبين" },
  { iso: "GB", dial: "+44", en: "United Kingdom", ar: "المملكة المتحدة" },
  { iso: "US", dial: "+1", en: "United States", ar: "الولايات المتحدة" },
  { iso: "FR", dial: "+33", en: "France", ar: "فرنسا" },
  { iso: "DE", dial: "+49", en: "Germany", ar: "ألمانيا" },
];

export type PhoneResult = { ok: true; e164: string; country: CountryCode | undefined } | { ok: false; reason: "empty" | "invalid" };

const ARABIC_INDIC = /[٠-٩۰-۹]/g;
const toLatinDigits = (s: string) =>
  s.replace(ARABIC_INDIC, (d) => String((d.charCodeAt(0) & 0xf) % 10));

/**
 * Normalise a phone number to E.164. `dial` is the selected country code ("+966") used for numbers
 * typed in national format; an already-international input ("+44…" / "00 44…") wins over `dial`.
 */
export function normalizePhone(input: string, dial = "+966"): PhoneResult {
  const raw = toLatinDigits((input ?? "").trim());
  if (!raw) return { ok: false, reason: "empty" };
  const cleaned = raw.replace(/[\s\-().]/g, "");
  let candidate = cleaned;
  if (cleaned.startsWith("00")) candidate = `+${cleaned.slice(2)}`;
  else if (!cleaned.startsWith("+")) {
    const national = cleaned.replace(/^0+/, "");
    candidate = `${dial}${national}`;
  }
  const parsed = parsePhoneNumberFromString(candidate);
  if (!parsed || !parsed.isValid()) return { ok: false, reason: "invalid" };
  return { ok: true, e164: parsed.number, country: parsed.country };
}

/** "+966501234567" → "+966 50 123 4567" (for display only). */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

/** Hide most digits of a number: "+966 •• ••• 4567". */
export function maskPhone(e164: string): string {
  const f = formatPhone(e164);
  return f.replace(/\d(?=[\d\s]*\d{4}$)/g, "•");
}
