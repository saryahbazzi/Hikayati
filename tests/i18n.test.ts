import { describe, expect, it } from "vitest";
import { isLocale, p, resolve, switchLocalePath } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";
import { home } from "@/lib/i18n/home";
import { pages } from "@/lib/i18n/pages";
import { guestCopy } from "@/lib/i18n/guest";
import { guestsCopy } from "@/lib/i18n/guests";
import { authCopy } from "@/lib/i18n/auth";
import { wizardCopy } from "@/lib/i18n/wizard";
import { portalCopy } from "@/lib/i18n/portal";
import { adminCopy } from "@/lib/i18n/admin";

const ARABIC = /[؀-ۿ]/;
const walk = (v: unknown, path = "", out: [string, string][] = []): [string, string][] => {
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`, out));
  return out;
};
const bundles = { common, home, pages, guestCopy, guestsCopy, authCopy, wizardCopy, portalCopy, adminCopy };

describe("i18n", () => {
  it("resolves pairs, lists and nested objects", () => {
    const tree = { a: p("Hello", "مرحبا"), l: [p("One", "واحد")], n: { x: p("X", "س") }, o: [{ t: p("T", "ت") }] };
    expect(resolve(tree, "en")).toEqual({ a: "Hello", l: ["One"], n: { x: "X" }, o: [{ t: "T" }] });
    expect(resolve(tree, "ar")).toEqual({ a: "مرحبا", l: ["واحد"], n: { x: "س" }, o: [{ t: "ت" }] });
  });
  it.each(Object.entries(bundles))("%s has no empty strings and genuinely Arabic Arabic", (_name, t) => {
    const en = walk(t("en")), ar = walk(t("ar"));
    expect(ar.length).toBe(en.length);
    for (const [path, s] of [...en, ...ar]) expect(s.trim(), path).not.toBe("");
    const latinOnlyAllowed = /exEn|driver|brand|phoneValue|instagramValue|\.n$|\.n\]|^\.brand/;
    const untranslated = ar.filter(([path, s], i) => !ARABIC.test(s) && s === en[i][1] && !latinOnlyAllowed.test(path));
    expect(untranslated.map(([k]) => k)).toEqual([]);
  });
  it("includes the required brand and CTA wording", () => {
    expect(home("en").hero.tagline).toBe("Every gathering has a story.");
    expect(home("ar").hero.tagline).toBe("لكل لقاء حكاية");
    expect(common("en").nav.begin).toBe("Begin Your Story");
    expect(common("ar").nav.begin).toBe("ابدأ حكايتك");
    expect(pages("ar").packages.soon).toBe("الأسعار قريبًا");
    expect(pages("en").packages.soon).toBe("Pricing Coming Soon");
    expect(guestCopy("ar").acceptedBody).toContain("يسعدنا تأكيد حضورك");
    expect(guestCopy("en").declinedBody).toContain("hope to celebrate together another time");
  });
  it("switches the locale segment of a path", () => {
    expect(switchLocalePath("/en/packages", "ar")).toBe("/ar/packages");
    expect(switchLocalePath("/ar", "en")).toBe("/en");
    expect(isLocale("fr")).toBe(false);
  });
});
