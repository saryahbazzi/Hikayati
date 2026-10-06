import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { Reveal } from "./reveal";

type T = (typeof content)[Locale];

const numerals = {
  en: ["01", "02", "03", "04"],
  ar: ["٠١", "٠٢", "٠٣", "٠٤"],
};

/** Four quiet steps: numeral, hairline, title, line of copy. No icons. */
export function Steps({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-center text-4xl font-light sm:text-6xl">
          {t.steps.heading}
        </Reveal>
        <ol className="mt-20 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {t.steps.items.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.12} className="relative">
              <span className="font-display block text-5xl font-light text-champagne">{numerals[locale][i]}</span>
              <span aria-hidden className="my-6 block h-px w-full bg-line" />
              <h3 className="font-display text-3xl font-normal">{s.title}</h3>
              <p className="mt-3 max-w-[16rem] leading-8 text-ink-soft">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
