import { notFound } from "next/navigation";
import { content, isLocale } from "@/lib/content";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Intro } from "@/components/intro";
import { Showcase } from "@/components/showcase";
import { Steps } from "@/components/steps";
import { Occasions } from "@/components/occasions";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = content[locale];
  return (
    <>
      <Header locale={locale} t={t} />
      <main>
        <Hero t={t} />
        <Intro t={t} />
        <Showcase t={t} />
        <Steps t={t} locale={locale} />
        <Occasions t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </>
  );
}
