import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { RsvpPanel } from "@/components/guest/rsvp-panel";
import { Button } from "@/components/ui/button";
import { buildContent } from "@/lib/domain/invitation-content";
import { formatDate, formatTime } from "@/lib/domain/time";
import { isLocale } from "@/lib/i18n";
import { guestCopy } from "@/lib/i18n/guest";
import { getDb } from "@/lib/server/db";
import { getPublicInvitation } from "@/lib/server/invitations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitation · حكايتي", robots: { index: false, follow: false } };

/** A guest's private invitation. Authenticated only by the signed token in the URL; never shows other guests or phone numbers. */
export default async function GuestInvitationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const t = guestCopy(locale);
  const inv = await getPublicInvitation(await getDb(), token);
  if (!inv) {
    return (
      <section className="wrap-narrow py-24 text-center">
        <h1 className="display-3">{t.invalidTitle}</h1>
        <p className="lead mt-4">{t.invalidBody}</p>
      </section>
    );
  }
  const e = inv.event;
  const content = buildContent({
    occasion: e.occasion, occasionCustom: e.occasionCustom, title: e.title, language: e.language, startsAt: e.startsAt, endsAt: e.endsAt, rsvpDeadline: e.rsvpDeadline, timezone: e.timezone,
    hostFirstName: e.hostFirstName, hostLastName: e.hostLastName, cohostName: e.cohostName, venueName: e.venueName, venueAddress: e.venueAddress, mapUrl: e.mapUrl, dressCode: e.dressCode,
    instructions: e.instructions, details: e.details, visibility: e.visibility, fields: inv.design.fields,
  }, [inv.guest.firstName, inv.guest.lastName].filter(Boolean).join(" "));
  const tz = e.timezone;
  return (
    <div className="wrap-narrow space-y-12 pb-24 pt-4">
      <section>
        <p className="eyebrow">{t.invited}</p>
        <h1 className="display-2 mt-3">{t.dear} {inv.guest.firstName}</h1>
      </section>
      <div className="mx-auto max-w-[26rem]">
        <InvitationRenderer content={content} layout={inv.design.layout} palette={inv.design.palette} fontPair={inv.design.fontPair} align={inv.design.align as "center"} />
      </div>
      <section aria-labelledby="det">
        <h2 id="det" className="display-3">{t.details}</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line text-[1.02rem]">
          <Row k={t.when}>{formatDate(e.startsAt, locale, tz, { weekday: true })} · {formatTime(e.startsAt, locale, tz)}</Row>
          <Row k={t.where}>{e.venueName}{e.venueAddress ? <span className="block text-sm text-ink-soft">{e.venueAddress}</span> : null}</Row>
          {e.dressCode && <Row k={t.dress}>{e.dressCode}</Row>}
          {e.instructions && <Row k={t.notes}>{e.instructions}</Row>}
          {e.rsvpDeadline && <Row k={t.replyBy}>{formatDate(e.rsvpDeadline, locale, tz)}</Row>}
        </dl>
        {e.mapUrl && <div className="mt-6"><Button href={e.mapUrl} variant="secondary" size="sm" target="_blank" rel="noopener noreferrer">{t.map}</Button></div>}
      </section>
      <RsvpPanel token={token} inv={inv} locale={locale} t={t} />
      <p className="text-center text-xs text-taupe">{t.poweredBy}</p>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[7rem_1fr] gap-4 py-4"><dt className="tracked text-[0.7rem] uppercase tracking-[0.2em] text-taupe">{k}</dt><dd>{children}</dd></div>;
}
