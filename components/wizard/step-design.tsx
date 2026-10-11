"use client";

import { useMemo, useState } from "react";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { TextArea, TextInput } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { ALIGNS, FONT_PAIRS, PALETTES } from "@/lib/domain/design";
import { buildContent } from "@/lib/domain/invitation-content";
import { occasionByKey } from "@/lib/domain/occasions";
import type { TemplateView } from "@/lib/server/templates";
import { draftToSource } from "./draft-source";
import { InvitationPreview } from "./invitation-preview";
import { StepHeading, errText, type StepProps } from "./types";

type Lang = "ar" | "en" | "both";

/** Step 4: template gallery, customisation controls and live preview. */
export function StepDesign({ draft, set, errors, t, locale, templates }: StepProps & { templates: TemplateView[] }) {
  const s = t.s4;
  const group = occasionByKey(draft.occasion)?.group ?? "general";
  const [showAll, setShowAll] = useState(false);
  const matching = useMemo(() => templates.filter((x) => x.groups.includes(group)), [templates, group]);
  const list = showAll || matching.length === 0 ? templates : matching;
  const selected = templates.find((x) => x.slug === draft.design.templateSlug);
  const content = useMemo(() => buildContent(draftToSource({ ...draft, design: { ...draft.design, fields: {} } })), [draft]);
  const previewLang: "ar" | "en" = draft.language === "en" ? "en" : "ar";
  const setDesign = (patch: Partial<typeof draft.design>) => set({ design: { ...draft.design, ...patch } });
  const setField = (k: string, v: string) => setDesign({ fields: { ...draft.design.fields, [k]: v } });
  const hasSoon = list.some((x) => x.status === "coming_soon");

  const pick = (tpl: TemplateView) => {
    if (tpl.status !== "published") return;
    setDesign({ templateSlug: tpl.slug, palette: tpl.palette, fontPair: tpl.fontPair });
  };

  const placeholder = (k: string): string => {
    switch (k) {
      case "blessing": return content.blessing[previewLang];
      case "intro": return content.intro[previewLang];
      case "closing": return content.closing[previewLang];
      case "names": return content.names.join("\n");
      default: return "";
    }
  };
  const langs: { v: Lang; label: string }[] = [{ v: "ar", label: t.s3.ar }, { v: "en", label: t.s3.en }, { v: "both", label: t.s3.both }];
  const alignLabel = { start: s.alignStart, center: s.alignCenter, end: s.alignEnd };

  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0 space-y-14">
          <section data-field="templateSlug" aria-labelledby="wz-gallery">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <h3 id="wz-gallery" className="eyebrow">{s.gallery}</h3>
              {matching.length > 0 && matching.length < templates.length && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm text-olive underline decoration-champagne underline-offset-4">{showAll ? s.showMatching : s.showAll}</button>
              )}
            </div>
            {errors.templateSlug && <p role="alert" className="mb-4 text-sm text-[#8a3b32]">{errText(t, errors.templateSlug === "required" ? "template" : errors.templateSlug)}</p>}
            <fieldset>
              <legend className="sr-only">{s.gallery}</legend>
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
                {list.map((tpl) => {
                  const soon = tpl.status !== "published";
                  const on = draft.design.templateSlug === tpl.slug;
                  return (
                    <label key={tpl.id} className={`group block ${soon ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input type="radio" name="wz-template" className="peer sr-only" disabled={soon} checked={on} onChange={() => pick(tpl)} />
                      <span className={`relative block p-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive ${on ? "bg-paper shadow-[0_0_0_1px_var(--color-olive)]" : "shadow-[0_0_0_1px_var(--color-line)] group-hover:shadow-[0_0_0_1px_var(--color-sage)]"}`}>
                        <span className={`block ${soon ? "opacity-55 saturate-50" : ""}`} aria-hidden>
                          <InvitationRenderer content={content} layout={tpl.layout} palette={tpl.palette} fontPair={tpl.fontPair} asset={tpl.asset} />
                        </span>
                        {soon && <span className="absolute start-4 top-4"><Badge tone="champagne">{s.soon}</Badge></span>}
                        {on && <span className="absolute end-4 top-4"><Badge tone="olive">{s.selected}</Badge></span>}
                      </span>
                      <span className="mt-3 block font-display text-lg leading-6 text-ink">{tpl.name[locale]}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-soft">{tpl.description[locale]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {hasSoon && <p className="mt-5 text-sm text-ink-soft">{s.soonNote}</p>}
          </section>

          <section aria-labelledby="wz-custom" className="space-y-10 border-t border-line pt-10">
            <h3 id="wz-custom" className="display-3 !text-[1.5rem]">{s.customise}</h3>

            <div>
              <p className="eyebrow mb-1">{s.words}</p>
              <p className="mb-5 text-xs text-ink-soft">{s.wordsHint}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput label={s.blessing} maxLength={400} value={draft.design.fields.blessing ?? ""} placeholder={placeholder("blessing")} onChange={(e) => setField("blessing", e.target.value)} />
                <TextInput label={s.intro} maxLength={400} value={draft.design.fields.intro ?? ""} placeholder={placeholder("intro")} onChange={(e) => setField("intro", e.target.value)} />
                <TextArea label={s.names} rows={2} maxLength={400} value={draft.design.fields.names ?? ""} placeholder={placeholder("names")} onChange={(e) => setField("names", e.target.value)} />
                <TextInput label={s.closing} maxLength={400} value={draft.design.fields.closing ?? ""} placeholder={placeholder("closing")} onChange={(e) => setField("closing", e.target.value)} />
                <TextInput wrapperClassName="sm:col-span-2" label={s.extra} maxLength={400} value={draft.design.fields.extra ?? ""} onChange={(e) => setField("extra", e.target.value)} />
              </div>
            </div>

            <fieldset>
              <legend className="eyebrow mb-4">{s.palette}</legend>
              <div className="flex flex-wrap gap-3">
                {PALETTES.map((p) => {
                  const on = draft.design.palette === p.key;
                  return (
                    <label key={p.key} className="cursor-pointer">
                      <input type="radio" name="wz-palette" className="peer sr-only" checked={on} onChange={() => setDesign({ palette: p.key })} />
                      <span className={`flex items-center gap-3 border px-3 py-2 text-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-olive ${on ? "border-olive bg-paper" : "border-ink/20 hover:border-olive/60"}`}>
                        <span aria-hidden className="flex">
                          {[p.bg, p.accent, p.ink].map((c, i) => <span key={i} className="-me-1 h-5 w-5 rounded-full border border-ink/15" style={{ background: c }} />)}
                        </span>
                        {p[locale]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="eyebrow mb-4">{s.fonts}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {FONT_PAIRS.map((f) => {
                  const on = draft.design.fontPair === f.key;
                  return (
                    <label key={f.key} className="cursor-pointer">
                      <input type="radio" name="wz-font" className="peer sr-only" checked={on} onChange={() => setDesign({ fontPair: f.key })} />
                      <span className={`flex items-center justify-between gap-4 border px-4 py-3 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-olive ${on ? "border-olive bg-paper" : "border-ink/20 hover:border-olive/60"}`}>
                        <span className="text-sm">{f[locale]}</span>
                        <span aria-hidden className="text-2xl" style={{ fontFamily: f.display }}>{s.fontSample}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-10 sm:grid-cols-2">
              <fieldset>
                <legend className="eyebrow mb-4">{s.align}</legend>
                <div className="inline-flex border border-ink/25">
                  {ALIGNS.map((a) => (
                    <label key={a} className="cursor-pointer">
                      <input type="radio" name="wz-align" className="peer sr-only" checked={draft.design.align === a} onChange={() => setDesign({ align: a })} />
                      <span className="block px-4 py-2 text-sm text-ink-soft transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-olive">{alignLabel[a]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="eyebrow mb-4">{s.language}</legend>
                <div className="inline-flex border border-ink/25">
                  {langs.map((l) => (
                    <label key={l.v} className="cursor-pointer">
                      <input type="radio" name="wz-design-lang" className="peer sr-only" checked={draft.language === l.v} onChange={() => set({ language: l.v })} />
                      <span className="block px-4 py-2 text-sm text-ink-soft transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-olive">{l.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>
        </div>

        <div className="min-w-0">
          <div className="lg:sticky lg:top-6">
            {selected ? <InvitationPreview draft={draft} template={selected} t={t} /> : (
              <div className="border border-dashed border-ink/20 px-6 py-16 text-center text-sm text-ink-soft">{s.sub}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
