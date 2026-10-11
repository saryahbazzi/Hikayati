import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { exportGuestsCsv } from "@/lib/server/extras";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/server/permissions";
import { getActor } from "@/lib/server/session";
import { uuidLike } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Personal-data export: owner/authorised staff only, audited, never cached. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return new NextResponse("Unauthorized", { status: 401 });
  if (!uuidLike.test(id)) return new NextResponse("Not found", { status: 404 });
  try {
    const csv = await exportGuestsCsv(await getDb(), actor, id);
    return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="guests-${id.slice(0, 8)}.csv"`, "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof NotFoundError) return new NextResponse("Not found", { status: 404 });
    if (e instanceof ForbiddenError || e instanceof ValidationError) return new NextResponse("Forbidden", { status: 403 });
    throw e;
  }
}
