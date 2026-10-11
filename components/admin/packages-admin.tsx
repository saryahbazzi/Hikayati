"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addDiscountAction, addPriceAction, deletePriceAction, setDiscountActiveAction, setPriceActiveAction, setTaxAction, updatePackageAction, upsertAddonAction } from "@/app/actions/admin";
import { Badge, Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { formatMinor } from "@/lib/domain/pricing";
import type { Locale } from "@/lib/i18n";
import type { adminCopy } from "@/lib/i18n/admin";
import type { DiscountRow } from "@/lib/server/admin";
import type { PackageView } from "@/lib/server/catalog";
import { ErrorNotice, OkNotice, errorText } from "./feedback";
import { PriceSimulator, type SimAddon } from "./price-simulator";
import { Lbl, Panel, Td, TableWrap, Th, btnDanger, btnPrimary, btnQuiet, ctl, tableCls } from "./ui";

type T = ReturnType<typeof adminCopy>;
interface Props { packages: PackageView[]; addons: SimAddon[]; discounts: DiscountRow[]; taxRate: number; locale: Locale; t: T }

export function PackagesAdmin({ packages, addons, discounts, taxRate, locale, t }: Props) {
  const p = t.packages;
  return (
    <div className="grid gap-6">
      <Notice tone="demo"><strong className="font-medium">{p.stateTitle}.</strong> {p.state}</Notice>
      <Panel title={p.sim.title} id="simulator">
        <PriceSimulator packages={packages} addons={addons} discounts={discounts} taxRate={taxRate} locale={locale} t={t} />
      </Panel>
      <div className="grid gap-3" role="list" aria-label={p.packageTitle}>
        {packages.map((pk, i) => (
          <details key={pk.id} className="border border-line bg-paper/70" open={i === 0} role="listitem">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="font-medium text-ink">{pk.name[locale]} <span className="text-xs font-normal text-taupe" dir="ltr">({pk.slug})</span></span>
              <span className="flex gap-2"><Badge tone={pk.pricingStatus === "published" ? "olive" : "champagne"}>{pk.pricingStatus === "published" ? p.st_published : p.st_coming_soon}</Badge><Badge tone={pk.isPublic ? "info" : "neutral"}>{pk.isPublic ? p.visible : t.common.inactive}</Badge></span>
            </summary>
            <div className="grid gap-6 border-t border-line p-5">
              <PackageEditor pkg={pk} t={t} />
              <PriceRows pkg={pk} locale={locale} t={t} />
            </div>
          </details>
        ))}
      </div>
      <Panel title={p.addons} id="addons"><AddonsPanel addons={addons} locale={locale} t={t} /></Panel>
      <Panel title={p.discounts} id="discounts"><DiscountsPanel discounts={discounts} t={t} locale={locale} /></Panel>
      <Panel title={p.tax} id="tax"><TaxPanel taxRate={taxRate} t={t} /></Panel>
    </div>
  );
}

function PackageEditor({ pkg, t }: { pkg: PackageView; t: T }) {
  const p = t.packages;
  const router = useRouter();
  const a = useAction();
  const [ok, setOk] = useState<string | null>(null);
  const [f, setF] = useState({
    nameEn: pkg.name.en, nameAr: pkg.name.ar, tagEn: pkg.tagline.en ?? "", tagAr: pkg.tagline.ar ?? "",
    featuresEn: pkg.features.map((x) => x.en).join("\n"), featuresAr: pkg.features.map((x) => x.ar).join("\n"),
    maxGuests: String(pkg.limits.maxGuests ?? 100), events: String(pkg.limits.events ?? 1), reminders: !!pkg.limits.reminders, pricingStatus: pkg.pricingStatus, isPublic: pkg.isPublic,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    const r = await a.run(() => updatePackageAction(pkg.id, f));
    if (r.ok) { setOk(t.common.saved); router.refresh(); }
  }
  const fe = a.fields;
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2" aria-label={`${p.packageTitle}: ${pkg.name.en}`}>
      <Lbl label={p.nameEn} error={fe.name ? t.common.required : undefined}><input className={ctl} value={f.nameEn} onChange={set("nameEn")} maxLength={60} required dir="ltr" /></Lbl>
      <Lbl label={p.nameAr}><input className={ctl} value={f.nameAr} onChange={set("nameAr")} maxLength={60} required dir="rtl" /></Lbl>
      <Lbl label={p.tagEn}><input className={ctl} value={f.tagEn} onChange={set("tagEn")} maxLength={200} dir="ltr" /></Lbl>
      <Lbl label={p.tagAr}><input className={ctl} value={f.tagAr} onChange={set("tagAr")} maxLength={200} dir="rtl" /></Lbl>
      <Lbl label={p.featuresEn} hint={p.featuresHint}><textarea className={ctl} rows={6} value={f.featuresEn} onChange={set("featuresEn")} dir="ltr" /></Lbl>
      <Lbl label={p.featuresAr} hint={p.featuresHint}><textarea className={ctl} rows={6} value={f.featuresAr} onChange={set("featuresAr")} dir="rtl" /></Lbl>
      <Lbl label={p.maxGuests} error={fe.maxGuests ? t.common.invalid : undefined}><input className={ctl} type="number" min={1} value={f.maxGuests} onChange={set("maxGuests")} dir="ltr" /></Lbl>
      <Lbl label={p.eventsLimit} error={fe.events ? t.common.invalid : undefined}><input className={ctl} type="number" min={1} value={f.events} onChange={set("events")} dir="ltr" /></Lbl>
      <Lbl label={p.pricingStatus}><select className={ctl} value={f.pricingStatus} onChange={set("pricingStatus")}><option value="coming_soon">{p.st_coming_soon}</option><option value="published">{p.st_published}</option></select></Lbl>
      <div className="flex flex-wrap items-end gap-5 pb-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--color-olive)]" checked={f.isPublic} onChange={set("isPublic")} />{p.visible}</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--color-olive)]" checked={f.reminders} onChange={set("reminders")} />{p.reminders}</label>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className={btnPrimary} disabled={a.pending}>{a.pending ? t.common.saving : t.common.save}</button>
        <ErrorNotice text={errorText(t.common, a.error, a.fields)} /><OkNotice text={ok} />
      </div>
    </form>
  );
}

