"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { errText } from "./util";

/** Cancel the event, after an explicit in-page confirmation. */
export function CancelEvent({ eventId, locale }: { eventId: string; locale: Locale }) {
  const t = portalCopy(locale);
  const router = useRouter();
  const a = useAction();
  const [ask, setAsk] = useState(false);
  const [done, setDone] = useState(false);

  async function go() {
    const r = await a.run(() => cancelEventAction(eventId));
    if (r.ok) { setDone(true); setAsk(false); router.refresh(); }
  }
  return (
    <section aria-labelledby="cancel-h" className="border border-line p-6">
      <h2 id="cancel-h" className="font-display text-xl">{t.ov.cancelTitle}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">{t.ov.cancelBody}</p>
      <div className="mt-5 space-y-4" aria-live="polite">
        {done && <Notice tone="success">{t.ov.cancelled}</Notice>}
        {a.error && <Notice tone="error">{errText(t, { error: a.error, fields: a.fields })}</Notice>}
        {!done && (ask ? (
          <div role="alertdialog" aria-labelledby="cancel-ask" className="space-y-4 border border-[#8a3b32]/40 bg-[#8a3b32]/5 p-4">
            <p id="cancel-ask" className="text-sm text-ink">{t.ov.cancelAsk}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" size="sm" onClick={go} disabled={a.pending} data-testid="cancel-confirm">{a.pending ? t.c.working : t.ov.cancelYes}</Button>
              <Button variant="secondary" size="sm" onClick={() => setAsk(false)}>{t.ov.cancelKeep}</Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setAsk(true)} data-testid="cancel-event">{t.ov.cancelBtn}</Button>
        ))}
      </div>
    </section>
  );
}
