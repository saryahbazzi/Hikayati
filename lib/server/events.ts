import "server-only";
import { DEFAULT_VISIBILITY, VISIBILITY_KEYS, occasionByKey } from "@/lib/domain/occasions";
import { PALETTES, FONT_PAIRS } from "@/lib/domain/design";
import { utcToZoned, zonedToUtc } from "@/lib/domain/time";
import { emptyDraft, isApprovedMapUrl, validateStep, type EventDraft } from "@/lib/domain/wizard";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { NotFoundError, ValidationError, hasPermission, requireEventAccess, type Actor, type EventAccess } from "./permissions";

const DETAIL_KEYS = ["brideName", "groomName", "brideFamily", "groomFamily", "brideMother", "groomMother", "brideFather", "groomFather", "zaffaTime", "womenDetails", "menDetails", "customWording", "celebrantName", "age", "mealType", "theme"];
const DESIGN_FIELD_KEYS = ["blessing", "intro", "names", "closing", "extra"];
const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");

export interface EventRow {
  id: string; owner_id: string; status: string; wizard_step: number; occasion: string; occasion_custom: string | null; title: string;
  estimated_guests: number | null; host_first_name: string; host_last_name: string; cohost_name: string;
  starts_at: Date | null; ends_at: Date | null; timezone: string; venue_name: string; venue_address: string; city: string; country: string;
  map_url: string; dress_code: string; instructions: string; notes: string; rsvp_deadline: Date | null; allow_rsvp_change: boolean;
  details: Record<string, string>; invitation_visibility: Record<string, boolean>; invitation_language: "ar" | "en" | "both";
  package_id: string | null; consent_attested_at: Date | null; confirmed_at: Date | null; created_at: Date; updated_at: Date;
}

/** Normalise untrusted client input into a safe, bounded draft. */
export function sanitizeDraft(input: Partial<EventDraft>): EventDraft {
  const d = emptyDraft();
  const out: EventDraft = {
    ...d,
    occasion: occasionByKey(clean(input.occasion, 40)) ? clean(input.occasion, 40) : "",
    occasionCustom: clean(input.occasionCustom, 80),
    estimatedGuests: Number.isFinite(Number(input.estimatedGuests)) && input.estimatedGuests !== null && input.estimatedGuests !== undefined ? Math.trunc(Number(input.estimatedGuests)) : null,
    title: clean(input.title, 120), hostFirstName: clean(input.hostFirstName, 60), hostLastName: clean(input.hostLastName, 60), cohostName: clean(input.cohostName, 80),
    date: /^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "") ? input.date! : "", startTime: /^\d{2}:\d{2}$/.test(input.startTime ?? "") ? input.startTime! : "",
    endTime: /^\d{2}:\d{2}$/.test(input.endTime ?? "") ? input.endTime! : "",
    venueName: clean(input.venueName, 120), venueAddress: clean(input.venueAddress, 240), city: clean(input.city, 60), country: clean(input.country, 2).toUpperCase() || "SA",
    mapUrl: isApprovedMapUrl(clean(input.mapUrl, 400)) ? clean(input.mapUrl, 400) : "",
    dressCode: clean(input.dressCode, 120), instructions: clean(input.instructions, 600),
    rsvpDeadline: /^\d{4}-\d{2}-\d{2}$/.test(input.rsvpDeadline ?? "") ? input.rsvpDeadline! : "", notes: clean(input.notes, 800),
    details: {}, visibility: {}, language: input.language === "en" || input.language === "both" ? input.language : "ar",
    design: { templateSlug: clean(input.design?.templateSlug, 80), palette: PALETTES.some((p) => p.key === input.design?.palette) ? input.design!.palette : "ivory",
      fontPair: FONT_PAIRS.some((f) => f.key === input.design?.fontPair) ? input.design!.fontPair : "classic",
      align: input.design?.align === "start" || input.design?.align === "end" ? input.design.align : "center", fields: {} },
    packageSlug: clean(input.packageSlug, 60), allowRsvpChange: input.allowRsvpChange !== false, consent: !!input.consent, timezone: "Asia/Riyadh",
  };
  for (const k of DETAIL_KEYS) if (input.details?.[k]) out.details[k] = clean(input.details[k], k.endsWith("Details") || k === "customWording" ? 600 : 100);
  for (const k of VISIBILITY_KEYS) if (typeof input.visibility?.[k] === "boolean") out.visibility[k] = input.visibility[k];
  for (const k of DESIGN_FIELD_KEYS) if (input.design?.fields?.[k]) out.design.fields[k] = clean(input.design.fields[k], 400);
  return out;
}

