import "server-only";
import { formatDate, formatTime } from "@/lib/domain/time";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { getProvider } from "./messaging";
import { confirmationBody, inviteBody } from "./messaging/templates";
import { ForbiddenError, NotFoundError, ValidationError, requireEventAccess, type Actor } from "./permissions";
import { signInvitationToken, signPassToken, verifyInvitationToken } from "./tokens";
import type { EventRow } from "./events";

const FAMILY_KEYS = ["brideFamily", "groomFamily", "brideMother", "groomMother", "brideFather", "groomFather"];

export const invitationPath = (locale: "ar" | "en", invitationId: string, version: number) => `/${locale}/i/${signInvitationToken(invitationId, version)}`;

interface InvRow { id: string; event_id: string; guest_id: string; link_version: number; status: string; rsvp_status: "pending" | "accepted" | "declined"; companions_attending: number; responded_at: Date | null; revoked_at: Date | null }

/** Resolve a guest link. Wrong signature, stale version or revoked → null (never reveals which). */
async function resolve(q: Queryable, token: string): Promise<InvRow | null> {
  const v = verifyInvitationToken(token);
  if (!v) return null;
  const r = (await q.query<InvRow>("select id, event_id, guest_id, link_version, status, rsvp_status, companions_attending, responded_at, revoked_at from invitations where id = $1", [v.id])).rows[0];
  if (!r || r.revoked_at || r.status === "revoked" || r.link_version !== v.version) return null;
  return r;
}

export async function ensureActivePass(q: Queryable, invitationId: string, eventId: string, guestId: string) {
  const existing = (await q.query<{ id: string }>("select id from entry_passes where invitation_id = $1 and status = 'active'", [invitationId])).rows[0];
  if (existing) return existing.id;
  const used = (await q.query("select 1 from entry_passes where invitation_id = $1 and status = 'used'", [invitationId])).rows.length;
  if (used) return null; // already attended: no new pass
  return (await q.query<{ id: string }>("insert into entry_passes (invitation_id, event_id, guest_id) values ($1,$2,$3) returning id", [invitationId, eventId, guestId])).rows[0].id;
}

export interface PublicInvitation {
  invitationId: string;
  eventId: string;
  guest: { firstName: string; lastName: string; language: "ar" | "en" | null; companionsAllowed: number };
  event: { title: string; occasion: string; occasionCustom: string | null; status: string; startsAt: string | null; endsAt: string | null; timezone: string; venueName: string; venueAddress: string | null; mapUrl: string | null; dressCode: string | null; instructions: string | null; hostFirstName: string | null; hostLastName: string | null; cohostName: string | null; language: "ar" | "en" | "both"; rsvpDeadline: string | null; details: Record<string, string>; visibility: Record<string, boolean> };
  design: { templateSlug: string | null; layout: string; palette: string; fontPair: string; align: string; fields: Record<string, string> };
  rsvp: { status: "pending" | "accepted" | "declined"; companionsAttending: number; respondedAt: string | null; deadlinePassed: boolean; canChange: boolean };
  pass: { token: string; status: string } | null;
  checkedInAt: string | null;
}

