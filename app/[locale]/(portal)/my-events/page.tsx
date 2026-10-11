import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeading } from "@/components/ui/misc";
import { EventCard } from "@/components/portal/event-card";
import { todayIso } from "@/lib/domain/wizard";
import { utcToZoned } from "@/lib/domain/time";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { getDb } from "@/lib/server/db";
import { listMyEvents, type EventSummary } from "@/lib/server/events";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Events · Hikayati", robots: { index: false } };

export default async function MyEventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const db = await getDb();
  const actor = await requireActor(locale);
  const t = portalCopy(locale);
  const events = await listMyEvents(db, actor);

  const today = todayIso();
  const dayOf = (e: EventSummary) => (e.startsAt ? utcToZoned(e.startsAt).date : "");
  const drafts = events.filter((e) => e.status === "draft");
  const rest = events.filter((e) => e.status !== "draft");
  const isPast = (e: EventSummary) => e.status === "completed" || e.status === "cancelled" || (!!e.startsAt && dayOf(e) < today);
  const upcoming = rest.filter((e) => !isPast(e)).sort((a, b) => (a.startsAt ?? "9").localeCompare(b.startsAt ?? "9"));
  const previous = rest.filter(isPast).sort((a, b) => (b.startsAt ?? "").localeCompare(a.startsAt ?? ""));
  const sections: { key: string; title: string; items: EventSummary[] }[] = [
    { key: "upcoming", title: t.events.upcoming, items: upcoming },
    { key: "drafts", title: t.events.drafts, items: drafts },
    { key: "previous", title: t.events.previous, items: previous },
  ];

  return (
    <>
      <PageHeading title={t.events.title} sub={t.events.sub} actions={events.length > 0 ? <Button href={`/${locale}/begin`} size="sm">{t.events.create}</Button> : undefined} />
      {events.length === 0 ? (
        <EmptyState title={t.events.emptyTitle} body={t.events.emptyBody} action={<Button href={`/${locale}/begin`}>{t.events.emptyCta}</Button>} />
      ) : (
        <div className="space-y-14">
          {sections.filter((s) => s.items.length > 0 || s.key === "upcoming").map((s) => (
            <section key={s.key} aria-labelledby={`sec-${s.key}`}>
              <div className="mb-5 flex items-baseline gap-4 border-b border-line pb-3">
                <h2 id={`sec-${s.key}`} className="font-display text-2xl">{s.title}</h2>
                <span className="text-sm text-taupe">{s.items.length}</span>
              </div>
              {s.items.length === 0 ? (
                <p className="py-4 text-ink-soft">{t.events.sectionEmpty}</p>
              ) : (
                <div className="space-y-4">{s.items.map((e) => <EventCard key={e.id} ev={e} locale={locale} />)}</div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
