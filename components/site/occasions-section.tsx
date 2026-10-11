import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { home } from "@/lib/i18n/home";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/** Large editorial index; rows slide and warm to olive on hover. */
export function OccasionsSection({ locale, t }: { locale: Locale; t: H }) {
  return (
    <section id="occasions" className="section band relative">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">{t.occasions.eyebrow}</p>
          <h2 className="display-2 mt-6 text-balance">{t.occasions.heading}</h2>
          <p className="mt-10"><Link href={`/${locale}/occasions`} className="link-quiet tracked text-[0.78rem] uppercase tracking-[0.2em]">{t.occasions.all}</Link></p>
        </Reveal>
        <ul className="lg:col-span-8 lg:col-start-5">
          {t.occasions.list.map((name, i) => (
            <Reveal as="li" key={name} delay={(i % 4) * 0.06}>
              <div className="group flex cursor-default items-baseline gap-6 border-b border-line py-5 transition-colors duration-500 hover:border-champagne">
                <span className="font-display w-8 text-sm text-taupe">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display flex-1 text-3xl font-light transition-all duration-500 group-hover:translate-x-2 group-hover:text-olive rtl:group-hover:-translate-x-2 sm:text-4xl">{name}</span>
                <span aria-hidden className="h-px w-0 bg-champagne transition-all duration-500 group-hover:w-10" />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
