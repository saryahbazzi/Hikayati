import { describe, expect, it } from "vitest";
import { GUEST_CSV_TEMPLATE, parseCsv, toCsv } from "@/lib/csv";
import { formatPhone, maskPhone, normalizePhone } from "@/lib/phone";
import { emptyDraft, isApprovedMapUrl, validateStep, todayIso, suggestTitle } from "@/lib/domain/wizard";

describe("phone normalisation (E.164)", () => {
  it.each([
    ["0501234567", "+966", "+966501234567"],
    ["501234567", "+966", "+966501234567"],
    ["+966 50 123 4567", "+966", "+966501234567"],
    ["00966501234567", "+966", "+966501234567"],
    ["٠٥٠١٢٣٤٥٦٧", "+966", "+966501234567"],            // Arabic-Indic digits
    ["050-123-4567", "+966", "+966501234567"],
    ["0501234567", "+971", "+971501234567"],             // UAE mobile (selected country)
    ["+44 7400 123456", "+966", "+447400123456"],        // explicit international wins over dial
  ])("%s with %s → %s", (input, dial, e164) => {
    const r = normalizePhone(input, dial);
    expect(r.ok && r.e164).toBe(e164);
  });
  it.each(["", "abc", "12345", "+966 12 345", "0000000000"])("rejects %j", (input) => {
    expect(normalizePhone(input).ok).toBe(false);
  });
  it("formats and masks for display", () => {
    expect(formatPhone("+966501234567")).toBe("+966 50 123 4567");
    expect(maskPhone("+966501234567")).toMatch(/4567$/);
    expect(maskPhone("+966501234567")).not.toContain("5012");
  });
});

describe("csv", () => {
  it("parses quotes, escaped quotes, CRLF, BOM and semicolons", () => {
    const rows = parseCsv('﻿first_name,notes\r\n"Noura","likes ""tea"", coffee"\r\nLayla;note\r\n');
    expect(rows).toEqual([["first_name", "notes"], ["Noura", 'likes "tea", coffee'], ["Layla", "note"]]);
  });
  it("guards exported cells against spreadsheet formula injection", () => {
    expect(toCsv([["=SUM(A1)", "+1", "-1", "@x", "ok"]])).toBe("'=SUM(A1),'+1,'-1,'@x,ok");
  });
  it("ships a template that parses", () => {
    const t = parseCsv(GUEST_CSV_TEMPLATE);
    expect(t[0]).toContain("phone");
    expect(t.length).toBeGreaterThan(1);
  });
});

describe("wizard validation", () => {
  const base = () => { const d = emptyDraft(); d.occasion = "wedding"; d.estimatedGuests = 120; return d; };
  it("step 1", () => {
    expect(validateStep(1, emptyDraft())).toMatchObject({ occasion: "required", estimatedGuests: "integer" });
    expect(validateStep(1, base())).toEqual({});
    expect(validateStep(1, { ...base(), estimatedGuests: 0 }).estimatedGuests).toBe("positive");
    expect(validateStep(1, { ...base(), estimatedGuests: 2.5 }).estimatedGuests).toBe("integer");
    expect(validateStep(1, { ...base(), occasion: "other" }).occasionCustom).toBe("required");
    expect(validateStep(1, { ...base(), occasion: "other", occasionCustom: "Garden tea" })).toEqual({});
  });
  it("step 2 is occasion-specific", () => {
    const d = { ...base(), title: "T", hostFirstName: "A", date: "2999-01-01", startTime: "20:00", venueName: "V", venueAddress: "Addr", city: "Riyadh", rsvpDeadline: "2998-12-01" };
    expect(validateStep(2, d)).toMatchObject({ brideName: "required", groomName: "required" });
    expect(validateStep(2, { ...d, details: { brideName: "N", groomName: "F" } })).toEqual({});
    const bday = { ...d, occasion: "birthday" };
    expect(validateStep(2, bday)).toMatchObject({ celebrantName: "required" });
    expect(validateStep(2, bday).brideName).toBeUndefined();   // wedding fields never forced on birthdays
    expect(validateStep(2, { ...d, occasion: "graduation" })).toEqual({});
  });
  it("step 2 date, time and map rules", () => {
    const d = { ...base(), title: "T", hostFirstName: "A", venueName: "V", venueAddress: "A", city: "R", details: { brideName: "N", groomName: "F" }, startTime: "20:00", date: "2999-01-01", rsvpDeadline: "2998-12-01" };
    expect(validateStep(2, { ...d, date: "2000-01-01", rsvpDeadline: "1999-01-01" }).date).toBe("past");
    expect(validateStep(2, { ...d, endTime: "19:00" }).endTime).toBe("afterStart");
    expect(validateStep(2, { ...d, rsvpDeadline: "2999-02-01" }).rsvpDeadline).toBe("beforeEvent");
    expect(validateStep(2, { ...d, mapUrl: "http://evil.example/x" }).mapUrl).toBe("mapUrl");
    expect(validateStep(2, { ...d, mapUrl: "https://maps.google.com/?q=Riyadh" }).mapUrl).toBeUndefined();
  });
  it("approved map links only", () => {
    expect(isApprovedMapUrl("https://maps.app.goo.gl/abc")).toBe(true);
    expect(isApprovedMapUrl("https://www.google.com/maps/place/x")).toBe(true);
    expect(isApprovedMapUrl("https://google.com.evil.io/maps")).toBe(false);
    expect(isApprovedMapUrl("javascript:alert(1)")).toBe(false);
  });
  it("requires template, package and consent at the end", () => {
    expect(validateStep(4, base()).templateSlug).toBe("required");
    expect(validateStep(6, base())).toMatchObject({ packageSlug: "required", consent: "required" });
  });
  it("suggests a title for couples", () => {
    const d = { ...base(), details: { groomName: "Fahad", brideName: "Nouf" } };
    expect(suggestTitle(d, "en")).toBe("Fahad & Nouf");
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
