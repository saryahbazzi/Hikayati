import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { isLocale } from "@/lib/i18n";
import { pages } from "@/lib/i18n/pages";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${pages(locale).legal.privacy.title} · Hikayati · حكايتي` : "Hikayati" };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages(locale).legal;
  const doc = t.privacy;
  return (
    <PageShell eyebrow={doc.title} title={doc.title} narrow>
      <p className="border border-champagne bg-champagne/15 px-4 py-3 text-sm text-[#6b5a2c]">{t.draft}</p>
      <div className="mt-10 space-y-10">
        {doc.sections.map((s, i) => (
          <section key={i}><h2 className="display-3">{s.h}</h2><p className="mt-3 leading-8 text-ink-soft">{s.b}</p></section>
        ))}
      </div>
    </PageShell>
  );
}
