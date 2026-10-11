import { notFound } from "next/navigation";
import { AuditTable } from "@/components/admin/audit-table";
import { AdminHeading, Empty, FilterBar, Lbl, Pager, ctl, first, qs } from "@/components/admin/ui";
import { ROLES } from "@/lib/server/permissions";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { listAuditLogs } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminAudit({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "audit.read", `/${locale}/admin/audit`);
  const sp = await searchParams;
  const f = { action: first(sp.action), role: first(sp.role), eventId: first(sp.event), page: Number(first(sp.page)) || 1 };
  const t = adminCopy(locale);
  const res = await listAuditLogs(await getDb(), actor, f);
  const base = `/${locale}/admin/audit`;
  const roles = t.roles as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.audit.title} sub={t.audit.sub} />
      <FilterBar apply={t.common.apply} clear={t.common.clear} clearHref={base} label={t.audit.title}>
        <Lbl label={t.audit.action} className="w-48"><input name="action" defaultValue={f.action ?? ""} placeholder="checkin." className={ctl} dir="ltr" maxLength={40} /></Lbl>
        <Lbl label={t.audit.actorRole} className="w-44"><select name="role" defaultValue={f.role ?? ""} className={ctl}><option value="">{t.common.all}</option>{ROLES.map((r) => <option key={r} value={r}>{roles[r]}</option>)}</select></Lbl>
        <Lbl label={t.audit.eventId} className="w-72"><input name="event" defaultValue={f.eventId ?? ""} className={ctl} dir="ltr" maxLength={36} /></Lbl>
      </FilterBar>
      {res.rows.length === 0 ? <Empty>{t.audit.empty}</Empty> : (
        <>
          <AuditTable rows={res.rows} locale={locale} />
          <Pager page={res.page} pageSize={res.pageSize} total={res.total} t={t.common} hrefFor={(p) => `${base}${qs({ action: f.action, role: f.role, event: f.eventId, page: p })}`} />
        </>
      )}
    </>
  );
}
