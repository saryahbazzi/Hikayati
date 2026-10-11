import "server-only";
import { demoAccessEnabled } from "./config";
import { createHmac } from "node:crypto";
import { appSecret } from "./config";
import { hashToken, randomCode, randomToken, safeEqual, sha256 } from "./crypto";
import type { Queryable } from "./db";
import { normalizePhone } from "@/lib/phone";
import type { Actor, Role } from "./permissions";
import { rateLimit } from "./rate-limit";
import { audit } from "./audit";

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 3600_000;

export class AuthError extends Error {
  constructor(public code: "invalid_phone" | "rate_limited" | "invalid_code" | "expired" | "disabled" | "not_configured" | "demo_disabled") {
    super(code);
    this.name = "AuthError";
  }
}

/**
 * OTP delivery. No SMS/WhatsApp provider is wired yet, so in production without demo access login is
 * refused rather than silently bypassed. In dev/demo mode the code is returned to the caller so a human
 * can finish the flow locally.
 */
export async function requestOtp(q: Queryable, phoneInput: string, dial?: string, ip = "unknown") {
  const phone = normalizePhone(phoneInput, dial);
  if (!phone.ok) throw new AuthError("invalid_phone");
  if (!demoAccessEnabled() && !process.env.OTP_PROVIDER) throw new AuthError("not_configured");
  if (!rateLimit(`otp:phone:${phone.e164}`, 3, 10 * 60_000) || !rateLimit(`otp:ip:${ip}`, 20, 10 * 60_000)) throw new AuthError("rate_limited");

  const code = process.env.HIKAYATI_DEV_OTP && demoAccessEnabled() ? process.env.HIKAYATI_DEV_OTP : randomCode(6);
  await q.query("update otp_challenges set consumed_at = now() where phone_e164 = $1 and consumed_at is null", [phone.e164]);
  await q.query("insert into otp_challenges (phone_e164, code_hash, expires_at) values ($1,$2,$3)", [
    phone.e164,
    sha256(`otp:${phone.e164}:${code}`),
    new Date(Date.now() + OTP_TTL_MS),
  ]);
  // TODO(provider): deliver `code` through the configured OTP provider here.
  return { phone: phone.e164, devCode: demoAccessEnabled() ? code : undefined };
}

export async function verifyOtp(q: Queryable, phoneInput: string, code: string, dial?: string, userAgent = "") {
  const phone = normalizePhone(phoneInput, dial);
  if (!phone.ok) throw new AuthError("invalid_phone");
  const ch = (
    await q.query<{ id: string; code_hash: string; expires_at: Date; attempts: number }>(
      "select id, code_hash, expires_at, attempts from otp_challenges where phone_e164 = $1 and consumed_at is null order by created_at desc limit 1",
      [phone.e164],
    )
  ).rows[0];
  if (!ch) throw new AuthError("invalid_code");
  if (new Date(ch.expires_at).getTime() < Date.now()) throw new AuthError("expired");
  if (ch.attempts >= MAX_ATTEMPTS) throw new AuthError("rate_limited");
  await q.query("update otp_challenges set attempts = attempts + 1 where id = $1", [ch.id]);
  if (!safeEqual(ch.code_hash, sha256(`otp:${phone.e164}:${code.trim()}`))) throw new AuthError("invalid_code");
  await q.query("update otp_challenges set consumed_at = now() where id = $1", [ch.id]);

  // First login creates an ordinary customer. Staff roles are only ever granted by an administrator.
  let user = (await q.query<{ id: string; disabled_at: Date | null }>("select id, disabled_at from users where phone_e164 = $1", [phone.e164])).rows[0];
  if (!user) {
    user = (await q.query<{ id: string; disabled_at: Date | null }>(
      "insert into users (phone_e164, role) values ($1, 'customer') returning id, disabled_at", [phone.e164],
    )).rows[0];
  }
  if (user.disabled_at) throw new AuthError("disabled");
  return createSession(q, user.id, userAgent);
}

/**
 * When the database is ephemeral (serverless without DATABASE_URL: each instance has its own in-memory copy), a
 * session row would vanish as soon as another instance serves the next request. In that mode only, the session is a
 * signed stateless token that any instance can verify and use to re-create the user. With a real database sessions are
 * stored (hashed) and revocable, and stateless tokens are refused.
 */
