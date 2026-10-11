import { beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/server/db";
import { actor, eventByOccasion, freshDb, guestByName, inviteToken, passToken } from "./helpers";
import { checkInByToken, simulateCheckIn } from "@/lib/server/checkin";
import { addGuest, commitImport, deleteGuest, listGuests, previewImport, updateGuest } from "@/lib/server/guests";
import { getPublicInvitation, regenerateInvitationLink, regeneratePass, respond, revokeInvitation, restoreInvitation, sendInvitations } from "@/lib/server/invitations";
import { createReminder, processDueReminders, runReminderNow, cancelReminder, listReminders } from "@/lib/server/reminders";
import { eventStats, loadEvent, saveDraft, confirmEvent, listMyEvents, sanitizeDraft } from "@/lib/server/events";
import { eventAccess, ForbiddenError, NotFoundError, ValidationError, hasPermission } from "@/lib/server/permissions";
import { addCollaborator } from "@/lib/server/extras";
import { exportGuestsCsv } from "@/lib/server/extras";
import { emptyDraft } from "@/lib/domain/wizard";
import { signPassToken } from "@/lib/server/tokens";

let db: Db;
let wedding: { id: string };
let brunch: { id: string };
const host = actor("host"), door = actor("door"), manager = actor("manager"), admin = actor("admin"), superAdmin = actor("superAdmin"), planner = actor("planner");
beforeAll(async () => {
  db = await freshDb();
  wedding = (await eventByOccasion(db, "wedding"))!;
  brunch = (await eventByOccasion(db, "birthday_brunch"))!;
});

describe("guests", () => {
  it("normalises phones to E.164 and rejects duplicates and invalid numbers", async () => {
    const g = await addGuest(db, host, brunch.id, { firstName: "Test", lastName: "One", dial: "+966", phone: "0500000999" });
    const row = (await db.query<{ phone_e164: string }>("select phone_e164 from guests where id = $1", [g.id])).rows[0];
    expect(row.phone_e164).toBe("+966500000999");
    await expect(addGuest(db, host, brunch.id, { firstName: "Dup", phone: "500000999" })).rejects.toMatchObject({ fields: { phone: "duplicate" } });
    await expect(addGuest(db, host, brunch.id, { firstName: "Bad", phone: "123" })).rejects.toMatchObject({ fields: { phone: "invalid" } });
    await expect(addGuest(db, host, brunch.id, { firstName: "", phone: "500000998" })).rejects.toMatchObject({ fields: { firstName: "required" } });
    await expect(addGuest(db, host, brunch.id, { firstName: "X", phone: "500000998", companions: 99 })).rejects.toMatchObject({ fields: { companions: "range" } });
  });
  it("creates exactly one invitation per guest", async () => {
    const n = (await db.query<{ n: number }>("select count(*)::int n from guests g left join invitations i on i.guest_id = g.id where i.id is null")).rows[0].n;
    expect(n).toBe(0);
  });
  it("edits and deletes, but never deletes a guest who has checked in", async () => {
    const g = await addGuest(db, host, brunch.id, { firstName: "Edit", phone: "500000997" });
    await updateGuest(db, host, g.id, { firstName: "Edited", phone: "500000997", companions: 2 });
    expect((await listGuests(db, host, brunch.id, { search: "Edited" })).length).toBe(1);
    await deleteGuest(db, host, g.id);
    const nouraRow = await guestByName(db, wedding.id, "ريم");
    await expect(deleteGuest(db, host, nouraRow.id)).rejects.toMatchObject({ fields: { guest: "checkedIn" } });
  });
  it("search and filters work", async () => {
    const accepted = await listGuests(db, host, wedding.id, { rsvp: "accepted" });
    expect(accepted.length).toBe(3);
    expect((await listGuests(db, host, wedding.id, { checkedIn: "yes" })).length).toBe(1);
    expect((await listGuests(db, host, wedding.id, { search: "+966500000101" })).length).toBe(1);
  });
  it("CSV import previews errors and duplicates before saving, then imports only valid rows", async () => {
    const csv = ["first_name,last_name,country_code,phone,language,companions,notes", "Ok,One,+966,500000501,ar,1,", "Dup,One,+966,500000501,,,", "Bad,Phone,+966,12,,,", "Intl,Two,+971,500000502,en,0,"].join("\n");
    const prev = await previewImport(db, host, brunch.id, csv);
    expect(prev.rows.map((r) => r.ok)).toEqual([true, false, false, true]);
    expect(prev.rows[1].duplicate).toBe("in_file");
    expect((await listGuests(db, host, brunch.id, { search: "Ok One" })).length).toBe(0); // preview saved nothing
    expect(await commitImport(db, host, brunch.id, csv)).toEqual({ imported: 2, skipped: 2 });
    const again = await previewImport(db, host, brunch.id, csv);
    expect(again.rows[0].duplicate).toBe("existing");
    expect((await previewImport(db, host, brunch.id, "a,b\n1,2")).headerError).toBe("headers");
  });
});

describe("authorization", () => {
  it("a customer cannot see or touch another customer's event (not even learn it exists)", async () => {
    await expect(loadEvent(db, planner, wedding.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listGuests(db, planner, wedding.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(addGuest(db, planner, wedding.id, { firstName: "Evil", phone: "500000777" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(saveDraft(db, planner, wedding.id, { title: "hacked" }, 1)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listMyEvents(db, planner)).toHaveLength(0);
    expect(await listMyEvents(db, host)).toHaveLength(3);
  });
  it("derives per-event access from the database", async () => {
    expect(await eventAccess(db, host, wedding.id)).toMatchObject({ owner: true, manage: true, exportData: true });
    expect(await eventAccess(db, door, wedding.id)).toMatchObject({ view: true, checkin: true, manage: false, guests: false, exportData: false });
    expect(await eventAccess(db, door, brunch.id)).toMatchObject({ view: false, checkin: false });     // not assigned
    expect(await eventAccess(db, manager, wedding.id)).toMatchObject({ manage: true, guests: true });
    expect(await eventAccess(db, manager, (await eventByOccasion(db, "engagement_dinner"))!.id)).toMatchObject({ view: false });
    expect(await eventAccess(db, admin, brunch.id)).toMatchObject({ manage: true });
    expect(await eventAccess(db, superAdmin, brunch.id)).toMatchObject({ manage: true, checkin: true });
  });
  it("check-in staff cannot read guests or export personal data", async () => {
    await expect(addGuest(db, door, wedding.id, { firstName: "X", phone: "500000555" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(exportGuestsCsv(db, door, wedding.id)).rejects.toBeInstanceOf(ValidationError);
  });
  it("global permissions follow least privilege", () => {
    expect(hasPermission(host, "staff.portal")).toBe(false);
    expect(hasPermission(door, "packages.manage")).toBe(false);
    expect(hasPermission(manager, "events.read_all")).toBe(false);
    expect(hasPermission(admin, "packages.manage")).toBe(false);
    expect(hasPermission(admin, "team.manage")).toBe(false);
    expect(hasPermission(superAdmin, "team.manage")).toBe(true);
  });
  it("collaborators can view stats but not manage; only the owner can share", async () => {
    await expect(addCollaborator(db, planner, wedding.id, "+966500000004", "view_stats")).rejects.toBeInstanceOf(NotFoundError);
    await addCollaborator(db, host, wedding.id, DEMO_PLANNER_PHONE, "view_stats");
    expect(await eventAccess(db, planner, wedding.id)).toMatchObject({ view: true, manage: false, guests: false, exportData: false });
    await expect(addGuest(db, planner, wedding.id, { firstName: "X", phone: "500000556" })).rejects.toBeInstanceOf(ForbiddenError);
    await addCollaborator(db, host, wedding.id, DEMO_PLANNER_PHONE, "manage_guests");
    expect((await eventAccess(db, planner, wedding.id)).guests).toBe(true);
  });
  it("exports are audited", async () => {
    await exportGuestsCsv(db, host, wedding.id);
    const n = (await db.query<{ n: number }>("select count(*)::int n from audit_logs where action = 'guest.export'")).rows[0].n;
    expect(n).toBeGreaterThan(0);
  });
});
const DEMO_PLANNER_PHONE = "+966500000006";

describe("events and drafts", () => {
  it("autosaves partial drafts and round-trips them, including time zones", async () => {
    const d = { ...emptyDraft(), occasion: "birthday", title: "Draft", date: "2999-05-05", startTime: "11:30", rsvpDeadline: "2999-05-01", estimatedGuests: 30, details: { celebrantName: "Lina", age: "7" } };
    const { id } = await saveDraft(db, host, null, d, 2);
    const { draft, row } = await loadEvent(db, host, id);
    expect(row.status).toBe("draft");
    expect(row.wizard_step).toBe(2);
    expect(draft).toMatchObject({ occasion: "birthday", date: "2999-05-05", startTime: "11:30", rsvpDeadline: "2999-05-01", estimatedGuests: 30 });
    expect(draft.details.celebrantName).toBe("Lina");
    expect(new Date(row.starts_at!).toISOString()).toBe("2999-05-05T08:30:00.000Z");
  });
  it("sanitises untrusted input", () => {
    const d = sanitizeDraft({ title: "  hi\u0000there ", mapUrl: "http://evil.example", occasion: "nope" as never, estimatedGuests: "12" as never, details: { evilKey: "x", brideName: "N" } as never });
    expect(d).toMatchObject({ title: "hithere", mapUrl: "", occasion: "", estimatedGuests: 12 });
    expect(d.details).toEqual({ brideName: "N" });
  });
  it("refuses to confirm an incomplete event (server-side validation)", async () => {
    const { id } = await saveDraft(db, host, null, { occasion: "wedding", title: "x" }, 1);
    await expect(confirmEvent(db, host, id, {}, { totalMinor: 0, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, breakdown: {} })).rejects.toBeInstanceOf(ValidationError);
    expect((await loadEvent(db, host, id)).row.status).toBe("draft");
  });
  it("computes real statistics", async () => {
    const s = await eventStats(db, wedding.id);
    expect(s).toMatchObject({ guestRecords: 6, recipients: 6, sent: 6, accepted: 3, declined: 1, awaiting: 2, checkedIn: 1, notYetArrived: 2, confirmedDelivered: 0 });
    expect(s.simulatedDelivered).toBe(6);   // demo sends are never reported as delivered
    expect(s.seats).toBe(3 + 1 + 2);        // accepted + companions attending (noura 1, sultan 2)
  });
});

describe("RSVP", () => {
  it("accepting creates exactly one active pass; declining revokes it", async () => {
    const g = await guestByName(db, wedding.id, "هند");   // seeded as declined
    const tok = await inviteToken(db, g.id);
    expect((await getPublicInvitation(db, tok, false))!.pass).toBeNull();
    await respond(db, tok, "accepted", 0);
    const pub = (await getPublicInvitation(db, tok, false))!;
    expect(pub.rsvp.status).toBe("accepted");
    expect(pub.pass?.token).toMatch(/^HK1\./);
    const active = (await db.query<{ n: number }>("select count(*)::int n from entry_passes where guest_id = $1 and status = 'active'", [g.id])).rows[0].n;
    expect(active).toBe(1);
    await respond(db, tok, "accepted", 0);   // idempotent: still one active pass
    expect((await db.query<{ n: number }>("select count(*)::int n from entry_passes where guest_id = $1 and status = 'active'", [g.id])).rows[0].n).toBe(1);
    await respond(db, tok, "declined", 0);
    expect((await getPublicInvitation(db, tok, false))!.pass).toBeNull();
    expect((await db.query<{ n: number }>("select count(*)::int n from entry_passes where guest_id = $1 and status = 'active'", [g.id])).rows[0].n).toBe(0);
  });
  it("caps companions at what the host allowed", async () => {
    const g = await guestByName(db, wedding.id, "نورة");  // allowed 1
    const r = await respond(db, await inviteToken(db, g.id), "accepted", 9);
    expect(r.companions).toBe(1);
  });
  it("the public view never exposes phone numbers or other guests", async () => {
    const g = await guestByName(db, wedding.id, "ماجد");
    const pub = await getPublicInvitation(db, await inviteToken(db, g.id), false);
    const json = JSON.stringify(pub);
    expect(json).not.toMatch(/\+?966500000\d{3}/);
    expect(json).not.toContain("ريم");
    expect(json).not.toContain("phone");
  });
  it("rejects forged, stale, revoked and regenerated links without leaking why", async () => {
    const g = await guestByName(db, wedding.id, "سلطان");
    const old = await inviteToken(db, g.id);
    expect(await getPublicInvitation(db, old + "x", false)).toBeNull();
    const fresh = await regenerateInvitationLink(db, host, g.id, "ar", "http://t");
    expect(await getPublicInvitation(db, old, false)).toBeNull();                       // old link invalid
    expect(await getPublicInvitation(db, fresh.url.split("/").pop()!, false)).not.toBeNull();
    await revokeInvitation(db, host, g.id);
    await expect(respond(db, fresh.url.split("/").pop()!, "accepted", 0)).rejects.toBeInstanceOf(NotFoundError);
    expect((await db.query<{ n: number }>("select count(*)::int n from entry_passes where guest_id = $1 and status = 'active'", [g.id])).rows[0].n).toBe(0);
    await restoreInvitation(db, host, g.id);                                            // restore re-issues the pass for an accepted guest
    expect((await db.query<{ n: number }>("select count(*)::int n from entry_passes where guest_id = $1 and status = 'active'", [g.id])).rows[0].n).toBe(1);
  });
  it("honours allow_rsvp_change and the deadline", async () => {
    const g = await guestByName(db, brunch.id, "Noor");
    await db.query("update events set status = 'confirmed' where id = $1", [brunch.id]);
    const tok = await inviteToken(db, g.id);
    await respond(db, tok, "accepted", 0);
    await db.query("update events set allow_rsvp_change = false where id = $1", [brunch.id]);
    await expect(respond(db, tok, "declined", 0)).rejects.toMatchObject({ fields: { rsvp: "locked" } });
    await db.query("update events set allow_rsvp_change = true, rsvp_deadline = now() - interval '1 hour' where id = $1", [brunch.id]);
    await expect(respond(db, tok, "declined", 0)).rejects.toMatchObject({ fields: { rsvp: "closed" } });
    expect((await getPublicInvitation(db, tok, false))!.rsvp.canChange).toBe(false);
    await db.query("update events set rsvp_deadline = now() + interval '30 days' where id = $1", [brunch.id]);
  });
  it("blocks replies after check-in and for cancelled events", async () => {
    const g = await guestByName(db, wedding.id, "ريم");   // seeded as checked in
    await expect(respond(db, await inviteToken(db, g.id), "declined", 0)).rejects.toMatchObject({ fields: { rsvp: "checked_in" } });
  });
  it("simulated sending uses the demo provider and never claims delivery", async () => {
    const r = await sendInvitations(db, host, brunch.id, "unsent", "http://t");
    expect(r.simulated).toBe(true);
    expect(r.sent).toBeGreaterThan(0);
    const bad = (await db.query<{ n: number }>("select count(*)::int n from invitations where delivery_status in ('delivered','read')")).rows[0].n;
    expect(bad).toBe(0);
    const msgs = (await db.query<{ provider: string; status: string }>("select provider, status from message_records where event_id = $1 and kind = 'invite'", [brunch.id])).rows;
    expect(msgs.every((m) => m.provider === "demo" && m.status === "demo_simulated")).toBe(true);
    // planner is only a collaborator on the wedding (see authorization tests) → may view, may not send.
    await expect(sendInvitations(db, planner, wedding.id, "unsent", "http://t")).rejects.toBeInstanceOf(ForbiddenError);
    // door staff cannot even see the brunch.
    await expect(sendInvitations(db, door, brunch.id, "unsent", "http://t")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("check-in", () => {
  it("checks a guest in once; the second scan reports already checked in", async () => {
    const g = await guestByName(db, wedding.id, "نورة");
    const tok = (await passToken(db, g.id))!;
    const first = await checkInByToken(db, door, tok, { expectedEventId: wedding.id });
    expect(first).toMatchObject({ ok: true, result: "success" });
    const second = await checkInByToken(db, door, tok, { expectedEventId: wedding.id });
    expect(second).toMatchObject({ ok: false, result: "already_checked_in" });
    const rows = (await db.query<{ checked_in_by: string; method: string }>("select checked_in_by, method from guest_checkins where guest_id = $1", [g.id])).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ checked_in_by: door.id, method: "scanner" });
    expect((await db.query<{ status: string }>("select status from entry_passes where guest_id = $1", [g.id])).rows[0].status).toBe("used");
  });
  it("is atomic under concurrent scans", async () => {
    const g = await guestByName(db, wedding.id, "سلطان");
    const tok = (await passToken(db, g.id))!;
    const results = await Promise.all([1, 2, 3, 4].map(() => checkInByToken(db, door, tok, { expectedEventId: wedding.id })));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect((await db.query<{ n: number }>("select count(*)::int n from guest_checkins where guest_id = $1", [g.id])).rows[0].n).toBe(1);
  });
  it("rejects invalid, forged, wrong-event, unaccepted and revoked credentials", async () => {
    expect(await checkInByToken(db, door, "garbage")).toMatchObject({ result: "invalid" });
    expect(await checkInByToken(db, door, signPassToken("00000000-0000-4000-8000-0000000000ff"))).toMatchObject({ result: "invalid" });
    const ayah = await guestByName(db, wedding.id, "ماجد");          // pending: no pass exists
    expect(await simulateCheckIn(db, door, ayah.id)).toMatchObject({ result: "not_accepted" });
    const g = await guestByName(db, wedding.id, "هند");
    const tok = (await passToken(db, g.id))!;                         // she accepted then declined earlier, so pass is revoked
    expect(tok).toBeNull();
    const l = await guestByName(db, wedding.id, "Layla");
    await respond(db, await inviteToken(db, l.id), "accepted", 0);
    const t1 = (await passToken(db, l.id))!;
    expect(await checkInByToken(db, door, t1, { expectedEventId: brunch.id })).toMatchObject({ result: "wrong_event" });
    await regeneratePass(db, host, l.id);                             // old QR is revoked
    expect(await checkInByToken(db, door, t1, { expectedEventId: wedding.id })).toMatchObject({ result: "revoked" });
    const t2 = (await passToken(db, l.id))!;
    expect(t2).not.toBe(t1);
    expect(await checkInByToken(db, door, t2, { expectedEventId: wedding.id })).toMatchObject({ ok: true });
  });
  it("only authorised staff can check in, and only for their assigned events", async () => {
    const g = await guestByName(db, brunch.id, "Noor");               // accepted earlier
    const tok = (await passToken(db, g.id))!;
    expect(await checkInByToken(db, door, tok)).toMatchObject({ ok: false, result: "forbidden" });     // door staff isn't assigned to the brunch
    expect(await checkInByToken(db, planner, tok)).toMatchObject({ ok: false, result: "forbidden" });  // another customer
    expect(await checkInByToken(db, manager, tok)).toMatchObject({ ok: true });                        // assigned manager
    const attempts = (await db.query<{ n: number }>("select count(*)::int n from checkin_attempts where result = 'forbidden'")).rows[0].n;
    expect(attempts).toBeGreaterThanOrEqual(2);
  });
  it("demo simulation is refused when demo access is off", async () => {
    const prev = process.env.HIKAYATI_DEMO_ACCESS;
    process.env.HIKAYATI_DEMO_ACCESS = "false";
    try {
      const g = await guestByName(db, wedding.id, "هند");
      expect(await simulateCheckIn(db, host, g.id)).toMatchObject({ ok: false, result: "forbidden" });
    } finally { process.env.HIKAYATI_DEMO_ACCESS = prev; }
  });
  it("RSVP and check-in are separate states", async () => {
    const s = await eventStats(db, wedding.id);
    expect(s.accepted).toBeGreaterThan(s.checkedIn - 1);
    expect(s.notYetArrived).toBe(s.accepted - s.checkedIn);
  });
});

describe("reminders", () => {
  it("validates schedule, prevents duplicates, and processes idempotently", async () => {
    const dinner = (await eventByOccasion(db, "engagement_dinner"))!;
    await db.query("update invitations set sent_at = now(), status = 'sent' where event_id = $1", [dinner.id]);
    await expect(createReminder(db, host, dinner.id, { kind: "custom", customAt: "2000-01-01T10:00", audience: "all_invited" })).rejects.toMatchObject({ fields: { customAt: "past" } });
    await expect(createReminder(db, host, dinner.id, { kind: "before_event", daysBefore: 0, audience: "all_invited" })).rejects.toMatchObject({ fields: { daysBefore: "range" } });
    const r = await createReminder(db, host, dinner.id, { kind: "before_event", daysBefore: 7, audience: "not_responded" });
    await expect(createReminder(db, host, dinner.id, { kind: "before_event", daysBefore: 7, audience: "not_responded" })).rejects.toMatchObject({ fields: { duplicate: "duplicate" } });
    expect(new Date(r.runAt).getTime()).toBeGreaterThan(Date.now());
    const rules = await listReminders(db, host, dinner.id);
    expect(rules[0]).toMatchObject({ status: "active", audienceNow: 3 });
    expect(await processDueReminders(db, "http://t", new Date())).toMatchObject({ rules: 0 });                  // not due yet
    await db.query("update reminder_rules set run_at = now() - interval '1 minute' where id = $1", [r.id]);
    expect(await processDueReminders(db, "http://t")).toMatchObject({ rules: 1, sent: 3 });
    expect(await processDueReminders(db, "http://t")).toMatchObject({ rules: 0, sent: 0 });                      // rule completed: no double send
    expect((await db.query<{ n: number }>("select count(*)::int n from reminder_jobs where rule_id = $1", [r.id])).rows[0].n).toBe(3);
    const msgs = (await db.query<{ status: string; provider: string }>("select status, provider from message_records where event_id = $1 and kind = 'reminder'", [dinner.id])).rows;
    expect(msgs).toHaveLength(3);
    expect(msgs.every((m) => m.status === "demo_simulated" && m.provider === "demo")).toBe(true);
  });
  it("targets audiences correctly, supports run-now and cancel, and checks access", async () => {
    const r1 = await createReminder(db, host, wedding.id, { kind: "before_event", daysBefore: 3, audience: "confirmed" });
    const r2 = await createReminder(db, host, wedding.id, { kind: "before_event", daysBefore: 2, audience: "not_responded" });
    expect((await runReminderNow(db, host, r1.id, "http://t")).sent).toBeGreaterThan(0);
    await expect(runReminderNow(db, host, r1.id, "http://t")).rejects.toMatchObject({ fields: { reminder: "notActive" } });
    await cancelReminder(db, host, r2.id);
    expect((await listReminders(db, host, wedding.id)).find((x) => x.id === r2.id)?.status).toBe("cancelled");
    await expect(createReminder(db, planner, wedding.id, { kind: "before_event", daysBefore: 4, audience: "all_invited" })).rejects.toBeInstanceOf(ForbiddenError);
  });
});
