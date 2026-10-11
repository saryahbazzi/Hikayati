import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getPublicInvitation } from "@/lib/server/invitations";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** Public read of ONE invitation, keyed by its signed link. Returns no phone numbers or ids of other guests. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`inv:${ip}`, 120, 60_000)) return new NextResponse("Too many requests", { status: 429 });
  const inv = await getPublicInvitation(await getDb(), (await params).token, false);
  if (!inv) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(inv, { headers: { "Cache-Control": "no-store" } });
}
