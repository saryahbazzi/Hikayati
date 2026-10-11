import { notFound, redirect } from "next/navigation";
import { AdminHeading, StatusBadge } from "@/components/admin/ui";
import { CheckinConsole } from "@/components/admin/checkin-console";
import { eventTitle, fmtDateTime, occName } from "@/components/admin/format";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { getCheckinPanel } from "@/lib/server/admin";
import { requireSection } from "@/lib/server/admin-guard";
import { getDb } from "@/lib/server/db";
import { ForbiddenError, NotFoundError } from "@/lib/server/permissions";

export default async function AdminCheckinEvent({ params }: { params: Promise<{ locale: string; eventId: string }> }) {
  const { locale, eventId } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireSection(locale, "checkin", `/${locale}/admin/checkin/${eventId}`);
  const t = adminCopy(locale);
  let panel;
  try { panel = await getCheckinPanel(await getDb(), actor, eventId); }
  catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof ForbiddenError) redirect(`/${locale}/not-authorized`);
    throw e;
  }
  const ev = panel.event;
  return (
    <>
      <AdminHeading back={{ href: `/${locale}/admin/checkin`, label: t.checkin.back }}
        title={<>{eventTitle(ev.title, t.events.untitled)} <span className="align-middle"><StatusBadge value={ev.status} label={(t.status.event as Record<string, string>)[ev.status] ?? ev.status} /></span></>}
        sub={`${occName(ev.occasion, locale, ev.occasionCustom)} · ${fmtDateTime(ev.startsAt, locale)}${ev.venueName ? ` · ${ev.venueName}` : ""}`} />
      <CheckinConsole initial={panel} locale={locale} t={t} />
    </>
  );
}
