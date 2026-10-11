import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, BarList, Empty, Kpi, Panel, StatusBadge, Td, TableWrap, Th, btnQuiet, linkCls, tableCls } from "@/components/admin/ui";
import { eventTitle, fmtDate, fmtNum, occName, pct } from "@/components/admin/format";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminOverview } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";

export default async function AdminOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "overview");
  const t = adminCopy(locale);
  const o = await adminOverview(await getDb(), actor);
  const base = `/${locale}/admin`;
  const canEvents = actor.role !== "check_in_staff";
  const st = t.status.event as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.overview.title} sub={o.scope === "all" ? t.overview.subAll : t.overview.subAssigned}
        actions={canEvents && o.scope === "all" ? <Link className={btnQuiet} href={`${base}/events`}>{t.overview.viewAll}</Link> : undefined} />
      {o.totals.events === 0 && o.scope === "assigned" ? (
        <Empty>{t.overview.noEventsAssigned}</Empty>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Kpi label={t.overview.events} value={fmtNum(o.totals.events)} />
            <Kpi label={t.overview.guests} value={fmtNum(o.totals.guests)} />
            <Kpi label={t.overview.invited} value={fmtNum(o.totals.sent)} />
            <Kpi label={t.overview.accepted} value={fmtNum(o.totals.accepted)} sub={`${pct(o.totals.accepted, o.totals.sent)}% ${t.overview.accRate}`} />
            <Kpi label={t.overview.declined} value={fmtNum(o.totals.declined)} />
            <Kpi label={t.overview.awaiting} value={fmtNum(o.totals.awaiting)} />
            <Kpi label={t.overview.checkedIn} value={fmtNum(o.totals.checkedIn)} sub={`${pct(o.totals.checkedIn, o.totals.accepted)}% / ${t.overview.accepted}`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Panel title={t.overview.upcoming} id="upcoming">
              {o.upcoming.length === 0 ? <Empty>{t.overview.noUpcoming}</Empty> : (
                <TableWrap label={t.overview.upcoming}>
                  <table className={tableCls}>
                    <thead><tr><Th>{t.common.event}</Th><Th>{t.common.date}</Th><Th>{t.common.status}</Th><Th>{t.events.guests}</Th><Th>{t.events.checkedIn}</Th><Th><span className="sr-only">{t.common.actions}</span></Th></tr></thead>
                    <tbody>
                      {o.upcoming.map((e) => (
                        <tr key={e.id}>
                          <Td>
                            {canEvents ? <Link className={linkCls} href={`${base}/events/${e.id}`}>{eventTitle(e.title, t.events.untitled)}</Link> : <span>{eventTitle(e.title, t.events.untitled)}</span>}
                            <span className="block text-xs text-taupe">{occName(e.occasion, locale, e.occasionCustom)}{e.city ? ` · ${e.city}` : ""}</span>
                          </Td>
                          <Td className="whitespace-nowrap">{fmtDate(e.startsAt, locale)}</Td>
                          <Td><StatusBadge value={e.status} label={st[e.status] ?? e.status} /></Td>
                          <Td mono><span dir="ltr">{e.guests}</span></Td>
                          <Td mono><span dir="ltr">{e.checkedIn} / {e.accepted}</span></Td>
                          <Td>{e.canCheckIn && <Link className={linkCls} href={`${base}/checkin/${e.id}`}>{t.overview.openCheckin}</Link>}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </Panel>
            <Panel title={t.overview.byStatus} id="by-status">
              {o.statusCounts.length === 0 ? <Empty>{t.common.noResults}</Empty> : (
                <BarList label={t.overview.byStatus} rows={o.statusCounts.map((s) => ({ label: st[s.status] ?? s.status, value: s.n }))} />
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
