import { notFound } from "next/navigation";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { DemoBanner } from "@/components/site/demo-banner";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { common } from "@/lib/i18n/common";
import { sectionsFor, type Section } from "@/lib/server/admin";
import { requirePermission } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const PATH: Record<Section, string> = {
  overview: "", events: "/events", customers: "/customers", guests: "/guests", templates: "/templates", packages: "/packages",
  messaging: "/messaging", checkin: "/checkin", reports: "/reports", team: "/team", settings: "/settings", audit: "/audit",
};

/**
 * Staff area. The gate is server-side: signed in AND holding `staff.portal`, otherwise redirect
 * (customers land on /not-authorized). Nav links shown are cosmetic; every page and action re-checks.
 */
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "staff.portal", `/${locale}/admin`);
  const t = adminCopy(locale);
  const c = common(locale);
  const items: AdminNavItem[] = sectionsFor(actor).map((s) => ({
    key: s, href: `/${locale}/admin${PATH[s]}`,
    label: s === "events" && actor.role === "event_manager" ? t.nav.myEvents : t.nav[s],
  }));
  return (
    <div className="min-h-screen">
      <DemoBanner text={c.demo.banner} />
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <AdminNav items={items} locale={locale} userName={actor.fullName || actor.phone || ""} roleLabel={t.roles[actor.role]}
          labels={{ menu: t.nav.menu, sections: t.nav.sections, signOut: c.nav.signOut, language: c.nav.language, title: t.title, signedInAs: t.nav.signedInAs, publicSite: t.nav.publicSite, skip: t.nav.skip }} />
        <main id="main" className="mx-auto w-full min-w-0 max-w-[80rem] px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
