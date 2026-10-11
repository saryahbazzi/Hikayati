import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeading } from "@/components/ui/misc";
import { EventPicker } from "@/components/portal/event-picker";
import { orderedEvents } from "@/components/portal/event-list";
import { GuestsWorkspace } from "@/components/portal/guests-workspace";
import { EventStatusBadge } from "@/components/portal/status";
import { fmtDateTime } from "@/components/portal/util";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { getDb } from "@/lib/server/db";
import { listMyEvents, loadEvent } from "@/lib/server/events";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guest Management · Hikayati", robots: { index: false } };

export default async function GuestsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ event?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { event } = await searchParams;
  const db = await getDb();
  const actor = await requireActor(locale);
  const t = portalCopy(locale);
  const all = await listMyEvents(db, actor);
  const events = orderedEvents(all);

  if (events.length === 0) {
    return (
      <>
        <PageHeading title={t.gl.guestsTitle} sub={t.gl.guestsSub} />
        <EmptyState title={t.gl.noEventsTitle} body={all.length ? t.gl.draftsOnly : t.gl.noEventsBody}
          action={<Button href={all.length ? `/${locale}/my-events` : `/${locale}/begin`}>{all.length ? t.events.title : t.events.emptyCta}</Button>} />
      </>
    );
  }
  const current = events.find((e) => e.id === event) ?? events[0];
  const ws = await loadEvent(db, actor, current.id);
  const when = fmtDateTime(ws.row.starts_at ? new Date(ws.row.starts_at).toISOString() : null, locale, ws.row.timezone);

  return (
    <>
      <PageHeading title={t.gl.guestsTitle} sub={t.gl.guestsSub} />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <EventPicker label={t.gl.pickEvent} value={current.id} base={`/${locale}/guests`}
          options={events.map((e) => ({ id: e.id, label: e.title || t.events.untitled }))} />
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
          <EventStatusBadge status={ws.row.status} locale={locale} />
          <span>{when || t.ws.dateTbd}</span>
          <Button href={`/${locale}/my-events/${current.id}`} variant="quiet" size="sm">{t.gl.openWorkspace}</Button>
        </div>
      </div>
      {ws.access.guests ? (
        <GuestsWorkspace key={current.id} eventId={current.id} locale={locale} eventStatus={ws.row.status} defaultLang={ws.row.invitation_language === "en" ? "en" : "ar"}
          canEdit={ws.access.guests && ws.row.status !== "cancelled"} canExport={ws.access.exportData} canManage={ws.access.manage} canGuests={ws.access.guests} />
      ) : (
        <EmptyState title={t.gl.guestsTitle} body={t.err.forbidden} />
      )}
    </>
  );
}
