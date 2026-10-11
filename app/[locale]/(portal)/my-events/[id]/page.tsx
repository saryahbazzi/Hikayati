import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, DemoTag, Stat } from "@/components/ui/misc";
import { Collaborators } from "@/components/portal/collaborators";
import { getWorkspace } from "@/components/portal/event-data";
import { CancelEvent } from "@/components/portal/event-actions";
import { EventStatusBadge } from "@/components/portal/status";
import { fmtDate } from "@/components/portal/util";
import { formatTime } from "@/lib/domain/time";
import { occasionLabel } from "@/lib/domain/occasions";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { eventStats } from "@/lib/server/events";
import { listCollaborators } from "@/lib/server/extras";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event overview · Hikayati", robots: { index: false } };

export default async function EventOverview({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { db, actor, row, access } = await getWorkspace(locale, id);
  const t = portalCopy(locale);
  const s = await eventStats(db, id);
  const collabs = access.owner ? await listCollaborators(db, actor, id) : [];
  const base = `/${locale}/my-events/${id}`;
  const starts = row.starts_at ? new Date(row.starts_at).toISOString() : null;
  const deadline = row.rsvp_deadline ? new Date(row.rsvp_deadline).toISOString() : null;

  const pct = (n: number) => (s.recipients > 0 ? Math.round((n / s.recipients) * 100) : 0);
  const detail = (k: string, v: string | null | undefined) => (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6"><dt className="text-sm text-taupe">{k}</dt><dd className="text-ink">{v || <span className="text-taupe">{t.ov.notSet}</span>}</dd></div>
  );
  const host = [row.host_first_name, row.host_last_name].filter(Boolean).join(" ") + (row.cohost_name ? ` & ${row.cohost_name}` : "");
  const sentSub = s.confirmedDelivered > 0 ? t.ov.sentReal : s.simulatedDelivered > 0 ? t.ov.sentSub : undefined;

  return (
    <div className="space-y-14">
      <section aria-labelledby="stats-h">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div><h2 id="stats-h" className="font-display text-2xl">{t.ov.stats}</h2><p className="text-sm text-ink-soft">{t.ov.statsNote}</p></div>
          {s.simulatedDelivered > 0 && <DemoTag>{t.c.demoSend}</DemoTag>}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4" data-testid="event-stats">
          <Stat label={t.ov.estimated} value={s.estimatedGuests ?? "—"} />
          <Stat label={t.ov.records} value={s.guestRecords} />
          <Stat label={t.ov.recipients} value={s.recipients} />
          <Stat label={t.ov.sent} value={s.sent} sub={sentSub} />
          {s.confirmedDelivered > 0 && <Stat label={t.ov.delivered} value={s.confirmedDelivered} sub={t.ov.deliveredSub} tone="olive" />}
          <Stat label={t.ov.accepted} value={s.accepted} tone="olive" />
          <Stat label={t.ov.declined} value={s.declined} tone={s.declined ? "danger" : undefined} />
          <Stat label={t.ov.awaiting} value={s.awaiting} />
          <Stat label={t.ov.checkedIn} value={s.checkedIn} tone="olive" />
          <Stat label={t.ov.notArrived} value={s.notYetArrived} />
          <Stat label={t.ov.seats} value={s.seats} sub={t.ov.seatsSub} />
        </div>

        <div className="mt-10">
          <h3 className="tracked mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-taupe">{t.ov.repliesTitle}</h3>
          {s.recipients === 0 ? (
            <p className="text-sm text-ink-soft">{t.ov.noRecipients}</p>
          ) : (
            <>
              <div role="img" aria-label={`${t.ov.repliesLabel}: ${t.ov.accepted} ${s.accepted}, ${t.ov.declined} ${s.declined}, ${t.ov.awaiting} ${s.awaiting}`} className="flex h-2 w-full overflow-hidden border border-line bg-bone">
                <span className="bg-olive" style={{ width: `${pct(s.accepted)}%` }} />
                <span className="bg-[#8a3b32]/70" style={{ width: `${pct(s.declined)}%` }} />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-6 text-xs text-ink-soft"><span>{t.ov.accepted} {pct(s.accepted)}%</span><span>{t.ov.declined} {pct(s.declined)}%</span><span>{t.ov.awaiting} {pct(s.awaiting)}%</span></p>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="details-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="details-h" className="font-display text-2xl">{t.ov.details}</h2>
            {access.manage && row.status !== "cancelled" && <Button href={`/${locale}/begin?event=${id}`} variant="quiet" size="sm">{t.ov.editDetails}</Button>}
          </div>
          <Card className="px-6 py-2">
            <dl className="divide-y divide-line">
              <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6"><dt className="text-sm text-taupe">{t.ov.status}</dt><dd><EventStatusBadge status={row.status} locale={locale} /></dd></div>
              {detail(t.ov.occasion, occasionLabel(row.occasion, locale, row.occasion_custom))}
              {detail(t.ov.date, starts ? fmtDate(starts, locale, row.timezone) : "")}
              {detail(t.ov.time, starts ? `${formatTime(starts, locale, row.timezone)} · ${t.c.eventTime}` : "")}
              {detail(t.ov.venue, [row.venue_name, row.venue_address].filter(Boolean).join(" — "))}
              {detail(t.ov.city, row.city)}
              {detail(t.ov.host, host)}
              {detail(t.ov.dress, row.dress_code)}
              {detail(t.ov.rsvp, deadline ? fmtDate(deadline, locale, row.timezone) : "")}
              {detail(t.ov.language, t.ov.langs[row.invitation_language])}
            </dl>
          </Card>
        </section>

        <section aria-labelledby="next-h">
          <h2 id="next-h" className="font-display mb-3 text-2xl">{t.ov.next}</h2>
          <ul className="divide-y divide-line border border-line bg-paper/70">
            {[
              ...(access.guests ? [{ href: `${base}/guests`, label: t.ov.nextGuests }, { href: `${base}/guests#invitation-actions`, label: t.ov.nextSend }] : []),
              { href: `${base}/reminders`, label: t.ov.nextRemind },
              ...(access.manage ? [{ href: `${base}/test`, label: t.ov.nextTest }] : []),
            ].map((x) => (
              <li key={x.href}><a href={x.href} className="flex items-center justify-between gap-4 px-5 py-4 text-ink transition-colors hover:bg-bone/60"><span>{x.label}</span><span aria-hidden className="text-taupe rtl:-scale-x-100">→</span></a></li>
            ))}
          </ul>
        </section>
      </div>

      {access.owner && <Collaborators eventId={id} locale={locale} initial={collabs} />}
      {access.manage && row.status !== "cancelled" && <CancelEvent eventId={id} locale={locale} />}
    </div>
  );
}
