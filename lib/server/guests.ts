import "server-only";
import { GUEST_CSV_HEADERS, parseCsv } from "@/lib/csv";
import { normalizePhone } from "@/lib/phone";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { NotFoundError, ValidationError, requireEventAccess, type Actor } from "./permissions";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");

export interface GuestInput { firstName: string; lastName?: string; dial?: string; phone: string; language?: string; companions?: number | string; notes?: string }
export interface GuestRow {
  id: string; eventId: string; firstName: string; lastName: string; phone: string; language: "ar" | "en" | null; companions: number; notes: string;
  invitationId: string; invitationStatus: string; rsvp: "pending" | "accepted" | "declined"; delivery: string; sentAt: string | null; respondedAt: string | null;
  companionsAttending: number; hasActivePass: boolean; checkedInAt: string | null; optedOut: boolean;
}

function parseInput(i: GuestInput) {
  const errors: Record<string, string> = {};
  const firstName = clean(i.firstName, 60);
  if (!firstName) errors.firstName = "required";
  const phone = normalizePhone(i.phone ?? "", i.dial || "+966");
  if (!phone.ok) errors.phone = phone.reason === "empty" ? "required" : "invalid";
  const companions = i.companions === undefined || i.companions === "" ? 0 : Number(i.companions);
  if (!Number.isInteger(companions) || companions < 0 || companions > 20) errors.companions = "range";
  const language = i.language === "ar" || i.language === "en" ? i.language : null;
  return { errors, value: { firstName, lastName: clean(i.lastName, 60), phone: phone.ok ? phone.e164 : "", language, companions: Number.isFinite(companions) ? companions : 0, notes: clean(i.notes, 300) } };
}

