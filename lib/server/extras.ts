import "server-only";
import { toCsv } from "@/lib/csv";
import { formatPhone } from "@/lib/phone";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { NotFoundError, ValidationError, requireEventAccess, type Actor } from "./permissions";
import { signPassToken } from "./tokens";
import { normalizePhone } from "@/lib/phone";
import { listGuests } from "./guests";

// ---------- collaborators (host shares event statistics / guest management) ----------
export async function addCollaborator(q: Queryable, actor: Actor, eventId: string, phoneInput: string, permission: "view_stats" | "manage_guests") {
  const a = await requireEventAccess(q, actor, eventId, "manage");
  if (!a.owner) throw new ValidationError({ collaborator: "ownerOnly" });
  const phone = normalizePhone(phoneInput);
  if (!phone.ok) throw new ValidationError({ phone: "invalid" });
  const u = (await q.query<{ id: string }>("select id from users where phone_e164 = $1 and disabled_at is null", [phone.e164])).rows[0];
  if (!u) throw new ValidationError({ phone: "noAccount" }); // they must have signed in once
  if (u.id === actor.id) throw new ValidationError({ phone: "self" });
  await q.query(`insert into event_collaborators (event_id, user_id, permission, invited_by) values ($1,$2,$3,$4)
    on conflict (event_id, user_id) do update set permission = excluded.permission`, [eventId, u.id, permission, actor.id]);
  await audit(q, actor, "collaborator.add", { entity: "event", id: eventId, eventId }, { permission });
}

export async function removeCollaborator(q: Queryable, actor: Actor, eventId: string, userId: string) {
  const a = await requireEventAccess(q, actor, eventId, "manage");
  if (!a.owner) throw new ValidationError({ collaborator: "ownerOnly" });
  await q.query("delete from event_collaborators where event_id = $1 and user_id = $2", [eventId, userId]);
  await audit(q, actor, "collaborator.remove", { entity: "event", id: eventId, eventId });
}

export async function listCollaborators(q: Queryable, actor: Actor, eventId: string) {
  await requireEventAccess(q, actor, eventId, "view");
  return (await q.query<{ user_id: string; permission: string; full_name: string; phone_e164: string }>(
    `select c.user_id, c.permission, u.full_name, u.phone_e164 from event_collaborators c join users u on u.id = c.user_id where c.event_id = $1 order by c.created_at`, [eventId]))
    .rows.map((r) => ({ userId: r.user_id, permission: r.permission as "view_stats" | "manage_guests", name: r.full_name, phone: formatPhone(r.phone_e164) }));
}

// ---------- profile ----------
export async function updateProfile(q: Queryable, actor: Actor, input: { fullName: string; email: string; locale: string }) {
  const errors: Record<string, string> = {};
  const fullName = input.fullName.trim().slice(0, 80);
  const email = input.email.trim().slice(0, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "invalid";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  await q.query("update users set full_name = $2, email = nullif($3,''), locale = $4, updated_at = now() where id = $1", [actor.id, fullName, email, input.locale === "en" ? "en" : "ar"]);
  await audit(q, actor, "profile.update", { entity: "user", id: actor.id });
}

export async function getProfile(q: Queryable, actor: Actor) {
  const r = (await q.query<{ full_name: string; email: string | null; phone_e164: string | null; locale: "ar" | "en" }>("select full_name, email, phone_e164, locale from users where id = $1", [actor.id])).rows[0];
  if (!r) throw new NotFoundError();
  return { fullName: r.full_name, email: r.email ?? "", phone: r.phone_e164 ? formatPhone(r.phone_e164) : "", locale: r.locale };
}

// ---------- guest list export (personal data: restricted + audited) ----------
export async function exportGuestsCsv(q: Queryable, actor: Actor, eventId: string): Promise<string> {
  const a = await requireEventAccess(q, actor, eventId, "view");
  if (!a.exportData) throw new ValidationError({ export: "forbidden" });
  const rows = await listGuests(q, actor, eventId);
  await audit(q, actor, "guest.export", { entity: "event", id: eventId, eventId }, { rows: rows.length });
  return toCsv([
    ["first_name", "last_name", "phone", "language", "companions_allowed", "rsvp", "companions_attending", "sent_at", "checked_in_at", "notes"],
    ...rows.map((g) => [g.firstName, g.lastName, g.phone, g.language ?? "", g.companions, g.rsvp, g.rsvp === "accepted" ? g.companionsAttending : "", g.sentAt ?? "", g.checkedInAt ?? "", g.notes]),
  ]);
}

// ---------- passes & messages for the host's own event ----------
export async function getGuestPassToken(q: Queryable, actor: Actor, guestId: string): Promise<string | null> {
  const g = (await q.query<{ event_id: string }>("select event_id from guests where id = $1", [guestId])).rows[0];
  if (!g) throw new NotFoundError();
  await requireEventAccess(q, actor, g.event_id, "guests");
  const p = (await q.query<{ id: string }>("select id from entry_passes where guest_id = $1 and status in ('active','used') order by issued_at desc limit 1", [guestId])).rows[0];
  return p ? signPassToken(p.id) : null;
}

export interface MessageRow { id: string; at: string; kind: string; status: string; provider: string; locale: string; body: string; guest: string }
export async function listMessages(q: Queryable, actor: Actor, eventId: string, limit = 100): Promise<MessageRow[]> {
  await requireEventAccess(q, actor, eventId, "view");
  const r = await q.query<Record<string, unknown>>(
    `select m.id, m.created_at, m.kind, m.status, m.provider, m.locale, m.body, trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as guest
       from message_records m left join guests g on g.id = m.guest_id where m.event_id = $1 order by m.created_at desc limit $2`, [eventId, limit]);
  return r.rows.map((x) => ({ id: x.id as string, at: new Date(x.created_at as string).toISOString(), kind: x.kind as string, status: x.status as string, provider: x.provider as string, locale: x.locale as string, body: x.body as string, guest: x.guest as string }));
}
