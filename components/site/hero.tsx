import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { home } from "@/lib/i18n/home";
import { BrandMark } from "../brand-mark";
import { Button } from "../ui/button";

type H = ReturnType<typeof home>;

/** Calm, cinematic opening: the wordmark writes itself, then the words arrive. */
export function Hero({ locale, t }: { locale: Locale; t: H }) {
  const base = `/${locale}`;
  return (
    <section id="top" className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center px-6 pb-20 pt-10 text-center sm:pt-14">
      <BrandMark label={t.hero.sr} />
      <div className="rise mt-8 max-w-2xl sm:mt-12" style={{ "--rise-delay": "1.8s" } as React.CSSProperties}>
        <p className="display-3 italic text-ink">{t.hero.tagline}</p>
        <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-8 text-ink-soft">{t.hero.line}</p>
      </div>
      <div className="rise mt-9 flex flex-col items-center gap-5 sm:flex-row sm:gap-8" style={{ "--rise-delay": "2.2s" } as React.CSSProperties}>
        <Button href={`${base}/begin`}>{t.hero.primary}</Button>
        <Button href="#about" variant="quiet">{t.hero.secondary}</Button>
      </div>
      <Link href="#about" aria-hidden tabIndex={-1} className="rise absolute bottom-6 start-1/2 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-champagne to-transparent" style={{ "--rise-delay": "2.6s" } as React.CSSProperties} />
    </section>
  );
}
