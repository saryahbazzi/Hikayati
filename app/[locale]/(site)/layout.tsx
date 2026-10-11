import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { DemoBanner } from "@/components/site/demo-banner";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = common(locale);
  return (
    <>
      <DemoBanner text={t.demo.banner} />
      <Header locale={locale} t={t} />
      <main id="main">{children}</main>
      <Footer locale={locale} t={t} />
    </>
  );
}
