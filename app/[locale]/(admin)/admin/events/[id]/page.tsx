import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentsPanel } from "@/components/admin/assignments-panel";
import { AdminHeading, Empty, Kpi, Panel, StatusBadge, Td, TableWrap, Th, btnQuiet, tableCls } from "@/components/admin/ui";
import { eventTitle, fmtDateTime, fmtNum, occName } from "@/components/admin/format";
import { GuestManager } from "@/components/guests/guest-manager";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { guestsCopy } from "@/lib/i18n/guests";
import { adminEventDetail } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";
import { NotFoundError } from "@/lib/server/permissions";
import { AuditTable } from "@/components/admin/audit-table";

export default async function AdminEventDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "events", `/${locale}/admin/events/${id}`);
  const t = adminCopy(locale);
  let d;
  try { d = await adminEventDetail(await getDb(), actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const { event: ev, stats: s, access } = d;
  const st = t.status.event as Record<string, string>;
  const res = t.checkin.result as Record<string, string>;
  const methods = t.events.methodLabel as Record<string, string>;
  const kinds = t.status.kind as Record<string, string>;
  const mst = t.status.msg as Record<string, string>;
  const base = `/${locale}/admin`;
  return (
    <>
      <AdminHeading back={{ href: `${base}/events`, label: t.events.back }}
        title={<>{eventTitle(ev.title, t.events.untitled)} <span className="align-middle"><StatusBadge value={ev.status} label={st[ev.status] ?? ev.status} /></span></>}
        sub={`${occName(ev.occasion, locale, ev.occasionCustom)} · ${fmtDateTime(ev.startsAt, locale)}${ev.venueName ? ` · ${ev.venueName}` : ""}${ev.city ? `, ${ev.city}` : ""}`}
        actions={access.checkin ? <Link className={btnQuiet} href={`${base}/checkin/${ev.id}`}>{t.events.openScanner}</Link> : undefined} />

      <section aria-label={t.events.stats} className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t.events.s_recipients} value={fmtNum(s.recipients)} sub={s.estimatedGuests ? `${t.events.estimated}: ${s.estimatedGuests}` : undefined} />
        <Kpi label={t.events.s_sent} value={fmtNum(s.sent)} sub={`${t.events.s_confirmedDelivered}: ${s.confirmedDelivered}`} />
        <Kpi label={t.events.s_accepted} value={fmtNum(s.accepted)} sub={`${t.events.s_seats}: ${s.seats}`} />
        <Kpi label={t.events.s_declined} value={fmtNum(s.declined)} />
        <Kpi label={t.events.s_awaiting} value={fmtNum(s.awaiting)} />
        <Kpi label={t.events.s_checkedIn} value={fmtNum(s.checkedIn)} />
        <Kpi label={t.events.s_notArrived} value={fmtNum(s.notYetArrived)} />
        <Kpi label={t.events.package} value={<span className="text-2xl">{d.event.packageName ? d.event.packageName[locale] : "—"}</span>} />
      </section>

      <div className="grid gap-6">
        <Panel title={t.events.guestsTitle} id="guests" note={t.events.guestsNote}
          actions={access.exportData ? <a className={btnQuiet} href={`/api/events/${ev.id}/guests.csv`}>{t.events.exportCsv}</a> : undefined}>
          <GuestManager eventId={ev.id} locale={locale} t={guestsCopy(locale)} canEdit={access.guests} canExport={access.exportData} />
        </Panel>

        <Panel title={t.events.assignments} id="assignments">
          <AssignmentsPanel eventId={ev.id} canAssign={d.canAssign} assignments={d.assignments} candidates={d.candidates}
            c={t.common}
            t={{ assignHelp: t.events.assignHelp, manager: t.events.manager, checkInRole: t.events.checkInRole, noAssigned: t.events.noAssigned, pickStaff: t.events.pickStaff, assign: t.events.assign, unassign: t.events.unassign, assignedOk: t.events.assignedOk, noCandidates: t.events.noCandidates, name: t.common.name, role: t.common.role, actions: t.common.actions, assignments: t.events.assignments, saving: t.common.saving, roles: t.roles }} />
        </Panel>

        <Panel title={t.events.checkinHistory} id="history">
          {d.history.length === 0 ? <Empty>{t.events.noHistory}</Empty> : (
            <TableWrap label={t.events.checkinHistory}>
              <table className={tableCls}>
                <thead><tr><Th>{t.common.when}</Th><Th>{t.common.guest}</Th><Th>{t.events.result}</Th><Th>{t.events.method}</Th><Th>{t.events.by}</Th></tr></thead>
                <tbody>
                  {d.history.map((h) => (
                    <tr key={h.id}>
                      <Td className="whitespace-nowrap">{fmtDateTime(h.at, locale)}</Td><Td>{h.guestName ?? "—"}</Td>
                      <Td><StatusBadge value={h.result} label={res[h.result] ?? h.result} /></Td><Td>{methods[h.method] ?? h.method}</Td><Td>{h.by ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        <Panel title={t.events.notifications} id="notifications" note={t.events.notifNote}>
          {d.messages.length === 0 ? <Empty>{t.events.noNotifications}</Empty> : (
            <TableWrap label={t.events.notifications}>
              <table className={tableCls}>
                <thead><tr><Th>{t.common.when}</Th><Th>{t.common.guest}</Th><Th>{t.common.kind}</Th><Th>{t.common.status}</Th><Th>{t.common.provider}</Th></tr></thead>
                <tbody>
                  {d.messages.map((m) => (
                    <tr key={m.id}>
                      <Td className="whitespace-nowrap">{fmtDateTime(m.at, locale)}</Td><Td>{m.guest || "—"}</Td><Td>{kinds[m.kind] ?? m.kind}</Td>
                      <Td><StatusBadge value={m.status} label={mst[m.status] ?? m.status} /></Td><Td>{(t.status.provider as Record<string, string>)[m.provider] ?? m.provider}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        {d.audit && (
          <Panel title={t.events.audit} id="audit">
            {d.audit.length === 0 ? <Empty>{t.events.noAudit}</Empty> : <AuditTable rows={d.audit} locale={locale} />}
          </Panel>
        )}
      </div>
      
    </>
  );
}
