import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { Button } from "./button";
import { Reveal } from "./reveal";

type T = (typeof content)[Locale];

/** Quiet closing call to action. */
export function FinalCta({ t }: { t: T }) {
  return (
    <section className="px-6 py-36 text-center sm:py-48">
      <Reveal className="mx-auto max-w-3xl">
        <span aria-hidden className="mx-auto mb-12 block h-14 w-px bg-champagne" />
        <h2 className="font-display text-4xl font-light leading-[1.25] sm:text-6xl">
          {t.final.line1}
          <br />
          <span className="italic text-olive">{t.final.line2}</span>
        </h2>
        <div className="mt-14">
          <Button href="#contact">{t.final.button}</Button>
        </div>
      </Reveal>
    </section>
  );
}
