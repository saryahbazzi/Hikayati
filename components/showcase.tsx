import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { GuestCard } from "./guest-card";
import { InvitationCard } from "./invitation-card";
import { Reveal } from "./reveal";

type T = (typeof content)[Locale];

/**
 * Signature section: one real example, two views. The grid is forced LTR so the invitation is
 * always on the right and the guest experience on the left (stacked on mobile); the text inside
 * each visual keeps its own direction.
 */
export function Showcase({ t }: { t: T }) {
  return (
    <section id="how" className="relative bg-bone/60 px-6 py-28 sm:py-36">
      <div aria-hidden className="absolute inset-x-0 top-0 hairline" />
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="tracked text-[0.72rem] uppercase tracking-[0.32em] text-olive">{t.showcase.eyebrow}</p>
          <h2 className="font-display mt-6 text-4xl font-light leading-[1.15] sm:text-6xl">{t.showcase.heading}</h2>
          <p className="mx-auto mt-6 max-w-xl leading-8 text-ink-soft">{t.showcase.body}</p>
        </Reveal>

        <div dir="ltr" className="mt-20 grid items-center gap-20 lg:grid-cols-2 lg:gap-12">
          {/* order-last on mobile so the invitation (the story's start) reads first */}
          <Reveal className="order-2 lg:order-1" delay={0.1}>
            <GuestCard />
            <Caption>{t.showcase.guestLabel}</Caption>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <InvitationCard />
            <Caption>{t.showcase.invitationLabel}</Caption>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p dir="auto" className="tracked mt-8 text-center text-[0.72rem] uppercase tracking-[0.28em] text-ink-soft/80">
      {children}
    </p>
  );
}
