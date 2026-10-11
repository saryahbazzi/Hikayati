import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, Empty, StatusBadge, btnPrimary } from "@/components/admin/ui";
import { eventTitle, fmtDateTime, occName } from "@/components/admin/format";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { listCheckinEvents } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";

export default async function AdminCheckin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "checkin", `/${locale}/admin/checkin`);
  const t = adminCopy(locale);
  const events = await listCheckinEvents(await getDb(), actor);
  const st = t.status.event as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.checkin.title} sub={t.checkin.sub} />
      {events.length === 0 ? <Empty><strong className="block font-display text-xl text-ink">{t.checkin.empty}</strong>{t.checkin.emptyBody}</Empty> : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label={t.checkin.title}>
          {events.map((e) => (
            <li key={e.id} className="grid gap-3 border border-line bg-paper/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="truncate font-display text-xl text-ink">{eventTitle(e.title, t.events.untitled)}</h2>
                  <p className="text-xs text-ink-soft">{occName(e.occasion, locale, e.occasionCustom)} · {fmtDateTime(e.startsAt, locale)}</p>
                  {e.venueName && <p className="text-xs text-taupe">{e.venueName}{e.city ? `, ${e.city}` : ""}</p>}</div>
                <StatusBadge value={e.status} label={st[e.status] ?? e.status} />
              </div>
              <p className="text-sm text-ink-soft"><span className="font-display text-3xl text-ink" dir="ltr">{e.attended}</span> <span dir="ltr">/ {e.accepted}</span> {t.checkin.attended}</p>
              <div><Link className={btnPrimary} href={`/${locale}/admin/checkin/${e.id}`}>{t.checkin.openScanner}</Link></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
