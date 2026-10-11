import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui/misc";
import { getWorkspace } from "@/components/portal/event-data";
import { EventTabs } from "@/components/portal/event-tabs";
import { EventStatusBadge } from "@/components/portal/status";
import { fmtDateTime } from "@/components/portal/util";
import { occasionLabel } from "@/lib/domain/occasions";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";

export const dynamic = "force-dynamic";

/** Shared chrome for one event: title, status and the section tabs. Tabs are gated by what the actor may do. */
export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const ws = await getWorkspace(locale, id);
  const { row, access } = ws;
  if (row.status === "draft") redirect(`/${locale}/begin?event=${id}`);
  const t = portalCopy(locale);
  const base = `/${locale}/my-events/${id}`;
  const tabs = [
    { href: base, label: t.ws.tabs.overview, exact: true },
    ...(access.guests ? [{ href: `${base}/guests`, label: t.ws.tabs.guests }] : []),
    { href: `${base}/invitation`, label: t.ws.tabs.invitation },
    { href: `${base}/reminders`, label: t.ws.tabs.reminders },
    ...(access.manage ? [{ href: `${base}/test`, label: t.ws.tabs.test }] : []),
  ];
  const when = fmtDateTime(row.starts_at ? new Date(row.starts_at).toISOString() : null, locale, row.timezone);
  return (
    <>
      <Link href={`/${locale}/my-events`} className="link-quiet mb-6 text-sm text-ink-soft"><span aria-hidden className="rtl:hidden">← </span><span aria-hidden className="hidden rtl:inline">→ </span>{t.c.back}</Link>
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <EventStatusBadge status={row.status} locale={locale} />
          <span className="text-sm text-taupe">{occasionLabel(row.occasion, locale, row.occasion_custom)}</span>
          {!access.manage && <span className="text-sm text-taupe">· {t.c.viewOnly}</span>}
        </div>
        <h1 className="display-3 mt-3 !text-[clamp(1.9rem,3.4vw,2.6rem)]" data-testid="event-title">{row.title}</h1>
        <p className="mt-1 text-ink-soft">{[when || t.ws.dateTbd, row.venue_name, row.city].filter(Boolean).join(" · ")}</p>
      </header>
      {row.status === "cancelled" && <div className="mb-6"><Notice tone="error">{t.ws.cancelledBanner}</Notice></div>}
      <EventTabs tabs={tabs} label={t.ws.tabs.label} />
      <div className="pt-10">{children}</div>
    </>
  );
}
