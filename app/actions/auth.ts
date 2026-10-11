"use server";

import { cookies, headers } from "next/headers";
import { publicAction } from "@/lib/server/action";
import { demoLogin, requestOtp, verifyOtp } from "@/lib/server/auth";
import { demoAccessEnabled } from "@/lib/server/config";
import { SESSION_COOKIE, setSessionCookie } from "@/lib/server/session";
import { DEMO_USERS } from "@/lib/server/seed";
import { STAFF_ROLES, type Role } from "@/lib/server/permissions";

const dest = (role: Role, locale: string, next?: string) => {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return `/${locale}${role === "customer" ? "/my-events" : "/admin"}`;
};

export async function requestOtpAction(phone: string, dial: string) {
  return publicAction(({ db, ip }) => requestOtp(db, phone, dial, ip));
}

export async function verifyOtpAction(phone: string, code: string, dial: string, locale: string, next?: string) {
  return publicAction(async ({ db }) => {
    const ua = (await headers()).get("user-agent") ?? "";
    const s = await verifyOtp(db, phone, code, dial, ua);
    await setSessionCookie(s.token, s.expires);
    const role = (await db.query<{ role: Role }>("select role from users where id = $1", [s.userId])).rows[0].role;
    return { to: dest(role, locale, next) };
  });
}

/** Seeded fictional accounts only; refused unless demo access is explicitly enabled. */
export async function demoLoginAction(key: keyof typeof DEMO_USERS, locale: string, next?: string) {
  return publicAction(async ({ db }) => {
    const u = DEMO_USERS[key];
    const ua = (await headers()).get("user-agent") ?? "";
    const s = await demoLogin(db, u.id, ua);
    await setSessionCookie(s.token, s.expires);
    return { to: dest(u.role, locale, next) };
  });
}

export async function demoAccountsAction() {
  if (!demoAccessEnabled()) return [];
  return Object.entries(DEMO_USERS).map(([key, u]) => ({ key, name: u.name, role: u.role, staff: STAFF_ROLES.includes(u.role) }));
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
}
