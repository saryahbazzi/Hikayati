import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/ui";
import { PackagesAdmin } from "@/components/admin/packages-admin";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminPricing } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminPackages({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "packages.manage", `/${locale}/admin/packages`);
  const t = adminCopy(locale);
  const d = await adminPricing(await getDb(), actor);
  return (
    <>
      <AdminHeading title={t.packages.title} />
      <PackagesAdmin packages={d.packages} addons={d.addons} discounts={d.discounts} taxRate={d.taxRate} locale={locale} t={t} />
    </>
  );
}
