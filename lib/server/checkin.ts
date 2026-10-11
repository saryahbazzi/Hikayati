import "server-only";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { demoAccessEnabled } from "./config";
import { eventAccess, type Actor } from "./permissions";
import { verifyPassToken } from "./tokens";

export type CheckInResult =
  | { ok: true; result: "success"; guest: { id: string; name: string; companions: number }; at: string }
  | { ok: false; result: "already_checked_in"; guest: { id: string; name: string }; at: string }
  | { ok: false; result: "invalid" | "wrong_event" | "not_accepted" | "revoked" | "forbidden" };

const log = (q: Queryable, eventId: string | null, guestId: string | null, result: string, by: string, method: string, meta: object = {}) =>
  q.query("insert into checkin_attempts (event_id, guest_id, result, by_user, method, meta) values ($1,$2,$3,$4,$5,$6)", [eventId, guestId, result, by, method, JSON.stringify(meta)]);

/**
 * Verify a scanned credential and record attendance. Authorization is evaluated against the pass's event,
 * and the single-use rule is enforced by the database (unique guest_checkins.guest_id / entry_pass_id),
 * so two phones scanning the same code at once cannot both succeed.
 */
export async function checkInByToken(q: Queryable, actor: Actor, token: string, opts: { expectedEventId?: string; method?: "scanner" | "manual" | "demo_simulated" } = {}): Promise<CheckInResult> {
  const method = opts.method ?? "scanner";
  const parsed = verifyPassToken(token);
  if (!parsed) { await log(q, opts.expectedEventId ?? null, null, "invalid", actor.id, method); return { ok: false, result: "invalid" }; }
  const pass = (await q.query<{ id: string; event_id: string; guest_id: string; invitation_id: string; status: string }>("select id, event_id, guest_id, invitation_id, status from entry_passes where id = $1", [parsed.id])).rows[0];
  if (!pass) { await log(q, opts.expectedEventId ?? null, null, "invalid", actor.id, method); return { ok: false, result: "invalid" }; }
  const access = await eventAccess(q, actor, pass.event_id);
  if (!access.checkin) { await log(q, pass.event_id, pass.guest_id, "forbidden", actor.id, method); return { ok: false, result: "forbidden" }; }
  if (opts.expectedEventId && opts.expectedEventId !== pass.event_id) { await log(q, opts.expectedEventId, pass.guest_id, "wrong_event", actor.id, method); return { ok: false, result: "wrong_event" }; }
  return finish(q, actor, pass, method);
}

/** Demo helper: check a guest in without a scanner. Only for the event owner / staff with check-in access. */
export async function simulateCheckIn(q: Queryable, actor: Actor, guestId: string): Promise<CheckInResult> {
  if (!demoAccessEnabled()) return { ok: false, result: "forbidden" }; // simulation exists only in demo mode
  const pass = (await q.query<{ id: string; event_id: string; guest_id: string; invitation_id: string; status: string }>(
    "select id, event_id, guest_id, invitation_id, status from entry_passes where guest_id = $1 and status in ('active','used') order by issued_at desc limit 1", [guestId])).rows[0];
  if (!pass) {
    const g = (await q.query<{ event_id: string }>("select event_id from guests where id = $1", [guestId])).rows[0];
    if (g && (await eventAccess(q, actor, g.event_id)).checkin) { await log(q, g.event_id, guestId, "not_accepted", actor.id, "demo_simulated"); return { ok: false, result: "not_accepted" }; }
    return { ok: false, result: "forbidden" };
  }
  const access = await eventAccess(q, actor, pass.event_id);
  if (!access.checkin) { await log(q, pass.event_id, guestId, "forbidden", actor.id, "demo_simulated"); return { ok: false, result: "forbidden" }; }
  return finish(q, actor, pass, "demo_simulated");
}

async function finish(q: Queryable, actor: Actor, pass: { id: string; event_id: string; guest_id: string; invitation_id: string; status: string }, method: "scanner" | "manual" | "demo_simulated"): Promise<CheckInResult> {
  const info = (await q.query<{ first_name: string; last_name: string; companions_attending: number; rsvp_status: string; event_status: string }>(
    `select g.first_name, g.last_name, i.companions_attending, i.rsvp_status, e.status as event_status
       from guests g join invitations i on i.guest_id = g.id join events e on e.id = g.event_id where g.id = $1`, [pass.guest_id])).rows[0];
  const name = `${info.first_name} ${info.last_name}`.trim();
  if (pass.status === "revoked") { await log(q, pass.event_id, pass.guest_id, "revoked", actor.id, method); return { ok: false, result: "revoked" }; }
  if (info.rsvp_status !== "accepted" || info.event_status === "cancelled") { await log(q, pass.event_id, pass.guest_id, "not_accepted", actor.id, method); return { ok: false, result: "not_accepted" }; }
  return q.tx(async (t) => {
    const ins = await t.query<{ checked_in_at: Date }>(
      `insert into guest_checkins (event_id, guest_id, entry_pass_id, checked_in_by, method) values ($1,$2,$3,$4,$5)
       on conflict do nothing returning checked_in_at`, [pass.event_id, pass.guest_id, pass.id, actor.id, method]);
    if (!ins.rows[0]) {
      const prev = (await t.query<{ checked_in_at: Date }>("select checked_in_at from guest_checkins where guest_id = $1", [pass.guest_id])).rows[0];
      await log(t, pass.event_id, pass.guest_id, "already_checked_in", actor.id, method);
      return { ok: false as const, result: "already_checked_in" as const, guest: { id: pass.guest_id, name }, at: new Date(prev?.checked_in_at ?? Date.now()).toISOString() };
    }
    await t.query("update entry_passes set status = 'used', used_at = now() where id = $1", [pass.id]);
    await log(t, pass.event_id, pass.guest_id, "success", actor.id, method);
    await audit(t, actor, "checkin.success", { entity: "guest", id: pass.guest_id, eventId: pass.event_id }, { method });
    return { ok: true as const, result: "success" as const, guest: { id: pass.guest_id, name, companions: info.companions_attending }, at: new Date(ins.rows[0].checked_in_at).toISOString() };
  });
}

export interface CheckInHistoryRow { id: string; at: string; result: string; method: string; guestName: string | null; by: string | null }
export async function checkInHistory(q: Queryable, actor: Actor, eventId: string, limit = 50): Promise<CheckInHistoryRow[]> {
  const a = await eventAccess(q, actor, eventId);
  if (!a.checkin && !a.view) return [];
  const r = await q.query<Record<string, unknown>>(
    `select a.id, a.created_at, a.result, a.method, trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as guest_name, u.full_name as by_name
       from checkin_attempts a left join guests g on g.id = a.guest_id left join users u on u.id = a.by_user
      where a.event_id = $1 order by a.created_at desc, a.id desc limit $2`, [eventId, limit]);
  return r.rows.map((x) => ({ id: String(x.id), at: new Date(x.created_at as string).toISOString(), result: x.result as string, method: x.method as string, guestName: (x.guest_name as string) || null, by: (x.by_name as string) || null }));
}

