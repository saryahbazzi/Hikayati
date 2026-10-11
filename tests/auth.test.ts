import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/lib/server/db";
import { actorFromSessionToken, AuthError, demoLogin, destroySession, requestOtp, verifyOtp } from "@/lib/server/auth";
import { resetRateLimits } from "@/lib/server/rate-limit";
import { demoAccessEnabled } from "@/lib/server/config";
import { DEMO_USERS } from "@/lib/server/seed";
import { freshDb } from "./helpers";

let db: Db;
const env = { ...process.env };
beforeAll(async () => { db = await freshDb(); });
beforeEach(() => { resetRateLimits(); process.env.HIKAYATI_DEMO_ACCESS = "true"; delete process.env.HIKAYATI_DEV_OTP; delete process.env.OTP_PROVIDER; });
afterEach(() => { process.env = { ...env }; });

describe("phone OTP sign-in", () => {
  it("signs in with a valid code, creating an ordinary customer on first login", async () => {
    const { phone, devCode } = await requestOtp(db, "0555000111", "+966");
    expect(phone).toBe("+966555000111");
    expect(devCode).toMatch(/^\d{6}$/);
    const s = await verifyOtp(db, "0555000111", devCode!, "+966");
    const a = await actorFromSessionToken(db, s.token);
    expect(a).toMatchObject({ role: "customer", phone: "+966555000111" });
    expect((await db.query("select token_hash from sessions")).rows.every((r) => !String(r.token_hash).includes(s.token))).toBe(true); // only hashes are stored
  });
  it("rejects wrong, reused and expired codes; locks after repeated failures", async () => {
    const { devCode } = await requestOtp(db, "0555000112");
    await expect(verifyOtp(db, "0555000112", "000000")).rejects.toMatchObject({ code: "invalid_code" });
    await verifyOtp(db, "0555000112", devCode!);
    await expect(verifyOtp(db, "0555000112", devCode!)).rejects.toBeInstanceOf(AuthError);   // consumed
    const r2 = await requestOtp(db, "0555000113");
    await db.query("update otp_challenges set expires_at = now() - interval '1 minute' where phone_e164 = '+966555000113'");
    await expect(verifyOtp(db, "0555000113", r2.devCode!)).rejects.toMatchObject({ code: "expired" });
    const r3 = await requestOtp(db, "0555000114");
    const wrong = r3.devCode === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) await expect(verifyOtp(db, "0555000114", wrong)).rejects.toMatchObject({ code: "invalid_code" });
    await expect(verifyOtp(db, "0555000114", r3.devCode!)).rejects.toMatchObject({ code: "rate_limited" });
  });
  it("rate-limits code requests per number", async () => {
    for (let i = 0; i < 3; i++) await requestOtp(db, "0555000115");
    await expect(requestOtp(db, "0555000115")).rejects.toMatchObject({ code: "rate_limited" });
  });
  it("rejects invalid numbers", async () => {
    await expect(requestOtp(db, "12")).rejects.toMatchObject({ code: "invalid_phone" });
  });
  it("sessions can be destroyed and disabled users are refused", async () => {
    const { devCode } = await requestOtp(db, "0555000116");
    const s = await verifyOtp(db, "0555000116", devCode!);
    await destroySession(db, s.token);
    expect(await actorFromSessionToken(db, s.token)).toBeNull();
    const { devCode: c2 } = await requestOtp(db, "0555000117");
    const s2 = await verifyOtp(db, "0555000117", c2!);
    await db.query("update users set disabled_at = now() where phone_e164 = '+966555000117'");
    expect(await actorFromSessionToken(db, s2.token)).toBeNull();
  });
  it("a new account can never self-assign a staff role", async () => {
    const { devCode } = await requestOtp(db, "0555000118");
    await verifyOtp(db, "0555000118", devCode!);
    expect((await db.query<{ role: string }>("select role from users where phone_e164 = '+966555000118'")).rows[0].role).toBe("customer");
  });
});

describe("serverless preview (ephemeral database)", () => {
  it("Vercel previews default to demo access; production does not", () => {
    const e = process.env as Record<string, string | undefined>;
    delete e.HIKAYATI_DEMO_ACCESS; e.NODE_ENV = "production";
    expect(demoAccessEnabled()).toBe(false);
    e.VERCEL_ENV = "production"; expect(demoAccessEnabled()).toBe(false);
    e.VERCEL_ENV = "preview"; expect(demoAccessEnabled()).toBe(true);
    e.HIKAYATI_DEMO_ACCESS = "false"; expect(demoAccessEnabled()).toBe(false);
  });
  it("uses signed stateless sessions that another instance can honour; rejects tampering and expiry", async () => {
    process.env.VERCEL = "1";
    const other = await freshDb();                                  // a second serverless instance with its own memory
    const s = await demoLogin(db, DEMO_USERS.host.id);
    expect(s.token.startsWith("v1.")).toBe(true);
    expect((await actorFromSessionToken(db, s.token))?.role).toBe("customer");
    expect((await actorFromSessionToken(other, s.token))?.id).toBe(DEMO_USERS.host.id);
    expect(await actorFromSessionToken(db, s.token.slice(0, -2) + "xx")).toBeNull();
    const [, body, sig] = s.token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), r: "super_admin" })).toString("base64url");
    expect(await actorFromSessionToken(db, `v1.${forged}.${sig}`)).toBeNull();   // role escalation is impossible without the secret
    const expired = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), e: Date.now() - 1000 })).toString("base64url");
    expect(await actorFromSessionToken(db, `v1.${expired}.${sig}`)).toBeNull();
  });
  it("never accepts stateless tokens when sessions are stored (local dev, real Postgres)", async () => {
    process.env.VERCEL = "1";
    const s = await demoLogin(db, DEMO_USERS.host.id);
    delete process.env.VERCEL;
    expect(await actorFromSessionToken(db, s.token)).toBeNull();
  });
});

describe("production safety", () => {
  it("demo access is off in production unless explicitly enabled", () => {
    const e = process.env as Record<string, string | undefined>;
    delete e.HIKAYATI_DEMO_ACCESS;
    e.NODE_ENV = "production";
    expect(demoAccessEnabled()).toBe(false);
    e.HIKAYATI_DEMO_ACCESS = "true";
    expect(demoAccessEnabled()).toBe(true);
    e.NODE_ENV = "development";
    delete e.HIKAYATI_DEMO_ACCESS;
    expect(demoAccessEnabled()).toBe(true);
    e.HIKAYATI_DEMO_ACCESS = "false";
    expect(demoAccessEnabled()).toBe(false);
  });
  it("with demo access off and no OTP provider, sign-in is refused (no silent bypass) and demo login is refused", async () => {
    process.env.HIKAYATI_DEMO_ACCESS = "false";
    await expect(requestOtp(db, "0555000119")).rejects.toMatchObject({ code: "not_configured" });
    await expect(demoLogin(db, DEMO_USERS.superAdmin.id)).rejects.toMatchObject({ code: "demo_disabled" });
  });
  it("the dev OTP override only works in demo mode", async () => {
    process.env.HIKAYATI_DEV_OTP = "123456";
    expect((await requestOtp(db, "0555000120")).devCode).toBe("123456");
  });
  it("demo login only works for seeded demo accounts", async () => {
    const real = (await db.query<{ id: string }>("select id from users where is_demo = false limit 1")).rows[0];
    await expect(demoLogin(db, real.id)).rejects.toMatchObject({ code: "demo_disabled" });
    const s = await demoLogin(db, DEMO_USERS.host.id);
    expect((await actorFromSessionToken(db, s.token))?.role).toBe("customer");
  });
});
