"use client";

import { useMemo, useState } from "react";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { TextInput } from "@/components/ui/form";
import { buildContent } from "@/lib/domain/invitation-content";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import type { PreviewData } from "./event-data";

/** The stored invitation, drawn by the same renderer guests see, with a Desktop / Mobile width toggle. */
export function InvitationPreview({ data, locale, showName = true }: { data: PreviewData; locale: Locale; showName?: boolean }) {
  const t = portalCopy(locale);
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [name, setName] = useState("");
  const content = useMemo(() => buildContent(data.source, name.trim()), [data.source, name]);
  const modes = [["desktop", t.iv.desktop], ["mobile", t.iv.mobile]] as const;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label={t.iv.viewAs} className="inline-flex border border-ink/25">
          {modes.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}
              className={`tracked px-5 py-2.5 text-[0.74rem] uppercase tracking-[0.16em] transition-colors ${mode === k ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>{label}</button>
          ))}
        </div>
        {showName && <div className="w-full sm:w-64"><TextInput label={t.iv.guestName} hint={t.iv.guestNameHint} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></div>}
      </div>
      <div className="flex justify-center border border-line bg-bone/40 px-4 py-10 sm:px-10" data-testid="invitation-preview" data-mode={mode}>
        <div className={`w-full transition-[max-width] duration-500 ${mode === "mobile" ? "max-w-[19rem]" : "max-w-[30rem]"}`} role="img" aria-label={t.iv.previewLabel}>
          <InvitationRenderer content={content} layout={data.layout} palette={data.palette} fontPair={data.fontPair} align={data.align} asset={data.asset} />
        </div>
      </div>
    </div>
  );
}
