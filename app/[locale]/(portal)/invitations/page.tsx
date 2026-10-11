import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice, PageHeading } from "@/components/ui/misc";
import { orderedEvents } from "@/components/portal/event-list";
import { EventStatusBadge } from "@/components/portal/status";
import { fmtDate } from "@/components/portal/util";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { getDb } from "@/lib/server/db";
import { listMyEvents } from "@/lib/server/events";
import { listGuests, type GuestRow } from "@/lib/server/guests";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitations · Hikayati", robots: { index: false } };

const tally = (guests: GuestRow[]) => ({
  notSent: guests.filter((g) => g.invitationStatus !== "revoked" && !g.sentAt).length,
  sent: guests.filter((g) => g.invitationStatus === "sent").length,
  opened: guests.filter((g) => g.invitationStatus === "opened").length,
  replied: guests.filter((g) => g.invitationStatus === "responded").length,
  revoked: guests.filter((g) => g.invitationStatus === "revoked").length,
});

export default async function InvitationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const db = await getDb();
  const actor = await requireActor(locale);
  const t = portalCopy(locale);
  const events = orderedEvents(await listMyEvents(db, actor));
  // Collaborators who can’t see guest details only get a link to the event.
  const rows = await Promise.all(events.map(async (e) => {
    try { return { e, n: tally(await listGuests(db, actor, e.id)) }; } catch { return { e, n: null }; }
  }));
  const c = t.gl.invCols;

  return (
    <>
      <PageHeading title={t.gl.invTitle} sub={t.gl.invSub} />
      {rows.length === 0 ? (
        <EmptyState title={t.gl.invEmpty} body={t.gl.invEmptyBody} action={<Button href={`/${locale}/my-events`}>{t.events.title}</Button>} />
      ) : (
        <>
          <div className="mb-6"><Notice tone="demo">{t.gu.simBanner}</Notice></div>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[56rem] text-sm" data-testid="invitations-table">
              <caption className="sr-only">{t.gl.invTitle}</caption>
              <thead className="bg-bone/60 text-xs uppercase tracking-wider text-taupe">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-normal">{c.event}</th>
                  <th scope="col" className="px-4 py-3 text-start font-normal">{c.date}</th>
                  {[c.notSent, c.sent, c.opened, c.replied, c.revoked].map((h) => <th key={h} scope="col" className="px-4 py-3 text-center font-normal">{h}</th>)}
                  <th scope="col" className="px-4 py-3 text-end font-normal">{c.act}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ e, n }) => (
                  <tr key={e.id} data-testid="invitation-row">
                    <th scope="row" className="px-4 py-4 text-start font-normal">
                      <Link href={`/${locale}/my-events/${e.id}`} className="link-quiet font-display text-lg">{e.title || t.events.untitled}</Link>
                      <span className="mt-1 block"><EventStatusBadge status={e.status} locale={locale} /></span>
                    </th>
                    <td className="whitespace-nowrap px-4 py-4 text-ink-soft">{e.startsAt ? fmtDate(e.startsAt, locale) : t.ws.dateTbd}</td>
                    {n ? [n.notSent, n.sent, n.opened, n.replied, n.revoked].map((v, i) => <td key={i} className="px-4 py-4 text-center font-display text-xl">{v}</td>) : <td colSpan={5} className="px-4 py-4 text-center text-ink-soft">—</td>}
                    <td className="px-4 py-4 text-end">
                      <span className="inline-flex flex-wrap justify-end gap-x-5 gap-y-1">
                        <Link href={`/${locale}/my-events/${e.id}/invitation`} className="link-quiet text-xs">{t.gl.preview}</Link>
                        {n && <Link href={`/${locale}/my-events/${e.id}/guests#invitation-actions`} className="link-quiet text-xs">{t.gl.sendDemo}</Link>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
