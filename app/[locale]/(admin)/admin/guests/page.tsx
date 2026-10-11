import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, Empty, FilterBar, Lbl, Pager, StatusBadge, Td, TableWrap, Th, ctl, first, linkCls, qs, tableCls } from "@/components/admin/ui";
import { eventTitle, fmtDateTime } from "@/components/admin/format";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminListGuests } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";

export default async function AdminGuests({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "guests", `/${locale}/admin/guests`);
  const sp = await searchParams;
  const f = { eventId: first(sp.event), rsvp: first(sp.rsvp), arrival: first(sp.arrival), search: first(sp.q), page: Number(first(sp.page)) || 1 };
  const t = adminCopy(locale);
  const res = await adminListGuests(await getDb(), actor, f);
  const base = `/${locale}/admin/guests`;
  const rs = t.status.rsvp as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.guests.title} sub={t.guests.sub} />
      {res.masked && <p className="mb-3 text-xs text-ink-soft">{t.common.personalMasked}</p>}
      <FilterBar apply={t.common.apply} clear={t.common.clear} clearHref={base} label={t.guests.title}>
        <Lbl label={t.common.search} className="w-56"><input name="q" defaultValue={f.search ?? ""} placeholder={res.masked ? t.guests.search : t.guests.searchPhone} className={ctl} /></Lbl>
        <Lbl label={t.common.event} className="w-56">
          <select name="event" defaultValue={f.eventId ?? ""} className={ctl}><option value="">{t.common.all}</option>{res.events.map((e) => <option key={e.id} value={e.id}>{eventTitle(e.title, t.events.untitled)}</option>)}</select>
        </Lbl>
        <Lbl label={t.guests.rsvp} className="w-40">
          <select name="rsvp" defaultValue={f.rsvp ?? ""} className={ctl}><option value="">{t.common.all}</option>{Object.entries(rs).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Lbl>
        <Lbl label={t.guests.arrival} className="w-40">
          <select name="arrival" defaultValue={f.arrival ?? ""} className={ctl}><option value="">{t.common.all}</option><option value="yes">{t.guests.arrived}</option><option value="no">{t.guests.notArrived}</option></select>
        </Lbl>
      </FilterBar>
      {res.rows.length === 0 ? <Empty>{t.guests.empty}</Empty> : (
        <>
          <TableWrap label={t.guests.title}>
            <table className={tableCls}>
              <caption className="sr-only">{t.guests.title}</caption>
              <thead><tr><Th>{t.common.guest}</Th><Th>{t.guests.mobile}</Th><Th>{t.common.event}</Th><Th>{t.guests.invitation}</Th><Th>{t.guests.rsvp}</Th><Th>{t.guests.plus}</Th><Th>{t.guests.arrival}</Th></tr></thead>
              <tbody>
                {res.rows.map((g) => (
                  <tr key={g.id}>
                    <Td>{g.name}</Td>
                    <Td mono><span dir="ltr">{g.phone}</span></Td>
                    <Td><Link className={linkCls} href={`/${locale}/admin/events/${g.eventId}`}>{eventTitle(g.eventTitle, t.events.untitled)}</Link></Td>
                    <Td>{g.sent ? t.guests.sentDemo : t.guests.notSent}</Td>
                    <Td><StatusBadge value={g.rsvp} label={rs[g.rsvp] ?? g.rsvp} /></Td>
                    <Td mono><span dir="ltr">{g.rsvp === "accepted" ? g.companionsAttending : "—"}</span></Td>
                    <Td className="whitespace-nowrap">{g.checkedInAt ? fmtDateTime(g.checkedInAt, locale) : t.guests.notArrived}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pager page={res.page} pageSize={res.pageSize} total={res.total} t={t.common} hrefFor={(p) => `${base}${qs({ q: f.search, event: f.eventId, rsvp: f.rsvp, arrival: f.arrival, page: p })}`} />
        </>
      )}
    </>
  );
}
