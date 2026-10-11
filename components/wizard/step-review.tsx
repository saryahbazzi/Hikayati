"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { confirmEventAction, packagesAction } from "@/app/actions/events";
import { addonsAction, wizardCountsAction, wizardQuoteAction } from "@/app/actions/wizard";
import { Button } from "@/components/ui/button";
import { Checkbox, TextInput } from "@/components/ui/form";
import { Badge, DemoTag, Notice } from "@/components/ui/misc";
import { formatDate, formatTime, zonedToUtc } from "@/lib/domain/time";
import { formatMinor, type Quote } from "@/lib/domain/pricing";
import { occasionLabel } from "@/lib/domain/occasions";
import type { PackageView } from "@/lib/server/catalog";
import type { TemplateView } from "@/lib/server/templates";
import { InvitationPreview } from "./invitation-preview";
import { StepHeading, errText, type StepProps } from "./types";

type Addon = { slug: string; name: { en: string; ar: string } };

const stepOfField = (k: string): number => {
  if (["occasion", "occasionCustom", "estimatedGuests"].includes(k)) return 1;
  if (k === "language") return 3;
  if (k === "templateSlug") return 4;
  if (["packageSlug", "consent"].includes(k)) return 6;
  return 2;
};

function Block({ title, step, onEdit, editLabel, children }: { title: string; step: number; onEdit: (s: number) => void; editLabel: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="eyebrow">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-sm text-olive underline decoration-champagne underline-offset-4" data-testid={`edit-step-${step}`}>{editLabel}</button>
      </div>
      {children}
    </section>
  );
}

