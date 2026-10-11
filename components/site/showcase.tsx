import type { home } from "@/lib/i18n/home";
import { GuestCard } from "../guest-card";
import { InvitationCard } from "../invitation-card";
import { Reveal } from "../reveal";

type H = ReturnType<typeof home>;

/**
 * Signature section — one fictional wedding, two views. The grid is forced LTR so the invitation is always on
 * the right and the guest experience on the left (stacked on mobile); text inside each card keeps its own direction.
 */
export function Showcase({ t }: { t: H }) {
  return (
    <section id="experience" className="section band relative">
      <div className="wrap">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.showcase.eyebrow}</p>
          <h2 className="display-2 mt-6 text-balance">{t.showcase.heading}</h2>
          <p className="lead mt-6 max-w-xl">{t.showcase.body}</p>
        </Reveal>
        <div dir="ltr" className="mt-20 grid items-start gap-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1 lg:mt-24" delay={0.12}>
            <GuestCard />
            <Caption>{t.showcase.guest}</Caption>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <InvitationCard />
            <Caption>{t.showcase.invitation}</Caption>
          </Reveal>
        </div>
        <p dir="auto" className="mt-16 text-center text-sm text-taupe">{t.showcase.fictional}</p>
      </div>
    </section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p dir="auto" className="tracked mt-8 text-center text-[0.72rem] uppercase tracking-[0.28em] text-ink-soft/80">{children}</p>;
}
