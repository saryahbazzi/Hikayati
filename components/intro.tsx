import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { Reveal } from "./reveal";

type T = (typeof content)[Locale];

/** Text-led introduction. */
export function Intro({ t }: { t: T }) {
  return (
    <section id="about" className="px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="tracked text-[0.72rem] uppercase tracking-[0.32em] text-olive">{t.intro.eyebrow}</p>
          <span aria-hidden className="mx-auto mt-6 block h-10 w-px bg-champagne" />
        </Reveal>
        <Reveal delay={0.12}>
          <h2 className="font-display mt-10 text-5xl font-light leading-[1.1] text-ink sm:text-7xl">{t.intro.heading}</h2>
        </Reveal>
        <Reveal delay={0.24}>
          <p className="mx-auto mt-10 max-w-2xl text-lg leading-9 text-ink-soft">{t.intro.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
