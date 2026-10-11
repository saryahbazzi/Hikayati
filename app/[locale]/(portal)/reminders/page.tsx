import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge, DemoTag, EmptyState, Notice, PageHeading } from "@/components/ui/misc";
import { orderedEvents } from "@/components/portal/event-list";
import { EventStatusBadge } from "@/components/portal/status";
import { fmtDateTime } from "@/components/portal/util";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { getDb } from "@/lib/server/db";
import { listMyEvents } from "@/lib/server/events";
import { listReminders, type ReminderRuleRow } from "@/lib/server/reminders";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reminders · Hikayati", robots: { index: false } };

export default async function RemindersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const db = await getDb();
  const actor = await requireActor(locale);
  const t = portalCopy(locale);
  const events = orderedEvents(await listMyEvents(db, actor));
  const groups = await Promise.all(events.map(async (e) => {
    let rules: ReminderRuleRow[] = [];
    try { rules = await listReminders(db, actor, e.id); } catch { /* no access to rules */ }
    return { e, rules };
  }));
  const next = events.find((e) => e.status !== "cancelled" && e.status !== "completed");

  return (
    <>
      <PageHeading title={t.gl.remTitle} sub={t.gl.remSub} actions={next ? <Button href={`/${locale}/my-events/${next.id}/reminders`} size="sm">{t.gl.newReminder}</Button> : undefined} />
      <div className="mb-8"><Notice tone="demo">{t.rem.demoNote}</Notice></div>
      {groups.length === 0 ? (
        <EmptyState title={t.gl.remEmpty} body={t.gl.remEmptyBody} action={<Button href={`/${locale}/my-events`}>{t.events.title}</Button>} />
      ) : (
        <div className="space-y-12">
          {groups.map(({ e, rules }) => (
            <section key={e.id} aria-labelledby={`r-${e.id}`} data-testid="reminder-group">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 id={`r-${e.id}`} className="font-display text-2xl">{e.title || t.events.untitled}</h2>
                  <EventStatusBadge status={e.status} locale={locale} />
                </div>
                <Link href={`/${locale}/my-events/${e.id}/reminders`} className="link-quiet text-sm">{t.gl.manageReminders}</Link>
              </div>
              {rules.length === 0 ? (
                <p className="text-ink-soft">{t.gl.noRulesFor}</p>
              ) : (
                <div className="overflow-x-auto border border-line">
                  <table className="w-full min-w-[40rem] text-sm">
                    <caption className="sr-only">{e.title}</caption>
                    <thead className="bg-bone/60 text-xs uppercase tracking-wider text-taupe">
                      <tr>{[t.rem.cols.when, t.rem.cols.kind, t.rem.cols.audience, t.rem.cols.status, t.rem.cols.sent].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-normal">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rules.map((r) => (
                        <tr key={r.id}>
                          <th scope="row" className="whitespace-nowrap px-4 py-3 text-start font-normal">{fmtDateTime(r.runAt, locale)}</th>
                          <td className="px-4 py-3 text-ink-soft">{r.kind === "before_event" ? (r.daysBefore === 1 ? t.rem.day : `${r.daysBefore} ${t.rem.days}`) : t.rem.kindLabel.custom}</td>
                          <td className="px-4 py-3">{t.rem.audShort[r.audience]}</td>
                          <td className="px-4 py-3"><Badge tone={r.status === "active" ? "champagne" : r.status === "completed" ? "olive" : "neutral"}>{(t.rem.status as Record<string, string>)[r.status] ?? r.status}</Badge></td>
                          <td className="px-4 py-3">{r.sent > 0 ? <span className="inline-flex items-center gap-2">{r.sent} <DemoTag>{t.c.simulated}</DemoTag></span> : 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
