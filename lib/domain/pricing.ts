export interface PriceRow { id: string; model: "flat" | "per_guest" | "subscription"; amountMinor: number; minGuests: number; maxGuests: number | null; billingInterval: "month" | "year" | null; label: string | null; active: boolean }
export interface AddonRow { slug: string; pricing: "flat" | "per_guest"; priceMinor: number }

export interface Quote {
  currency: "SAR";
  lines: { key: string; label?: string; amountMinor: number }[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  taxRate: number;
  /** Always true for now: internal example pricing, no payment is taken. */
  example: true;
}

/**
 * Configurable pricing: one-time `flat` base + `per_guest` tiers (the tier whose [min,max] contains the
 * guest count) + add-ons, then percentage discount, then VAT. Subscription prices are returned separately
 * by the caller; they are not part of an event quote.
 */
export function quote(opts: {
  prices: PriceRow[];
  guests: number;
  addons?: AddonRow[];
  discountPercent?: number;
  taxRate?: number;
}): Quote {
  const guests = Math.max(0, Math.floor(opts.guests));
  const lines: Quote["lines"] = [];
  const active = opts.prices.filter((p) => p.active);
  for (const p of active.filter((p) => p.model === "flat")) lines.push({ key: "base", label: p.label ?? undefined, amountMinor: p.amountMinor });
  const tier = active
    .filter((p) => p.model === "per_guest" && guests >= p.minGuests && (p.maxGuests === null || guests <= p.maxGuests))
    .sort((a, b) => b.minGuests - a.minGuests)[0];
  if (tier) lines.push({ key: "guests", label: tier.label ?? undefined, amountMinor: tier.amountMinor * guests });
  for (const a of opts.addons ?? []) lines.push({ key: `addon:${a.slug}`, amountMinor: a.pricing === "per_guest" ? a.priceMinor * guests : a.priceMinor });
  const subtotalMinor = lines.reduce((s, l) => s + l.amountMinor, 0);
  const pct = Math.min(100, Math.max(0, opts.discountPercent ?? 0));
  const discountMinor = Math.round((subtotalMinor * pct) / 100);
  const taxRate = opts.taxRate ?? 0.15;
  const taxMinor = Math.round(((subtotalMinor - discountMinor) * taxRate));
  return { currency: "SAR", lines, subtotalMinor, discountMinor, taxMinor, totalMinor: subtotalMinor - discountMinor + taxMinor, taxRate, example: true };
}

export const formatMinor = (minor: number, locale: "ar" | "en", currency = "SAR") =>
  new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