/** Step 6: summary, package, demo estimate, consent and the demo confirmation. */
export function StepReview({ draft, set, errors, t, locale, templates, eventId, goto, flush, validate }: StepProps & {
  templates: TemplateView[]; eventId: string | null; goto: (s: number) => void; flush: () => Promise<boolean>; validate: () => boolean;
}) {
  const s = t.s6;
  const router = useRouter();
  const [records, setRecords] = useState<number | null>(null);
  const [packages, setPackages] = useState<PackageView[] | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<{ quote: Quote; guests: number; discountApplied: boolean } | null>(null);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<Record<string, string> | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  const guests = Math.max(records ?? 0, draft.estimatedGuests ?? 0, 1);
  const tpl = templates.find((x) => x.slug === draft.design.templateSlug);
  const tz = draft.timezone;
  const starts = draft.date && draft.startTime ? zonedToUtc(draft.date, draft.startTime, tz) : null;

  useEffect(() => {
    if (!eventId) return;
    let live = true;
    void wizardCountsAction(eventId).then((r) => { if (live && r.ok) setRecords(r.data.guestRecords); });
    void addonsAction().then((r) => { if (live && r.ok) setAddons(r.data); });
    return () => { live = false; };
  }, [eventId]);

  useEffect(() => {
    let live = true;
    void packagesAction(guests).then((r) => {
      if (!live || !r.ok) return;
      setPackages(r.data.packages);
      setRecommended(r.data.recommended);
      if (!draft.packageSlug && r.data.recommended) set({ packageSlug: r.data.recommended });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests]);

  const pickedKey = picked.join(",");
  useEffect(() => {
    if (!eventId || !draft.packageSlug || records === null) return;
    let live = true;
    setQuoteFailed(false);
    void wizardQuoteAction(eventId, draft.packageSlug, picked, code).then((r) => {
      if (!live) return;
      if (r.ok) setQuote(r.data); else { setQuote(null); setQuoteFailed(true); }
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, draft.packageSlug, pickedKey, code, records, draft.estimatedGuests]);

  const lineLabel = (key: string) => {
    if (key === "base") return s.base;
    if (key === "guests") return s.perGuest;
    const a = addons.find((x) => `addon:${x.slug}` === key);
    return a ? a.name[locale] : s.addonLine;
  };
  const money = (n: number) => formatMinor(n, locale);

  const confirm = async () => {
    setFatal(null);
    setProblems(null);
    if (!validate() || !eventId) return;
    setBusy(true);
    try {
      if (!(await flush())) { setFatal(t.errors.unknown); return; }
      const r = await confirmEventAction(eventId, { ...draft, consent: true }, picked, code || undefined);
      if (r.ok) { router.push(`/${locale}/my-events/${r.data.id}/test`); return; }
      if (r.error === "validation" && r.fields) setProblems(r.fields);
      else setFatal(r.error === "forbidden" ? t.errors.forbidden : r.error === "not_found" ? t.errors.notFound : t.errors.unknown);
    } catch {
      setFatal(t.errors.unknown);
    } finally {
      setBusy(false);
    }
  };

  const when = starts ? `${formatDate(starts, locale, tz, { weekday: true })} · ${formatTime(starts, locale, tz)}` : "—";
  const host = [draft.hostFirstName, draft.hostLastName].filter(Boolean).join(" ");
  const langLabel = draft.language === "ar" ? t.s3.ar : draft.language === "en" ? t.s3.en : t.s3.both;
  const names = s.fieldNames as Record<string, string>;
  const fe = errText(t, errors.consent);

  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <DemoTag>{s.demoBanner}</DemoTag>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0">
          <Block title={s.occasion} step={1} onEdit={goto} editLabel={s.edit}>
            <p className="font-display text-2xl">{occasionLabel(draft.occasion, locale, draft.occasionCustom)}</p>
          </Block>
          <Block title={s.details} step={2} onEdit={goto} editLabel={s.edit}>
            <p className="font-display text-2xl">{draft.title || "—"}</p>
            <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-soft">{s.when}</dt><dd>{when}</dd></div>
              <div><dt className="text-ink-soft">{s.where}</dt><dd>{[draft.venueName, draft.city].filter(Boolean).join(locale === "ar" ? "، " : ", ") || "—"}</dd></div>
              <div><dt className="text-ink-soft">{s.host}</dt><dd>{host || "—"}</dd></div>
              <div><dt className="text-ink-soft">{s.replyBy}</dt><dd>{draft.rsvpDeadline ? formatDate(zonedToUtc(draft.rsvpDeadline, "12:00", tz), locale, tz) : "—"}</dd></div>
            </dl>
          </Block>
          <Block title={s.language} step={3} onEdit={goto} editLabel={s.edit}><p>{langLabel}</p></Block>
          <Block title={s.design} step={4} onEdit={goto} editLabel={s.edit}>
            {tpl ? (
              <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start lg:block">
                <p className="font-display text-xl">{tpl.name[locale]}</p>
                <div className="mt-4 lg:hidden"><InvitationPreview draft={draft} template={tpl} t={t} toggle={false} /></div>
              </div>
            ) : <p className="text-ink-soft">{s.noTemplate}</p>}
          </Block>
          <Block title={s.guests} step={5} onEdit={goto} editLabel={s.edit}>
            <dl className="flex gap-10">
              <div><dt className="text-sm text-ink-soft">{s.estimatedGuests}</dt><dd className="font-display text-3xl">{draft.estimatedGuests ?? "—"}</dd></div>
              <div><dt className="text-sm text-ink-soft">{s.recordsAdded}</dt><dd className="font-display text-3xl" data-testid="review-records">{records ?? "…"}</dd></div>
            </dl>
            {records === 0 && <p className="mt-3 text-sm text-ink-soft">{s.noGuestsYet}</p>}
          </Block>

          <section className="border-t border-line py-8" aria-labelledby="wz-pkg" data-field="packageSlug">
            <h3 id="wz-pkg" className="display-3 !text-[1.5rem]">{s.package}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.packageSub.replace("{n}", String(guests))}</p>
            {errors.packageSlug && <p role="alert" className="mt-3 text-sm text-[#8a3b32]">{t.errors.package}</p>}
            <fieldset className="mt-6">
              <legend className="sr-only">{s.package}</legend>
              <div className="grid gap-4 md:grid-cols-2">
                {(packages ?? []).map((p) => {
                  const on = draft.packageSlug === p.slug;
                  const max = p.limits.maxGuests;
                  return (
                    <label key={p.id} className={`relative block cursor-pointer border px-5 py-5 transition-colors ${on ? "border-olive bg-paper shadow-[inset_0_0_0_1px_var(--color-olive)]" : "border-ink/20 hover:border-olive/60"}`}>
                      <input type="radio" name="wz-package" value={p.slug} checked={on} onChange={() => set({ packageSlug: p.slug })} className="peer sr-only" />
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-display text-2xl">{p.name[locale]}</span>
                        {recommended === p.slug && <Badge tone="olive">{s.recommended}</Badge>}
                      </span>
                      <span className="mt-1 block text-sm text-ink-soft">{p.tagline[locale]}</span>
                      {typeof max === "number" && <span className="mt-3 block text-xs text-olive">{s.upTo.replace("{n}", String(max))}</span>}
                      <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                        {p.features.map((f, i) => <li key={i} className="flex gap-2"><span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-champagne" />{f[locale]}</li>)}
                      </ul>
                      <span className="mt-5 block border-t border-line pt-3 text-sm">{s.pricingSoon}</span>
                      <span aria-hidden className="pointer-events-none absolute inset-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive" />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          {addons.length > 0 && (
            <section className="border-t border-line py-8" aria-labelledby="wz-addons">
              <h3 id="wz-addons" className="eyebrow mb-4">{s.addons}</h3>
              <div className="space-y-3">
                {addons.map((a) => {
                  const soon = /motion|video/.test(a.slug);
                  return (
                    <div key={a.slug} className={soon ? "opacity-60" : ""}>
                      <Checkbox label={<>{a.name[locale]}{soon && <> <Badge tone="champagne">{s.addonsSoon}</Badge></>}</>} checked={picked.includes(a.slug)}
                        onChange={(v) => !soon && setPicked((c) => (v ? [...c, a.slug] : c.filter((x) => x !== a.slug)))} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="border-t border-line py-8" aria-labelledby="wz-discount">
            <h3 id="wz-discount" className="sr-only">{s.discount}</h3>
            <div className="flex max-w-md items-end gap-3">
              <TextInput wrapperClassName="flex-1" label={s.discount} value={codeInput} maxLength={40} autoCapitalize="characters" onChange={(e) => setCodeInput(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={() => setCode(codeInput.trim())} className="mb-0.5">{s.apply}</Button>
            </div>
            {code && quote && <p className={`mt-2 text-sm ${quote.discountApplied ? "text-olive" : "text-[#8a3b32]"}`} role="status">{quote.discountApplied ? s.discountOk : s.discountBad}</p>}
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <div className="lg:sticky lg:top-6 space-y-8">
            {tpl && <div className="hidden lg:block"><InvitationPreview draft={draft} template={tpl} t={t} toggle={false} /></div>}

            <div className="border border-champagne bg-champagne/10 p-6" data-testid="estimate">
              <div className="flex items-center justify-between gap-3"><h3 className="font-display text-2xl">{s.estimate}</h3><DemoTag>{t.s6.demoBanner.split(" — ")[0]}</DemoTag></div>
              <p className="mt-1 text-xs leading-5 text-[#6b5a2c]">{s.estimateNote}</p>
              {quoteFailed && <p className="mt-4 text-sm text-[#8a3b32]">{s.quoteFailed}</p>}
              {!quote && !quoteFailed && <p className="mt-4 text-sm text-ink-soft">{draft.packageSlug ? s.calculating : t.errors.package}</p>}
              {quote && (
                <>
                  <p className="mt-3 text-xs text-ink-soft">{s.basedOn.replace("{n}", String(quote.guests))}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    {quote.quote.lines.map((l, i) => <div key={i} className="flex justify-between gap-4"><dt className="text-ink-soft">{lineLabel(l.key)}</dt><dd className="tabular-nums">{money(l.amountMinor)}</dd></div>)}
                    <div className="flex justify-between gap-4 border-t border-line pt-2"><dt className="text-ink-soft">{s.subtotal}</dt><dd className="tabular-nums">{money(quote.quote.subtotalMinor)}</dd></div>
                    {quote.quote.discountMinor > 0 && <div className="flex justify-between gap-4"><dt className="text-ink-soft">{s.discountLine}</dt><dd className="tabular-nums">−{money(quote.quote.discountMinor)}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-ink-soft">{s.vat} ({Math.round(quote.quote.taxRate * 100)}%)</dt><dd className="tabular-nums">{money(quote.quote.taxMinor)}</dd></div>
                    <div className="flex justify-between gap-4 border-t border-ink/30 pt-3 text-base"><dt>{s.total}</dt><dd className="font-display text-2xl tabular-nums" data-testid="estimate-total">{money(quote.quote.totalMinor)}</dd></div>
                  </dl>
                </>
              )}
            </div>

            <div data-field="consent" className="space-y-5">
              <Checkbox label={s.consent} hint={s.consentHint} checked={draft.consent} onChange={(v) => set({ consent: v })} error={fe} name="consent" />
              {problems && (
                <Notice tone="error">
                  <p className="mb-2">{s.problems}</p>
                  <ul className="space-y-1">
                    {Object.entries(problems).map(([k, code2]) => (
                      <li key={k}>
                        {names[k] ?? k}: {errText(t, code2)}{" "}
                        <button type="button" className="underline underline-offset-4" onClick={() => goto(stepOfField(k))}>{s.goTo} {stepOfField(k)}</button>
                      </li>
                    ))}
                  </ul>
                </Notice>
              )}
              {fatal && <Notice tone="error">{fatal}</Notice>}
              <Button onClick={confirm} disabled={busy || !eventId} className="w-full" data-testid="confirm-demo">{busy ? s.confirming : s.confirm}</Button>
              <p className="text-center text-xs text-ink-soft">{s.demoBanner}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
