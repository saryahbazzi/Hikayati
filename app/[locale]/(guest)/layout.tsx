import { notFound } from "next/navigation";
import Link from "next/link";
import { LanguageToggle } from "@/components/site/language-toggle";
import { Wordmark } from "@/components/site/wordmark";
import { DemoBanner } from "@/components/site/demo-banner";
import { isLocale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";

/** Guest pages: no site navigation, just the brand and a language switch. */
export default async function GuestLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = common(locale);
  return (
    <div className="min-h-screen">
      <DemoBanner text={t.demo.banner} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href={`/${locale}`} aria-label="Hikayati — حكايتي"><Wordmark /></Link>
        <LanguageToggle locale={locale} label={t.nav.language} />
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
