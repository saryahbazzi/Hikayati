import "server-only";
import { quote, type AddonRow, type PriceRow } from "@/lib/domain/pricing";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { ValidationError, type Actor } from "./permissions";

export interface PackageView {
  id: string; slug: string; name: { en: string; ar: string }; tagline: { en: string; ar: string }; features: { en: string; ar: string }[];
  limits: Record<string, number | boolean | string>; pricingStatus: "coming_soon" | "published"; isPublic: boolean; sort: number; prices: PriceRow[];
}

const mapPrice = (x: Record<string, unknown>): PriceRow => ({ id: x.id as string, model: x.model as PriceRow["model"], amountMinor: Number(x.amount_minor), minGuests: x.min_guests as number, maxGuests: x.max_guests as number | null, billingInterval: x.billing_interval as PriceRow["billingInterval"], label: x.label as string | null, active: x.active as boolean });

export async function listPackages(q: Queryable, opts: { publicOnly?: boolean } = {}): Promise<PackageView[]> {
  const pk = (await q.query<Record<string, unknown>>(`select * from packages ${opts.publicOnly ? "where is_public" : ""} order by sort`)).rows;
  const prices = (await q.query<Record<string, unknown>>("select * from package_prices order by min_guests")).rows;
  return pk.map((p) => ({
    id: p.id as string, slug: p.slug as string, name: p.name_i18n as PackageView["name"], tagline: p.tagline_i18n as PackageView["tagline"], features: p.features as PackageView["features"],
    limits: p.limits as PackageView["limits"], pricingStatus: p.pricing_status as PackageView["pricingStatus"], isPublic: p.is_public as boolean, sort: p.sort as number,
    prices: prices.filter((x) => x.package_id === p.id).map(mapPrice),
  }));
}

export async function listAddons(q: Queryable) {
  return (await q.query<Record<string, unknown>>("select * from package_addons order by slug")).rows.map((a) => ({
    slug: a.slug as string, name: a.name_i18n as { en: string; ar: string }, pricing: a.pricing as AddonRow["pricing"], priceMinor: Number(a.price_minor), active: a.active as boolean }));
}

export async function taxRate(q: Queryable): Promise<number> {
  const r = (await q.query<{ value: { rate: number } }>("select value from platform_settings where key = 'tax'")).rows[0];
  return r?.value?.rate ?? 0.15;
}

/** Recommend the smallest package whose guest limit covers the estimate. */
export function recommendPackage(pkgs: PackageView[], guests: number): string | null {
  const fit = pkgs.filter((p) => p.slug !== "event-planner" && (typeof p.limits.maxGuests !== "number" || p.limits.maxGuests >= guests));
  return fit[0]?.slug ?? pkgs[0]?.slug ?? null;
}

/** Internal example quote for the wizard summary. Public pricing stays "coming soon". */
export async function quoteForEvent(q: Queryable, packageSlug: string, guests: number, addonSlugs: string[] = [], discountCode?: string) {
  const pkg = (await listPackages(q)).find((p) => p.slug === packageSlug);
  if (!pkg) throw new ValidationError({ packageSlug: "required" });
  const allAddons = await listAddons(q);
  const addons = allAddons.filter((a) => a.active && addonSlugs.includes(a.slug));
  let pct = 0;
  if (discountCode) {
    const d = (await q.query<{ percent: string }>("select percent from discounts where code = $1 and active and (expires_at is null or expires_at > now())", [discountCode.trim().toUpperCase()])).rows[0];
    if (d) pct = Number(d.percent);
  }
  return { package: pkg, quote: quote({ prices: pkg.prices.filter((p) => p.model !== "subscription"), guests, addons, discountPercent: pct, taxRate: await taxRate(q) }) };
}

// ---------- admin management ----------
export interface PackageUpdate { name?: { en: string; ar: string }; tagline?: { en: string; ar: string }; features?: { en: string; ar: string }[]; limits?: Record<string, number | boolean | string>; pricingStatus?: "coming_soon" | "published"; isPublic?: boolean }

