import type { Locale } from "@/lib/i18n";
import type { home } from "@/lib/i18n/home";
import { Button } from "../ui/button";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/** Quiet closing call to action. */
export function FinalCta({ locale, t }: { locale: Locale; t: H }) {
  return (
    <section className="px-6 py-36 text-center sm:py-48">
      <Reveal className="mx-auto max-w-3xl">
        <span aria-hidden className="mx-auto mb-12 block h-14 w-px bg-champagne" />
        <h2 className="display-1 text-balance">
          {t.final.line1}
          <br />
          <span className="italic text-olive">{t.final.line2}</span>
        </h2>
        <div className="mt-14"><Button href={`/${locale}/begin`}>{t.final.button}</Button></div>
      </Reveal>
    </section>
  );
}
