"use client";

import { StepHeading, type StepProps } from "./types";

type Lang = "ar" | "en" | "both";

/** Step 3: invitation language with a tiny live example of each. */
export function StepLanguage({ draft, set, t }: StepProps) {
  const s = t.s3;
  const opts: { v: Lang; label: string; sub: string }[] = [
    { v: "ar", label: s.ar, sub: s.arSub }, { v: "en", label: s.en, sub: s.enSub }, { v: "both", label: s.both, sub: s.bothSub },
  ];
  const ar = <p lang="ar" dir="rtl" className="font-display text-xl leading-9 text-ink">{s.exAr}</p>;
  const en = <p lang="en" dir="ltr" className="font-display text-xl leading-9 text-ink">{s.exEn}</p>;
  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <fieldset>
        <legend className="sr-only">{s.legend}</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {opts.map((o) => {
            const on = draft.language === o.v;
            return (
              <label key={o.v} className={`relative flex cursor-pointer flex-col border px-6 py-6 transition-colors ${on ? "border-olive bg-paper shadow-[inset_0_0_0_1px_var(--color-olive)]" : "border-ink/20 hover:border-olive/60"}`}>
                <input type="radio" name="wz-language" value={o.v} checked={on} onChange={() => set({ language: o.v })} className="peer sr-only" />
                <span className="block text-lg text-ink">{o.label}</span>
                <span className="mt-1 block text-xs text-ink-soft">{o.sub}</span>
                <span className="hairline my-5 block" aria-hidden />
                <span className="eyebrow !text-[0.66rem] mb-2 block">{s.example}</span>
                <span className="block space-y-1">
                  {o.v !== "en" && ar}
                  {o.v !== "ar" && en}
                </span>
                <span aria-hidden className="pointer-events-none absolute inset-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive" />
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