export function rowToDraft(e: EventRow, design: { template_slug: string | null; palette: string; font_pair: string; align: string; fields: Record<string, string> } | null, packageSlug = ""): EventDraft {
  const tz = e.timezone || "Asia/Riyadh";
  const start = utcToZoned(e.starts_at, tz);
  const end = utcToZoned(e.ends_at, tz);
  const rsvp = utcToZoned(e.rsvp_deadline, tz);
  return {
    occasion: e.occasion, occasionCustom: e.occasion_custom ?? "", estimatedGuests: e.estimated_guests, title: e.title,
    hostFirstName: e.host_first_name, hostLastName: e.host_last_name, cohostName: e.cohost_name,
    date: start.date, startTime: start.time, endTime: end.time, venueName: e.venue_name, venueAddress: e.venue_address, city: e.city, country: e.country,
    mapUrl: e.map_url, dressCode: e.dress_code, instructions: e.instructions, rsvpDeadline: rsvp.date, notes: e.notes,
    details: e.details ?? {}, visibility: { ...DEFAULT_VISIBILITY, ...(e.invitation_visibility ?? {}) }, language: e.invitation_language,
    design: { templateSlug: design?.template_slug ?? "", palette: design?.palette ?? "ivory", fontPair: design?.font_pair ?? "classic", align: (design?.align as "start") ?? "center", fields: design?.fields ?? {} },
    packageSlug, allowRsvpChange: e.allow_rsvp_change, consent: !!e.consent_attested_at, timezone: tz,
  };
}

async function write(q: Queryable, id: string, d: EventDraft, step: number | null) {
  const tz = d.timezone;
  const startsAt = d.date && d.startTime ? zonedToUtc(d.date, d.startTime, tz) : null;
  const endsAt = d.date && d.endTime ? zonedToUtc(d.date, d.endTime, tz) : null;
  // The RSVP deadline is end of the chosen day, local time.
  const rsvp = d.rsvpDeadline ? zonedToUtc(d.rsvpDeadline, "23:59", tz) : null;
  const pkg = d.packageSlug ? (await q.query<{ id: string }>("select id from packages where slug = $1", [d.packageSlug])).rows[0]?.id ?? null : null;
  await q.query(
    `update events set occasion=$2, occasion_custom=$3, title=$4, estimated_guests=$5, host_first_name=$6, host_last_name=$7, cohost_name=$8,
       starts_at=$9, ends_at=$10, timezone=$11, venue_name=$12, venue_address=$13, city=$14, country=$15, map_url=$16, dress_code=$17,
       instructions=$18, notes=$19, rsvp_deadline=$20, allow_rsvp_change=$21, details=$22, invitation_visibility=$23, invitation_language=$24,
       package_id=$25, wizard_step = coalesce($26, wizard_step), updated_at=now()
     where id=$1`,
    [id, d.occasion || "wedding", d.occasion === "other" ? d.occasionCustom : null, d.title, d.estimatedGuests && d.estimatedGuests > 0 ? d.estimatedGuests : null,
      d.hostFirstName, d.hostLastName, d.cohostName, startsAt, endsAt, tz, d.venueName, d.venueAddress, d.city, d.country, d.mapUrl, d.dressCode,
      d.instructions, d.notes, rsvp, d.allowRsvpChange, JSON.stringify(d.details), JSON.stringify({ ...DEFAULT_VISIBILITY, ...d.visibility }), d.language, pkg, step],
  );
  const tpl = d.design.templateSlug ? (await q.query<{ id: string }>("select id from invitation_templates where slug = $1", [d.design.templateSlug])).rows[0]?.id ?? null : null;
  await q.query(
    `insert into invitation_designs (event_id, template_id, fields, palette, font_pair, align) values ($1,$2,$3,$4,$5,$6)
     on conflict (event_id) do update set template_id=excluded.template_id, fields=excluded.fields, palette=excluded.palette, font_pair=excluded.font_pair, align=excluded.align, updated_at=now()`,
    [id, tpl, JSON.stringify(d.design.fields), d.design.palette, d.design.fontPair, d.design.align],
  );
}

