import "server-only";
import { headers } from "next/headers";
import { getDb, type Db } from "./db";
import { ForbiddenError, NotFoundError, ValidationError, type Actor } from "./permissions";
import { AuthError } from "./auth";
import { getActor } from "./session";

/** Result envelope every server action returns, so the UI never has to catch exceptions. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: "validation" | "forbidden" | "not_found" | "unauthenticated" | "rate_limited" | "auth" | "unknown"; fields?: Record<string, string>; code?: string };

export interface Ctx { db: Db; actor: Actor; origin: string }

export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/**
 * Run an authenticated action. The actor ALWAYS comes from the session cookie on the server;
 * nothing the client sends (user ids, roles) is trusted.
 */
export async function action<T>(fn: (ctx: Ctx) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const actor = await getActor();
    if (!actor) return { ok: false, error: "unauthenticated" };
    return { ok: true, data: await fn({ db: await getDb(), actor, origin: await requestOrigin() }) };
  } catch (e) {
    return fail(e);
  }
}

/** For public (unauthenticated) actions such as guest RSVP and login. */
export async function publicAction<T>(fn: (ctx: { db: Db; origin: string; ip: string }) => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn({ db: await getDb(), origin: await requestOrigin(), ip: await clientIp() }) };
  } catch (e) {
    return fail(e);
  }
}

export function fail(e: unknown): ActionResult<never> {
  if (e instanceof ValidationError) return { ok: false, error: "validation", fields: e.fields };
  if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
  if (e instanceof NotFoundError) return { ok: false, error: "not_found" };
  if (e instanceof AuthError) return { ok: false, error: e.code === "rate_limited" ? "rate_limited" : "auth", code: e.code };
  console.error("[action]", e);
  return { ok: false, error: "unknown" };
}
