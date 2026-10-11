import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { home } from "@/lib/i18n/home";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/** Four names separated by hairlines. No prices: pricing is not published yet. */
export function PackagesPreview({ locale, t }: { locale: Locale; t: H }) {
  return (
    <section id="packages" className="section">
      <div className="wrap">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.packages.eyebrow}</p>
          <h2 className="display-2 mt-6 text-balance">{t.packages.heading}</h2>
        </Reveal>
        <div className="mt-16 grid border-t border-line md:grid-cols-4">
          {t.packages.items.map((pkg, i) => (
            <Reveal key={i} delay={i * 0.08} className="border-b border-line py-10 md:border-b-0 md:border-s md:px-8 md:first:border-s-0 md:first:ps-0">
              <h3 className="display-3">{pkg.name}</h3>
              <p className="mt-4 min-h-[4.5rem] leading-8 text-ink-soft">{pkg.line}</p>
              <p className="tracked mt-6 text-[0.72rem] uppercase tracking-[0.22em] text-olive">{t.packages.soon}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-10"><Link href={`/${locale}/packages`} className="link-quiet tracked text-[0.78rem] uppercase tracking-[0.2em]">{t.packages.all}</Link></p>
      </div>
    </section>
  );
}
