import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/lib/i18n";
import { pages } from "@/lib/i18n/pages";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${pages(locale).about.meta} · Hikayati · حكايتي` : "Hikayati" };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages(locale).about;
  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="grid gap-14 md:grid-cols-3 md:gap-10">
        {t.blocks.map((b, i) => (
          <Reveal key={i} delay={i * 0.1} className="border-t border-line pt-8 md:[&:nth-child(2)]:mt-12">
            <h2 className="display-3">{b.h}</h2>
            <p className="mt-4 leading-8 text-ink-soft">{b.b}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-24"><Button href={`/${locale}/begin`}>{t.cta}</Button></div>
    </PageShell>
  );
}
