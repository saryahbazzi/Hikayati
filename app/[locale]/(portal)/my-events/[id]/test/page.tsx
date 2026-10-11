import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPreview, getWorkspace } from "@/components/portal/event-data";
import { TestFlow } from "@/components/portal/test-flow";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Test the invitation · Hikayati", robots: { index: false } };

export default async function EventTest({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const ws = await getWorkspace(locale, id);
  if (!ws.access.manage) notFound();
  const data = await buildPreview(ws);
  return <TestFlow eventId={id} locale={locale} eventStatus={ws.row.status} data={data} defaultLang={ws.row.invitation_language === "en" ? "en" : "ar"} canCheckin={ws.access.checkin} guestsHref={`/${locale}/my-events/${id}/guests`} />;
}
