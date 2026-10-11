import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading, Empty, FilterBar, Lbl, Pager, StatusBadge, Td, TableWrap, Th, ctl, linkCls, qs, tableCls, first } from "@/components/admin/ui";
import { eventTitle, fmtDate, occName } from "@/components/admin/format";
import { OCCASIONS } from "@/lib/domain/occasions";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminListEvents } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminEvents({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "events", `/${locale}/admin/events`);
  const sp = await searchParams;
  const f = { status: first(sp.status), occasion: first(sp.occasion), search: first(sp.q), page: Number(first(sp.page)) || 1 };
  const t = adminCopy(locale);
  const res = await adminListEvents(await getDb(), actor, f);
  const base = `/${locale}/admin/events`;
  const st = t.status.event as Record<string, string>;
  const assigned = actor.role === "event_manager";
  return (
    <>
      <AdminHeading title={assigned ? t.events.titleAssigned : t.events.title} sub={assigned ? t.events.subAssigned : t.events.sub} />
      <FilterBar apply={t.common.apply} clear={t.common.clear} clearHref={base} label={t.events.title}>
        <Lbl label={t.common.search} className="w-56"><input name="q" defaultValue={f.search ?? ""} placeholder={t.events.search} className={ctl} /></Lbl>
        <Lbl label={t.common.status} className="w-40">
          <select name="status" defaultValue={f.status ?? ""} className={ctl}><option value="">{t.common.all}</option>{Object.entries(st).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Lbl>
        <Lbl label={t.common.occasion} className="w-48">
          <select name="occasion" defaultValue={f.occasion ?? ""} className={ctl}><option value="">{t.common.all}</option>{OCCASIONS.map((o) => <option key={o.key} value={o.key}>{o[locale]}</option>)}</select>
        </Lbl>
      </FilterBar>
      {res.rows.length === 0 ? <Empty>{f.status || f.occasion || f.search ? t.common.noResults : t.events.empty}</Empty> : (
        <>
          <TableWrap label={t.events.title}>
            <table className={tableCls}>
              <caption className="sr-only">{t.events.title}</caption>
              <thead><tr><Th>{t.common.event}</Th><Th>{t.common.occasion}</Th><Th>{t.common.date}</Th><Th>{t.common.status}</Th>{res.rows[0].ownerName !== null && <Th>{t.events.owner}</Th>}<Th>{t.events.guests}</Th><Th>{t.events.accepted}</Th><Th>{t.events.checkedIn}</Th></tr></thead>
              <tbody>
                {res.rows.map((e) => (
                  <tr key={e.id}>
                    <Td><Link className={linkCls} href={`${base}/${e.id}`}>{eventTitle(e.title, t.events.untitled)}</Link>{e.venueName && <span className="block text-xs text-taupe">{e.venueName}{e.city ? ` · ${e.city}` : ""}</span>}</Td>
                    <Td>{occName(e.occasion, locale, e.occasionCustom)}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(e.startsAt, locale)}</Td>
                    <Td><StatusBadge value={e.status} label={st[e.status] ?? e.status} /></Td>
                    {e.ownerName !== null && <Td>{e.ownerName || "—"}</Td>}
                    <Td mono><span dir="ltr">{e.guests}</span></Td>
                    <Td mono><span dir="ltr">{e.accepted}</span></Td>
                    <Td mono><span dir="ltr">{e.checkedIn}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pager page={res.page} pageSize={res.pageSize} total={res.total} t={{ ...t.common }} hrefFor={(p) => `${base}${qs({ ...f, q: f.search, search: undefined, page: p })}`} />
        </>
      )}
    </>
  );
}
