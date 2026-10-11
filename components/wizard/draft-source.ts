import type { ContentSource } from "@/lib/domain/invitation-content";
import { DEFAULT_VISIBILITY } from "@/lib/domain/occasions";
import { zonedToUtc } from "@/lib/domain/time";
import type { EventDraft } from "@/lib/domain/wizard";

/** Map the wizard draft onto what `buildContent` needs, so the preview shows the host's real details. */
export function draftToSource(d: EventDraft): ContentSource {
  const tz = d.timezone || "Asia/Riyadh";
  const at = (date: string, time: string) => (date && time ? zonedToUtc(date, time, tz).toISOString() : null);
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.design.fields)) if (v && v.trim()) fields[k] = v;
  const details: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.details)) if (v && v.trim()) details[k] = v;
  return {
    occasion: d.occasion || "wedding",
    occasionCustom: d.occasion === "other" ? d.occasionCustom : null,
    title: d.title,
    language: d.language,
    startsAt: at(d.date, d.startTime),
    endsAt: at(d.date, d.endTime),
    rsvpDeadline: d.rsvpDeadline ? zonedToUtc(d.rsvpDeadline, "23:59", tz).toISOString() : null,
    timezone: tz,
    hostFirstName: d.hostFirstName || null,
    hostLastName: d.hostLastName || null,
    cohostName: d.cohostName || null,
    venueName: d.venueName,
    venueAddress: d.venueAddress || null,
    mapUrl: d.mapUrl || null,
    dressCode: d.dressCode || null,
    instructions: d.instructions || null,
    details,
    visibility: { ...DEFAULT_VISIBILITY, ...d.visibility },
    fields,
  };
}
