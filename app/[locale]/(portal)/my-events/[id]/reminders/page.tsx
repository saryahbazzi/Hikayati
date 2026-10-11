import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/misc";
import { getWorkspace } from "@/components/portal/event-data";
import { RemindersPanel } from "@/components/portal/reminders-panel";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { listGuests } from "@/lib/server/guests";
import { listReminders, type Audience } from "@/lib/server/reminders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event reminders · Hikayati", robots: { index: false } };

export default async function EventReminders({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { db, actor, row, access } = await getWorkspace(locale, id);
  const t = portalCopy(locale);
  const rules = await listReminders(db, actor, id);
  // Who would receive a reminder today: invited, not revoked / opted out, split by reply.
  const guests = access.guests || access.manage ? await listGuests(db, actor, id) : [];
  const live = guests.filter((g) => !!g.sentAt && g.invitationStatus !== "revoked" && !g.optedOut);
  const counts: Record<Audience, number> = {
    not_responded: live.filter((g) => g.rsvp === "pending").length,
    confirmed: live.filter((g) => g.rsvp === "accepted").length,
    all_invited: live.filter((g) => g.rsvp !== "declined").length,
  };
  return (
    <>
      <PageHeading title={t.rem.title} sub={t.rem.sub} />
      <RemindersPanel
        event={{ id, title: row.title, startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null, venue: row.venue_name, timezone: row.timezone, language: row.invitation_language, status: row.status }}
        locale={locale} rules={rules} audienceCounts={counts} canManage={access.manage} />
    </>
  );
}
