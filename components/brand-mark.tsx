import { CALLIGRAPHY } from "@/lib/calligraphy";

/**
 * Arabic «حِكَايَتِي» as live calligraphy.
 *
 * The letterforms are real outlines (Amiri, SIL OFL) shaped with HarfBuzz — including the fatha/kasra marks —
 * by scripts/build-calligraphy.mjs. Each glyph sits behind an SVG <mask> holding hand-placed pen strokes that
 * are drawn on in writing order (CSS `stroke-dashoffset`, see `.hk-pen` in globals.css): the body letters
 * right-to-left, then the dots, then the vowel marks last, as a calligrapher would. It is NOT a clipping wipe.
 *
 * REPLACEMENT SLOT: to use bespoke hand-drawn calligraphy, regenerate lib/calligraphy.ts (or write one in
 * the same shape: glyph outline `d` + `strokes` pen paths + `dots`). Nothing else needs to change.
 */
export function Calligraphy({ className = "" }: { className?: string }) {
  const { viewBox, glyphs } = CALLIGRAPHY;
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label="حِكَايَتِي" fill="currentColor">
      <defs>
        {glyphs.map((g, i) => (
          <mask key={i} id={`hk-mask-${i}`} maskUnits="userSpaceOnUse" x="-200" y="-1100" width="3200" height="2000">
            {g.strokes.map((s, j) => (
              <path
                key={j}
                d={s.d}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth={s.w}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hk-pen"
                style={{ "--at": `${s.at}s`, "--dur": `${s.dur}s` } as React.CSSProperties}
              />
            ))}
            {g.dots.map((c, j) => (
              <circle key={j} cx={c.cx} cy={c.cy} r={c.r} fill="#fff" className="hk-dot" style={{ "--at": `${c.at}s` } as React.CSSProperties} />
            ))}
          </mask>
        ))}
      </defs>
      {glyphs.map((g, i) => (
        <g key={i} mask={`url(#hk-mask-${i})`}>
          <path d={g.d} transform={g.transform} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Hero lockup. The Arabic is large and tilted, written across the page; HIKAYATI sits still on top of its
 * lower edge so the two layer like a signature over letterpress. Both stay visible when the writing ends.
 */
export function BrandMark({ label }: { label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[62rem]" dir="ltr">
      <h1 className="sr-only">{label}</h1>
      <div className="relative aspect-[1.2/1] sm:aspect-[1.9/1]">
        <Calligraphy className="pointer-events-none absolute start-[6%] top-[2%] w-[88%] -rotate-[6deg] text-olive/80 mix-blend-multiply sm:start-[10%] sm:w-[76%]" />
        <p
          aria-hidden
          className="absolute bottom-[1%] start-[6%] font-light leading-none tracking-[0.2em] text-ink sm:bottom-[3%] sm:start-[31%] sm:tracking-[0.26em]"
          style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.9rem, 7vw, 6rem)" }}
        >
          HIKAYATI
        </p>
        <span aria-hidden className="absolute inset-x-[4%] bottom-0 hairline" />
      </div>
    </div>
  );
}
