"use server";

import { action } from "@/lib/server/action";
import { addGuest, commitImport, deleteGuest, listGuests, previewImport, updateGuest, type GuestFilter, type GuestInput } from "@/lib/server/guests";

export async function listGuestsAction(eventId: string, filter: GuestFilter = {}) { return action(({ db, actor }) => listGuests(db, actor, eventId, filter)); }
export async function addGuestAction(eventId: string, input: GuestInput) { return action(({ db, actor }) => addGuest(db, actor, eventId, input)); }
export async function updateGuestAction(guestId: string, input: GuestInput) { return action(({ db, actor }) => updateGuest(db, actor, guestId, input)); }
export async function deleteGuestAction(guestId: string) { return action(({ db, actor }) => deleteGuest(db, actor, guestId)); }
export async function previewImportAction(eventId: string, csv: string, dial: string) { return action(({ db, actor }) => previewImport(db, actor, eventId, csv, dial)); }
export async function commitImportAction(eventId: string, csv: string, dial: string) { return action(({ db, actor }) => commitImport(db, actor, eventId, csv, dial)); }