export async function getPublicInvitation(q: Queryable, token: string, markOpened = true): Promise<PublicInvitation | null> {
  const inv = await resolve(q, token);
  if (!inv) return null;
  const ev = (await q.query<EventRow>("select * from events where id = $1", [inv.event_id])).rows[0];
  const g = (await q.query<{ first_name: string; last_name: string; preferred_language: "ar" | "en" | null; companions: number }>("select first_name,last_name,preferred_language,companions from guests where id = $1", [inv.guest_id])).rows[0];
  if (!ev || !g || ev.status === "draft") return null;
  const d = (await q.query<{ slug: string | null; layout: string | null; palette: string; font_pair: string; align: string; fields: Record<string, string> }>(
    `select t.slug, t.layout, d.palette, d.font_pair, d.align, d.fields from invitation_designs d left join invitation_templates t on t.id = d.template_id where d.event_id = $1`, [ev.id])).rows[0];
  if (markOpened && inv.status === "sent") await q.query("update invitations set status = 'opened', opened_at = coalesce(opened_at, now()) where id = $1 and status = 'sent'", [inv.id]);
  const pass = inv.rsvp_status === "accepted"
    ? (await q.query<{ id: string; status: string }>("select id, status from entry_passes where invitation_id = $1 and status in ('active','used') order by issued_at desc limit 1", [inv.id])).rows[0]
    : undefined;
  const checkedIn = (await q.query<{ checked_in_at: Date }>("select checked_in_at from guest_checkins where guest_id = $1", [inv.guest_id])).rows[0];
  const vis = ev.invitation_visibility ?? {};
  const show = (k: string) => vis[k] !== false;
  const deadlinePassed = !!ev.rsvp_deadline && new Date(ev.rsvp_deadline).getTime() < Date.now();
  const cancelled = ev.status === "cancelled" || ev.status === "completed";
  return {
    invitationId: inv.id, eventId: ev.id,
    guest: { firstName: g.first_name, lastName: g.last_name, language: g.preferred_language, companionsAllowed: g.companions },
    event: {
      title: ev.title, occasion: ev.occasion, occasionCustom: ev.occasion_custom, status: ev.status, startsAt: ev.starts_at ? new Date(ev.starts_at).toISOString() : null,
      endsAt: show("endTime") && ev.ends_at ? new Date(ev.ends_at).toISOString() : null, timezone: ev.timezone, venueName: ev.venue_name,
      venueAddress: show("venueAddress") ? ev.venue_address : null, mapUrl: show("mapLink") && ev.map_url ? ev.map_url : null,
      dressCode: show("dressCode") && ev.dress_code ? ev.dress_code : null, instructions: show("instructions") && ev.instructions ? ev.instructions : null,
      hostFirstName: show("hosts") ? ev.host_first_name : null, hostLastName: show("hosts") ? ev.host_last_name : null, cohostName: show("hosts") ? ev.cohost_name : null,
      language: ev.invitation_language, rsvpDeadline: show("rsvpDeadline") && ev.rsvp_deadline ? new Date(ev.rsvp_deadline).toISOString() : null,
      // Internal notes and family details only travel if the host chose to show them.
      details: Object.fromEntries(Object.entries(ev.details ?? {}).filter(([k]) => (FAMILY_KEYS.includes(k) ? show("family") : k === "zaffaTime" ? show("zaffa") : true))),
      visibility: vis,
    },
    design: { templateSlug: d?.slug ?? null, layout: d?.layout ?? "classic-frame", palette: d?.palette ?? "ivory", fontPair: d?.font_pair ?? "classic", align: d?.align ?? "center", fields: d?.fields ?? {} },
    rsvp: {
      status: inv.rsvp_status, companionsAttending: inv.companions_attending, respondedAt: inv.responded_at ? new Date(inv.responded_at).toISOString() : null, deadlinePassed,
      canChange: !cancelled && !checkedIn && !deadlinePassed && (inv.rsvp_status === "pending" || ev.allow_rsvp_change),
    },
    pass: pass ? { token: signPassToken(pass.id), status: pass.status } : null,
    checkedInAt: checkedIn ? new Date(checkedIn.checked_in_at).toISOString() : null,
  };
}

export type RsvpError = "invalid_link" | "closed" | "locked" | "checked_in" | "cancelled";

