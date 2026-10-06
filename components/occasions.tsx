import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { Reveal } from "./reveal";

type T = (typeof content)[Locale];

/** Editorial index of occasions: hairline rows that slide and warm to olive on hover. */
export function Occasions({ t }: { t: T }) {
  return (
    <section id="occasions" className="relative bg-bone/60 px-6 py-28 sm:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-5xl">
        <Reveal as="h2" className="font-display text-center text-4xl font-light sm:text-6xl">
          {t.occasions.heading}
        </Reveal>
        <ul className="mt-20 grid gap-x-16 md:grid-cols-2">
          {t.occasions.items.map((name, i) => (
            <Reveal as="li" key={name} delay={(i % 4) * 0.08}>
              <div className="group flex cursor-default items-baseline gap-5 border-b border-line py-6 transition-colors duration-500 hover:border-champagne">
                <span className="font-display w-8 text-sm text-taupe">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display flex-1 text-2xl font-light text-ink transition-all duration-500 group-hover:translate-x-2 group-hover:text-olive rtl:group-hover:-translate-x-2 sm:text-3xl">
                  {name}
                </span>
                <span aria-hidden className="h-px w-0 bg-champagne transition-all duration-500 group-hover:w-8" />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
