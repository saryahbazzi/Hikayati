import { occasionByKey } from "./occasions";

/** The whole wizard state. Shared by the client form, autosave and server-side validation. */
export interface EventDraft {
  occasion: string;
  occasionCustom: string;
  estimatedGuests: number | null;
  title: string;
  hostFirstName: string;
  hostLastName: string;
  cohostName: string;
  date: string;        // YYYY-MM-DD, event-local
  startTime: string;   // HH:MM
  endTime: string;
  venueName: string;
  venueAddress: string;
  city: string;
  country: string;
  mapUrl: string;
  dressCode: string;
  instructions: string;
  rsvpDeadline: string; // YYYY-MM-DD
  notes: string;
  details: Record<string, string>;
  visibility: Record<string, boolean>;
  language: "ar" | "en" | "both";
  design: { templateSlug: string; palette: string; fontPair: string; align: "start" | "center" | "end"; fields: Record<string, string> };
  packageSlug: string;
  allowRsvpChange: boolean;
  consent: boolean;
  timezone: string;
}

export const emptyDraft = (): EventDraft => ({
  occasion: "", occasionCustom: "", estimatedGuests: null, title: "", hostFirstName: "", hostLastName: "", cohostName: "",
  date: "", startTime: "", endTime: "", venueName: "", venueAddress: "", city: "", country: "SA", mapUrl: "", dressCode: "",
  instructions: "", rsvpDeadline: "", notes: "", details: {}, visibility: {}, language: "ar",
  design: { templateSlug: "", palette: "ivory", fontPair: "classic", align: "center", fields: {} },
  packageSlug: "", allowRsvpChange: true, consent: false, timezone: "Asia/Riyadh",
});

export const MAP_HOSTS = ["google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl", "maps.apple.com", "waze.com", "ul.waze.com"];

export function isApprovedMapUrl(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.replace(/^www\./, "");
    return MAP_HOSTS.some((m) => h === m || h.endsWith(`.${m}`));
  } catch {
    return false;
  }
}

export type Errors = Record<string, string>;
/** Error values are i18n keys under `wizard.errors.*` — the UI translates them. */
export const todayIso = (tz = "Asia/Riyadh") => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

export function validateStep(step: number, d: EventDraft): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.occasion || !occasionByKey(d.occasion)) e.occasion = "required";
    if (d.occasion === "other" && !d.occasionCustom.trim()) e.occasionCustom = "required";
    if (d.estimatedGuests === null || !Number.isInteger(d.estimatedGuests)) e.estimatedGuests = "integer";
    else if (d.estimatedGuests < 1) e.estimatedGuests = "positive";
    else if (d.estimatedGuests > 100000) e.estimatedGuests = "tooMany";
  }
  if (step === 2) {
    const set = occasionByKey(d.occasion)?.fieldSet ?? "general";
    if (!d.title.trim()) e.title = "required";
    if (!d.hostFirstName.trim()) e.hostFirstName = "required";
    if (!d.date) e.date = "required";
    else if (d.date < todayIso(d.timezone)) e.date = "past";
    if (!d.startTime) e.startTime = "required";
    if (d.endTime && d.startTime && d.endTime <= d.startTime) e.endTime = "afterStart";
    if (!d.venueName.trim()) e.venueName = "required";
    if (!d.venueAddress.trim()) e.venueAddress = "required";
    if (!d.city.trim()) e.city = "required";
    if (d.mapUrl && !isApprovedMapUrl(d.mapUrl)) e.mapUrl = "mapUrl";
    if (!d.rsvpDeadline) e.rsvpDeadline = "required";
    else if (d.date && d.rsvpDeadline > d.date) e.rsvpDeadline = "beforeEvent";
    if (set === "wedding") {
      if (!d.details.brideName?.trim()) e.brideName = "required";
      if (!d.details.groomName?.trim()) e.groomName = "required";
    }
    if (set === "birthday" && !d.details.celebrantName?.trim()) e.celebrantName = "required";
    if (d.details.age && !/^\d{1,3}$/.test(d.details.age)) e.age = "integer";
  }
  if (step === 3 && !["ar", "en", "both"].includes(d.language)) e.language = "required";
  if (step === 4 && !d.design.templateSlug) e.templateSlug = "required";
  if (step === 6) {
    if (!d.packageSlug) e.packageSlug = "required";
    if (!d.consent) e.consent = "required";
  }
  return e;
}

/** Wedding-style events default to a title built from the couple, so users rarely type one. */
export function suggestTitle(d: EventDraft, locale: "ar" | "en"): string {
  const set = occasionByKey(d.occasion)?.fieldSet;
  if (set === "wedding" && d.details.groomName && d.details.brideName) {
    return locale === "ar" ? `${d.details.groomName} و${d.details.brideName}` : `${d.details.groomName} & ${d.details.brideName}`;
  }
  if (set === "birthday" && d.details.celebrantName) {
    return locale === "ar" ? `عيد ميلاد ${d.details.celebrantName}` : `${d.details.celebrantName}’s Birthday`;
  }
  return d.title;
}
