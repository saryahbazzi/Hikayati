import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { formatMinor } from "@/lib/domain/pricing";
import { isLocale } from "@/lib/i18n";
import { pages } from "@/lib/i18n/pages";
import { listPackages } from "@/lib/server/catalog";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${pages(locale).packages.meta} · Hikayati · حكايتي` : "Hikayati" };
}

/** Packages come from the database, so staff edits in the admin portal appear here. Prices are shown only when staff publish them. */
export default async function PackagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages(locale).packages;
  const pkgs = await listPackages(await getDb(), { publicOnly: true });
  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="grid border-t border-line md:grid-cols-2 xl:grid-cols-4">
        {pkgs.map((pkg, i) => {
          const published = pkg.pricingStatus === "published";
          const flat = pkg.prices.find((x) => x.active && x.model === "flat");
          const per = pkg.prices.filter((x) => x.active && x.model === "per_guest").sort((a, b) => a.amountMinor - b.amountMinor)[0];
          const sub = pkg.prices.find((x) => x.active && x.model === "subscription");
          const maxGuests = typeof pkg.limits.maxGuests === "number" ? pkg.limits.maxGuests : null;
          return (
            <Reveal key={pkg.id} delay={i * 0.08} className="flex flex-col border-b border-line py-10 md:border-s md:px-8 md:first:border-s-0 md:first:ps-0 xl:border-b-0">
              <h2 className="display-3">{pkg.name[locale]}</h2>
              <p className="mt-3 min-h-[4rem] leading-7 text-ink-soft">{pkg.tagline[locale]}</p>
              <p className="tracked mt-5 text-[0.74rem] uppercase tracking-[0.2em] text-olive" data-testid="pkg-price">
                {published ? [flat && `${formatMinor(flat.amountMinor, locale)}`, per && `+ ${formatMinor(per.amountMinor, locale)} ${t.perGuest}`, sub && `${formatMinor(sub.amountMinor, locale)} ${t.perMonth}`].filter(Boolean).join(" ") : t.soon}
              </p>
              {maxGuests && <p className="mt-3 text-sm text-ink-soft">{t.upTo} {maxGuests.toLocaleString("en-US")} {t.guests}</p>}
              <p className="eyebrow mt-8">{t.included}</p>
              <ul className="mt-3 flex-1 space-y-2.5 text-[0.98rem] leading-7">
                {pkg.features.map((f, k) => <li key={k} className="flex gap-3"><span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-champagne" />{f[locale]}</li>)}
              </ul>
              <div className="mt-10"><Button href={`/${locale}/begin?package=${pkg.slug}`} variant="secondary" size="sm">{t.begin}</Button></div>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-12 max-w-2xl text-sm leading-6 text-taupe">{t.note}</p>
    </PageShell>
  );
}
