import type { home } from "@/lib/i18n/home";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/** Create → Personalise → Share → Welcome. Staggered along a single hairline; no cards, no icons. */
export function HowItWorks({ t }: { t: H }) {
  return (
    <section id="how" className="section">
      <div className="wrap">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.how.eyebrow}</p>
          <h2 className="display-2 mt-6 text-balance">{t.how.heading}</h2>
        </Reveal>
        <ol className="relative mt-20 grid gap-12 md:grid-cols-4 md:gap-8">
          <span aria-hidden className="absolute inset-x-0 top-[2.15rem] hidden h-px bg-line md:block" />
          {t.how.steps.map((s, i) => (
            <Reveal as="li" key={i} delay={i * 0.12} className="relative">
              <span className="relative inline-block bg-ivory pe-4 font-display text-5xl font-light text-champagne">{s.n}</span>
              <h3 className="display-3 mt-6">{s.title}</h3>
              <p className="mt-3 max-w-[16rem] leading-8 text-ink-soft">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
