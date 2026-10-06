import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { BrandMark } from "./brand-mark";
import { Button } from "./button";

type T = (typeof content)[Locale];

/** Calm, cinematic opening: the brand mark first, then tagline and actions fade in behind it. */
export function Hero({ t }: { t: T }) {
  return (
    <section id="home" className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center px-6 pb-20 pt-16 text-center">
      <BrandMark />

      <div className="rise mt-10 max-w-2xl" style={{ "--rise-delay": "1.4s" } as React.CSSProperties}>
        <p className="font-display text-3xl font-light italic text-ink sm:text-4xl">{t.hero.tagline}</p>
        <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-8 text-ink-soft">{t.hero.line}</p>
      </div>

      <div
        className="rise mt-10 flex flex-col items-center gap-4 sm:flex-row"
        style={{ "--rise-delay": "2.1s" } as React.CSSProperties}
      >
        <Button href="#contact">{t.hero.primary}</Button>
        <Button href="#about" variant="ghost">
          {t.hero.secondary}
        </Button>
      </div>

      <span aria-hidden className="rise absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-champagne to-transparent" style={{ "--rise-delay": "3s" } as React.CSSProperties} />
    </section>
  );
}
