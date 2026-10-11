"use client";

import { useCallback, useState } from "react";
import { GuestManager } from "@/components/guests/guest-manager";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { guestsCopy } from "@/lib/i18n/guests";
import { StepHeading, type StepProps } from "./types";

/** Step 5: guest list. The draft event already exists (autosave creates it before this step). */
export function StepGuests({ draft, t, locale, eventId, onRecords, onRetry }: StepProps & { eventId: string | null; onRecords: (n: number) => void; onRetry: () => void }) {
  const s = t.s5;
  const [records, setRecords] = useState(0);
  const onChange = useCallback((g: unknown[]) => { setRecords(g.length); onRecords(g.length); }, [onRecords]);
  return (
    <div>
      <StepHeading id="wz-heading" title={s.heading} sub={s.sub} />
      <dl className="mb-8 grid max-w-xl grid-cols-2 gap-6">
        <div className="border-s border-line ps-5">
          <dt className="eyebrow !text-[0.66rem]">{s.estimated}</dt>
          <dd className="font-display mt-1 text-4xl font-light">{draft.estimatedGuests ?? "—"}</dd>
        </div>
        <div className="border-s border-line ps-5">
          <dt className="eyebrow !text-[0.66rem]">{s.records}</dt>
          <dd className="font-display mt-1 text-4xl font-light" data-testid="records-count">{records}</dd>
        </div>
      </dl>
      <p className="mb-8 max-w-2xl text-sm leading-7 text-ink-soft">{s.note}</p>
      {eventId ? (
        <GuestManager eventId={eventId} locale={locale} t={guestsCopy(locale)} canEdit onChange={onChange} />
      ) : (
        <Notice tone="info">
          <span>{s.preparing}</span>{" "}
          <Button size="sm" variant="secondary" onClick={onRetry} className="ms-3">{s.retry}</Button>
        </Notice>
      )}
    </div>
  );
}
