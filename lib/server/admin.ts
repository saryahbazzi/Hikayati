import "server-only";
import { toCsv } from "@/lib/csv";
import { formatPhone, maskPhone, normalizePhone } from "@/lib/phone";
import { audit } from "./audit";
import { demoAccessEnabled, isProduction } from "./config";
import type { Db, Queryable } from "./db";
import { checkInHistory, type CheckInHistoryRow } from "./checkin";
import { eventStats, type EventStats } from "./events";
import {
  ForbiddenError, NotFoundError, ROLES, STAFF_ROLES, ValidationError, eventAccess, hasPermission,
  type Actor, type EventAccess, type Permission, type Role,
} from "./permissions";
import { addPrice, deletePrice, listAddons, listPackages, setPriceActive, setTaxRate, taxRate, updatePackage, upsertAddon, type PackageUpdate, type PriceInput } from "./catalog";
import { listTemplates, registerAssetTemplate, setTemplateStatus, updateTemplate, type OverlayField } from "./templates";
import { uuidLike } from "./db";

/* ───────────────────────── sections & authorization ───────────────────────── */

export type Section = "overview" | "events" | "customers" | "guests" | "templates" | "packages" | "messaging" | "checkin" | "reports" | "team" | "settings" | "audit";
export const SECTIONS: Section[] = ["overview", "events", "customers", "guests", "templates", "packages", "messaging", "checkin", "reports", "team", "settings", "audit"];

/**
 * Which admin sections an actor may open. Derived only from the role (never from email or client state).
 * events/guests: staff with events.read_all, plus event managers (their assigned events only).
 * checkin: any staff (the list itself is filtered by eventAccess().checkin per event).
 */
export function canOpen(actor: Pick<Actor, "role">, s: Section): boolean {
  if (!hasPermission(actor, "staff.portal")) return false;
  switch (s) {
    case "overview": case "checkin": return true;
    case "events": case "guests": return hasPermission(actor, "events.read_all") || actor.role === "event_manager";
    case "customers": return hasPermission(actor, "customers.read");
    case "templates": return hasPermission(actor, "templates.manage");
    case "packages": return hasPermission(actor, "packages.manage");
    case "messaging": return hasPermission(actor, "messaging.read");
    case "reports": return hasPermission(actor, "reports.read");
    case "team": return hasPermission(actor, "team.manage");
    case "settings": return hasPermission(actor, "settings.manage");
    case "audit": return hasPermission(actor, "audit.read");
  }
}
export const sectionsFor = (actor: Pick<Actor, "role">) => SECTIONS.filter((s) => canOpen(actor, s));

function need(actor: Actor, p: Permission) {
  if (!hasPermission(actor, p)) throw new ForbiddenError(`missing ${p}`);
}
function needSection(actor: Actor, s: Section) {
  if (!canOpen(actor, s)) throw new ForbiddenError(`missing section ${s}`);
}

/* ───────────────────────── small query helpers ───────────────────────── */

class Where {
  parts: string[] = [];
  params: unknown[] = [];
  add(sql: string, ...vals: unknown[]) {
    let s = sql;
    for (const v of vals) { this.params.push(v); s = s.replace("?", `$${this.params.length}`); }
    this.parts.push(s);
  }
  get sql() { return this.parts.length ? `where ${this.parts.join(" and ")}` : ""; }
  get n() { return this.params.length; }
}

