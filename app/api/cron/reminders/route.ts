import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requestOrigin } from "@/lib/server/action";
import { safeEqual } from "@/lib/server/crypto";
import { processDueReminders } from "@/lib/server/reminders";

export const dynamic = "force-dynamic";

/**
 * Cron entry point (e.g. a Vercel Cron or any scheduler hitting it every few minutes).
 * Requires `Authorization: Bearer $CRON_SECRET`; with no CRON_SECRET configured the endpoint is disabled.
 * Reminders are SIMULATED while the demo messaging provider is active.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !safeEqual(given, secret)) return new NextResponse("Unauthorized", { status: 401 });
  const out = await processDueReminders(await getDb(), await requestOrigin());
  return NextResponse.json(out);
}
