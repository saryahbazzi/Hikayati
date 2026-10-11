"use client";

import { useState } from "react";
import { rsvpAction } from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { formatDate, formatTime } from "@/lib/domain/time";
import type { Locale } from "@/lib/i18n";
import type { guestCopy } from "@/lib/i18n/guest";
import type { PublicInvitation } from "@/lib/server/invitations";
import { QrImage, downloadPassImage } from "./qr-image";

type T = ReturnType<typeof guestCopy>;

/** Accept / decline, then the guest's personal pass. Everything is persisted through rsvpAction. */
export function RsvpPanel({ token, inv: initial, locale, t }: { token: string; inv: PublicInvitation; locale: Locale; t: T }) {
  const [inv, setInv] = useState(initial);
  const [editing, setEditing] = useState(initial.rsvp.status === "pending");
  const [companions, setCompanions] = useState(initial.rsvp.companionsAttending);
  const a = useAction();
  const err = a.fields.rsvp ?? (a.error && a.error !== "validation" ? a.error : undefined);
  const cancelled = inv.event.status === "cancelled" || inv.event.status === "completed";

  async function answer(response: "accepted" | "declined") {
    const r = await a.run(() => rsvpAction(token, response, response === "accepted" ? companions : 0));
    if (r.ok) {
      // Re-read the authoritative state (pass token, flags) from the server.
      const res = await fetch(`/api/invitation/${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.ok) setInv(await res.json());
      setEditing(false);
    }
  }

  const status = inv.rsvp.status;
  const tz = inv.event.timezone;
  const download = () => downloadPassImage({
    token: inv.pass!.token, guest: `${inv.guest.firstName} ${inv.guest.lastName}`.trim(), title: inv.event.title,
    when: `${formatDate(inv.event.startsAt, locale, tz)} · ${formatTime(inv.event.startsAt, locale, tz)}`, venue: inv.event.venueName, note: t.passNote, filename: "hikayati-pass.png", rtl: locale === "ar",
  });

  return (
    <section aria-live="polite" className="space-y-8">
      {cancelled && <Notice tone="error">{t.cancelled}</Notice>}

      {!cancelled && editing && (
        <div className="space-y-6 border border-line bg-paper/70 p-6 sm:p-8" data-testid="rsvp-form">
          {inv.guest.companionsAllowed > 0 && (
            <SelectInput label={t.companionsQ} hint={`${t.companionsOf} ${inv.guest.companionsAllowed}`} value={companions} onChange={(e) => setCompanions(Number(e.target.value))}>
              {Array.from({ length: inv.guest.companionsAllowed + 1 }, (_, i) => <option key={i} value={i}>{i}</option>)}
            </SelectInput>
          )}
          {inv.rsvp.deadlinePassed ? <Notice tone="error">{t.closed}</Notice> : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => answer("accepted")} disabled={a.pending} data-testid="rsvp-accept" className="w-full sm:w-auto">{a.pending ? t.working : t.accept}</Button>
              <Button variant="secondary" onClick={() => answer("declined")} disabled={a.pending} data-testid="rsvp-decline" className="w-full sm:w-auto">{t.decline}</Button>
            </div>
          )}
          {err && <Notice tone="error">{(t.errors as Record<string, string>)[err] ?? t.errors.unknown}</Notice>}
        </div>
      )}

      {!editing && status === "accepted" && (
        <div className="space-y-6" data-testid="rsvp-accepted">
          <div><h2 className="display-3">{t.acceptedTitle}</h2><p className="lead mt-3">{t.acceptedBody}</p></div>
          {inv.pass && (
            <div className="mx-auto w-full max-w-sm border border-champagne bg-paper p-6 text-center">
              <p className="eyebrow">{t.passTitle}</p>
              <QrImage value={inv.pass.token} label={t.passTitle} className={`mx-auto mt-4 w-full max-w-[16rem] ${inv.pass.status === "used" ? "opacity-40" : ""}`} />
              <p className="font-display mt-4 text-xl">{inv.guest.firstName} {inv.guest.lastName}</p>
              {inv.guest.companionsAllowed > 0 && inv.rsvp.companionsAttending > 0 && <p className="text-sm text-ink-soft">+ {inv.rsvp.companionsAttending}</p>}
              <p className="mt-2 text-xs leading-5 text-ink-soft">{t.passNote}</p>
              {inv.checkedInAt ? <p className="mt-4 text-sm text-olive" data-testid="checked-in-note">{t.checkedIn}</p> : <div className="mt-5"><Button variant="secondary" size="sm" onClick={download}>{t.save}</Button></div>}
            </div>
          )}
        </div>
      )}

      {!editing && status === "declined" && (
        <div data-testid="rsvp-declined"><h2 className="display-3">{t.declinedTitle}</h2><p className="lead mt-3">{t.declinedBody}</p></div>
      )}

      {!editing && !cancelled && (
        inv.rsvp.canChange ? <Button variant="quiet" onClick={() => setEditing(true)} data-testid="rsvp-change">{t.change}</Button>
          : !inv.checkedInAt && <p className="text-sm text-ink-soft">{inv.rsvp.deadlinePassed ? t.changeClosed : t.locked}</p>
      )}
    </section>
  );
}
