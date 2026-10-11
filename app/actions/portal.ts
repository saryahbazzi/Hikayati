"use server";

import { action } from "@/lib/server/action";
import { eventStats } from "@/lib/server/events";
import { requireEventAccess } from "@/lib/server/permissions";

/** Live attendance numbers for the "Test" walkthrough. Access is re-checked on the server. */
export async function getEventStatsAction(eventId: string) {
  return action(async ({ db, actor }) => {
    await requireEventAccess(db, actor, eventId, "view");
    return eventStats(db, eventId);
  });
}