/** Guest accepts or declines. Idempotent per response; changes allowed only per event settings and deadline. */
export async function respond(q: Queryable, token: string, response: "accepted" | "declined", companionsInput = 0) {
  const inv = await resolve(q, token);
  if (!inv) throw new NotFoundError("invalid_link");
  return q.tx(async (t) => {
    const ev = (await t.query<{ status: string; rsvp_deadline: Date | null; allow_rsvp_change: boolean; title: string }>("select status, rsvp_deadline, allow_rsvp_change, title from events where id = $1 for update", [inv.event_id])).rows[0];
    const guest = (await t.query<{ companions: number; first_name: string; preferred_language: "ar" | "en" | null }>("select companions, first_name, preferred_language from guests where id = $1", [inv.guest_id])).rows[0];
    if (!ev || ev.status === "cancelled" || ev.status === "completed" || ev.status === "draft") throw new ValidationError({ rsvp: "cancelled" });
    if (await t.query("select 1 from guest_checkins where guest_id = $1", [inv.guest_id]).then((r) => r.rows.length)) throw new ValidationError({ rsvp: "checked_in" });
    if (ev.rsvp_deadline && new Date(ev.rsvp_deadline).getTime() < Date.now()) throw new ValidationError({ rsvp: "closed" });
    if (inv.rsvp_status !== "pending" && !ev.allow_rsvp_change) throw new ValidationError({ rsvp: "locked" });
    const companions = response === "accepted" ? Math.min(Math.max(0, Math.trunc(companionsInput) || 0), guest.companions) : 0;
    await t.query("insert into rsvp_responses (invitation_id, response, companions) values ($1,$2,$3)", [inv.id, response, companions]);
    await t.query("update invitations set rsvp_status=$2, companions_attending=$3, responded_at=now(), status='responded', updated_at=now() where id=$1", [inv.id, response, companions]);
    if (response === "accepted") await ensureActivePass(t, inv.id, inv.event_id, inv.guest_id);
    else await t.query("update entry_passes set status='revoked', revoked_at=now() where invitation_id=$1 and status='active'", [inv.id]); // declining never leaves an active pass
    const locale = guest.preferred_language ?? "ar";
    await t.query("insert into message_records (event_id, guest_id, invitation_id, provider, kind, status, locale, body) values ($1,$2,$3,'demo','rsvp_confirmation','demo_simulated',$4,$5)",
      [inv.event_id, inv.guest_id, inv.id, locale, confirmationBody(locale, response === "accepted")]);
    return { response, companions };
  });
}

/** Simulated send. Every send uses the provider seam; the demo provider contacts nobody. */
export async function sendInvitations(q: Queryable, actor: Actor, eventId: string, guestIds: string[] | "unsent", origin: string) {
  await requireEventAccess(q, actor, eventId, "manage");
  const ev = (await q.query<EventRow>("select * from events where id = $1", [eventId])).rows[0];
  if (!ev || !["confirmed", "live"].includes(ev.status)) throw new ValidationError({ event: "notConfirmed" });
  const provider = getProvider();
  const rows = (await q.query<{ guest_id: string; first_name: string; phone_e164: string; preferred_language: "ar" | "en" | null; opted_out_at: Date | null; invitation_id: string; link_version: number; sent_at: Date | null }>(
    `select g.id as guest_id, g.first_name, g.phone_e164, g.preferred_language, g.opted_out_at, i.id as invitation_id, i.link_version, i.sent_at
       from guests g join invitations i on i.guest_id = g.id where g.event_id = $1`, [eventId])).rows
    .filter((r) => (guestIds === "unsent" ? !r.sent_at : guestIds.includes(r.guest_id)));
  let sent = 0, skipped = 0;
  for (const r of rows) {
    if (r.opted_out_at) { skipped++; continue; }
    const locale = r.preferred_language ?? (ev.invitation_language === "en" ? "en" : "ar");
    const link = `${origin}${invitationPath(locale, r.invitation_id, r.link_version)}`;
    const body = inviteBody(locale, {
      guestName: r.first_name, eventTitle: ev.title, date: formatDate(ev.starts_at, locale, ev.timezone), time: formatTime(ev.starts_at, locale, ev.timezone), venue: ev.venue_name, link,
    });
    const res = await provider.send({ eventId, guestId: r.guest_id, invitationId: r.invitation_id, kind: "invite", to: r.phone_e164, locale, body });
    await q.query("insert into message_records (event_id, guest_id, invitation_id, provider, kind, status, locale, body, meta) values ($1,$2,$3,$4,'invite',$5,$6,$7,$8)",
      [eventId, r.guest_id, r.invitation_id, provider.name, res.status, locale, body, JSON.stringify({ providerMessageId: res.providerMessageId ?? null })]);
    await q.query("update invitations set sent_at = now(), delivery_status = $2, status = case when status in ('not_sent') then 'sent' else status end, updated_at = now() where id = $1", [r.invitation_id, res.status]);
    sent++;
  }
  if (ev.status === "confirmed" && sent) await q.query("update events set status='live' where id=$1", [eventId]);
  await audit(q, actor, "invitation.send", { entity: "event", id: eventId, eventId }, { sent, skipped, simulated: provider.simulated });
  return { sent, skipped, simulated: provider.simulated };
}

