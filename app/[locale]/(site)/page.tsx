import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { home } from "@/lib/i18n/home";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { Showcase } from "@/components/site/showcase";
import { HowItWorks } from "@/components/site/how-it-works";
import { OccasionsSection } from "@/components/site/occasions-section";
import { PackagesPreview } from "@/components/site/packages-preview";
import { FinalCta } from "@/components/site/final-cta";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = home(locale);
  return { title: t.meta.title, description: t.meta.description, alternates: { languages: { en: "/en", ar: "/ar" } } };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = home(locale);
  return (
    <>
      <Hero locale={locale} t={t} />
      <About locale={locale} t={t} />
      <Showcase t={t} />
      <HowItWorks t={t} />
      <OccasionsSection locale={locale} t={t} />
      <PackagesPreview locale={locale} t={t} />
      <FinalCta locale={locale} t={t} />
    </>
  );
}