const likeEsc = (s: string) => `%${s.trim().toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
const iso = (d: unknown) => (d ? new Date(d as string).toISOString() : null);
const num = (v: unknown) => Number(v ?? 0);
export const PAGE_SIZE = 25;
export interface Paged<T> { rows: T[]; total: number; page: number; pageSize: number }
const pageOf = (p: unknown) => Math.max(1, Math.min(10_000, Math.trunc(Number(p) || 1)));

/** SQL restricting `events <alias>` to those the actor may see. Admins see everything; managers/door staff see only assignments. */
function visibleEvents(actor: Actor, w: Where, alias = "e") {
  if (hasPermission(actor, "events.read_all")) return;
  const asg = actor.role === "event_manager" ? "manager" : actor.role === "check_in_staff" ? "check_in" : "__none__";
  w.add(`exists (select 1 from event_assignments ea where ea.event_id = ${alias}.id and ea.user_id = ? and ea.role = ?)`, actor.id, asg);
}

/* ───────────────────────── overview ───────────────────────── */

export interface OverviewData {
  scope: "all" | "assigned";
  statusCounts: { status: string; n: number }[];
  totals: { events: number; guests: number; sent: number; accepted: number; declined: number; awaiting: number; checkedIn: number };
  upcoming: { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; city: string; guests: number; accepted: number; checkedIn: number; canCheckIn: boolean }[];
}

export async function adminOverview(q: Queryable, actor: Actor): Promise<OverviewData> {
  needSection(actor, "overview");
  const w = new Where();
  visibleEvents(actor, w);
  const sc = (await q.query<{ status: string; n: number }>(`select e.status, count(*)::int as n from events e ${w.sql} group by e.status`, w.params)).rows;
  const t = (await q.query<Record<string, number>>(
    `select count(*)::int as events,
       coalesce(sum((select count(*) from guests g where g.event_id = e.id)),0)::int as guests,
       coalesce(sum((select count(*) from invitations i where i.event_id = e.id and i.sent_at is not null)),0)::int as sent,
       coalesce(sum((select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')),0)::int as accepted,
       coalesce(sum((select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'declined')),0)::int as declined,
       coalesce(sum((select count(*) from guest_checkins k where k.event_id = e.id)),0)::int as checked
     from events e ${w.sql}`, w.params)).rows[0];
  const w2 = new Where();
  visibleEvents(actor, w2);
  w2.add("e.status in ('confirmed','live')");
  w2.add("(e.starts_at is null or e.starts_at >= now() - interval '1 day')");
  const up = (await q.query<Record<string, unknown>>(
    `select e.id, e.title, e.occasion, e.occasion_custom, e.status, e.starts_at, e.city,
       (select count(*) from guests g where g.event_id = e.id)::int as guests,
       (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')::int as accepted,
       (select count(*) from guest_checkins k where k.event_id = e.id)::int as checked
     from events e ${w2.sql} order by e.starts_at asc nulls last limit 8`, w2.params)).rows;
  const upcoming: OverviewData["upcoming"] = [];
  for (const x of up) {
    const a = await eventAccess(q, actor, x.id as string);
    upcoming.push({ id: x.id as string, title: x.title as string, occasion: x.occasion as string, occasionCustom: x.occasion_custom as string | null, status: x.status as string, startsAt: iso(x.starts_at), city: x.city as string, guests: num(x.guests), accepted: num(x.accepted), checkedIn: num(x.checked), canCheckIn: a.checkin });
  }
  const accepted = num(t.accepted), declined = num(t.declined), sent = num(t.sent);
  return {
    scope: hasPermission(actor, "events.read_all") ? "all" : "assigned",
    statusCounts: sc, upcoming,
    totals: { events: num(t.events), guests: num(t.guests), sent, accepted, declined, awaiting: Math.max(0, sent - accepted - declined), checkedIn: num(t.checked) },
  };
}

/* ───────────────────────── events ───────────────────────── */

export interface AdminEventRow { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; city: string; venueName: string; ownerName: string | null; guests: number; accepted: number; checkedIn: number }
export interface EventFilter { status?: string; occasion?: string; search?: string; page?: number }

export async function adminListEvents(q: Queryable, actor: Actor, f: EventFilter): Promise<Paged<AdminEventRow>> {
  needSection(actor, "events");
  const w = new Where();
  visibleEvents(actor, w);
  if (f.status && ["draft", "confirmed", "live", "completed", "cancelled"].includes(f.status)) w.add("e.status = ?", f.status);
  if (f.occasion && /^[a-z_]{1,40}$/.test(f.occasion)) w.add("e.occasion = ?", f.occasion);
  if (f.search?.trim()) w.add("(lower(e.title) like ? or lower(e.venue_name) like ? or lower(e.host_first_name || ' ' || e.host_last_name) like ?)", likeEsc(f.search), likeEsc(f.search), likeEsc(f.search));
  const page = pageOf(f.page);
  const total = num((await q.query<{ n: number }>(`select count(*)::int as n from events e ${w.sql}`, w.params)).rows[0].n);
  const showOwner = hasPermission(actor, "customers.read");
  const r = await q.query<Record<string, unknown>>(
    `select e.id, e.title, e.occasion, e.occasion_custom, e.status, e.starts_at, e.city, e.venue_name, u.full_name as owner_name,
       (select count(*) from guests g where g.event_id = e.id)::int as guests,
       (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')::int as accepted,
       (select count(*) from guest_checkins k where k.event_id = e.id)::int as checked
     from events e join users u on u.id = e.owner_id ${w.sql}
     order by e.starts_at desc nulls last, e.created_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`, w.params);
  return {
    total, page, pageSize: PAGE_SIZE,
    rows: r.rows.map((x) => ({ id: x.id as string, title: x.title as string, occasion: x.occasion as string, occasionCustom: x.occasion_custom as string | null, status: x.status as string, startsAt: iso(x.starts_at), city: x.city as string, venueName: x.venue_name as string, ownerName: showOwner ? (x.owner_name as string) : null, guests: num(x.guests), accepted: num(x.accepted), checkedIn: num(x.checked) })),
  };
}

export interface StaffOption { id: string; name: string; role: Role; phone: string }
export interface AssignmentRow { userId: string; name: string; role: "manager" | "check_in"; phone: string; disabled: boolean }
export interface MessageHistoryRow { id: string; at: string; kind: string; status: string; provider: string; locale: string; guest: string }
export interface AuditRow { id: number; at: string; action: string; entity: string | null; entityId: string | null; eventId: string | null; actorRole: string | null; actorName: string | null; actorShort: string | null; meta: Record<string, string | number | boolean> }
export interface AdminEventDetail {
  event: { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; timezone: string; venueName: string; city: string; estimatedGuests: number | null; hostName: string; packageName: { en: string; ar: string } | null };
  access: EventAccess;
  stats: EventStats;
  assignments: AssignmentRow[];
  canAssign: boolean;
  candidates: StaffOption[];
  history: CheckInHistoryRow[];
  messages: MessageHistoryRow[];
  audit: AuditRow[] | null;
}

export async function adminEventDetail(q: Queryable, actor: Actor, eventId: string): Promise<AdminEventDetail> {
  needSection(actor, "events");
  if (!uuidLike.test(eventId)) throw new NotFoundError();
  const access = await eventAccess(q, actor, eventId);
  if (!access.view) throw new NotFoundError("event not found"); // not enumerable
  const e = (await q.query<Record<string, unknown>>(
    `select e.*, p.name_i18n as pkg from events e left join packages p on p.id = e.package_id where e.id = $1`, [eventId])).rows[0];
  if (!e) throw new NotFoundError();
  const canAssign = hasPermission(actor, "team.manage") || hasPermission(actor, "events.manage_all");
  const assignments = (await q.query<Record<string, unknown>>(
    `select a.user_id, a.role, u.full_name, u.phone_e164, u.disabled_at from event_assignments a join users u on u.id = a.user_id where a.event_id = $1 order by a.role, u.full_name`, [eventId])).rows
    .map((x) => ({ userId: x.user_id as string, name: (x.full_name as string) || "—", role: x.role as "manager" | "check_in", phone: x.phone_e164 ? maskPhone(x.phone_e164 as string) : "", disabled: !!x.disabled_at }));
  let candidates: StaffOption[] = [];
  if (canAssign) {
    candidates = (await q.query<Record<string, unknown>>(
      "select id, full_name, role, phone_e164 from users where role in ('event_manager','check_in_staff') and disabled_at is null order by role, full_name")).rows
      .map((x) => ({ id: x.id as string, name: (x.full_name as string) || "—", role: x.role as Role, phone: x.phone_e164 ? maskPhone(x.phone_e164 as string) : "" }));
  }
  const messages = (await q.query<Record<string, unknown>>(
    `select m.id, m.created_at, m.kind, m.status, m.provider, m.locale, trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as guest
       from message_records m left join guests g on g.id = m.guest_id where m.event_id = $1 order by m.created_at desc limit 30`, [eventId])).rows
    .map((x) => ({ id: x.id as string, at: iso(x.created_at)!, kind: x.kind as string, status: x.status as string, provider: x.provider as string, locale: x.locale as string, guest: x.guest as string }));
  const auditRows = hasPermission(actor, "audit.read") ? (await queryAudit(q, new AuditWhere().eventId(eventId), 1, 30)).rows : null;
  return {
    event: {
      id: eventId, title: e.title as string, occasion: e.occasion as string, occasionCustom: e.occasion_custom as string | null, status: e.status as string, startsAt: iso(e.starts_at), timezone: e.timezone as string,
      venueName: e.venue_name as string, city: e.city as string, estimatedGuests: e.estimated_guests as number | null, hostName: `${e.host_first_name} ${e.host_last_name}`.trim(), packageName: (e.pkg as { en: string; ar: string } | null) ?? null,
    },
    access, stats: await eventStats(q, eventId), assignments, canAssign, candidates, history: await checkInHistory(q, actor, eventId, 30), messages, audit: auditRows,
  };
}

export async function assignStaff(q: Queryable, actor: Actor, eventId: string, userId: string) {
  if (!(hasPermission(actor, "team.manage") || hasPermission(actor, "events.manage_all"))) throw new ForbiddenError();
  if (!uuidLike.test(eventId) || !uuidLike.test(userId)) throw new NotFoundError();
  const ev = await q.query("select 1 from events where id = $1", [eventId]);
  if (!ev.rows[0]) throw new NotFoundError("event not found");
  const u = (await q.query<{ role: Role; disabled_at: Date | null }>("select role, disabled_at from users where id = $1", [userId])).rows[0];
  if (!u || u.disabled_at) throw new ValidationError({ user: "invalid" });
  const role = u.role === "event_manager" ? "manager" : u.role === "check_in_staff" ? "check_in" : null;
  if (!role) throw new ValidationError({ user: "role" }); // only event managers / check-in staff can be assigned
  await q.query("insert into event_assignments (event_id, user_id, role) values ($1,$2,$3) on conflict do nothing", [eventId, userId, role]);
  await audit(q, actor, "event.assign", { entity: "event", id: eventId, eventId }, { assignee: userId, role });
}

export async function unassignStaff(q: Queryable, actor: Actor, eventId: string, userId: string, role: "manager" | "check_in") {
  if (!(hasPermission(actor, "team.manage") || hasPermission(actor, "events.manage_all"))) throw new ForbiddenError();
  if (!uuidLike.test(eventId) || !uuidLike.test(userId) || !["manager", "check_in"].includes(role)) throw new NotFoundError();
  await q.query("delete from event_assignments where event_id = $1 and user_id = $2 and role = $3", [eventId, userId, role]);
  await audit(q, actor, "event.unassign", { entity: "event", id: eventId, eventId }, { assignee: userId, role });
}

/* ───────────────────────── customers & accounts ───────────────────────── */

export interface CustomerRow { id: string; name: string; phone: string; events: number; lastActivity: string | null; joined: string; disabled: boolean; isDemo: boolean }
export async function adminListCustomers(q: Queryable, actor: Actor, f: { search?: string; page?: number }): Promise<Paged<CustomerRow> & { canDisable: boolean; masked: boolean }> {
  need(actor, "customers.read");
  const w = new Where();
  w.add("u.role = 'customer'");
  const full = hasPermission(actor, "events.manage_all");
  if (f.search?.trim()) {
    if (full) w.add("(lower(u.full_name) like ? or u.phone_e164 like ?)", likeEsc(f.search), likeEsc(f.search));
    else w.add("lower(u.full_name) like ?", likeEsc(f.search));
  }
  const page = pageOf(f.page);
  const total = num((await q.query<{ n: number }>(`select count(*)::int as n from users u ${w.sql}`, w.params)).rows[0].n);
  const r = await q.query<Record<string, unknown>>(
    `select u.id, u.full_name, u.phone_e164, u.created_at, u.disabled_at, u.is_demo,
       (select count(*) from events e where e.owner_id = u.id)::int as events,
       greatest((select max(s.last_seen_at) from sessions s where s.user_id = u.id), (select max(e.updated_at) from events e where e.owner_id = u.id), u.updated_at) as last_activity
     from users u ${w.sql} order by last_activity desc nulls last limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`, w.params);
  return {
    total, page, pageSize: PAGE_SIZE, canDisable: hasPermission(actor, "team.manage"), masked: !full,
    rows: r.rows.map((x) => ({ id: x.id as string, name: (x.full_name as string) || "", phone: x.phone_e164 ? (full ? formatPhone(x.phone_e164 as string) : maskPhone(x.phone_e164 as string)) : "", events: num(x.events), lastActivity: iso(x.last_activity), joined: iso(x.created_at)!, disabled: !!x.disabled_at, isDemo: !!x.is_demo })),
  };
}

async function activeSuperAdmins(q: Queryable, exceptId: string) {
  return num((await q.query<{ n: number }>("select count(*)::int as n from users where role = 'super_admin' and disabled_at is null and id <> $1", [exceptId])).rows[0].n);
}

/** Disable / enable any account (customer or staff). Super admin only; never yourself; never the last active super admin. */
export async function setAccountDisabled(q: Queryable, actor: Actor, userId: string, disabled: boolean) {
  need(actor, "team.manage");
  if (!uuidLike.test(userId)) throw new NotFoundError();
  if (userId === actor.id) throw new ValidationError({ user: "self" });
  const u = (await q.query<{ role: Role }>("select role from users where id = $1", [userId])).rows[0];
  if (!u) throw new NotFoundError();
  if (disabled && u.role === "super_admin" && (await activeSuperAdmins(q, userId)) === 0) throw new ValidationError({ user: "lastSuperAdmin" });
  await q.tx(async (t) => {
    await t.query("update users set disabled_at = $2, updated_at = now() where id = $1", [userId, disabled ? new Date() : null]);
    if (disabled) await t.query("delete from sessions where user_id = $1", [userId]);
    await audit(t, actor, disabled ? "account.disable" : "account.enable", { entity: "user", id: userId }, { role: u.role });
  });
}

/* ───────────────────────── guests & rsvps (cross-event) ───────────────────────── */

export interface AdminGuestRow { id: string; eventId: string; eventTitle: string; name: string; phone: string; rsvp: string; companionsAttending: number; companions: number; delivery: string; sent: boolean; respondedAt: string | null; checkedInAt: string | null }
export interface AdminGuestFilter { eventId?: string; rsvp?: string; arrival?: string; search?: string; page?: number }

export async function adminListGuests(q: Queryable, actor: Actor, f: AdminGuestFilter): Promise<Paged<AdminGuestRow> & { masked: boolean; events: { id: string; title: string }[] }> {
  needSection(actor, "guests");
  const w = new Where();
  visibleEvents(actor, w);
  const full = hasPermission(actor, "events.manage_all");
  if (f.eventId && uuidLike.test(f.eventId)) w.add("g.event_id = ?", f.eventId);
  if (f.rsvp && ["pending", "accepted", "declined"].includes(f.rsvp)) w.add("i.rsvp_status = ?", f.rsvp);
  if (f.arrival === "yes") w.add("k.id is not null");
  if (f.arrival === "no") w.add("k.id is null");
  if (f.search?.trim()) {
    if (full) w.add("(lower(g.first_name || ' ' || g.last_name) like ? or g.phone_e164 like ?)", likeEsc(f.search), likeEsc(f.search));
    else w.add("lower(g.first_name || ' ' || g.last_name) like ?", likeEsc(f.search));
  }
  const from = "guests g join invitations i on i.guest_id = g.id join events e on e.id = g.event_id left join guest_checkins k on k.guest_id = g.id";
  const page = pageOf(f.page);
  const total = num((await q.query<{ n: number }>(`select count(*)::int as n from ${from} ${w.sql}`, w.params)).rows[0].n);
  const r = await q.query<Record<string, unknown>>(
    `select g.id, g.event_id, e.title, g.first_name, g.last_name, g.phone_e164, g.companions, i.rsvp_status, i.companions_attending, i.delivery_status, i.sent_at, i.responded_at, k.checked_in_at
       from ${from} ${w.sql} order by e.starts_at desc nulls last, g.first_name limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`, w.params);
  const ew = new Where();
  visibleEvents(actor, ew);
  const events = (await q.query<{ id: string; title: string }>(`select e.id, e.title from events e ${ew.sql} order by e.created_at desc limit 200`, ew.params)).rows;
  return {
    total, page, pageSize: PAGE_SIZE, masked: !full, events,
    rows: r.rows.map((x) => ({
      id: x.id as string, eventId: x.event_id as string, eventTitle: x.title as string, name: `${x.first_name} ${x.last_name}`.trim(), phone: full ? formatPhone(x.phone_e164 as string) : maskPhone(x.phone_e164 as string),
      rsvp: x.rsvp_status as string, companionsAttending: num(x.companions_attending), companions: num(x.companions), delivery: x.delivery_status as string, sent: !!x.sent_at, respondedAt: iso(x.responded_at), checkedInAt: iso(x.checked_in_at),
    })),
  };
}

/* ───────────────────────── templates ───────────────────────── */

export async function adminListTemplates(q: Queryable, actor: Actor) {
  need(actor, "templates.manage");
  return listTemplates(q, { includeDrafts: true });
}

export async function adminSetTemplateStatus(q: Queryable, actor: Actor, id: string, status: "published" | "coming_soon" | "draft") {
  need(actor, "templates.manage");
  if (!uuidLike.test(id) || !["published", "coming_soon", "draft"].includes(status)) throw new ValidationError({ status: "invalid" });
  const t = (await q.query<{ kind: string; ak: string | null }>(
    "select t.kind, (select a.kind from template_assets a where a.template_id = t.id order by a.created_at desc limit 1) as ak from invitation_templates t where t.id = $1", [id])).rows[0];
  if (!t) throw new NotFoundError();
  // Video / PDF designs cannot be rendered yet: they may never be offered to customers.
  if (status === "published" && (t.kind === "video" || t.kind === "motion" || t.ak === "pdf" || t.ak === "video")) throw new ValidationError({ status: "notSupported" });
  await setTemplateStatus(q, actor, id, status);
}

export async function adminUpdateTemplate(q: Queryable, actor: Actor, id: string, u: { en: string; ar: string; descEn: string; descAr: string; sort: number }) {
  need(actor, "templates.manage");
  if (!uuidLike.test(id)) throw new NotFoundError();
  const ex = await q.query("select 1 from invitation_templates where id = $1", [id]);
  if (!ex.rows[0]) throw new NotFoundError();
  await updateTemplate(q, actor, id, u);
}

const KEYS = ["names", "intro", "blessing", "date", "time", "venue", "address", "hosts", "closing", "guest"];
function cleanOverlay(raw: unknown): OverlayField[] {
  if (!Array.isArray(raw)) throw new ValidationError({ overlay: "invalid" });
  const out: OverlayField[] = [];
  for (const f of raw.slice(0, 20)) {
    if (!f || typeof f !== "object") throw new ValidationError({ overlay: "invalid" });
    const o = f as Record<string, unknown>;
    const x = Number(o.x), y = Number(o.y), w = Number(o.w);
    if (typeof o.key !== "string" || !KEYS.includes(o.key) || ![x, y, w].every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) throw new ValidationError({ overlay: "invalid" });
    const field: OverlayField = { key: o.key, x, y, w };
    if (o.align === "start" || o.align === "center" || o.align === "end") field.align = o.align;
    if (o.size !== undefined) { const s = Number(o.size); if (!Number.isFinite(s) || s < 1 || s > 20) throw new ValidationError({ overlay: "invalid" }); field.size = s; }
    if (typeof o.color === "string") { if (!/^#[0-9a-fA-F]{3,8}$/.test(o.color)) throw new ValidationError({ overlay: "invalid" }); field.color = o.color; }
    out.push(field);
  }
  return out;
}

export interface RegisterTemplateInput { slug: string; en: string; ar: string; groups: string; kind: string; url: string; overlayJson: string }
export async function adminRegisterTemplate(q: Queryable, actor: Actor, i: RegisterTemplateInput) {
  need(actor, "templates.manage");
  let overlay: OverlayField[] = [];
  if (i.overlayJson?.trim()) {
    let parsed: unknown;
    try { parsed = JSON.parse(i.overlayJson); } catch { throw new ValidationError({ overlay: "invalid" }); }
    overlay = cleanOverlay(parsed);
  }
  const kind = i.kind as "png" | "jpg" | "svg" | "pdf" | "video";
  const groups = String(i.groups ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z_]{1,30}$/.test(s)).slice(0, 8);
  const slug = i.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
  if (slug && (await q.query("select 1 from invitation_templates where slug = $1", [slug])).rows[0]) throw new ValidationError({ slug: "duplicate" });
  return registerAssetTemplate(q, actor, { slug: i.slug, en: i.en, ar: i.ar, groups: groups.length ? groups : ["general"], kind, url: i.url.trim(), overlayFields: overlay });
}

export async function adminUpdateOverlay(q: Queryable, actor: Actor, templateId: string, overlayJson: string) {
  need(actor, "templates.manage");
  if (!uuidLike.test(templateId)) throw new NotFoundError();
  let parsed: unknown;
  try { parsed = JSON.parse(overlayJson); } catch { throw new ValidationError({ overlay: "invalid" }); }
  const fields = cleanOverlay(parsed);
  const a = (await q.query<{ id: string; kind: string }>("select id, kind from template_assets where template_id = $1 order by created_at desc limit 1", [templateId])).rows[0];
  if (!a) throw new NotFoundError("no uploaded asset");
  await q.query("update template_assets set overlay_fields = $2 where id = $1", [a.id, JSON.stringify(fields)]);
  await audit(q, actor, "template.overlay", { entity: "template", id: templateId });
}

/* ───────────────────────── packages & pricing ───────────────────────── */

export interface DiscountRow { id: string; code: string; percent: number; active: boolean; expiresAt: string | null }
export async function adminPricing(q: Queryable, actor: Actor) {
  need(actor, "packages.manage");
  const discounts = (await q.query<Record<string, unknown>>("select id, code, percent, active, expires_at from discounts order by code")).rows
    .map((d) => ({ id: d.id as string, code: d.code as string, percent: Number(d.percent), active: d.active as boolean, expiresAt: iso(d.expires_at) }));
  const pub = (await q.query<{ value: { publicStatus?: string } }>("select value from platform_settings where key = 'pricing'")).rows[0]?.value?.publicStatus ?? "coming_soon";
  return { packages: await listPackages(q), addons: await listAddons(q), discounts, taxRate: await taxRate(q), publicStatus: pub };
}

export interface PackageForm {
  nameEn: string; nameAr: string; tagEn: string; tagAr: string; featuresEn: string; featuresAr: string;
  maxGuests: string; events: string; reminders: boolean; pricingStatus: string; isPublic: boolean;
}
export async function adminUpdatePackage(q: Queryable, actor: Actor, id: string, f: PackageForm) {
  need(actor, "packages.manage");
  if (!uuidLike.test(id)) throw new NotFoundError();
  const cur = (await q.query<{ limits: Record<string, number | boolean | string> }>("select limits from packages where id = $1", [id])).rows[0];
  if (!cur) throw new NotFoundError();
  const errors: Record<string, string> = {};
  if (!f.nameEn.trim() || !f.nameAr.trim()) errors.name = "required";
  const maxGuests = Number(f.maxGuests), events = Number(f.events);
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 1_000_000) errors.maxGuests = "range";
  if (!Number.isInteger(events) || events < 1 || events > 10_000) errors.events = "range";
  if (!["coming_soon", "published"].includes(f.pricingStatus)) errors.pricingStatus = "invalid";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const en = f.featuresEn.split("\n").map((s) => s.trim()).filter(Boolean);
  const ar = f.featuresAr.split("\n").map((s) => s.trim()).filter(Boolean);
  const features = Array.from({ length: Math.min(20, Math.max(en.length, ar.length)) }, (_, i) => ({ en: en[i] ?? ar[i] ?? "", ar: ar[i] ?? en[i] ?? "" }));
  const limits = { ...cur.limits, maxGuests, events, reminders: !!f.reminders };
  const u: PackageUpdate = { name: { en: f.nameEn, ar: f.nameAr }, tagline: { en: f.tagEn, ar: f.tagAr }, features, limits, pricingStatus: f.pricingStatus as "coming_soon" | "published", isPublic: !!f.isPublic };
  await updatePackage(q, actor, id, u);
}
export async function adminAddPrice(q: Queryable, actor: Actor, packageId: string, p: PriceInput) {
  need(actor, "packages.manage");
  if (!uuidLike.test(packageId)) throw new NotFoundError();
  if (!(await q.query("select 1 from packages where id = $1", [packageId])).rows[0]) throw new NotFoundError();
  await addPrice(q, actor, packageId, p);
}
export async function adminSetPriceActive(q: Queryable, actor: Actor, priceId: string, active: boolean) { need(actor, "packages.manage"); if (!uuidLike.test(priceId)) throw new NotFoundError(); await setPriceActive(q, actor, priceId, !!active); }
export async function adminDeletePrice(q: Queryable, actor: Actor, priceId: string) { need(actor, "packages.manage"); if (!uuidLike.test(priceId)) throw new NotFoundError(); await deletePrice(q, actor, priceId); }
export async function adminUpsertAddon(q: Queryable, actor: Actor, a: { slug: string; en: string; ar: string; pricing: "flat" | "per_guest"; priceSar: number; active: boolean }) {
  need(actor, "packages.manage");
  if (!["flat", "per_guest"].includes(a.pricing)) throw new ValidationError({ addon: "invalid" });
  await upsertAddon(q, actor, a);
}
/** `percent` is entered as 15 for 15%. */
export async function adminSetTax(q: Queryable, actor: Actor, percent: number) { need(actor, "packages.manage"); await setTaxRate(q, actor, Number(percent) / 100); }

export async function addDiscount(q: Queryable, actor: Actor, d: { code: string; percent: number; expiresAt?: string }) {
  need(actor, "packages.manage");
  const code = d.code.trim().toUpperCase();
  const errors: Record<string, string> = {};
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) errors.code = "invalid";
  if (!(Number(d.percent) > 0 && Number(d.percent) <= 100)) errors.percent = "range";
  let exp: Date | null = null;
  if (d.expiresAt) { exp = new Date(d.expiresAt); if (Number.isNaN(exp.getTime())) errors.expiresAt = "invalid"; }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  if ((await q.query("select 1 from discounts where code = $1", [code])).rows[0]) throw new ValidationError({ code: "duplicate" });
  await q.query("insert into discounts (code, percent, expires_at) values ($1,$2,$3)", [code, Number(d.percent), exp]);
  await audit(q, actor, "discount.add", { entity: "discount", id: code }, { percent: Number(d.percent) });
}
export async function setDiscountActive(q: Queryable, actor: Actor, id: string, active: boolean) {
  need(actor, "packages.manage");
  if (!uuidLike.test(id)) throw new NotFoundError();
  await q.query("update discounts set active = $2 where id = $1", [id, !!active]);
  await audit(q, actor, "discount.toggle", { entity: "discount", id }, { active: !!active });
}

/* ───────────────────────── messaging ───────────────────────── */

export interface AdminMessageRow { id: string; at: string; eventId: string; eventTitle: string; guest: string; kind: string; status: string; provider: string; locale: string }
export async function adminListMessages(q: Queryable, actor: Actor, f: { status?: string; provider?: string; kind?: string; page?: number }): Promise<Paged<AdminMessageRow>> {
  need(actor, "messaging.read");
  const w = new Where();
  if (f.status && ["queued", "demo_simulated", "sent", "delivered", "read", "failed"].includes(f.status)) w.add("m.status = ?", f.status);
  if (f.provider && ["demo", "whatsapp"].includes(f.provider)) w.add("m.provider = ?", f.provider);
  if (f.kind && ["invite", "reminder", "rsvp_confirmation", "pass"].includes(f.kind)) w.add("m.kind = ?", f.kind);
  const page = pageOf(f.page);
  const total = num((await q.query<{ n: number }>(`select count(*)::int as n from message_records m ${w.sql}`, w.params)).rows[0].n);
  const r = await q.query<Record<string, unknown>>(
    `select m.id, m.created_at, m.event_id, e.title, trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as guest, m.kind, m.status, m.provider, m.locale
       from message_records m join events e on e.id = m.event_id left join guests g on g.id = m.guest_id ${w.sql} order by m.created_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`, w.params);
  return { total, page, pageSize: PAGE_SIZE, rows: r.rows.map((x) => ({ id: x.id as string, at: iso(x.created_at)!, eventId: x.event_id as string, eventTitle: x.title as string, guest: x.guest as string, kind: x.kind as string, status: x.status as string, provider: x.provider as string, locale: x.locale as string })) };
}

export interface ContactRow { id: string; name: string; replyTo: string; message: string; locale: string; createdAt: string; handledAt: string | null }
export async function adminListContacts(q: Queryable, actor: Actor, f: { show?: string }): Promise<ContactRow[]> {
  need(actor, "messaging.read");
  const cond = f.show === "handled" ? "where handled_at is not null" : f.show === "all" ? "" : "where handled_at is null";
  return (await q.query<Record<string, unknown>>(`select * from contact_messages ${cond} order by created_at desc limit 100`)).rows
    .map((x) => ({ id: x.id as string, name: x.name as string, replyTo: x.reply_to as string, message: x.message as string, locale: x.locale as string, createdAt: iso(x.created_at)!, handledAt: iso(x.handled_at) }));
}
export async function markContactHandled(q: Queryable, actor: Actor, id: string) {
  need(actor, "messaging.read");
  if (!uuidLike.test(id)) throw new NotFoundError();
  const r = await q.query("update contact_messages set handled_at = coalesce(handled_at, now()) where id = $1 returning id", [id]);
  if (!r.rows[0]) throw new NotFoundError();
  await audit(q, actor, "contact.handled", { entity: "contact_message", id });
}

/* ───────────────────────── check-in ───────────────────────── */

export interface CheckinEventRow { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; venueName: string; city: string; accepted: number; attended: number }
/** Events this actor may operate check-in for: candidates by SQL, then confirmed per event with eventAccess(). */
export async function listCheckinEvents(q: Queryable, actor: Actor): Promise<CheckinEventRow[]> {
  needSection(actor, "checkin");
  const w = new Where();
  w.add("e.status in ('confirmed','live','completed')");
  if (!hasPermission(actor, "checkin.operate_all")) {
    w.add("(e.owner_id = ? or exists (select 1 from event_assignments ea where ea.event_id = e.id and ea.user_id = ?))", actor.id, actor.id);
  }
  const r = await q.query<Record<string, unknown>>(
    `select e.id, e.title, e.occasion, e.occasion_custom, e.status, e.starts_at, e.venue_name, e.city,
       (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')::int as accepted,
       (select count(*) from guest_checkins k where k.event_id = e.id)::int as attended
     from events e ${w.sql} order by e.starts_at asc nulls last limit 200`, w.params);
  const out: CheckinEventRow[] = [];
  for (const x of r.rows) {
    if (!(await eventAccess(q, actor, x.id as string)).checkin) continue;
    out.push({ id: x.id as string, title: x.title as string, occasion: x.occasion as string, occasionCustom: x.occasion_custom as string | null, status: x.status as string, startsAt: iso(x.starts_at), venueName: x.venue_name as string, city: x.city as string, accepted: num(x.accepted), attended: num(x.attended) });
  }
  return out;
}

export interface CheckinPanel {
  event: { id: string; title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; venueName: string; city: string };
  counts: { attended: number; accepted: number; seats: number };
  history: CheckInHistoryRow[];
  /** Only populated in demo mode: accepted guests that can be checked in without a scanner. */
  simulate: { id: string; name: string; checkedIn: boolean }[] | null;
  demo: boolean;
}
export async function getCheckinPanel(q: Queryable, actor: Actor, eventId: string): Promise<CheckinPanel> {
  needSection(actor, "checkin");
  if (!uuidLike.test(eventId)) throw new NotFoundError();
  const a = await eventAccess(q, actor, eventId);
  if (!a.view && !a.checkin) throw new NotFoundError("event not found");
  if (!a.checkin) throw new ForbiddenError("missing checkin access");
  const e = (await q.query<Record<string, unknown>>("select id, title, occasion, occasion_custom, status, starts_at, venue_name, city from events where id = $1", [eventId])).rows[0];
  if (!e) throw new NotFoundError();
  const c = (await q.query<Record<string, number>>(
    `select (select count(*) from guest_checkins where event_id = $1)::int as attended,
            (select count(*) from invitations where event_id = $1 and rsvp_status = 'accepted')::int as accepted,
            (select coalesce(sum(1 + companions_attending),0) from invitations where event_id = $1 and rsvp_status = 'accepted')::int as seats`, [eventId])).rows[0];
  const demo = demoAccessEnabled();
  let simulate: CheckinPanel["simulate"] = null;
  if (demo) {
    simulate = (await q.query<Record<string, unknown>>(
      `select g.id, trim(g.first_name || ' ' || g.last_name) as name, (k.id is not null) as checked
         from guests g join invitations i on i.guest_id = g.id left join guest_checkins k on k.guest_id = g.id
        where g.event_id = $1 and i.rsvp_status = 'accepted' order by g.first_name, g.last_name limit 300`, [eventId])).rows
      .map((x) => ({ id: x.id as string, name: x.name as string, checkedIn: !!x.checked }));
  }
  return {
    event: { id: eventId, title: e.title as string, occasion: e.occasion as string, occasionCustom: e.occasion_custom as string | null, status: e.status as string, startsAt: iso(e.starts_at), venueName: e.venue_name as string, city: e.city as string },
    counts: { attended: num(c.attended), accepted: num(c.accepted), seats: num(c.seats) },
    history: await checkInHistory(q, actor, eventId, 15), simulate, demo,
  };
}

/* ───────────────────────── reports ───────────────────────── */

export interface ReportData {
  byStatus: { key: string; n: number }[];
  byOccasion: { key: string; n: number }[];
  funnel: { guests: number; sent: number; opened: number; responded: number; accepted: number; declined: number; checkedIn: number };
  attendance: { id: string; title: string; accepted: number; checkedIn: number }[];
  messagesByKind: { key: string; n: number }[];
  messagesByStatus: { key: string; n: number }[];
  orders: { count: number; totalMinor: number };
}
export async function buildReports(q: Queryable, actor: Actor): Promise<ReportData> {
  need(actor, "reports.read");
  const grp = async (sql: string) => (await q.query<{ key: string; n: number }>(sql)).rows.map((r) => ({ key: r.key, n: num(r.n) }));
  const f = (await q.query<Record<string, number>>(
    `select (select count(*) from guests)::int as guests,
            (select count(*) from invitations where sent_at is not null)::int as sent,
            (select count(*) from invitations where opened_at is not null)::int as opened,
            (select count(*) from invitations where responded_at is not null)::int as responded,
            (select count(*) from invitations where rsvp_status = 'accepted')::int as accepted,
            (select count(*) from invitations where rsvp_status = 'declined')::int as declined,
            (select count(*) from guest_checkins)::int as checked`)).rows[0];
  const att = (await q.query<Record<string, unknown>>(
    `select e.id, e.title, (select count(*) from invitations i where i.event_id = e.id and i.rsvp_status = 'accepted')::int as accepted,
            (select count(*) from guest_checkins k where k.event_id = e.id)::int as checked
       from events e where e.status in ('confirmed','live','completed') order by e.starts_at desc nulls last limit 30`)).rows;
  const o = (await q.query<Record<string, unknown>>("select count(*)::int as n, coalesce(sum(total_minor),0) as t from orders where is_demo and status <> 'cancelled'")).rows[0];
  return {
    byStatus: await grp("select status as key, count(*)::int as n from events group by status order by n desc"),
    byOccasion: await grp("select occasion as key, count(*)::int as n from events group by occasion order by n desc"),
    funnel: { guests: num(f.guests), sent: num(f.sent), opened: num(f.opened), responded: num(f.responded), accepted: num(f.accepted), declined: num(f.declined), checkedIn: num(f.checked) },
    attendance: att.map((x) => ({ id: x.id as string, title: x.title as string, accepted: num(x.accepted), checkedIn: num(x.checked) })),
    messagesByKind: await grp("select kind as key, count(*)::int as n from message_records group by kind order by n desc"),
    messagesByStatus: await grp("select status as key, count(*)::int as n from message_records group by status order by n desc"),
    orders: { count: num(o.n), totalMinor: num(o.t) },
  };
}

/** Aggregate CSV (no personal data). Audited. */
export async function reportCsv(q: Queryable, actor: Actor): Promise<string> {
  const r = await buildReports(q, actor);
  await audit(q, actor, "report.export", { entity: "report", id: "aggregate" });
  const rows: (string | number)[][] = [["section", "key", "value", "value2"]];
  r.byStatus.forEach((x) => rows.push(["events_by_status", x.key, x.n, ""]));
  r.byOccasion.forEach((x) => rows.push(["events_by_occasion", x.key, x.n, ""]));
  (Object.entries(r.funnel) as [string, number][]).forEach(([k, v]) => rows.push(["rsvp_funnel", k, v, ""]));
  r.attendance.forEach((x) => rows.push(["attendance", x.title, x.accepted, x.checkedIn]));
  r.messagesByKind.forEach((x) => rows.push(["messages_by_kind", x.key, x.n, ""]));
  r.messagesByStatus.forEach((x) => rows.push(["messages_by_status", x.key, x.n, ""]));
  rows.push(["demo_orders", "count", r.orders.count, ""], ["demo_orders", "total_sar_DEMO_NOT_REAL_REVENUE", (r.orders.totalMinor / 100).toFixed(2), ""]);
  return toCsv(rows);
}

/* ───────────────────────── team ───────────────────────── */

export interface StaffRow { id: string; name: string; phone: string; role: Role; disabled: boolean; created: string; isSelf: boolean; isDemo: boolean }
export async function listStaff(q: Queryable, actor: Actor): Promise<StaffRow[]> {
  need(actor, "team.manage");
  return (await q.query<Record<string, unknown>>("select id, full_name, phone_e164, role, disabled_at, created_at, is_demo from users where role <> 'customer' order by case role when 'super_admin' then 0 when 'admin' then 1 when 'event_manager' then 2 else 3 end, full_name")).rows
    .map((x) => ({ id: x.id as string, name: (x.full_name as string) || "", phone: x.phone_e164 ? formatPhone(x.phone_e164 as string) : "", role: x.role as Role, disabled: !!x.disabled_at, created: iso(x.created_at)!, isSelf: x.id === actor.id, isDemo: !!x.is_demo }));
}

export async function addStaff(q: Queryable, actor: Actor, input: { phone: string; dial: string; role: string; fullName?: string }) {
  need(actor, "team.manage");
  if (!(STAFF_ROLES as readonly string[]).includes(input.role)) throw new ValidationError({ role: "required" });
  const ph = normalizePhone(input.phone, input.dial || "+966");
  if (!ph.ok) throw new ValidationError({ phone: "invalid" });
  const name = (input.fullName ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, 80);
  const ex = (await q.query<{ id: string; role: Role }>("select id, role from users where phone_e164 = $1", [ph.e164])).rows[0];
  if (ex && ex.role !== "customer") throw new ValidationError({ phone: "exists" });
  let id: string;
  if (ex) {
    id = ex.id;
    await q.query("update users set role = $2, full_name = case when $3 <> '' then $3 else full_name end, disabled_at = null, updated_at = now() where id = $1", [id, input.role, name]);
  } else {
    id = (await q.query<{ id: string }>("insert into users (phone_e164, role, full_name) values ($1,$2,$3) returning id", [ph.e164, input.role, name])).rows[0].id;
  }
  await audit(q, actor, "team.add", { entity: "user", id }, { role: input.role, promoted: !!ex });
  return { id };
}

export async function changeStaffRole(q: Queryable, actor: Actor, userId: string, role: string) {
  need(actor, "team.manage");
  if (!uuidLike.test(userId)) throw new NotFoundError();
  if (!(ROLES as readonly string[]).includes(role)) throw new ValidationError({ role: "required" });
  if (userId === actor.id) throw new ValidationError({ user: "self" });
  const u = (await q.query<{ role: Role }>("select role from users where id = $1", [userId])).rows[0];
  if (!u) throw new NotFoundError();
  if (u.role === "super_admin" && role !== "super_admin" && (await activeSuperAdmins(q, userId)) === 0) throw new ValidationError({ user: "lastSuperAdmin" });
  if (u.role === role) return;
  await q.query("update users set role = $2, updated_at = now() where id = $1", [userId, role]);
  await audit(q, actor, "team.role_change", { entity: "user", id: userId }, { from: u.role, to: role });
}

/* ───────────────────────── settings ───────────────────────── */

export async function platformStatus(db: Db, actor: Actor) {
  need(actor, "settings.manage");
  const c = (await db.query<Record<string, number>>("select (select count(*) from users)::int as users, (select count(*) from events)::int as events, (select count(*) from guests)::int as guests")).rows[0];
  const pricing = (await db.query<{ value: { publicStatus?: string } }>("select value from platform_settings where key = 'pricing'")).rows[0]?.value?.publicStatus ?? "coming_soon";
  // Booleans and names only. Never read or return secret values.
  return {
    demoAccess: demoAccessEnabled(), production: isProduction(), provider: process.env.MESSAGING_PROVIDER === "whatsapp" ? ("whatsapp" as const) : ("demo" as const),
    driver: db.driver, ephemeral: db.ephemeral, otpConfigured: !!process.env.OTP_PROVIDER, taxRate: await taxRate(db), pricingPublic: pricing,
    counts: { users: num(c.users), events: num(c.events), guests: num(c.guests) },
  };
}

/* ───────────────────────── audit ───────────────────────── */

class AuditWhere extends Where {
  eventId(id: string) { if (uuidLike.test(id)) this.add("a.event_id = ?", id); return this; }
}
const SENSITIVE_KEY = /phone|name|email|token|code|link|url|body|message/i;
function safeMeta(m: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (m && typeof m === "object") {
    for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(k)) continue;
      if (typeof v === "string") out[k] = v.slice(0, 60);
      else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
  }
  return out;
}
async function queryAudit(q: Queryable, w: Where, page: number, size = PAGE_SIZE): Promise<Paged<AuditRow>> {
  const total = num((await q.query<{ n: number }>(`select count(*)::int as n from audit_logs a ${w.sql}`, w.params)).rows[0].n);
  const r = await q.query<Record<string, unknown>>(
    `select a.id, a.created_at, a.action, a.entity, a.entity_id, a.event_id, a.actor_role, a.actor_id, a.meta, u.full_name, u.role as urole
       from audit_logs a left join users u on u.id = a.actor_id ${w.sql} order by a.id desc limit ${size} offset ${(page - 1) * size}`, w.params);
  return {
    total, page, pageSize: size,
    rows: r.rows.map((x) => {
      const staff = x.urole && x.urole !== "customer";
      return {
        id: Number(x.id), at: iso(x.created_at)!, action: x.action as string, entity: x.entity as string | null, entityId: x.entity_id ? String(x.entity_id).slice(0, 8) : null, eventId: x.event_id ? String(x.event_id) : null,
        actorRole: x.actor_role as string | null, actorName: staff ? (x.full_name as string) || null : null, actorShort: x.actor_id ? String(x.actor_id).slice(0, 8) : null, meta: safeMeta(x.meta),
      };
    }),
  };
}
export async function listAuditLogs(q: Queryable, actor: Actor, f: { action?: string; role?: string; eventId?: string; page?: number }): Promise<Paged<AuditRow>> {
  need(actor, "audit.read");
  const w = new AuditWhere();
  if (f.action?.trim() && /^[a-z0-9_.]{1,40}$/i.test(f.action.trim())) w.add("a.action like ?", `${f.action.trim().replace(/[%_\\]/g, "\\$&")}%`);
  if (f.role && (ROLES as readonly string[]).includes(f.role)) w.add("a.actor_role = ?", f.role);
  if (f.eventId) w.eventId(f.eventId);
  return queryAudit(q, w, pageOf(f.page));
}
