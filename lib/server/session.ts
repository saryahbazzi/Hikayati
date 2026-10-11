import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorFromSessionToken } from "./auth";
import { isProduction } from "./config";
import { getDb } from "./db";
import { hasPermission, type Actor, type Permission } from "./permissions";

export const SESSION_COOKIE = "hk_session";

export async function setSessionCookie(token: string, expires: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: isProduction(), path: "/", expires,
  });
}
export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Current actor for this request (deduplicated), or null. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  return actorFromSessionToken(await getDb(), token);
});

const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/");

export async function requireActor(locale: string, next?: string): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(`/${locale}/login${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}`);
  return actor;
}

/** Server-side gate for staff pages: signed in AND holding the permission. */
export async function requirePermission(locale: string, p: Permission, next?: string): Promise<Actor> {
  const actor = await requireActor(locale, next);
  if (!hasPermission(actor, p)) redirect(`/${locale}/not-authorized`);
  return actor;
}