/** Create a draft (id = null) or autosave an existing one. Partial data is allowed; use confirmEvent to enforce validity. */
export async function saveDraft(q: Queryable, actor: Actor, id: string | null, input: Partial<EventDraft>, step?: number): Promise<{ id: string }> {
  const d = sanitizeDraft(input);
  let eventId = id;
  if (!eventId) {
    eventId = (await q.query<{ id: string }>("insert into events (owner_id) values ($1) returning id", [actor.id])).rows[0].id;
    await audit(q, actor, "event.create_draft", { entity: "event", id: eventId, eventId });
  } else {
    await requireEventAccess(q, actor, eventId, "manage");
  }
  await write(q, eventId, d, step ?? null);
  if (d.consent) await q.query("update events set consent_attested_at = coalesce(consent_attested_at, now()) where id = $1", [eventId]);
  return { id: eventId };
}

export async function loadEvent(q: Queryable, actor: Actor, id: string): Promise<{ row: EventRow; draft: EventDraft; access: EventAccess; packageSlug: string }> {
  const access = await requireEventAccess(q, actor, id, "view");
  const row = (await q.query<EventRow>("select * from events where id = $1", [id])).rows[0];
  if (!row) throw new NotFoundError();
  const design = (await q.query<{ template_slug: string | null; palette: string; font_pair: string; align: string; fields: Record<string, string> }>(
    `select t.slug as template_slug, d.palette, d.font_pair, d.align, d.fields from invitation_designs d left join invitation_templates t on t.id = d.template_id where d.event_id = $1`, [id])).rows[0] ?? null;
  const pkg = row.package_id ? (await q.query<{ slug: string }>("select slug from packages where id = $1", [row.package_id])).rows[0]?.slug ?? "" : "";
  return { row, draft: rowToDraft(row, design, pkg), access, packageSlug: pkg };
}

export interface EventSummary { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; venueName: string; city: string; estimatedGuests: number | null; guests: number; accepted: number; declined: number; checkedIn: number; wizardStep: number; role: "owner" | "collaborator" | "assigned" }

/** Events visible to this actor: owned, shared with them, or assigned. Staff see everything via the admin lists instead. */
export async function listMyEvents(q: Queryable, actor: Actor): Promise<EventSummary[]> {
  const r = await q.query<Record<string, unknown>>(
    `select e.id, e.title, e.occasion, e.occasion_custom, e.status, e.starts_at, e.venue_name, e.city, e.estimated_guests, e.wizard_step,
            case when e.owner_id = $1 then 'owner' when exists (select 1 from event_collaborators c where c.event_id = e.id and c.user_id = $1) then 'collaborator' else 'assigned' end as role,
            (select count(*) from guests g where g.event_id = e.id)::int as guests,
            (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')::int as accepted,
            (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'declined')::int as declined,
            (select count(*) from guest_checkins k where k.event_id = e.id)::int as checked_in
       from events e
      where e.owner_id = $1
         or exists (select 1 from event_collaborators c where c.event_id = e.id and c.user_id = $1)
         or exists (select 1 from event_assignments a where a.event_id = e.id and a.user_id = $1)
      order by e.starts_at desc nulls last, e.created_at desc`, [actor.id]);
  return r.rows.map((x) => ({
    id: x.id as string, title: x.title as string, occasion: x.occasion as string, occasionCustom: x.occasion_custom as string | null, status: x.status as string,
    startsAt: x.starts_at ? new Date(x.starts_at as string).toISOString() : null, venueName: x.venue_name as string, city: x.city as string,
    estimatedGuests: x.estimated_guests as number | null, guests: x.guests as number, accepted: x.accepted as number, declined: x.declined as number, checkedIn: x.checked_in as number,
    wizardStep: x.wizard_step as number, role: x.role as EventSummary["role"],
  }));
}

export interface EventStats {
  estimatedGuests: number | null; guestRecords: number; recipients: number; sent: number; simulatedDelivered: number; confirmedDelivered: number;
  accepted: number; declined: number; awaiting: number; checkedIn: number; notYetArrived: number; companionsAttending: number; seats: number; activePasses: number;
}

