import { NextResponse } from "next/server";
import { demoAccessEnabled } from "@/lib/server/config";
import { getDb } from "@/lib/server/db";
import { getActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Minimal "who am I" for the static public shell. Never returns phone numbers or ids. */
export async function GET() {
  const actor = await getActor();
  const demo = demoAccessEnabled();
  // Only reveal storage state in demo mode; it tells reviewers their data is temporary.
  const temporary = demo && !!process.env.VERCEL && (await getDb()).ephemeral;
  return NextResponse.json(
    { actor: actor ? { role: actor.role, fullName: actor.fullName } : null, demo, temporary },
    { headers: { "Cache-Control": "no-store" } },
  );
}
