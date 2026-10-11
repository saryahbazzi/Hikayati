import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactHandled } from "@/components/admin/contact-handled";
import { AdminHeading, Empty, FilterBar, Lbl, Pager, Panel, StatusBadge, Td, TableWrap, Th, ctl, first, linkCls, qs, tableCls } from "@/components/admin/ui";
import { eventTitle, fmtDateTime } from "@/components/admin/format";
import { DemoTag, Notice } from "@/components/ui/misc";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminListContacts, adminListMessages } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminMessaging({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "messaging.read", `/${locale}/admin/messaging`);
  const sp = await searchParams;
  const f = { status: first(sp.status), provider: first(sp.provider), kind: first(sp.kind), page: Number(first(sp.page)) || 1 };
  const show = first(sp.show);
  const t = adminCopy(locale);
  const db = await getDb();
  const [msgs, contacts] = await Promise.all([adminListMessages(db, actor, f), adminListContacts(db, actor, { show })]);
  const base = `/${locale}/admin/messaging`;
  const ms = t.status.msg as Record<string, string>, kinds = t.status.kind as Record<string, string>, prov = t.status.provider as Record<string, string>;
  return (
    <>
      <AdminHeading title={t.messaging.title} />
      <div className="mb-6"><Notice tone="demo"><DemoTag>{t.common.demoTag}</DemoTag> {t.messaging.demoNote}</Notice></div>
      <div className="grid gap-8">
        <section aria-labelledby="records-h">
          <h2 id="records-h" className="mb-3 text-sm font-medium">{t.messaging.records}</h2>
          <FilterBar apply={t.common.apply} clear={t.common.clear} clearHref={base} label={t.messaging.records}>
            <Lbl label={t.common.status} className="w-44"><select name="status" defaultValue={f.status ?? ""} className={ctl}><option value="">{t.common.all}</option>{Object.entries(ms).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Lbl>
            <Lbl label={t.common.provider} className="w-44"><select name="provider" defaultValue={f.provider ?? ""} className={ctl}><option value="">{t.common.all}</option>{Object.entries(prov).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Lbl>
            <Lbl label={t.common.kind} className="w-44"><select name="kind" defaultValue={f.kind ?? ""} className={ctl}><option value="">{t.common.all}</option>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Lbl>
          </FilterBar>
          <p className="mb-3 text-xs text-ink-soft">{t.messaging.bodyHidden}</p>
          {msgs.rows.length === 0 ? <Empty>{f.status || f.provider || f.kind ? t.common.noResults : t.messaging.empty}</Empty> : (
            <>
              <TableWrap label={t.messaging.records}>
                <table className={tableCls}>
                  <caption className="sr-only">{t.messaging.records}</caption>
                  <thead><tr><Th>{t.common.when}</Th><Th>{t.common.event}</Th><Th>{t.common.guest}</Th><Th>{t.common.kind}</Th><Th>{t.common.status}</Th><Th>{t.common.provider}</Th><Th>{t.messaging.locale}</Th></tr></thead>
                  <tbody>
                    {msgs.rows.map((m) => (
                      <tr key={m.id}>
                        <Td className="whitespace-nowrap">{fmtDateTime(m.at, locale)}</Td>
                        <Td><Link className={linkCls} href={`/${locale}/admin/events/${m.eventId}`}>{eventTitle(m.eventTitle, t.events.untitled)}</Link></Td>
                        <Td>{m.guest || "—"}</Td><Td>{kinds[m.kind] ?? m.kind}</Td>
                        <Td><span className="inline-flex flex-wrap items-center gap-1.5"><StatusBadge value={m.status} label={ms[m.status] ?? m.status} />{m.status === "demo_simulated" && <DemoTag>{t.messaging.simulated}</DemoTag>}</span></Td>
                        <Td>{prov[m.provider] ?? m.provider}</Td><Td><span dir="ltr">{m.locale}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
              <Pager page={msgs.page} pageSize={msgs.pageSize} total={msgs.total} t={t.common} hrefFor={(p) => `${base}${qs({ ...f, page: p, show })}`} />
            </>
          )}
        </section>

        <Panel title={t.messaging.contact} id="contact" note={t.messaging.contactSub}
          actions={
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="status" value={f.status ?? ""} /><input type="hidden" name="provider" value={f.provider ?? ""} /><input type="hidden" name="kind" value={f.kind ?? ""} />
              <label className="flex items-center gap-2 text-xs text-ink-soft">{t.messaging.handledFilter}
                <select name="show" defaultValue={show ?? "open"} className={`${ctl} !w-auto`}><option value="open">{t.messaging.onlyOpen}</option><option value="handled">{t.messaging.onlyHandled}</option><option value="all">{t.common.all}</option></select>
              </label>
              <button className="border border-ink/30 px-3 py-1.5 text-sm hover:border-olive" type="submit">{t.common.apply}</button>
            </form>
          }>
          {contacts.length === 0 ? <Empty>{t.messaging.noContact}</Empty> : (
            <ul className="grid gap-3">
              {contacts.map((c) => (
                <li key={c.id} className="grid gap-2 border border-line bg-paper p-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="text-sm"><strong className="font-medium">{c.name}</strong> <span className="text-xs text-taupe">· {fmtDateTime(c.createdAt, locale)} · <span dir="ltr">{c.locale}</span></span></p>
                    <p className="text-xs text-ink-soft">{t.messaging.replyTo}: <span dir="ltr">{c.replyTo}</span></p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{c.message}</p>
                  </div>
                  <div className="self-start">{c.handledAt ? <span className="text-xs text-olive">{t.messaging.handled} · {fmtDateTime(c.handledAt, locale)}</span> : <ContactHandled id={c.id} label={t.messaging.markHandled} c={t.common} />}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
