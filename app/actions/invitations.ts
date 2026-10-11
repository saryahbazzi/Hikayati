"use server";

import { action, publicAction } from "@/lib/server/action";
import { checkInByToken, simulateCheckIn } from "@/lib/server/checkin";
import { getGuestPassToken, listMessages } from "@/lib/server/extras";
import { getInvitationLink, regenerateInvitationLink, regeneratePass, respond, restoreInvitation, revokeInvitation, sendInvitations } from "@/lib/server/invitations";
import { cancelReminder, createReminder, listReminders, processDueReminders, runReminderNow, type ReminderInput } from "@/lib/server/reminders";
import { rateLimit } from "@/lib/server/rate-limit";
import { ValidationError } from "@/lib/server/permissions";
import type { Locale } from "@/lib/i18n";

/** Demo send: goes through the provider seam; the demo provider contacts nobody. */
export async function sendInvitationsAction(eventId: string, guestIds: string[] | "unsent") {
  return action(({ db, actor, origin }) => sendInvitations(db, actor, eventId, guestIds, origin));
}
export async function getLinkAction(guestId: string, locale: Locale) { return action(({ db, actor, origin }) => getInvitationLink(db, actor, guestId, locale, origin)); }
export async function regenerateLinkAction(guestId: string, locale: Locale) { return action(({ db, actor, origin }) => regenerateInvitationLink(db, actor, guestId, locale, origin)); }
export async function revokeInvitationAction(guestId: string) { return action(({ db, actor }) => revokeInvitation(db, actor, guestId)); }
export async function restoreInvitationAction(guestId: string) { return action(({ db, actor }) => restoreInvitation(db, actor, guestId)); }
export async function regeneratePassAction(guestId: string) { return action(({ db, actor }) => regeneratePass(db, actor, guestId)); }
export async function getPassTokenAction(guestId: string) { return action(({ db, actor }) => getGuestPassToken(db, actor, guestId)); }
export async function listMessagesAction(eventId: string) { return action(({ db, actor }) => listMessages(db, actor, eventId)); }

/** Guest RSVP: public, authenticated only by the signed link. Rate-limited per IP. */
export async function rsvpAction(token: string, response: "accepted" | "declined", companions: number) {
  return publicAction(async ({ db, ip }) => {
    if (!rateLimit(`rsvp:${ip}`, 30, 10 * 60_000)) throw new ValidationError({ rsvp: "rate_limited" });
    return respond(db, token, response, companions);
  });
}

/** Staff scanner / manual entry. The pass token is verified and authorised on the server. */
export async function checkInAction(token: string, expectedEventId?: string) {
  return action(({ db, actor }) => checkInByToken(db, actor, token, { expectedEventId, method: "scanner" }));
}
/** Demo only: check a guest in without a scanner. Refused unless demo access is enabled. */
export async function simulateCheckInAction(guestId: string) { return action(({ db, actor }) => simulateCheckIn(db, actor, guestId)); }

export async function createReminderAction(eventId: string, input: ReminderInput) { return action(({ db, actor }) => createReminder(db, actor, eventId, input)); }
export async function cancelReminderAction(ruleId: string) { return action(({ db, actor }) => cancelReminder(db, actor, ruleId)); }
export async function listRemindersAction(eventId: string) { return action(({ db, actor }) => listReminders(db, actor, eventId)); }
export async function runReminderNowAction(ruleId: string) { return action(({ db, actor, origin }) => runReminderNow(db, actor, ruleId, origin)); }
export async function processDueRemindersAction() { return action(({ db, origin }) => processDueReminders(db, origin)); }
