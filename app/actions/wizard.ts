"use server";

import { action } from "@/lib/server/action";
import { listAddons, quoteForEvent } from "@/lib/server/catalog";
import { eventStats } from "@/lib/server/events";
import { requireEventAccess } from "@/lib/server/permissions";

/** Add-ons the host may pick in the review step. Prices are re-computed server-side by wizardQuoteAction. */
export async function addonsAction() {
  return action(async ({ db }) => (await listAddons(db)).filter((a) => a.active).map((a) => ({ slug: a.slug, name: a.name })));
}

/** Real counts for the wizard summary (estimated vs records added). */
export async function wizardCountsAction(eventId: string) {
  return action(async ({ db, actor }) => {
    await requireEventAccess(db, actor, eventId, "view");
    const s = await eventStats(db, eventId);
    return { estimatedGuests: s.estimatedGuests, guestRecords: s.guestRecords };
  });
}

/**
 * Internal example quote. The guest basis and the discount are decided on the server: the same rule
 * confirmEventAction applies (the larger of guest records and the saved estimate), never a client-supplied price.
 */
export async function wizardQuoteAction(eventId: string, packageSlug: string, addons: string[], discountCode: string) {
  return action(async ({ db, actor }) => {
    await requireEventAccess(db, actor, eventId, "view");
    const s = await eventStats(db, eventId);
    const guests = Math.max(s.guestRecords, s.estimatedGuests ?? 0, 1);
    const code = discountCode.trim().slice(0, 40).toUpperCase();
    const slugs = addons.filter((a) => typeof a === "string").slice(0, 10);
    const { quote } = await quoteForEvent(db, packageSlug, guests, slugs, code || undefined);
    let discountApplied = false;
    if (code) {
      const d = (await db.query<{ percent: string }>("select percent from discounts where code = $1 and active and (expires_at is null or expires_at > now())", [code])).rows[0];
      discountApplied = !!d;
    }
    return { quote, guests, discountApplied };
  });
}
