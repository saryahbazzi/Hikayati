"use client";

import { useMemo, useState } from "react";
import { formatMinor, quote, type AddonRow } from "@/lib/domain/pricing";
import type { Locale } from "@/lib/i18n";
import type { adminCopy } from "@/lib/i18n/admin";
import type { PackageView } from "@/lib/server/catalog";
import { Lbl, ctl } from "./ui";

type T = ReturnType<typeof adminCopy>;
export interface SimAddon { slug: string; name: { en: string; ar: string }; pricing: "flat" | "per_guest"; priceMinor: number; active: boolean }
export interface SimDiscount { code: string; percent: number; active: boolean; expiresAt: string | null }

/** Interactive quote preview using the same pure quote() the wizard uses. Nothing is stored or charged. */
export function PriceSimulator({ packages, addons, discounts, taxRate, locale, t }: { packages: PackageView[]; addons: SimAddon[]; discounts: SimDiscount[]; taxRate: number; locale: Locale; t: T }) {
  const s = t.packages.sim;
  const [pkgId, setPkgId] = useState(packages[0]?.id ?? "");
  const [guests, setGuests] = useState("120");
  const [picked, setPicked] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const pkg = packages.find((p) => p.id === pkgId);
  const n = Math.max(0, Math.floor(Number(guests) || 0));
  const chosen: AddonRow[] = addons.filter((a) => a.active && picked.includes(a.slug)).map((a) => ({ slug: a.slug, pricing: a.pricing, priceMinor: a.priceMinor }));
  const d = discounts.find((x) => x.code === code.trim().toUpperCase() && x.active && (!x.expiresAt || new Date(x.expiresAt) > new Date()));
  const q = useMemo(() => (pkg ? quote({ prices: pkg.prices.filter((p) => p.model !== "subscription"), guests: n, addons: chosen, discountPercent: d?.percent ?? 0, taxRate }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pkg, n, picked, d, taxRate, addons]);
  const subs = pkg?.prices.filter((p) => p.model === "subscription" && p.active) ?? [];
  const money = (m: number) => formatMinor(m, locale);
  const lineLabel = (key: string, label?: string) => {
    if (key === "base") return label ?? s.base;
    if (key === "guests") return `${s.guestsLine}${label ? ` — ${label}` : ""}`;
    const a = addons.find((x) => `addon:${x.slug}` === key);
    return a ? a.name[locale] : key;
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <p className="text-xs leading-5 text-ink-soft">{s.sub}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Lbl label={s.package}><select className={ctl} value={pkgId} onChange={(e) => setPkgId(e.target.value)}>{packages.map((p) => <option key={p.id} value={p.id}>{p.name[locale]}</option>)}</select></Lbl>
          <Lbl label={s.guests}><input className={ctl} type="number" min={0} max={1000000} value={guests} onChange={(e) => setGuests(e.target.value)} dir="ltr" /></Lbl>
        </div>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-xs text-ink-soft">{s.addons}</legend>
          {addons.filter((a) => a.active).map((a) => (
            <label key={a.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[var(--color-olive)]" checked={picked.includes(a.slug)} onChange={(e) => setPicked(e.target.checked ? [...picked, a.slug] : picked.filter((x) => x !== a.slug))} />
              <span>{a.name[locale]}</span><span className="text-xs text-taupe" dir="ltr">{money(a.priceMinor)}{a.pricing === "per_guest" ? " / guest" : ""}</span>
            </label>
          ))}
        </fieldset>
        <Lbl label={s.discount} error={code.trim() && !d ? s.invalidCode : undefined} hint={d ? `${s.appliedCode}: ${d.percent}%` : undefined}>
          <input className={ctl} value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" placeholder="WELCOME10" list="sim-codes" aria-invalid={!!code.trim() && !d} />
        </Lbl>
        <datalist id="sim-codes">{discounts.filter((x) => x.active).map((x) => <option key={x.code} value={x.code} />)}</datalist>
      </div>
      <div className="border border-line bg-paper p-4" aria-live="polite">
        {q ? (
          <dl className="grid gap-2 text-sm">
            {q.lines.map((l) => <div key={l.key} className="flex justify-between gap-4"><dt className="text-ink-soft">{lineLabel(l.key, l.label)}</dt><dd className="tabular-nums" dir="ltr">{money(l.amountMinor)}</dd></div>)}
            <div className="flex justify-between gap-4 border-t border-line pt-2"><dt className="text-ink-soft">{s.subtotal}</dt><dd className="tabular-nums" dir="ltr">{money(q.subtotalMinor)}</dd></div>
            {q.discountMinor > 0 && <div className="flex justify-between gap-4"><dt className="text-ink-soft">{s.discountLine} ({d?.percent}%)</dt><dd className="tabular-nums" dir="ltr">−{money(q.discountMinor)}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-ink-soft">{s.taxLine} ({Math.round(q.taxRate * 1000) / 10}%)</dt><dd className="tabular-nums" dir="ltr">{money(q.taxMinor)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-ink/30 pt-2 text-base"><dt className="font-medium">{s.total}</dt><dd className="font-sans text-2xl tabular-nums" dir="ltr">{money(q.totalMinor)}</dd></div>
          </dl>
        ) : null}
        {subs.length > 0 && <p className="mt-3 text-xs leading-5 text-ink-soft">{s.subscriptionNote} {subs.map((p) => `${money(p.amountMinor)} / ${p.billingInterval === "year" ? t.packages.year : t.packages.month}`).join(", ")}</p>}
      </div>
    </div>
  );
}
