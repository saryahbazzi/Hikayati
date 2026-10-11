"use client";

import { RadioCards, TextInput } from "@/components/ui/form";
import { OCCASIONS } from "@/lib/domain/occasions";
import { StepHeading, errText, type StepProps } from "./types";

/** Step 1: what are we celebrating, and roughly how many guests. */
export function StepOccasion({ draft, set, errors, t, locale }: StepProps) {
  const s = t.s1;
  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <div data-field="occasion">
        <RadioCards
          legend={s.heading}
          columns={4}
          value={draft.occasion}
          onChange={(v) => set({ occasion: v })}
          options={OCCASIONS.map((o) => ({ value: o.key, label: o[locale] }))}
          error={errText(t, errors.occasion)}
        />
      </div>

      {draft.occasion === "other" && (
        <div className="mt-6 max-w-md" data-field="occasionCustom">
          <TextInput label={s.custom} hint={s.customHint} required maxLength={60} value={draft.occasionCustom} onChange={(e) => set({ occasionCustom: e.target.value })} error={errText(t, errors.occasionCustom)} />
        </div>
      )}

      <div className="hairline my-14" aria-hidden />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div data-field="estimatedGuests">
          <h3 className="display-3 !text-[1.5rem] text-balance">{s.guestsHeading}</h3>
          <div className="mt-6">
            <TextInput
              label={s.guests}
              hint={s.guestsHint}
              required
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              step={1}
              value={draft.estimatedGuests ?? ""}
              onChange={(e) => set({ estimatedGuests: e.target.value === "" ? null : Number(e.target.value) })}
              error={errText(t, errors.estimatedGuests)}
            />
          </div>
        </div>

        <aside aria-labelledby="wz-explain">
          <p id="wz-explain" className="eyebrow">{s.explainTitle}</p>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            {s.explain.map((x, i) => (
              <div key={i} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-display text-lg text-ink">{x.term}</dt>
                <dd className="text-sm leading-7 text-ink-soft">{x.body}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
