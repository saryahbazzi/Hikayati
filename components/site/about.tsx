import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { home } from "@/lib/i18n/home";
import { AmbientMedia } from "./ambient-media";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/** Editorial, asymmetric: large heading on one side, the story offset on the other. */
export function About({ locale, t }: { locale: Locale; t: H }) {
  return (
    <section id="about" className="section relative">
      <AmbientMedia videoUrl={process.env.NEXT_PUBLIC_ABOUT_VIDEO_URL} posterUrl={process.env.NEXT_PUBLIC_ABOUT_POSTER_URL} />
      <div className="wrap relative grid gap-12 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">{t.about.eyebrow}</p>
          <span aria-hidden className="mt-6 block h-14 w-px bg-champagne" />
          <h2 className="display-1 mt-8 text-balance">{t.about.heading}</h2>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7 lg:pt-28">
          <p className="lead text-ink">{t.about.body}</p>
          <p className="mt-10"><Link href={`/${locale}/about`} className="link-quiet tracked text-[0.78rem] uppercase tracking-[0.2em]">{t.about.more}</Link></p>
        </Reveal>
      </div>
    </section>
  );
}
