import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, BarList, Empty, Kpi, Panel, Td, TableWrap, Th, btnQuiet, tableCls } from "@/components/admin/ui";
import { eventTitle, fmtNum, occName, pct } from "@/components/admin/format";
import { DemoTag, Notice } from "@/components/ui/misc";
import { formatMinor } from "@/lib/domain/pricing";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { buildReports } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminReports({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "reports.read", `/${locale}/admin/reports`);
  const t = adminCopy(locale);
  const r = await buildReports(await getDb(), actor);
  const st = t.status.event as Record<string, string>;
  const kinds = t.status.kind as Record<string, string>, ms = t.status.msg as Record<string, string>;
  const f = r.funnel;
  const funnel = [
    { label: t.reports.f_guests, value: f.guests }, { label: t.reports.f_sent, value: f.sent }, { label: t.reports.f_opened, value: f.opened }, { label: t.reports.f_responded, value: f.responded },
    { label: t.reports.f_accepted, value: f.accepted }, { label: t.reports.f_declined, value: f.declined }, { label: t.reports.f_checkedIn, value: f.checkedIn },
  ];
  return (
    <>
      <AdminHeading title={t.reports.title} sub={t.reports.sub} actions={
        <a className={btnQuiet} href="/api/admin/reports" download>{t.reports.export}</a>} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title={t.reports.byStatus} id="r-status">{r.byStatus.length ? <BarList label={t.reports.byStatus} rows={r.byStatus.map((x) => ({ label: st[x.key] ?? x.key, value: x.n }))} /> : <Empty>{t.reports.empty}</Empty>}</Panel>
        <Panel title={t.reports.byOccasion} id="r-occ">{r.byOccasion.length ? <BarList label={t.reports.byOccasion} rows={r.byOccasion.map((x) => ({ label: occName(x.key, locale), value: x.n }))} /> : <Empty>{t.reports.empty}</Empty>}</Panel>
        <Panel title={t.reports.funnel} id="r-funnel"><BarList label={t.reports.funnel} max={Math.max(1, f.guests)} rows={funnel} /></Panel>
        <Panel title={t.reports.messages} id="r-msg" note={t.reports.messagesNote}>
          {r.messagesByKind.length === 0 ? <Empty>{t.reports.empty}</Empty> : (
            <div className="grid gap-5">
              <div><h3 className="mb-2 text-xs text-ink-soft">{t.reports.byKind}</h3><BarList label={t.reports.byKind} rows={r.messagesByKind.map((x) => ({ label: kinds[x.key] ?? x.key, value: x.n }))} /></div>
              <div><h3 className="mb-2 text-xs text-ink-soft">{t.reports.msgByStatus}</h3><BarList label={t.reports.msgByStatus} rows={r.messagesByStatus.map((x) => ({ label: ms[x.key] ?? x.key, value: x.n }))} /></div>
            </div>
          )}
        </Panel>
        <Panel title={t.reports.attendance} id="r-att" className="lg:col-span-2">
          {r.attendance.length === 0 ? <Empty>{t.reports.empty}</Empty> : (
            <TableWrap label={t.reports.attendance}>
              <table className={tableCls}>
                <caption className="sr-only">{t.reports.attendance}</caption>
                <thead><tr><Th>{t.common.event}</Th><Th>{t.reports.accepted}</Th><Th>{t.reports.arrived}</Th><Th>{t.reports.rate}</Th></tr></thead>
                <tbody>
                  {r.attendance.map((a) => (
                    <tr key={a.id}>
                      <Td><Link className="text-olive underline decoration-champagne underline-offset-4" href={`/${locale}/admin/events/${a.id}`}>{eventTitle(a.title, t.events.untitled)}</Link></Td>
                      <Td mono><span dir="ltr">{a.accepted}</span></Td><Td mono><span dir="ltr">{a.checkedIn}</span></Td>
                      <Td className="min-w-[10rem]"><div className="flex items-center gap-2"><span className="h-2.5 flex-1 bg-bone" aria-hidden><span className="block h-full bg-olive" style={{ width: `${pct(a.checkedIn, a.accepted)}%` }} /></span><span className="w-10 text-end tabular-nums text-ink-soft" dir="ltr">{pct(a.checkedIn, a.accepted)}%</span></div></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
        <Panel title={<span className="flex items-center gap-2">{t.reports.orders} <DemoTag>{t.common.demoTag}</DemoTag></span>} id="r-orders" className="lg:col-span-2">
          <div className="grid gap-4">
            <Notice tone="demo">{t.reports.ordersNote}</Notice>
            <div className="grid max-w-xl grid-cols-2 gap-3"><Kpi label={t.reports.ordersCount} value={fmtNum(r.orders.count)} /><Kpi label={t.reports.ordersTotal} value={<span className="text-2xl">{formatMinor(r.orders.totalMinor, locale)}</span>} /></div>
          </div>
        </Panel>
      </div>
    </>
  );
}