/** Link the host can copy. Same link every time (signed), valid until revoked. */
export async function getInvitationLink(q: Queryable, actor: Actor, guestId: string, locale: "ar" | "en", origin: string) {
  const r = (await q.query<{ id: string; event_id: string; link_version: number }>("select i.id, i.event_id, i.link_version from invitations i where i.guest_id = $1", [guestId])).rows[0];
  if (!r) throw new NotFoundError();
  await requireEventAccess(q, actor, r.event_id, "guests");
  return { url: `${origin}${invitationPath(locale, r.id, r.link_version)}` };
}

/** Invalidate every link already issued to this guest and return the replacement. */
export async function regenerateInvitationLink(q: Queryable, actor: Actor, guestId: string, locale: "ar" | "en", origin: string) {
  const r = (await q.query<{ id: string; event_id: string }>("select id, event_id from invitations where guest_id = $1", [guestId])).rows[0];
  if (!r) throw new NotFoundError();
  await requireEventAccess(q, actor, r.event_id, "guests");
  const upd = (await q.query<{ link_version: number }>("update invitations set link_version = link_version + 1, updated_at = now() where id = $1 returning link_version", [r.id])).rows[0];
  await audit(q, actor, "invitation.regenerate_link", { entity: "invitation", id: r.id, eventId: r.event_id });
  return { url: `${origin}${invitationPath(locale, r.id, upd.link_version)}` };
}

export async function revokeInvitation(q: Queryable, actor: Actor, guestId: string) {
  const r = (await q.query<{ id: string; event_id: string }>("select id, event_id from invitations where guest_id = $1", [guestId])).rows[0];
  if (!r) throw new NotFoundError();
  await requireEventAccess(q, actor, r.event_id, "guests");
  await q.query("update invitations set status='revoked', revoked_at=now() where id=$1", [r.id]);
  await q.query("update entry_passes set status='revoked', revoked_at=now() where invitation_id=$1 and status='active'", [r.id]);
  await audit(q, actor, "invitation.revoke", { entity: "invitation", id: r.id, eventId: r.event_id });
}

export async function restoreInvitation(q: Queryable, actor: Actor, guestId: string) {
  const r = (await q.query<{ id: string; event_id: string; rsvp_status: string }>("select id, event_id, rsvp_status from invitations where guest_id = $1", [guestId])).rows[0];
  if (!r) throw new NotFoundError();
  await requireEventAccess(q, actor, r.event_id, "guests");
  await q.query("update invitations set status = case when responded_at is not null then 'responded' when sent_at is not null then 'sent' else 'not_sent' end, revoked_at=null, link_version=link_version+1 where id=$1", [r.id]);
  if (r.rsvp_status === "accepted") await ensureActivePass(q, r.id, r.event_id, guestId);
  await audit(q, actor, "invitation.restore", { entity: "invitation", id: r.id, eventId: r.event_id });
}

/** Revoke the current pass and issue a fresh QR (e.g. a screenshot was shared). Not possible after check-in. */
export async function regeneratePass(q: Queryable, actor: Actor, guestId: string) {
  const r = (await q.query<{ id: string; event_id: string; rsvp_status: string }>("select id, event_id, rsvp_status from invitations where guest_id = $1", [guestId])).rows[0];
  if (!r) throw new NotFoundError();
  await requireEventAccess(q, actor, r.event_id, "guests");
  if (r.rsvp_status !== "accepted") throw new ValidationError({ pass: "notAccepted" });
  if ((await q.query("select 1 from guest_checkins where guest_id=$1", [guestId])).rows.length) throw new ValidationError({ pass: "checkedIn" });
  await q.query("update entry_passes set status='revoked', revoked_at=now() where invitation_id=$1 and status='active'", [r.id]);
  const id = (await q.query<{ id: string }>("insert into entry_passes (invitation_id, event_id, guest_id) values ($1,$2,$3) returning id", [r.id, r.event_id, guestId])).rows[0].id;
  await audit(q, actor, "pass.regenerate", { entity: "pass", id, eventId: r.event_id });
  return { token: signPassToken(id) };
}

export { ForbiddenError };
