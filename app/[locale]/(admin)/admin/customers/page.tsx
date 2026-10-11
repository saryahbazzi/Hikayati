import { notFound } from "next/navigation";
import { AccountToggle } from "@/components/admin/account-toggle";
import { AdminHeading, Empty, FilterBar, Lbl, Pager, Td, TableWrap, Th, ctl, first, qs, tableCls } from "@/components/admin/ui";
import { Badge, DemoTag } from "@/components/ui/misc";
import { fmtDateTime } from "@/components/admin/format";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminListCustomers } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";

export default async function AdminCustomers({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "customers", `/${locale}/admin/customers`);
  const sp = await searchParams;
  const f = { search: first(sp.q), page: Number(first(sp.page)) || 1 };
  const t = adminCopy(locale);
  const res = await adminListCustomers(await getDb(), actor, f);
  const base = `/${locale}/admin/customers`;
  return (
    <>
      <AdminHeading title={t.customers.title} sub={t.customers.sub} />
      {res.masked && <p className="mb-3 text-xs text-ink-soft">{t.common.personalMasked}</p>}
      <FilterBar apply={t.common.apply} clear={t.common.clear} clearHref={base} label={t.customers.title}>
        <Lbl label={t.common.search} className="w-64"><input name="q" defaultValue={f.search ?? ""} placeholder={t.customers.search} className={ctl} /></Lbl>
      </FilterBar>
      {res.rows.length === 0 ? <Empty>{f.search ? t.common.noResults : t.customers.empty}</Empty> : (
        <>
          <TableWrap label={t.customers.title}>
            <table className="w-full min-w-[44rem] border-collapse text-start text-sm">
              <caption className="sr-only">{t.customers.title}</caption>
              <thead><tr><Th>{t.customers.customer}</Th><Th>{t.customers.phone}</Th><Th>{t.customers.events}</Th><Th>{t.customers.lastActivity}</Th><Th>{t.customers.account}</Th>{res.canDisable && <Th><span className="sr-only">{t.common.actions}</span></Th>}</tr></thead>
              <tbody>
                {res.rows.map((c) => (
                  <tr key={c.id}>
                    <Td>{c.name || <span className="text-taupe">{t.common.unnamed}</span>} {c.isDemo && <DemoTag>{t.customers.demoAccount}</DemoTag>}</Td>
                    <Td mono><span dir="ltr">{c.phone || "—"}</span></Td>
                    <Td mono><span dir="ltr">{c.events}</span></Td>
                    <Td className="whitespace-nowrap">{fmtDateTime(c.lastActivity, locale)}</Td>
                    <Td><Badge tone={c.disabled ? "danger" : "olive"}>{c.disabled ? t.common.disabled : t.common.active}</Badge></Td>
                    {res.canDisable && <Td><AccountToggle userId={c.id} disabled={c.disabled} c={t.common} labels={{ disable: t.customers.disable, enable: t.customers.enable, confirm: t.customers.confirmDisable, cancel: t.common.cancel }} /></Td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <Pager page={res.page} pageSize={res.pageSize} total={res.total} t={t.common} hrefFor={(p) => `${base}${qs({ q: f.search, page: p })}`} />
        </>
      )}
    </>
  );
}
