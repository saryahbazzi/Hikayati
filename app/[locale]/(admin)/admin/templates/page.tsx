import { notFound } from "next/navigation";
import { AdminHeading } from "@/components/admin/ui";
import { TemplatesAdmin } from "@/components/admin/templates-admin";
import { isLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/i18n/admin";
import { adminListTemplates } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";
import { requirePermission } from "@/lib/server/session";

export default async function AdminTemplates({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requirePermission(locale, "templates.manage", `/${locale}/admin/templates`);
  const t = adminCopy(locale);
  const templates = await adminListTemplates(await getDb(), actor);
  return (
    <>
      <AdminHeading title={t.templates.title} sub={t.templates.sub} />
      <TemplatesAdmin templates={templates} locale={locale} t={t} />
    </>
  );
}
