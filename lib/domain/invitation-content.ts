import { occasionByKey, occasionLabel, type FieldSet } from "./occasions";
import { formatDate, formatTime } from "./time";

export type Lang = "ar" | "en";
export interface Bi { ar: string; en: string }

/** Display-ready text for one invitation, independent of any template. Built from a wizard draft or a stored event. */
export interface InvitationContent {
  lang: "ar" | "en" | "both";
  occasionKey: string;
  fieldSet: FieldSet;
  occasion: Bi;
  blessing: Bi;
  intro: Bi;
  names: string[];            // main name lines (couple, celebrant, or event title)
  namesJoin: Bi;              // "و" / "&"
  family: string[];           // parents / families (only when the host chose to show them)
  hosts: string;
  date: Bi;
  hijri: string;
  time: Bi;
  endTime: Bi | null;
  zaffa: string;
  venue: string;
  address: string;
  mapUrl: string;
  dressCode: string;
  instructions: string;
  rsvpBy: Bi | null;
  extra: string;
  closing: Bi;
  guestName: string;
}

/** The subset of event data content needs — matches both EventDraft-derived and PublicInvitation-derived input. */
export interface ContentSource {
  occasion: string; occasionCustom: string | null; title: string; language: "ar" | "en" | "both";
  startsAt: string | null; endsAt: string | null; rsvpDeadline: string | null; timezone: string;
  hostFirstName: string | null; hostLastName: string | null; cohostName: string | null;
  venueName: string; venueAddress: string | null; mapUrl: string | null; dressCode: string | null; instructions: string | null;
  details: Record<string, string>; visibility: Record<string, boolean>;
  fields: Record<string, string>;
}

const BLESSING_OCCASIONS = new Set(["wedding", "katb_kitab", "engagement_party", "engagement_dinner", "malka", "henna_night"]);

export function buildContent(src: ContentSource, guestName = ""): InvitationContent {
  const occ = occasionByKey(src.occasion);
  const fieldSet: FieldSet = occ?.fieldSet ?? "general";
  const show = (k: string, dflt = true) => src.visibility[k] ?? dflt;
  const d = src.details;
  const occasion: Bi = { ar: occasionLabel(src.occasion, "ar", src.occasionCustom), en: occasionLabel(src.occasion, "en", src.occasionCustom) };
  const f = src.fields;

  let names: string[] = [];
  if (f.names?.trim()) names = f.names.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  else if (fieldSet === "wedding" && (d.groomName || d.brideName)) names = [d.groomName, d.brideName].filter(Boolean);
  else if (fieldSet === "birthday" && d.celebrantName) names = [d.celebrantName + (d.age && show("hosts") ? "" : "")];
  else names = [src.title].filter(Boolean);

  const family: string[] = [];
  if (show("family") && fieldSet === "wedding") {
    const mothers = [d.groomMother, d.brideMother].filter(Boolean);
    const fathers = [d.groomFather, d.brideFather].filter(Boolean);
    const families = [d.groomFamily, d.brideFamily].filter(Boolean);
    if (families.length) family.push(families.join(" · "));
    if (fathers.length) family.push(fathers.join(" · "));
    if (mothers.length) family.push(mothers.join(" · "));
  }

  const hosts = show("hosts") ? [src.hostFirstName, src.hostLastName].filter(Boolean).join(" ") + (src.cohostName ? ` & ${src.cohostName}` : "") : "";
  const tz = src.timezone || "Asia/Riyadh";
  const dt = (l: Lang, d2: string | null) => (d2 ? formatDate(d2, l, tz, { weekday: true }) : "");
  const tm = (l: Lang, d2: string | null) => (d2 ? formatTime(d2, l, tz) : "");

  const introAr = fieldSet === "wedding" ? `تتشرف الأسرتان الكريمتان بدعوتكم لحضور ${occasion.ar}` : fieldSet === "birthday" ? `يسعدنا دعوتكم لحضور ${occasion.ar}` : `يسرنا دعوتكم لحضور ${occasion.ar}`;
  const introEn = fieldSet === "wedding" ? `The families request the pleasure of your company at ${occasion.en.toLowerCase()}` : fieldSet === "birthday" ? `We would love for you to join us for ${occasion.en.toLowerCase()}` : `You are warmly invited to ${occasion.en.toLowerCase()}`;
  const custom = d.customWording?.trim();

  return {
    lang: src.language,
    occasionKey: src.occasion,
    fieldSet,
    occasion,
    blessing: {
      ar: f.blessing ?? (BLESSING_OCCASIONS.has(src.occasion) ? "بارك الله لهما وبارك عليهما وجمع بينهما في خير" : ""),
      en: f.blessing ?? (BLESSING_OCCASIONS.has(src.occasion) ? "May God bless them and unite them in goodness." : ""),
    },
    intro: { ar: f.intro ?? custom ?? introAr, en: f.intro ?? custom ?? introEn },
    names,
    namesJoin: { ar: "و", en: "&" },
    family,
    hosts,
    date: { ar: dt("ar", src.startsAt), en: dt("en", src.startsAt) },
    hijri: show("hijri", false) && src.startsAt ? formatDate(src.startsAt, "ar", tz, { hijri: true }) : "",
    time: { ar: tm("ar", src.startsAt), en: tm("en", src.startsAt) },
    endTime: show("endTime", false) && src.endsAt ? { ar: tm("ar", src.endsAt), en: tm("en", src.endsAt) } : null,
    zaffa: show("zaffa") && d.zaffaTime ? d.zaffaTime : "",
    venue: src.venueName,
    address: show("venueAddress") ? (src.venueAddress ?? "") : "",
    mapUrl: show("mapLink") ? (src.mapUrl ?? "") : "",
    dressCode: show("dressCode") ? (src.dressCode ?? "") : "",
    instructions: show("instructions") ? (src.instructions ?? "") : "",
    rsvpBy: show("rsvpDeadline") && src.rsvpDeadline ? { ar: formatDate(src.rsvpDeadline, "ar", tz), en: formatDate(src.rsvpDeadline, "en", tz) } : null,
    extra: f.extra ?? "",
    closing: { ar: f.closing ?? (fieldSet === "wedding" ? "نتشرف بحضوركم" : "نسعد بحضوركم"), en: f.closing ?? "We look forward to celebrating with you." },
    guestName,
  };
}

export const hasBothLangs = (c: InvitationContent) => c.lang === "both";
export const langsOf = (c: InvitationContent): Lang[] => (c.lang === "both" ? ["ar", "en"] : [c.lang]);

/** Placeholder content shown in template galleries before the host has entered anything. */
export const SAMPLE_SOURCE: ContentSource = {
  occasion: "wedding", occasionCustom: null, title: "فهد ونوف", language: "ar", startsAt: "2026-12-15T17:00:00.000Z", endsAt: null, rsvpDeadline: "2026-12-01T20:59:00.000Z", timezone: "Asia/Riyadh",
  hostFirstName: "Sample", hostLastName: "Hosts", cohostName: "", venueName: "نايراه هول", venueAddress: "الرياض، المملكة العربية السعودية", mapUrl: "", dressCode: "", instructions: "",
  details: { groomName: "فهد آل سعود", brideName: "نوف بنت محمد آل الشيخ", groomMother: "سارة آل سعود", brideMother: "مها العتيبي" },
  visibility: { family: true, hosts: false }, fields: {},
};
