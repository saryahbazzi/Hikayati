"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDraftAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { validateStep, type EventDraft } from "@/lib/domain/wizard";
import { dirOf, type Locale } from "@/lib/i18n";
import { wizardCopy } from "@/lib/i18n/wizard";
import type { TemplateView } from "@/lib/server/templates";
import { StepDesign } from "./step-design";
import { StepDetails } from "./step-details";
import { StepGuests } from "./step-guests";
import { StepLanguage } from "./step-language";
import { StepOccasion } from "./step-occasion";
import { StepReview } from "./step-review";

const LAST = 6;
type SaveState = "idle" | "saving" | "saved" | "failed";

/** "Begin Your Story": six calm steps over one EventDraft, autosaved to the database as it changes. */
export function Wizard({ locale, initial, templates }: { locale: Locale; initial: { eventId: string | null; step: number; draft: EventDraft }; templates: TemplateView[] }) {
  const t = wizardCopy(locale);
  const rtl = dirOf(locale) === "rtl";
  const [draft, setDraft] = useState<EventDraft>(initial.draft);
  const [step, setStep] = useState(Math.min(Math.max(initial.step, 1), LAST));
  const [eventId, setEventId] = useState<string | null>(initial.eventId);
  const [save, setSave] = useState<SaveState>("idle");
  const [attempted, setAttempted] = useState(false);
  const [tick, setTick] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [toReview, setToReview] = useState(false);
  const [navBusy, setNavBusy] = useState(false);

  const draftRef = useRef(draft);
  const idRef = useRef(initial.eventId);
  const stepRef = useRef(step);
  const lastJson = useRef(JSON.stringify(initial.draft));
  const lastStep = useRef(initial.eventId ? step : 0);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const navRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);

  const set = useCallback((patch: Partial<EventDraft>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
  }, []);

  /** Serialised save: the first call creates the draft, later ones update it, never two at once. */
  const flush = useCallback((stepArg?: number, force = false): Promise<boolean> => {
    const run = async (): Promise<boolean> => {
      const d = draftRef.current;
      const st = stepArg ?? stepRef.current;
      const json = JSON.stringify(d);
      if (!idRef.current && !force && json === lastJson.current) return true;
      if (idRef.current && json === lastJson.current && st === lastStep.current) return true;
      setSave("saving");
      try {
        const r = await saveDraftAction(idRef.current, d, st);
        if (!r.ok) { setSave("failed"); return false; }
        if (!idRef.current) {
          idRef.current = r.data.id;
          setEventId(r.data.id);
          window.history.replaceState(null, "", `/${locale}/begin?event=${r.data.id}`);
        }
        lastJson.current = json;
        lastStep.current = st;
        setSave(JSON.stringify(draftRef.current) === json ? "saved" : "saving");
        return true;
      } catch {
        setSave("failed");
        return false;
      }
    };
    const p = chain.current.then(run, run);
    chain.current = p.catch(() => undefined);
    return p;
  }, [locale]);

  // Debounced autosave while typing.
  useEffect(() => {
    if (JSON.stringify(draft) === lastJson.current) return;
    const h = setTimeout(() => { void flush(); }, 1200);
    return () => clearTimeout(h);
  }, [draft, flush]);

  // Retry quietly after a failure.
  useEffect(() => {
    if (save !== "failed") return;
    const h = setTimeout(() => { void flush(undefined, !!idRef.current || JSON.stringify(draftRef.current) !== lastJson.current); }, 4000);
    return () => clearTimeout(h);
  }, [save, flush]);

  // Save when the tab is hidden.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") void flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  // After a step change: move focus to the heading and bring the wizard into view.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    navRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    document.getElementById("wz-heading")?.focus({ preventScroll: true });
  }, [step]);

  // After a failed Continue: focus the first invalid control.
  useEffect(() => {
    if (!tick) return;
    const el = document.querySelector<HTMLElement>('[data-wizard-step] [aria-invalid="true"]') ?? document.querySelector<HTMLElement>('[data-wizard-step] [role="alert"]');
    if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); if (el.matches("input,select,textarea")) el.focus({ preventScroll: true }); }
  }, [tick]);

  const errors = attempted ? validateStep(step, draft) : {};

  const move = useCallback((to: number, force = false) => {
    setDir(to > stepRef.current ? 1 : -1);
    stepRef.current = to;
    setStep(to);
    setAttempted(false);
    void flush(to, force);
  }, [flush]);

  const validate = useCallback(() => {
    const e = validateStep(stepRef.current, draftRef.current);
    if (Object.keys(e).length) { setAttempted(true); setTick((n) => n + 1); return false; }
    return true;
  }, []);

  const onNext = async () => {
    if (!validate()) return;
    const to = toReview && step < LAST ? LAST : step + 1;
    if (to === LAST) setToReview(false);
    setNavBusy(true);
    if (to === 5 || to === LAST) await flush(to, true);
    setNavBusy(false);
    move(to, true);
  };
  const onBack = () => { setToReview(false); move(step - 1); };
  const gotoFromReview = (s: number) => { setToReview(true); move(s); };

  const common = { draft, set, errors, t, locale };
  const label = t.save[save === "idle" ? "idle" : save];

  return (
    <div>
      <style>{`
        @keyframes wz-in { from { opacity: 0; transform: translateX(var(--wz-dx, 0)); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: no-preference) { .wz-step { animation: wz-in 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both; } }
      `}</style>

      <header className="mb-10">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="display-2 mt-4 text-balance">{t.title}</h1>
        <p className="lead mt-4 max-w-2xl">{t.intro}</p>
      </header>

      <nav ref={navRef} aria-label={t.progress} className="mb-12 scroll-mt-4">
        <div className="mb-3 flex items-center justify-between gap-4 text-sm text-ink-soft">
          <p>
            <span className="text-ink">{t.stepOf} {step} {t.of} {LAST}</span>
            <span aria-hidden> · </span>
            <span>{t.steps[step - 1]}</span>
          </p>
          <p role="status" aria-live="polite" data-testid="save-state" data-state={save} className={`flex items-center gap-2 text-xs ${save === "failed" ? "text-[#8a3b32]" : ""}`}>
            <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${save === "saved" ? "bg-sage" : save === "saving" ? "animate-pulse bg-champagne" : save === "failed" ? "bg-[#8a3b32]" : "bg-ink/20"}`} />
            {label}
          </p>
        </div>
        <ol className="flex gap-1.5">
          {t.steps.map((name, i) => {
            const n = i + 1;
            const done = n < step;
            return (
              <li key={n} className="flex-1" aria-current={n === step ? "step" : undefined}>
                {done ? (
                  <button type="button" onClick={() => { setToReview(false); move(n); }} aria-label={`${t.back}: ${name}`} className="group block w-full py-2">
                    <span className="block h-px bg-olive transition-all group-hover:h-[3px]" />
                  </button>
                ) : (
                  <span className="block py-2"><span className={`block h-px ${n === step ? "h-[3px] bg-champagne" : "bg-ink/15"}`} /></span>
                )}
                <span className={`mt-1 hidden text-[0.7rem] sm:block ${n === step ? "text-ink" : "text-taupe"}`}>{name}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div key={step} data-wizard-step={step} className="wz-step" style={{ ["--wz-dx" as string]: `${dir * (rtl ? -1 : 1) * 18}px` }}>
        {step === 1 && <StepOccasion {...common} />}
        {step === 2 && <StepDetails {...common} />}
        {step === 3 && <StepLanguage {...common} />}
        {step === 4 && <StepDesign {...common} templates={templates} />}
        {step === 5 && <StepGuests {...common} eventId={eventId} onRecords={() => {}} onRetry={() => { void flush(undefined, true); }} />}
        {step === 6 && <StepReview {...common} templates={templates} eventId={eventId} goto={gotoFromReview} flush={() => flush(undefined, true)} validate={validate} />}
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 mt-14 border-t border-line bg-ivory/95 px-6 py-4 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          {step > 1 ? <Button variant="secondary" onClick={onBack} data-testid="wizard-back">{t.back}</Button> : <span />}
          {step < LAST && (
            <div className="flex items-center gap-4">
              {attempted && Object.keys(errors).length > 0 && <p role="alert" className="hidden text-sm text-[#8a3b32] sm:block">{t.fixErrors}</p>}
              <Button onClick={onNext} disabled={navBusy} data-testid="wizard-next">{toReview ? t.backToReview : t.next}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
