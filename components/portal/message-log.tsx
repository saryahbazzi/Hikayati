"use client";

import { useEffect, useState } from "react";
import { listMessagesAction } from "@/app/actions/invitations";
import { Badge, EmptyState, Notice } from "@/components/ui/misc";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import type { MessageRow } from "@/lib/server/extras";
import { errText, fmtDateTime } from "./util";

/** Demo message log (invite or reminder kinds), each labelled as simulated unless a provider confirmed it. */
export function MessageLog({ eventId, locale, kind, title, note, empty, limit = 6, reloadKey = 0 }: { eventId: string; locale: Locale; kind: "invite" | "reminder"; title: string; note: string; empty: string; limit?: number; reloadKey?: number }) {
  const t = portalCopy(locale);
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    listMessagesAction(eventId).then((r) => {
      if (off) return;
      if (r.ok) setRows(r.data.filter((m) => m.kind === kind).slice(0, limit)); else setErr(errText(t, r));
    }).catch(() => { if (!off) setErr(t.err.unknown); });
    return () => { off = true; };
  }, [eventId, kind, limit, reloadKey, t]);

  return (
    <section aria-labelledby={`log-${kind}`} className="space-y-4" data-testid={`log-${kind}`}>
      <h3 id={`log-${kind}`} className="font-display text-xl">{title}</h3>
      <p className="text-sm text-ink-soft">{note}</p>
      {err && <Notice tone="error">{err}</Notice>}
      {rows === null && !err ? <p role="status" className="text-ink-soft">{t.c.loading}</p> : rows && rows.length === 0 ? <EmptyState title={title} body={empty} /> : rows && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-bone/60 text-xs uppercase tracking-wider text-taupe">
              <tr>{[t.rem.logGuest, t.rem.logWhen, t.rem.logStatus, t.rem.logMsg].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {rows.map((m) => (
                <tr key={m.id}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-start font-normal text-ink">{m.guest || "—"}</th>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{fmtDateTime(m.at, locale)}</td>
                  <td className="px-4 py-3"><Badge tone={m.status === "demo_simulated" ? "champagne" : "olive"}>{m.status === "demo_simulated" ? t.c.simulated : m.status}</Badge></td>
                  <td className="px-4 py-3"><p className="max-w-md whitespace-pre-line text-ink-soft" dir={m.locale === "ar" ? "rtl" : "ltr"}>{m.body}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
