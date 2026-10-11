import "server-only";
import { formatDate, formatTime, zonedToUtc, addDays } from "@/lib/domain/time";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { getProvider } from "./messaging";
import { reminderBody } from "./messaging/templates";
import { ValidationError, requireEventAccess, type Actor } from "./permissions";
import { invitationPath } from "./invitations";
import type { EventRow } from "./events";

export type Audience = "not_responded" | "confirmed" | "all_invited";
export interface ReminderInput { kind: "before_event" | "custom"; daysBefore?: number; customAt?: string; audience: Audience; message?: string }
export interface ReminderRuleRow { id: string; kind: string; daysBefore: number | null; runAt: string; audience: Audience; message: string | null; status: string; sent: number; audienceNow: number }

const SEND_HOUR = "10:00";

async function eligible(q: Queryable, eventId: string, audience: Audience) {
  const cond = audience === "not_responded" ? "i.rsvp_status = 'pending'" : audience === "confirmed" ? "i.rsvp_status = 'accepted'" : "i.rsvp_status <> 'declined'";
  return (await q.query<{ guest_id: string; first_name: string; phone_e164: string; preferred_language: "ar" | "en" | null; invitation_id: string; link_version: number }>(
    `select g.id as guest_id, g.first_name, g.phone_e164, g.preferred_language, i.id as invitation_id, i.link_version
       from guests g join invitations i on i.guest_id = g.id
      where g.event_id = $1 and g.opted_out_at is null and i.status <> 'revoked' and i.sent_at is not null and ${cond}`, [eventId])).rows;
}

