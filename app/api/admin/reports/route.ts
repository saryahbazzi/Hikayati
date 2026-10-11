import { NextResponse } from "next/server";
import { reportCsv } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { ForbiddenError } from "@/lib/server/permissions";
import { getActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Aggregate report as CSV (no personal data). Requires `reports.read`, checked by the service; audited; never cached. */
export async function GET() {
  const actor = await getActor();
  if (!actor) return new NextResponse("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const csv = await reportCsv(await getDb(), actor);
    return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="hikayati-report.csv"', "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
    throw e;
  }
}
