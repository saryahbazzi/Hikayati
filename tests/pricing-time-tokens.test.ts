import { describe, expect, it } from "vitest";
import { quote, type PriceRow } from "@/lib/domain/pricing";
import { formatDate, formatTime, utcToZoned, zonedToUtc } from "@/lib/domain/time";
import { signInvitationToken, signPassToken, verifyInvitationToken, verifyPassToken } from "@/lib/server/tokens";
import { hashToken, randomToken } from "@/lib/server/crypto";
import { verifyWebhookSignature } from "@/lib/server/messaging/whatsapp";
import { createHmac } from "node:crypto";

const row = (o: Partial<PriceRow>): PriceRow => ({ id: "x", model: "flat", amountMinor: 0, minGuests: 0, maxGuests: null, billingInterval: null, label: null, active: true, ...o });

describe("pricing", () => {
  const prices = [row({ model: "flat", amountMinor: 70000 }), row({ model: "per_guest", amountMinor: 500, minGuests: 0, maxGuests: 100 }), row({ model: "per_guest", amountMinor: 400, minGuests: 101, maxGuests: 500 })];
  it("applies the tier that contains the guest count, then VAT", () => {
    const q = quote({ prices, guests: 100 });
    expect(q.subtotalMinor).toBe(70000 + 500 * 100);
    expect(q.taxMinor).toBe(Math.round(q.subtotalMinor * 0.15));
    const q2 = quote({ prices, guests: 200 });
    expect(q2.subtotalMinor).toBe(70000 + 400 * 200);
  });
  it("adds add-ons, discount before tax, ignores inactive rows", () => {
    const q = quote({ prices: [...prices, row({ model: "flat", amountMinor: 999999, active: false })], guests: 10, addons: [{ slug: "a", pricing: "flat", priceMinor: 10000 }, { slug: "b", pricing: "per_guest", priceMinor: 100 }], discountPercent: 10 });
    const sub = 70000 + 5000 + 10000 + 1000;
    expect(q.subtotalMinor).toBe(sub);
    expect(q.discountMinor).toBe(Math.round(sub * 0.1));
    expect(q.totalMinor).toBe(sub - q.discountMinor + q.taxMinor);
    expect(q.example).toBe(true);
  });
});

describe("time zones", () => {
  it("converts Riyadh wall-clock to UTC and back (UTC+3, no DST)", () => {
    const d = zonedToUtc("2026-12-15", "20:00", "Asia/Riyadh");
    expect(d.toISOString()).toBe("2026-12-15T17:00:00.000Z");
    expect(utcToZoned(d, "Asia/Riyadh")).toEqual({ date: "2026-12-15", time: "20:00" });
  });
  it("handles zones with DST", () => {
    expect(zonedToUtc("2026-07-01", "12:00", "Europe/London").toISOString()).toBe("2026-07-01T11:00:00.000Z");
    expect(zonedToUtc("2026-01-01", "12:00", "Europe/London").toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });
  it("formats Gregorian with Latin digits in both languages", () => {
    const d = "2026-12-15T17:00:00.000Z";
    expect(formatDate(d, "en")).toContain("15 December 2026");
    expect(formatDate(d, "ar")).toMatch(/15/);
    expect(formatDate(d, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatTime(d, "en")).toMatch(/8:00/);
  });
});

describe("signed guest credentials", () => {
  const id = "11111111-2222-4333-8444-555555555555";
  it("round-trips invitation links and rejects tampering or stale versions", () => {
    const t = signInvitationToken(id, 3);
    expect(verifyInvitationToken(t)).toEqual({ id, version: 3 });
    expect(verifyInvitationToken(t.replace(".3.", ".4."))).toBeNull();
    expect(verifyInvitationToken(t.slice(0, -2) + "xx")).toBeNull();
    expect(verifyInvitationToken("nope")).toBeNull();
  });
  it("round-trips passes and never embeds personal data", () => {
    const t = signPassToken(id);
    expect(verifyPassToken(t)).toEqual({ id });
    expect(verifyPassToken(t + "x")).toBeNull();
    expect(verifyPassToken(signInvitationToken(id, 1))).toBeNull();
    expect(t).toMatch(/^HK1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{27}$/);
  });
  it("hashes and randomises tokens", () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(hashToken("a")).toHaveLength(64);
  });
});

describe("whatsapp webhook signature", () => {
  it("verifies HMAC-SHA256 over the raw body", () => {
    const body = '{"entry":[]}';
    const sig = "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, "secret")).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, "secret")).toBe(false);
    expect(verifyWebhookSignature(body, null, "secret")).toBe(false);
  });
});
