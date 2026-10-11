import { notFound } from "next/navigation";
import { AdminHeading, Panel } from "@/components/admin/ui";
import { Badge, Notice } from "@/components/ui/misc";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { platformStatus } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "settings.manage", `/${locale}/admin/settings`);
  const t = adminCopy(locale);
  const s = t.settings;
  const st = await platformStatus(await getDb(), actor);
  const rows: { k: string; v: React.ReactNode }[] = [
    { k: s.environment, v: <Badge tone={st.production ? "ink" : "champagne"}>{st.production ? s.production : s.development}</Badge> },
    { k: s.demoAccess, v: <span><Badge tone={st.demoAccess ? "champagne" : "olive"}>{st.demoAccess ? t.common.enabled : s.demoOff}</Badge> {st.demoAccess && <span className="block pt-1 text-xs text-ink-soft">{s.demoOn}</span>}</span> },
    { k: s.provider, v: <span>{st.provider === "demo" ? s.providerDemo : s.providerWa}</span> },
    { k: s.database, v: <span>{st.driver === "pglite" ? s.driverPglite : s.driverPg} · <Badge tone={st.ephemeral ? "danger" : "olive"}>{st.ephemeral ? s.ephemeral : s.persistent}</Badge></span> },
    { k: s.otp, v: <span>{st.otpConfigured ? s.otpYes : s.otpNo}</span> },
    { k: s.tax, v: <span dir="ltr">{Math.round(st.taxRate * 10000) / 100}%</span> },
    { k: s.pricing, v: <span>{s.pricingSoon}</span> },
    { k: s.payments, v: <span>{s.paymentsOff}</span> },
  ];
  return (
    <>
      <AdminHeading title={s.title} sub={s.sub} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title={s.environment} id="env">
          <dl className="grid gap-3 text-sm">
            {rows.map((r) => <div key={r.k} className="grid gap-1 border-b border-line/70 pb-3 sm:grid-cols-[11rem_1fr]"><dt className="text-ink-soft">{r.k}</dt><dd>{r.v}</dd></div>)}
          </dl>
        </Panel>
        <div className="grid content-start gap-6">
          <Panel title={s.counts} id="counts">
            <dl className="grid grid-cols-3 gap-3 text-sm">
              {[[s.users, st.counts.users], [s.events, st.counts.events], [s.guests, st.counts.guests]].map(([k, v]) => <div key={String(k)}><dt className="text-xs text-ink-soft">{k}</dt><dd className="font-display text-3xl" dir="ltr" style={{ textAlign: "start" }}>{v}</dd></div>)}
            </dl>
          </Panel>
          <Panel title={s.placeholders} id="placeholders"><Notice tone="info">{s.placeholdersNote}</Notice></Panel>
        </div>
      </div>
    </>
  );
}
