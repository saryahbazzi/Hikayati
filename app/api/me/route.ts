import { NextResponse } from "next/server";
import { demoAccessEnabled } from "@/lib/server/config";
import { getActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Minimal "who am I" for the static public shell. Never returns phone numbers or ids. */
export async function GET() {
  const actor = await getActor();
  return NextResponse.json(
    { actor: actor ? { role: actor.role, fullName: actor.fullName } : null, demo: demoAccessEnabled() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
