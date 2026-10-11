"use server";

import { action } from "@/lib/server/action";
import { confirmEvent, cancelEvent, deleteDraft, saveDraft, eventStats } from "@/lib/server/events";
import { quoteForEvent, listPackages, recommendPackage } from "@/lib/server/catalog";
import { addCollaborator, removeCollaborator, updateProfile } from "@/lib/server/extras";
import { requireEventAccess } from "@/lib/server/permissions";
import type { EventDraft } from "@/lib/domain/wizard";

/** Autosave. Creates the draft on first call (id = null). Partial data is fine. */
export async function saveDraftAction(id: string | null, draft: Partial<EventDraft>, step: number) {
  return action(({ db, actor }) => saveDraft(db, actor, id, draft, step));
}

export async function quoteAction(packageSlug: string, guests: number, addons: string[], discountCode?: string) {
  return action(async ({ db }) => {
    const { quote } = await quoteForEvent(db, packageSlug, guests, addons, discountCode);
    return quote;
  });
}

export async function packagesAction(guests: number) {
  return action(async ({ db }) => {
    const pkgs = await listPackages(db, { publicOnly: true });
    return { packages: pkgs, recommended: recommendPackage(pkgs, guests) };
  });
}

/** Demo checkout. Totals are recomputed on the server; nothing is charged. */
export async function confirmEventAction(id: string, draft: Partial<EventDraft>, addons: string[], discountCode?: string) {
  return action(async ({ db, actor }) => {
    await requireEventAccess(db, actor, id, "manage");
    const stats = await eventStats(db, id);
    const guests = Math.max(stats.guestRecords, draft.estimatedGuests ?? 0, 1);
    const { quote } = await quoteForEvent(db, draft.packageSlug ?? "", guests, addons, discountCode);
    await confirmEvent(db, actor, id, draft, { totalMinor: quote.totalMinor, subtotalMinor: quote.subtotalMinor, discountMinor: quote.discountMinor, taxMinor: quote.taxMinor, breakdown: { lines: quote.lines, addons, discountCode: discountCode ?? null, guests, demo: true } });
    return { id };
  });
}

export async function deleteDraftAction(id: string) { return action(({ db, actor }) => deleteDraft(db, actor, id)); }
export async function cancelEventAction(id: string) { return action(({ db, actor }) => cancelEvent(db, actor, id)); }

export async function addCollaboratorAction(eventId: string, phone: string, permission: "view_stats" | "manage_guests") {
  return action(({ db, actor }) => addCollaborator(db, actor, eventId, phone, permission));
}
export async function removeCollaboratorAction(eventId: string, userId: string) {
  return action(({ db, actor }) => removeCollaborator(db, actor, eventId, userId));
}

export async function updateProfileAction(input: { fullName: string; email: string; locale: string }) {
  return action(({ db, actor }) => updateProfile(db, actor, input));
}