export async function updatePackage(q: Queryable, actor: Actor, id: string, u: PackageUpdate) {
  const s = (v: unknown, max = 200) => String(v ?? "").slice(0, max);
  if (u.name && (!u.name.en.trim() || !u.name.ar.trim())) throw new ValidationError({ name: "required" });
  await q.query(
    `update packages set name_i18n = coalesce($2, name_i18n), tagline_i18n = coalesce($3, tagline_i18n), features = coalesce($4, features), limits = coalesce($5, limits),
       pricing_status = coalesce($6, pricing_status), is_public = coalesce($7, is_public), updated_at = now() where id = $1`,
    [id, u.name ? JSON.stringify({ en: s(u.name.en, 60), ar: s(u.name.ar, 60) }) : null, u.tagline ? JSON.stringify({ en: s(u.tagline.en, 200), ar: s(u.tagline.ar, 200) }) : null,
      u.features ? JSON.stringify(u.features.slice(0, 20).map((f) => ({ en: s(f.en), ar: s(f.ar) }))) : null, u.limits ? JSON.stringify(u.limits) : null, u.pricingStatus ?? null, u.isPublic ?? null]);
  await audit(q, actor, "package.update", { entity: "package", id });
}

export interface PriceInput { model: "flat" | "per_guest" | "subscription"; amountSar: number; minGuests: number; maxGuests: number | null; billingInterval?: "month" | "year" | null; label?: string }

export async function addPrice(q: Queryable, actor: Actor, packageId: string, p: PriceInput) {
  const errors: Record<string, string> = {};
  if (!["flat", "per_guest", "subscription"].includes(p.model)) errors.model = "required";
  if (!Number.isFinite(p.amountSar) || p.amountSar < 0) errors.amountSar = "range";
  if (!Number.isInteger(p.minGuests) || p.minGuests < 0) errors.minGuests = "range";
  if (p.maxGuests !== null && (!Number.isInteger(p.maxGuests) || p.maxGuests < p.minGuests)) errors.maxGuests = "range";
  if (p.model === "subscription" && !p.billingInterval) errors.billingInterval = "required";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  await q.query("insert into package_prices (package_id, model, amount_minor, min_guests, max_guests, billing_interval, label) values ($1,$2,$3,$4,$5,$6,$7)",
    [packageId, p.model, Math.round(p.amountSar * 100), p.minGuests, p.maxGuests, p.model === "subscription" ? p.billingInterval : null, p.label?.slice(0, 80) ?? null]);
  await audit(q, actor, "package.price_add", { entity: "package", id: packageId });
}

export async function setPriceActive(q: Queryable, actor: Actor, priceId: string, active: boolean) {
  await q.query("update package_prices set active = $2 where id = $1", [priceId, active]);
  await audit(q, actor, "package.price_toggle", { entity: "price", id: priceId }, { active });
}
export async function deletePrice(q: Queryable, actor: Actor, priceId: string) {
  await q.query("delete from package_prices where id = $1", [priceId]);
  await audit(q, actor, "package.price_delete", { entity: "price", id: priceId });
}
export async function upsertAddon(q: Queryable, actor: Actor, a: { slug: string; en: string; ar: string; pricing: "flat" | "per_guest"; priceSar: number; active: boolean }) {
  const slug = a.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
  if (!slug || !a.en.trim() || !a.ar.trim() || !(a.priceSar >= 0)) throw new ValidationError({ addon: "invalid" });
  await q.query(`insert into package_addons (slug, name_i18n, pricing, price_minor, active) values ($1,$2,$3,$4,$5)
    on conflict (slug) do update set name_i18n=excluded.name_i18n, pricing=excluded.pricing, price_minor=excluded.price_minor, active=excluded.active`,
    [slug, JSON.stringify({ en: a.en.slice(0, 80), ar: a.ar.slice(0, 80) }), a.pricing, Math.round(a.priceSar * 100), a.active]);
  await audit(q, actor, "package.addon_upsert", { entity: "addon", id: slug });
}
export async function setTaxRate(q: Queryable, actor: Actor, rate: number) {
  if (!(rate >= 0 && rate <= 0.5)) throw new ValidationError({ tax: "range" });
  await q.query("insert into platform_settings (key, value, updated_by) values ('tax', $1, $2) on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()", [JSON.stringify({ rate }), actor.id]);
  await audit(q, actor, "settings.tax", { entity: "settings", id: "tax" }, { rate });
}
