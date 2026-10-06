import { sampleWedding as w } from "@/lib/content";
import { Lozenge, Sprig } from "./floral";

/**
 * Mock Saudi wedding invitation. Always Arabic/RTL: it is a sample of what a host designs.
 * Ivory stock, blind-embossed botanicals, double hairline frame, Amiri typography.
 */
export function InvitationCard() {
  return (
    <article
      dir="rtl"
      lang="ar"
      className="relative mx-auto aspect-[3/4.25] w-full max-w-[26.5rem] overflow-hidden bg-[#fdfbf6] font-arabic text-ink shadow-[0_40px_70px_-30px_rgba(70,58,28,0.45),0_3px_8px_rgba(70,58,28,0.1)]"
    >
      {/* paper grain + faint light falloff */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_0%,rgba(255,255,255,0.9),transparent_60%)]" />
      <div aria-hidden className="absolute inset-[0.9rem] border border-champagne/70" />
      <div aria-hidden className="absolute inset-[1.15rem] border border-champagne/35" />

      <Sprig className="absolute -start-2 -top-1 w-[24%] opacity-90" />
      <Sprig className="absolute -bottom-1 -end-2 w-[24%] opacity-90" flip />

      <div className="relative flex h-full flex-col items-center px-[13%] pb-[11%] pt-[12%] text-center">
        <p className="text-[0.95rem] leading-8 text-olive sm:text-base">{w.blessing}</p>
        <Lozenge className="mt-3 w-24" />

        <p className="mt-5 text-[0.82rem] leading-7 text-ink-soft">{w.host}</p>
        <p className="mt-2 text-[0.85rem] leading-7 text-ink-soft">
          {w.mothers[0]} <span className="mx-1 text-champagne">·</span> {w.mothers[1]}
        </p>

        <div className="mt-auto">
          <p className="text-[1.65rem] leading-[1.5] sm:text-[1.9rem]">{w.groom}</p>
          <p className="my-1 text-xl text-champagne">و</p>
          <p className="text-[1.65rem] leading-[1.5] sm:text-[1.9rem]">{w.bride}</p>
        </div>

        <Lozenge className="mt-6 w-24" />

        <dl className="mt-5 space-y-2 text-[0.82rem] leading-6 text-ink-soft">
          <div>
            <dt className="sr-only">{w.venueLabel}</dt>
            <dd>{w.venue}</dd>
          </div>
          <div className="flex items-center justify-center gap-3 text-ink">
            <dt className="sr-only">{w.dateLabel}</dt>
            <dd>{w.date}</dd>
            <span aria-hidden className="h-3 w-px bg-champagne" />
            <dt className="sr-only">{w.timeLabel}</dt>
            <dd>{w.time}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-olive">{w.closing}</p>
      </div>
    </article>
  );
}