function PriceRows({ pkg, locale, t }: { pkg: PackageView; locale: Locale; t: T }) {
  const p = t.packages;
  const router = useRouter();
  const a = useAction();
  const [f, setF] = useState({ model: "flat", amount: "", min: "0", max: "", interval: "month", label: "" });
  const model = (m: string) => (p as unknown as Record<string, string>)[m] ?? m;
  async function toggle(id: string, active: boolean) { const r = await a.run(() => setPriceActiveAction(id, active)); if (r.ok) router.refresh(); }
  async function del(id: string) { const r = await a.run(() => deletePriceAction(id)); if (r.ok) router.refresh(); }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.run(() => addPriceAction(pkg.id, {
      model: f.model as "flat", amountSar: Number(f.amount), minGuests: f.model === "per_guest" ? Number(f.min) || 0 : 0,
      maxGuests: f.model === "per_guest" && f.max !== "" ? Number(f.max) : null, billingInterval: f.model === "subscription" ? (f.interval as "month") : null, label: f.label,
    }));
    if (r.ok) { setF({ ...f, amount: "", label: "" }); router.refresh(); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-medium">{p.prices}</h3>
      {pkg.prices.length === 0 ? <p className="text-sm text-ink-soft">{p.noPrices}</p> : (
        <TableWrap label={`${p.prices}: ${pkg.name[locale]}`}>
          <table className={tableCls}>
            <thead><tr><Th>{p.model}</Th><Th>{p.amount}</Th><Th>{p.range}</Th><Th>{p.label}</Th><Th>{t.common.status}</Th><Th><span className="sr-only">{t.common.actions}</span></Th></tr></thead>
            <tbody>
              {pkg.prices.map((x) => (
                <tr key={x.id}>
                  <Td>{model(x.model)}{x.model === "subscription" && x.billingInterval ? ` · ${x.billingInterval === "year" ? p.year : p.month}` : ""}</Td>
                  <Td mono><span dir="ltr">{formatMinor(x.amountMinor, locale)}</span></Td>
                  <Td mono><span dir="ltr">{x.model === "per_guest" ? `${x.minGuests} – ${x.maxGuests ?? p.unlimited}` : "—"}</span></Td>
                  <Td className="text-ink-soft">{x.label ?? "—"}</Td>
                  <Td><Badge tone={x.active ? "olive" : "neutral"}>{x.active ? t.common.active : t.common.inactive}</Badge></Td>
                  <Td><div className="flex justify-end gap-2"><button type="button" className={btnQuiet} disabled={a.pending} onClick={() => toggle(x.id, !x.active)}>{x.active ? p.deactivate : p.activate}</button><button type="button" className={btnDanger} disabled={a.pending} onClick={() => del(x.id)}>{t.common.delete}</button></div></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <form onSubmit={add} className="flex flex-wrap items-end gap-3 border border-dashed border-ink/20 p-3" aria-label={p.addPrice}>
        <Lbl label={p.model} className="w-44"><select className={ctl} value={f.model} onChange={set("model")}><option value="flat">{p.flat}</option><option value="per_guest">{p.per_guest}</option><option value="subscription">{p.subscription}</option></select></Lbl>
        <Lbl label={p.amount} className="w-28"><input className={ctl} type="number" min={0} step="0.01" value={f.amount} onChange={set("amount")} required dir="ltr" /></Lbl>
        {f.model === "per_guest" && <>
          <Lbl label={p.minGuests} className="w-28"><input className={ctl} type="number" min={0} value={f.min} onChange={set("min")} dir="ltr" /></Lbl>
          <Lbl label={p.maxGuestsTier} className="w-36"><input className={ctl} type="number" min={0} value={f.max} onChange={set("max")} dir="ltr" /></Lbl>
        </>}
        {f.model === "subscription" && <Lbl label={p.interval} className="w-32"><select className={ctl} value={f.interval} onChange={set("interval")}><option value="month">{p.month}</option><option value="year">{p.year}</option></select></Lbl>}
        <Lbl label={p.label} className="w-48"><input className={ctl} value={f.label} onChange={set("label")} maxLength={80} /></Lbl>
        <button type="submit" className={btnPrimary} disabled={a.pending}>{p.addPrice}</button>
      </form>
      <ErrorNotice text={errorText(t.common, a.error, a.fields)} />
    </div>
  );
}

function AddonsPanel({ addons, locale, t }: { addons: SimAddon[]; locale: Locale; t: T }) {
  const p = t.packages;
  const router = useRouter();
  const a = useAction();
  const blank = { slug: "", en: "", ar: "", pricing: "flat", price: "", active: true };
  const [f, setF] = useState(blank);
  const [ok, setOk] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    const r = await a.run(() => upsertAddonAction({ slug: f.slug, en: f.en, ar: f.ar, pricing: f.pricing as "flat", priceSar: Number(f.price), active: f.active }));
    if (r.ok) { setF(blank); setOk(t.common.saved); router.refresh(); }
  }
  return (
    <div className="grid gap-4">
      {addons.length > 0 && (
        <TableWrap label={p.addons}>
          <table className={tableCls}>
            <thead><tr><Th>{t.common.name}</Th><Th>{p.addonPricing}</Th><Th>{p.amount}</Th><Th>{t.common.status}</Th><Th><span className="sr-only">{t.common.actions}</span></Th></tr></thead>
            <tbody>
              {addons.map((x) => (
                <tr key={x.slug}>
                  <Td>{x.name[locale]}<span className="block text-xs text-taupe" dir="ltr" style={{ textAlign: "start" }}>{x.slug}</span></Td>
                  <Td>{x.pricing === "flat" ? p.flat : p.per_guest}</Td>
                  <Td mono><span dir="ltr">{formatMinor(x.priceMinor, locale)}</span></Td>
                  <Td><Badge tone={x.active ? "olive" : "neutral"}>{x.active ? t.common.active : t.common.inactive}</Badge></Td>
                  <Td className="text-end"><button type="button" className={btnQuiet} onClick={() => setF({ slug: x.slug, en: x.name.en, ar: x.name.ar, pricing: x.pricing, price: String(x.priceMinor / 100), active: x.active })}>{p.editAddon}</button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3 border border-dashed border-ink/20 p-3" aria-label={p.addAddon}>
        <Lbl label={p.addonSlug} className="w-40"><input className={ctl} value={f.slug} onChange={set("slug")} required maxLength={40} dir="ltr" /></Lbl>
        <Lbl label={p.nameEn} className="w-44"><input className={ctl} value={f.en} onChange={set("en")} required maxLength={80} dir="ltr" /></Lbl>
        <Lbl label={p.nameAr} className="w-44"><input className={ctl} value={f.ar} onChange={set("ar")} required maxLength={80} dir="rtl" /></Lbl>
        <Lbl label={p.addonPricing} className="w-36"><select className={ctl} value={f.pricing} onChange={set("pricing")}><option value="flat">{p.flat}</option><option value="per_guest">{p.per_guest}</option></select></Lbl>
        <Lbl label={p.amount} className="w-28"><input className={ctl} type="number" min={0} step="0.01" value={f.price} onChange={set("price")} required dir="ltr" /></Lbl>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="accent-[var(--color-olive)]" checked={f.active} onChange={set("active")} />{t.common.active}</label>
        <button type="submit" className={btnPrimary} disabled={a.pending}>{p.addAddon}</button>
      </form>
      <ErrorNotice text={errorText(t.common, a.error, a.fields)} /><OkNotice text={ok} />
    </div>
  );
}

function DiscountsPanel({ discounts, t, locale }: { discounts: DiscountRow[]; t: T; locale: Locale }) {
  const p = t.packages;
  const router = useRouter();
  const a = useAction();
  const [f, setF] = useState({ code: "", percent: "", expiresAt: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.run(() => addDiscountAction({ code: f.code, percent: Number(f.percent), expiresAt: f.expiresAt || undefined }));
    if (r.ok) { setF({ code: "", percent: "", expiresAt: "" }); router.refresh(); }
  }
  async function toggle(id: string, active: boolean) { const r = await a.run(() => setDiscountActiveAction(id, active)); if (r.ok) router.refresh(); }
  return (
    <div className="grid gap-4">
      {discounts.length === 0 ? <p className="text-sm text-ink-soft">{p.noDiscounts}</p> : (
        <TableWrap label={p.discounts}>
          <table className={tableCls}>
            <thead><tr><Th>{p.code}</Th><Th>{p.percent}</Th><Th>{p.expires}</Th><Th>{t.common.status}</Th><Th><span className="sr-only">{t.common.actions}</span></Th></tr></thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id}>
                  <Td><code dir="ltr">{d.code}</code></Td><Td mono><span dir="ltr">{d.percent}%</span></Td>
                  <Td>{d.expiresAt ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(d.expiresAt)) : "—"}</Td>
                  <Td><Badge tone={d.active ? "olive" : "neutral"}>{d.active ? t.common.active : t.common.inactive}</Badge></Td>
                  <Td className="text-end"><button type="button" className={btnQuiet} disabled={a.pending} onClick={() => toggle(d.id, !d.active)}>{d.active ? p.deactivate : p.activate}</button></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <form onSubmit={add} className="flex flex-wrap items-end gap-3 border border-dashed border-ink/20 p-3" aria-label={p.addDiscount}>
        <Lbl label={p.code} className="w-40" error={a.fields.code ? t.common.invalid : undefined}><input className={ctl} value={f.code} onChange={set("code")} required maxLength={24} dir="ltr" /></Lbl>
        <Lbl label={p.percent} className="w-28" error={a.fields.percent ? t.common.invalid : undefined}><input className={ctl} type="number" min={1} max={100} step="0.01" value={f.percent} onChange={set("percent")} required dir="ltr" /></Lbl>
        <Lbl label={p.expires} className="w-44"><input className={ctl} type="date" value={f.expiresAt} onChange={set("expiresAt")} dir="ltr" /></Lbl>
        <button type="submit" className={btnPrimary} disabled={a.pending}>{p.addDiscount}</button>
      </form>
      <ErrorNotice text={errorText(t.common, a.error, a.fields)} />
    </div>
  );
}

function TaxPanel({ taxRate, t }: { taxRate: number; t: T }) {
  const p = t.packages;
  const router = useRouter();
  const a = useAction();
  const [v, setV] = useState(String(Math.round(taxRate * 10000) / 100));
  const [ok, setOk] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    const r = await a.run(() => setTaxAction(Number(v)));
    if (r.ok) { setOk(t.common.saved); router.refresh(); }
  }
  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <Lbl label={p.tax} hint={p.taxHint} className="w-40"><input className={ctl} type="number" min={0} max={50} step="0.01" value={v} onChange={(e) => setV(e.target.value)} dir="ltr" /></Lbl>
      <button type="submit" className={btnPrimary} disabled={a.pending}>{p.saveTax}</button>
      <ErrorNotice text={errorText(t.common, a.error, a.fields)} /><OkNotice text={ok} />
    </form>
  );
}