export async function createReminder(q: Queryable, actor: Actor, eventId: string, input: ReminderInput) {
  await requireEventAccess(q, actor, eventId, "manage");
  const ev = (await q.query<EventRow>("select * from events where id = $1", [eventId])).rows[0];
  const errors: Record<string, string> = {};
  let runAt: Date | null = null;
  if (!["not_responded", "confirmed", "all_invited"].includes(input.audience)) errors.audience = "required";
  if (input.kind === "before_event") {
    const n = Number(input.daysBefore);
    if (!ev.starts_at) errors.daysBefore = "noDate";
    else if (!Number.isInteger(n) || n < 1 || n > 60) errors.daysBefore = "range";
    else {
      const startDay = new Intl.DateTimeFormat("en-CA", { timeZone: ev.timezone }).format(ev.starts_at);
      const eventDay = zonedToUtc(startDay, SEND_HOUR, ev.timezone);
      runAt = addDays(eventDay, -n);
    }
  } else {
    // custom: "YYYY-MM-DDTHH:MM" in the event's time zone
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(input.customAt ?? "");
    if (!m) errors.customAt = "required";
    else runAt = zonedToUtc(m[1], m[2], ev.timezone);
  }
  if (runAt && runAt.getTime() <= Date.now()) errors[input.kind === "custom" ? "customAt" : "daysBefore"] = "past";
  if (runAt && ev.starts_at && runAt.getTime() >= new Date(ev.starts_at).getTime()) errors[input.kind === "custom" ? "customAt" : "daysBefore"] = "afterEvent";
  if (Object.keys(errors).length || !runAt) throw new ValidationError(errors);
  const dup = await q.query("select 1 from reminder_rules where event_id=$1 and audience=$2 and run_at=$3 and status='active'", [eventId, input.audience, runAt]);
  if (dup.rows.length) throw new ValidationError({ duplicate: "duplicate" });
  const id = (await q.query<{ id: string }>(
    "insert into reminder_rules (event_id, kind, days_before, run_at, audience, message, created_by) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [eventId, input.kind, input.kind === "before_event" ? Number(input.daysBefore) : null, runAt, input.audience, input.message?.trim().slice(0, 400) || null, actor.id])).rows[0].id;
  await audit(q, actor, "reminder.create", { entity: "reminder", id, eventId });
  return { id, runAt: runAt.toISOString() };
}

export async function cancelReminder(q: Queryable, actor: Actor, ruleId: string) {
  const r = (await q.query<{ event_id: string }>("select event_id from reminder_rules where id = $1", [ruleId])).rows[0];
  if (!r) return;
  await requireEventAccess(q, actor, r.event_id, "manage");
  await q.query("update reminder_rules set status='cancelled' where id=$1 and status='active'", [ruleId]);
  await audit(q, actor, "reminder.cancel", { entity: "reminder", id: ruleId, eventId: r.event_id });
}

export async function listReminders(q: Queryable, actor: Actor, eventId: string): Promise<ReminderRuleRow[]> {
  await requireEventAccess(q, actor, eventId, "view");
  const r = await q.query<Record<string, unknown>>(
    `select r.*, (select count(*) from reminder_jobs j where j.rule_id = r.id and j.state = 'simulated')::int as sent from reminder_rules r where r.event_id = $1 order by r.run_at`, [eventId]);
  const out: ReminderRuleRow[] = [];
  for (const x of r.rows) {
    const audience = x.audience as Audience;
    out.push({ id: x.id as string, kind: x.kind as string, daysBefore: x.days_before as number | null, runAt: new Date(x.run_at as string).toISOString(), audience, message: x.message as string | null,
      status: x.status as string, sent: x.sent as number, audienceNow: x.status === "active" ? (await eligible(q, eventId, audience)).length : 0 });
  }
  return out;
}

/** Process one rule: one job per guest (unique rule+guest), so running twice never double-sends. */
async function runRule(q: Queryable, rule: { id: string; event_id: string; audience: Audience; message: string | null }, origin: string) {
  const ev = (await q.query<EventRow>("select * from events where id = $1", [rule.event_id])).rows[0];
  const provider = getProvider();
  let n = 0;
  for (const g of await eligible(q, rule.event_id, rule.audience)) {
    const job = await q.query<{ id: string }>("insert into reminder_jobs (rule_id, guest_id, run_at, state) values ($1,$2,now(),'pending') on conflict do nothing returning id", [rule.id, g.guest_id]);
    if (!job.rows[0]) continue;
    const locale = g.preferred_language ?? (ev.invitation_language === "en" ? "en" : "ar");
    const body = reminderBody(locale, { guestName: g.first_name, eventTitle: ev.title, date: formatDate(ev.starts_at, locale, ev.timezone), time: formatTime(ev.starts_at, locale, ev.timezone), venue: ev.venue_name, link: `${origin}${invitationPath(locale, g.invitation_id, g.link_version)}` }, rule.message);
    const res = await provider.send({ eventId: rule.event_id, guestId: g.guest_id, invitationId: g.invitation_id, kind: "reminder", to: g.phone_e164, locale, body });
    const msg = (await q.query<{ id: string }>("insert into message_records (event_id, guest_id, invitation_id, provider, kind, status, locale, body, meta) values ($1,$2,$3,$4,'reminder',$5,$6,$7,$8) returning id",
      [rule.event_id, g.guest_id, g.invitation_id, provider.name, res.status, locale, body, JSON.stringify({ ruleId: rule.id })])).rows[0].id;
    await q.query("update reminder_jobs set state='simulated', processed_at=now(), message_id=$2 where id=$1", [job.rows[0].id, msg]);
    n++;
  }
  await q.query("update reminder_rules set status='completed' where id=$1", [rule.id]);
  return n;
}

/** Cron entry point (also safe to call from the UI): runs every active rule that is due. */
export async function processDueReminders(q: Queryable, origin: string, now = new Date()) {
  const due = (await q.query<{ id: string; event_id: string; audience: Audience; message: string | null }>(
    "select id, event_id, audience, message from reminder_rules where status='active' and run_at <= $1 order by run_at", [now])).rows;
  let sent = 0;
  for (const r of due) sent += await q.tx((t) => runRule(t, r, origin));
  return { rules: due.length, sent };
}

/** Demo: run a rule right now regardless of its schedule. Labelled as a simulation in the UI. */
export async function runReminderNow(q: Queryable, actor: Actor, ruleId: string, origin: string) {
  const r = (await q.query<{ id: string; event_id: string; audience: Audience; message: string | null; status: string }>("select id, event_id, audience, message, status from reminder_rules where id = $1", [ruleId])).rows[0];
  if (!r) return { sent: 0 };
  await requireEventAccess(q, actor, r.event_id, "manage");
  if (r.status !== "active") throw new ValidationError({ reminder: "notActive" });
  const sent = await q.tx((t) => runRule(t, r, origin));
  await audit(q, actor, "reminder.run_now", { entity: "reminder", id: ruleId, eventId: r.event_id }, { sent });
  return { sent };
}
