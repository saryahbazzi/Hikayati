"use client";

import { useMemo, useState } from "react";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { buildContent } from "@/lib/domain/invitation-content";
import type { EventDraft } from "@/lib/domain/wizard";
import type { TemplateView } from "@/lib/server/templates";
import { draftToSource } from "./draft-source";
import type { T } from "./types";

/** Live preview with a Desktop / Mobile frame toggle. Uses the real draft, so it updates as the host types. */
export function InvitationPreview({ draft, template, t, toggle = true }: { draft: EventDraft; template: TemplateView | undefined; t: T; toggle?: boolean }) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const content = useMemo(() => buildContent(draftToSource(draft)), [draft]);
  const s = t.s4;
  if (!template) return null;
  const card = (
    <InvitationRenderer content={content} layout={template.layout} palette={draft.design.palette} fontPair={draft.design.fontPair} align={draft.design.align} asset={template.asset} />
  );
  return (
    <div>
      {toggle && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="eyebrow">{s.preview}</p>
          <div role="group" aria-label={s.viewAs} className="inline-flex border border-ink/25 text-xs">
            {(["desktop", "mobile"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`px-3.5 py-1.5 transition-colors ${mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
                {m === "desktop" ? s.desktop : s.mobile}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-center bg-bone/60 px-4 py-8 sm:px-8" data-testid="invitation-preview" data-mode={mode}>
        {mode === "desktop" ? (
          <div className="w-full max-w-[34rem] border border-line bg-paper/70 p-3 sm:p-6">
            <div className="mx-auto w-full max-w-[22rem]">{card}</div>
          </div>
        ) : (
          <div className="w-[14.5rem] rounded-[1.9rem] border-[6px] border-ink/80 bg-ink/80 p-0 shadow-sm">
            <div className="overflow-hidden rounded-[1.4rem] bg-paper">{card}</div>
          </div>
        )}
      </div>
    </div>
  );
}
