import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/site/contact-form";
import { PageShell } from "@/components/site/page-shell";
import { isLocale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";
import { pages } from "@/lib/i18n/pages";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${pages(locale).contact.meta} · Hikayati · حكايتي` : "Hikayati" };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages(locale).contact;
  const f = common(locale).footer;
  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
        <ContactForm locale={locale} t={t} />
        <div>
          <h2 className="eyebrow">{t.details}</h2>
          <dl className="mt-5 space-y-4 text-[0.98rem]">
            <div className="border-b border-line pb-4"><dt className="text-xs uppercase tracking-[0.2em] text-taupe">{f.email}</dt><dd dir="ltr" className="mt-1 text-start">hikayati@gmail.com <span className="text-xs text-taupe">({f.placeholder})</span></dd></div>
            <div className="border-b border-line pb-4"><dt className="text-xs uppercase tracking-[0.2em] text-taupe">{f.phone}</dt><dd dir="ltr" className="mt-1 text-start">{f.phoneValue} <span className="text-xs text-taupe">({f.placeholder})</span></dd></div>
            <div className="border-b border-line pb-4"><dt className="text-xs uppercase tracking-[0.2em] text-taupe">{f.location}</dt><dd className="mt-1">{f.locationValue}</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-taupe">{f.placeholderNote}</p>
        </div>
      </div>
    </PageShell>
  );
}
