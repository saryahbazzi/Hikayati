import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { occasionLabel } from "@/lib/domain/occasions";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import type { EventSummary } from "@/lib/server/events";
import { EventStatusBadge } from "./status";
import { dayMonth } from "./util";

/** One row in My Events: calendar block, title, real counts and the next action. */
export function EventCard({ ev, locale }: { ev: EventSummary; locale: Locale }) {
  const t = portalCopy(locale);
  const dm = dayMonth(ev.startsAt, locale);
  const draft = ev.status === "draft";
  const place = [ev.venueName, ev.city].filter(Boolean).join(" · ");
  const counts: [string, number][] = [[t.events.guests, ev.guests], [t.events.accepted, ev.accepted], [t.events.declined, ev.declined], [t.events.checkedIn, ev.checkedIn]];
  return (
    <article className="grid gap-5 border border-line bg-paper/70 p-5 sm:grid-cols-[5rem_1fr] md:grid-cols-[5rem_1fr_auto] md:items-center md:gap-8 md:p-6" data-testid="event-card" aria-label={ev.title || t.events.untitled}>
      <div className="hidden border-e border-line pe-5 text-center sm:block" aria-hidden={!dm}>
        {dm ? (
          <>
            <p className="font-display text-4xl font-light leading-none">{dm.day}</p>
            <p className="tracked mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-taupe">{dm.month}</p>
            <p className="mt-0.5 text-xs text-taupe">{dm.year}</p>
          </>
        ) : <p className="text-xs text-taupe">—</p>}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={ev.status} locale={locale} />
          {ev.role !== "owner" && <Badge tone="info">{t.c.role[ev.role]}</Badge>}
        </div>
        <h3 className="font-display mt-2 truncate text-2xl">{ev.title || t.events.untitled}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {occasionLabel(ev.occasion, locale, ev.occasionCustom)}
          {dm && <> · <span>{dm.day} {dm.month} {dm.year}</span></>}
          {place && <> · {place}</>}
        </p>
        {draft ? (
          <p className="mt-3 text-sm text-ink-soft">{t.events.draftStep} {Math.min(Math.max(ev.wizardStep, 1), 7)} {t.events.of} 7 — {t.events.draftHint}</p>
        ) : (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {counts.map(([label, n]) => (
              <div key={label}>
                <dt className="tracked text-[0.66rem] uppercase tracking-[0.18em] text-taupe">{label}</dt>
                <dd className="font-display text-2xl leading-tight">{n}{label === t.events.guests && ev.estimatedGuests ? <span className="ms-1.5 text-xs text-taupe">/ {ev.estimatedGuests} {t.events.estimated}</span> : null}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="sm:col-span-2 md:col-span-1">
        {draft ? <Button href={`/${locale}/begin?event=${ev.id}`} size="sm">{t.events.resume}</Button> : <Button href={`/${locale}/my-events/${ev.id}`} variant="secondary" size="sm" aria-label={`${t.events.openEvent}: ${ev.title}`}>{t.events.openEvent}</Button>}
      </div>
    </article>
  );
}
