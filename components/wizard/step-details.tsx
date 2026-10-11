"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Checkbox, SelectInput, TextArea, TextInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/misc";
import { DEFAULT_VISIBILITY, MEAL_TYPES, VISIBILITY_KEYS, occasionByKey, type VisibilityKey } from "@/lib/domain/occasions";
import { suggestTitle, todayIso, type EventDraft } from "@/lib/domain/wizard";
import { COUNTRIES } from "@/lib/phone";
import { StepHeading, errText, type StepProps } from "./types";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h3 className="eyebrow mb-6">{title}</h3>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const WEDDING_ONLY: VisibilityKey[] = ["family", "zaffa", "hijri"];

/** Step 2: details. The fields shown depend on the occasion's fieldSet — wedding fields never appear for other events. */
export function StepDetails({ draft, set, errors, t, locale }: StepProps) {
  const s = t.s2;
  const set_ = occasionByKey(draft.occasion)?.fieldSet ?? "general";
  const text = (k: keyof EventDraft, label: string, extra: { hint?: string; required?: boolean; type?: string; max?: number; min?: string; wide?: boolean } = {}) => (
    <div data-field={k} className={extra.wide ? "sm:col-span-2" : ""}>
      <TextInput label={label} hint={extra.hint} required={extra.required} type={extra.type} min={extra.min} maxLength={extra.max} value={draft[k] as string} onChange={(e) => set({ [k]: e.target.value } as Partial<EventDraft>)} error={errText(t, errors[k as string])} />
    </div>
  );
  const detail = (k: string, label: string, extra: { hint?: string; required?: boolean; max?: number; wide?: boolean } = {}) => (
    <div data-field={k} className={extra.wide ? "sm:col-span-2" : ""}>
      <TextInput label={label} hint={extra.hint} required={extra.required} maxLength={extra.max ?? 100} value={draft.details[k] ?? ""} onChange={(e) => set({ details: { ...draft.details, [k]: e.target.value } })} error={errText(t, errors[k])} />
    </div>
  );
  const area = (k: string, label: string, hint?: string) => (
    <div className="sm:col-span-2">
      <TextArea label={label} hint={hint} rows={3} maxLength={600} value={draft.details[k] ?? ""} onChange={(e) => set({ details: { ...draft.details, [k]: e.target.value } })} />
    </div>
  );

  // Prefill the title from the couple / celebrant until the host writes their own.
  const lastSuggested = useRef<string | null>(null);
  const suggestion = suggestTitle(draft, locale);
  useEffect(() => {
    if (lastSuggested.current === null) { lastSuggested.current = suggestion; return; }
    if (suggestion && suggestion !== draft.title && (draft.title === "" || draft.title === lastSuggested.current)) set({ title: suggestion });
    lastSuggested.current = suggestion;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion]);
  useEffect(() => {
    if (!draft.title && suggestion) set({ title: suggestion });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visKeys = VISIBILITY_KEYS.filter((k) => set_ === "wedding" || !WEDDING_ONLY.includes(k));
  const today = todayIso(draft.timezone);

  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <div className="space-y-10">
        {set_ === "wedding" && (
          <Group title={s.groups.couple}>
            {detail("groomName", s.groom, { required: true })}
            {detail("brideName", s.bride, { required: true })}
          </Group>
        )}
        {set_ === "birthday" && (
          <Group title={s.groups.birthday}>
            {detail("celebrantName", s.celebrant, { required: true })}
            <div data-field="age"><TextInput label={s.age} inputMode="numeric" maxLength={3} value={draft.details.age ?? ""} onChange={(e) => set({ details: { ...draft.details, age: e.target.value } })} error={errText(t, errors.age)} /></div>
            <SelectInput label={s.meal} value={draft.details.mealType ?? ""} onChange={(e) => set({ details: { ...draft.details, mealType: e.target.value } })}>
              <option value="">{s.mealNone}</option>
              {MEAL_TYPES.map((m) => <option key={m} value={m}>{s.meals[m]}</option>)}
            </SelectInput>
            {detail("theme", s.theme)}
          </Group>
        )}

        <Group title={s.groups.occasion}>
          {text("title", s.title, { required: true, hint: s.titleHint, max: 120, wide: true })}
        </Group>

        <Group title={s.groups.hosts}>
          {text("hostFirstName", s.hostFirst, { required: true, max: 60 })}
          {text("hostLastName", s.hostLast, { max: 60 })}
          {text("cohostName", s.cohost, { max: 80, wide: true })}
        </Group>

        {set_ === "wedding" && (
          <Group title={s.groups.families}>
            {detail("groomFamily", s.groomFamily)}
            {detail("brideFamily", s.brideFamily)}
            {detail("groomFather", s.groomFather)}
            {detail("brideFather", s.brideFather)}
            {detail("groomMother", s.groomMother)}
            {detail("brideMother", s.brideMother)}
          </Group>
        )}

        <Group title={s.groups.when}>
          {text("date", s.date, { required: true, type: "date", min: today })}
          {text("rsvpDeadline", s.rsvp, { required: true, type: "date", hint: s.rsvpHint, min: today })}
          {text("startTime", s.start, { required: true, type: "time" })}
          {text("endTime", s.end, { type: "time" })}
          {set_ === "wedding" && detail("zaffaTime", s.zaffa, { hint: s.zaffaHint })}
        </Group>

        <Group title={s.groups.where}>
          {text("venueName", s.venue, { required: true, max: 120, wide: true })}
          {text("venueAddress", s.address, { required: true, max: 240, wide: true })}
          {text("city", s.city, { required: true, max: 60 })}
          <SelectInput label={s.country} value={draft.country} onChange={(e) => set({ country: e.target.value })}>
            {COUNTRIES.map((c) => <option key={c.iso} value={c.iso}>{c[locale]}</option>)}
          </SelectInput>
          {text("mapUrl", s.mapUrl, { hint: s.mapHint, type: "url", max: 400, wide: true })}
        </Group>

        <Group title={s.groups.guestInfo}>
          {text("dressCode", s.dress, { max: 120, wide: true })}
          <div className="sm:col-span-2" data-field="instructions">
            <TextArea label={s.instructions} hint={s.instructionsHint} rows={3} maxLength={600} value={draft.instructions} onChange={(e) => set({ instructions: e.target.value })} />
          </div>
          {set_ === "wedding" && (
            <>
              <div className="sm:col-span-2"><Notice tone="info">{s.sepNote}</Notice></div>
              {area("womenDetails", s.women)}
              {area("menDetails", s.men)}
              {detail("customWording", s.wording, { hint: s.wordingHint, max: 600, wide: true })}
            </>
          )}
          <div className="sm:col-span-2">
            <Checkbox label={s.allowChange} checked={draft.allowRsvpChange} onChange={(v) => set({ allowRsvpChange: v })} />
          </div>
        </Group>

        <Group title={s.groups.appears}>
          <p className="text-sm leading-7 text-ink-soft sm:col-span-2">{s.appearsHint}</p>
          {visKeys.map((k) => (
            <Checkbox key={k} label={s.vis[k]} checked={draft.visibility[k] ?? DEFAULT_VISIBILITY[k]} onChange={(v) => set({ visibility: { ...draft.visibility, [k]: v } })} />
          ))}
        </Group>

        <Group title={s.groups.private}>
          <div className="sm:col-span-2">
            <TextArea label={s.notes} hint={s.notesHint} rows={3} maxLength={800} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </Group>
      </div>
    </div>
  );
}