/** Real counts from stored rows. "Delivered" is only counted when a provider confirmed it; demo sends are separate. */
export async function eventStats(q: Queryable, eventId: string): Promise<EventStats> {
  const r = (await q.query<Record<string, number | null>>(
    `select (select estimated_guests from events where id = $1) as estimated,
       (select count(*)::int from guests where event_id = $1) as guest_records,
       (select count(*)::int from invitations where event_id = $1 and status <> 'revoked') as recipients,
       (select count(*)::int from invitations where event_id = $1 and sent_at is not null) as sent,
       (select count(*)::int from invitations where event_id = $1 and delivery_status = 'demo_simulated') as sim,
       (select count(*)::int from invitations where event_id = $1 and delivery_status in ('delivered','read')) as delivered,
       (select count(*)::int from invitations where event_id = $1 and rsvp_status = 'accepted') as accepted,
       (select count(*)::int from invitations where event_id = $1 and rsvp_status = 'declined') as declined,
       (select count(*)::int from guest_checkins where event_id = $1) as checked,
       (select coalesce(sum(companions_attending),0)::int from invitations where event_id = $1 and rsvp_status = 'accepted') as companions,
       (select count(*)::int from entry_passes where event_id = $1 and status = 'active') as passes`, [eventId])).rows[0];
  const accepted = r.accepted ?? 0, declined = r.declined ?? 0, recipients = r.recipients ?? 0, checked = r.checked ?? 0;
  return {
    estimatedGuests: r.estimated ?? null, guestRecords: r.guest_records ?? 0, recipients, sent: r.sent ?? 0, simulatedDelivered: r.sim ?? 0, confirmedDelivered: r.delivered ?? 0,
    accepted, declined, awaiting: Math.max(0, recipients - accepted - declined), checkedIn: checked, notYetArrived: Math.max(0, accepted - checked),
    companionsAttending: r.companions ?? 0, seats: accepted + (r.companions ?? 0), activePasses: r.passes ?? 0,
  };
}

/** Validates every wizard step server-side, then confirms (demo checkout: no payment is taken). */
export async function confirmEvent(q: Queryable, actor: Actor, id: string, input: Partial<EventDraft>, order: { totalMinor: number; subtotalMinor: number; discountMinor: number; taxMinor: number; breakdown: unknown }) {
  await requireEventAccess(q, actor, id, "manage");
  if (Object.keys(input).length) await saveDraft(q, actor, id, input); // wizard sends its full draft; callers with nothing new pass {}
  const { draft, row } = await loadEvent(q, actor, id);
  const errors: Record<string, string> = {};
  for (const s of [1, 2, 3, 4, 6]) Object.assign(errors, validateStep(s, { ...draft, consent: !!row.consent_attested_at || draft.consent }));
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const tpl = await q.query<{ status: string }>("select t.status from invitation_designs d join invitation_templates t on t.id = d.template_id where d.event_id = $1", [id]);
  if (tpl.rows[0]?.status !== "published") throw new ValidationError({ templateSlug: "unavailable" });
  await q.query("update events set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()), wizard_step = 7, consent_attested_at = coalesce(consent_attested_at, now()) where id = $1", [id]);
  await q.query(
    `insert into orders (event_id, user_id, package_id, status, is_demo, subtotal_minor, discount_minor, tax_minor, total_minor, breakdown)
     values ($1,$2,(select package_id from events where id=$1),'demo_confirmed',true,$3,$4,$5,$6,$7)`,
    [id, actor.id, order.subtotalMinor, order.discountMinor, order.taxMinor, order.totalMinor, JSON.stringify(order.breakdown)]);
  await audit(q, actor, "event.confirm_demo", { entity: "event", id, eventId: id });
  return { id };
}

export async function deleteDraft(q: Queryable, actor: Actor, id: string) {
  const a = await requireEventAccess(q, actor, id, "manage");
  const r = (await q.query<{ status: string }>("select status from events where id = $1", [id])).rows[0];
  if (r?.status !== "draft" || !(a.owner || hasPermission(actor, "events.manage_all"))) throw new ValidationError({ event: "onlyDrafts" });
  await q.query("delete from events where id = $1", [id]);
  await audit(q, actor, "event.delete_draft", { entity: "event", id });
}

export async function cancelEvent(q: Queryable, actor: Actor, id: string) {
  await requireEventAccess(q, actor, id, "manage");
  await q.query("update events set status = 'cancelled', updated_at = now() where id = $1", [id]);
  await q.query("update reminder_rules set status = 'cancelled' where event_id = $1 and status = 'active'", [id]);
  await audit(q, actor, "event.cancel", { entity: "event", id, eventId: id });
}
