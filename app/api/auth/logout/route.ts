import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { SESSION_COOKIE } from "@/lib/server/session";
import { isLocale } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  // Same-origin only: blocks cross-site forms from logging a visitor out.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))) return new NextResponse("Forbidden", { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(await getDb(), token);
  const form = await req.formData().catch(() => null);
  const loc = String(form?.get("locale") ?? "en");
  const res = NextResponse.redirect(new URL(`/${isLocale(loc) ? loc : "en"}`, req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
