import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuestsWorkspace } from "@/components/portal/guests-workspace";
import { getWorkspace } from "@/components/portal/event-data";
import { Notice } from "@/components/ui/misc";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event guests · Hikayati", robots: { index: false } };

export default async function EventGuests({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { row, access } = await getWorkspace(locale, id);
  if (!access.guests) notFound();
  const t = portalCopy(locale);
  return (
    <div className="space-y-6">
      {!access.manage && <Notice>{t.gu.viewOnlyNote}</Notice>}
      <GuestsWorkspace eventId={id} locale={locale} eventStatus={row.status} defaultLang={row.invitation_language === "en" ? "en" : "ar"}
        canEdit={access.guests && row.status !== "cancelled"} canExport={access.exportData} canManage={access.manage} canGuests={access.guests} />
    </div>
  );
}
