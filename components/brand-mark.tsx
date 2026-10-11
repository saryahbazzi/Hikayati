import { WORDMARK } from "@/lib/wordmark";

/**
 * Arabic «حِكَايَتِي» as a refined calligraphic wordmark: classical Naskh letterforms (Amiri, SIL OFL), fully
 * vocalised, shaped once at design time and drawn as clean vector outlines (lib/wordmark.ts).
 *
 * REPLACEMENT SLOT: for bespoke hand-lettered calligraphy, regenerate lib/wordmark.ts (scripts/build-wordmark.mjs)
 * or supply one in the same shape. Nothing else needs to change.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={WORDMARK.viewBox} className={className} role="img" aria-label="حِكَايَتِي" fill="currentColor">
      {WORDMARK.glyphs.map((g, i) => (
        <path key={i} d={g.d} transform={g.transform} />
      ))}
    </svg>
  );
}

/**
 * Hero lockup: HIKAYATI and حِكَايَتِي face each other across a hairline, matched in optical weight.
 * The Latin name never moves; the Arabic eases in. Stacks on small screens (Latin above, Arabic below).
 */
export function BrandMark({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-[70rem]" dir="ltr">
      <h1 className="sr-only">{label}</h1>
      <div className="flex flex-col items-center gap-7 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12 lg:gap-16">
        <p
          aria-hidden
          className="text-center font-light leading-none text-ink md:text-end"
          style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.3rem, 7vw, 5.7rem)", letterSpacing: "0.16em", marginInlineEnd: "-0.16em" }}
        >
          HIKAYATI
        </p>

        <span aria-hidden className="mark-rule relative h-px w-24 bg-champagne md:h-40 md:w-px">
          <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-champagne md:h-[7px]" />
        </span>

        <div className="mark-arabic flex justify-center md:justify-start">
          <Wordmark className="h-[clamp(5.6rem,12.4vw,10.4rem)] w-auto text-olive" />
        </div>
      </div>
    </div>
  );
}