const sign = (payload: string) => createHmac("sha256", appSecret()).update(`session:${payload}`).digest("base64url").slice(0, 32);
/** Serverless (Vercel) + in-memory database only. Everywhere else — local dev, tests, real Postgres — sessions are stored. */
const statelessSessions = (q: Queryable) => !!(q as { ephemeral?: boolean }).ephemeral && !!process.env.VERCEL;
type Claims = { u: string; p: string | null; n: string; r: Role; l: "ar" | "en"; d: boolean; e: number };

export async function createSession(q: Queryable, userId: string, userAgent = "") {
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  if (statelessSessions(q)) {
    const u = (await q.query<{ phone_e164: string | null; full_name: string; role: Role; locale: "ar" | "en"; is_demo: boolean }>("select phone_e164, full_name, role, locale, is_demo from users where id = $1", [userId])).rows[0];
    const claims: Claims = { u: userId, p: u.phone_e164, n: u.full_name, r: u.role, l: u.locale, d: u.is_demo, e: expires.getTime() };
    const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return { token: `v1.${body}.${sign(body)}`, expires, userId };
  }
  const token = randomToken(32);
  await q.query("insert into sessions (user_id, token_hash, expires_at, user_agent) values ($1,$2,$3,$4)", [userId, hashToken(token), expires, userAgent.slice(0, 200)]);
  return { token, expires, userId };
}

/** Quick sign-in as a seeded fictional account. Only exists when demo access is enabled. */
export async function demoLogin(q: Queryable, userId: string, userAgent = "") {
  if (!demoAccessEnabled()) throw new AuthError("demo_disabled");
  const u = (await q.query<{ id: string; is_demo: boolean }>("select id, is_demo from users where id = $1", [userId])).rows[0];
  if (!u || !u.is_demo) throw new AuthError("demo_disabled");
  await audit(q, { id: u.id, role: "customer" }, "auth.demo_login", { entity: "user", id: u.id });
  return createSession(q, u.id, userAgent);
}

async function actorFromStateless(q: Queryable, token: string): Promise<Actor | null> {
  if (!statelessSessions(q)) return null; // never accept non-revocable tokens when sessions are stored
  const [, body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  let c: Claims;
  try { c = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Claims; } catch { return null; }
  if (!c.u || c.e < Date.now()) return null;
  const row = (await q.query<{ disabled_at: Date | null }>("select disabled_at from users where id = $1", [c.u])).rows[0];
  if (row?.disabled_at) return null;
  if (!row) {
    // another instance created this user; recreate it here (the claims are server-signed)
    await q.query("insert into users (id, phone_e164, full_name, role, locale, is_demo) values ($1,$2,$3,$4,$5,$6) on conflict do nothing", [c.u, c.p, c.n, c.r, c.l, c.d]);
  }
  const u = (await q.query<{ id: string; role: Role; full_name: string; phone_e164: string | null; locale: "ar" | "en" }>("select id, role, full_name, phone_e164, locale from users where id = $1", [c.u])).rows[0];
  return u ? { id: u.id, role: u.role, fullName: u.full_name, phone: u.phone_e164, locale: u.locale } : null;
}

export async function actorFromSessionToken(q: Queryable, token: string | undefined): Promise<Actor | null> {
  if (!token) return null;
  if (token.startsWith("v1.")) return actorFromStateless(q, token);
  const r = await q.query<{ id: string; role: Role; full_name: string; phone_e164: string | null; locale: "ar" | "en"; disabled_at: Date | null }>(
    `select u.id, u.role, u.full_name, u.phone_e164, u.locale, u.disabled_at
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  const row = r.rows[0];
  if (!row || row.disabled_at) return null;
  return { id: row.id, role: row.role, fullName: row.full_name, phone: row.phone_e164, locale: row.locale };
}

export async function destroySession(q: Queryable, token: string | undefined) {
  if (token && !token.startsWith("v1.")) await q.query("delete from sessions where token_hash = $1", [hashToken(token)]);
}