async function insertGuest(q: Queryable, eventId: string, v: ReturnType<typeof parseInput>["value"]) {
  const g = (await q.query<{ id: string }>(
    "insert into guests (event_id, first_name, last_name, phone_e164, preferred_language, companions, notes) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [eventId, v.firstName, v.lastName, v.phone, v.language, v.companions, v.notes])).rows[0];
  // Every guest has exactly one invitation record (unique guest_id).
  await q.query("insert into invitations (event_id, guest_id) values ($1,$2)", [eventId, g.id]);
  return g.id;
}

export async function addGuest(q: Queryable, actor: Actor, eventId: string, input: GuestInput) {
  await requireEventAccess(q, actor, eventId, "guests");
  const { errors, value } = parseInput(input);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const dup = await q.query("select 1 from guests where event_id = $1 and phone_e164 = $2", [eventId, value.phone]);
  if (dup.rows.length) throw new ValidationError({ phone: "duplicate" });
  const id = await q.tx((t) => insertGuest(t, eventId, value));
  await audit(q, actor, "guest.add", { entity: "guest", id, eventId });
  return { id };
}

async function guestEvent(q: Queryable, guestId: string): Promise<string> {
  const r = await q.query<{ event_id: string }>("select event_id from guests where id = $1", [guestId]);
  if (!r.rows[0]) throw new NotFoundError("guest not found");
  return r.rows[0].event_id;
}

export async function updateGuest(q: Queryable, actor: Actor, guestId: string, input: GuestInput) {
  const eventId = await guestEvent(q, guestId);
  await requireEventAccess(q, actor, eventId, "guests");
  const { errors, value } = parseInput(input);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const dup = await q.query("select 1 from guests where event_id = $1 and phone_e164 = $2 and id <> $3", [eventId, value.phone, guestId]);
  if (dup.rows.length) throw new ValidationError({ phone: "duplicate" });
  await q.query("update guests set first_name=$2,last_name=$3,phone_e164=$4,preferred_language=$5,companions=$6,notes=$7,updated_at=now() where id=$1",
    [guestId, value.firstName, value.lastName, value.phone, value.language, value.companions, value.notes]);
  await audit(q, actor, "guest.update", { entity: "guest", id: guestId, eventId });
}

export async function deleteGuest(q: Queryable, actor: Actor, guestId: string) {
  const eventId = await guestEvent(q, guestId);
  await requireEventAccess(q, actor, eventId, "guests");
  const checked = await q.query("select 1 from guest_checkins where guest_id = $1", [guestId]);
  if (checked.rows.length) throw new ValidationError({ guest: "checkedIn" });
  await q.query("delete from guests where id = $1", [guestId]);
  await audit(q, actor, "guest.delete", { entity: "guest", id: guestId, eventId });
}

export interface GuestFilter { search?: string; rsvp?: "pending" | "accepted" | "declined"; checkedIn?: "yes" | "no"; sent?: "yes" | "no" }

/** Owner-scoped: the event id is access-checked first, and every query is bound to that event. */
export async function listGuests(q: Queryable, actor: Actor, eventId: string, f: GuestFilter = {}): Promise<GuestRow[]> {
  await requireEventAccess(q, actor, eventId, "view");
  const where = ["g.event_id = $1"];
  const params: unknown[] = [eventId];
  if (f.search?.trim()) {
    params.push(`%${f.search.trim().toLowerCase().replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`(lower(g.first_name || ' ' || g.last_name) like $${params.length} or g.phone_e164 like $${params.length})`);
  }
  if (f.rsvp) { params.push(f.rsvp); where.push(`i.rsvp_status = $${params.length}`); }
  if (f.checkedIn === "yes") where.push("k.id is not null");
  if (f.checkedIn === "no") where.push("k.id is null");
  if (f.sent === "yes") where.push("i.sent_at is not null");
  if (f.sent === "no") where.push("i.sent_at is null");
  const r = await q.query<Record<string, unknown>>(
    `select g.*, i.id as invitation_id, i.status as inv_status, i.rsvp_status, i.delivery_status, i.sent_at, i.responded_at, i.companions_attending,
            exists (select 1 from entry_passes p where p.invitation_id = i.id and p.status = 'active') as has_pass, k.checked_in_at
       from guests g join invitations i on i.guest_id = g.id left join guest_checkins k on k.guest_id = g.id
      where ${where.join(" and ")} order by g.first_name, g.last_name`, params);
  const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
  return r.rows.map((x) => ({
    id: x.id as string, eventId, firstName: x.first_name as string, lastName: x.last_name as string, phone: x.phone_e164 as string, language: x.preferred_language as "ar" | "en" | null,
    companions: x.companions as number, notes: x.notes as string, invitationId: x.invitation_id as string, invitationStatus: x.inv_status as string,
    rsvp: x.rsvp_status as GuestRow["rsvp"], delivery: x.delivery_status as string, sentAt: iso(x.sent_at), respondedAt: iso(x.responded_at),
    companionsAttending: x.companions_attending as number, hasActivePass: !!x.has_pass, checkedInAt: iso(x.checked_in_at), optedOut: !!x.opted_out_at,
  }));
}

export interface ImportRow { line: number; input: GuestInput; errors: Record<string, string>; duplicate: "none" | "existing" | "in_file"; ok: boolean; phone: string }

/** Parse + validate without saving, so the UI can show a confirmation preview with every problem. */
export async function previewImport(q: Queryable, actor: Actor, eventId: string, csv: string, defaultDial = "+966"): Promise<{ rows: ImportRow[]; headerError?: string }> {
  await requireEventAccess(q, actor, eventId, "guests");
  const table = parseCsv(csv.slice(0, 500_000));
  if (!table.length) return { rows: [], headerError: "empty" };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const idx = (n: string) => head.indexOf(n);
  if (idx("first_name") < 0 || idx("phone") < 0) return { rows: [], headerError: "headers" };
  if (table.length - 1 > 2000) return { rows: [], headerError: "tooLarge" };
  const existing = new Set((await q.query<{ phone_e164: string }>("select phone_e164 from guests where event_id = $1", [eventId])).rows.map((r) => r.phone_e164));
  const seen = new Set<string>();
  const rows: ImportRow[] = table.slice(1).map((cells, i) => {
    const get = (n: string) => (idx(n) >= 0 ? (cells[idx(n)] ?? "").trim() : "");
    const input: GuestInput = { firstName: get("first_name"), lastName: get("last_name"), dial: get("country_code") || defaultDial, phone: get("phone"), language: get("language"), companions: get("companions"), notes: get("notes") };
    const { errors, value } = parseInput(input);
    let duplicate: ImportRow["duplicate"] = "none";
    if (value.phone && !errors.phone) {
      if (existing.has(value.phone)) duplicate = "existing";
      else if (seen.has(value.phone)) duplicate = "in_file";
      seen.add(value.phone);
    }
    if (duplicate !== "none") errors.phone = "duplicate";
    return { line: i + 2, input, errors, duplicate, ok: Object.keys(errors).length === 0, phone: value.phone };
  });
  return { rows };
}

/** Saves only rows that validate, in one transaction. Returns what was skipped. */
export async function commitImport(q: Queryable, actor: Actor, eventId: string, csv: string, defaultDial = "+966") {
  const { rows, headerError } = await previewImport(q, actor, eventId, csv, defaultDial);
  if (headerError) throw new ValidationError({ file: headerError });
  const good = rows.filter((r) => r.ok);
  await q.tx(async (t) => {
    for (const r of good) await insertGuest(t, eventId, parseInput(r.input).value);
  });
  await audit(q, actor, "guest.import", { entity: "event", id: eventId, eventId }, { imported: good.length, skipped: rows.length - good.length });
  return { imported: good.length, skipped: rows.length - good.length };
}

export const GUEST_CSV_COLUMNS = GUEST_CSV_HEADERS;
