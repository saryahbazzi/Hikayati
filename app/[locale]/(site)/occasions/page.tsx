import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/reveal";
import { occasionByKey } from "@/lib/domain/occasions";
import { isLocale } from "@/lib/i18n";
import { pages } from "@/lib/i18n/pages";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${pages(locale).occasions.meta} · Hikayati · حكايتي` : "Hikayati" };
}

const GROUPS: { key: "weddings" | "celebrations" | "gatherings" | "corporate"; items: string[] }[] = [
  { key: "weddings", items: ["wedding", "engagement_party", "engagement_dinner", "katb_kitab", "malka", "henna_night", "bridal_shower"] },
  { key: "celebrations", items: ["birthday", "birthday_brunch", "baby_shower", "graduation", "anniversary"] },
  { key: "gatherings", items: ["dinner_gathering", "iftar", "eid_gathering", "private_celebration"] },
  { key: "corporate", items: ["corporate_event", "product_launch", "other"] },
];

export default async function OccasionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages(locale).occasions;
  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="grid gap-16 md:grid-cols-2">
        {GROUPS.map((g, gi) => (
          <Reveal key={g.key} delay={(gi % 2) * 0.1}>
            <h2 className="eyebrow">{t.groups[g.key]}</h2>
            <ul className="mt-4">
              {g.items.map((k) => {
                const o = occasionByKey(k)!;
                return (
                  <li key={k}>
                    <Link href={`/${locale}/begin?occasion=${k}`} className="group flex items-baseline justify-between gap-4 border-b border-line py-4 transition-colors hover:border-champagne" aria-label={`${o[locale]} — ${t.start}`}>
                      <span className="font-display text-2xl font-light transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-olive rtl:group-hover:-translate-x-1.5 sm:text-3xl">{o[locale]}</span>
                      <span aria-hidden className="text-sm text-taupe opacity-0 transition-opacity group-hover:opacity-100">{locale === "ar" ? "←" : "→"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        ))}
      </div>
      <p className="mt-16"><Link href={`/${locale}/templates`} className="link-quiet tracked text-[0.78rem] uppercase tracking-[0.2em]">{t.designs}</Link></p>
    </PageShell>
  );
}
