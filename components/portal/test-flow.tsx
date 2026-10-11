"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEventStatsAction } from "@/app/actions/portal";
import { listGuestsAction } from "@/app/actions/guests";
import { getLinkAction, getPassTokenAction, sendInvitationsAction, simulateCheckInAction } from "@/app/actions/invitations";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { Button } from "@/components/ui/button";
import { SelectInput, controlCls } from "@/components/ui/form";
import { Badge, DemoTag, Notice, Stat } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { buildContent } from "@/lib/domain/invitation-content";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import type { EventStats } from "@/lib/server/events";
import type { GuestRow } from "@/lib/server/guests";
import type { PreviewData } from "./event-data";
import { PassQr } from "./pass-qr";
import { copyText, errText, fmtDateTime } from "./util";

function Step({ n, title, help, children, done, off, word }: { n: number; title: string; help: string; children: React.ReactNode; done?: boolean; off: boolean; word: string }) {
  return (
    <li className={`grid grid-cols-[2.25rem_1fr] gap-x-4 border-b border-line py-7 first:pt-0 last:border-b-0 ${off && n > 1 ? "opacity-50" : ""}`}>
      <span aria-hidden className={`font-display flex h-9 w-9 items-center justify-center border text-lg ${done ? "border-olive bg-olive text-paper" : "border-ink/30"}`}>{n}</span>
      <div className="min-w-0 space-y-3">
        <h3 className="font-display text-xl leading-9"><span className="sr-only">{word} {n}: </span>{title}</h3>
        <p className="text-sm text-ink-soft">{help}</p>
        {children}
      </div>
    </li>
  );
}

type Check = { ok: boolean; result: string; at?: string };

/** STEP 7 — a guided, fully simulated run-through of one guest's experience. Nothing here reaches a real phone. */
export function TestFlow({ eventId, locale, eventStatus, data, defaultLang, canCheckin, guestsHref }: { eventId: string; locale: Locale; eventStatus: string; data: PreviewData; defaultLang: "ar" | "en"; canCheckin: boolean; guestsHref: string }) {
  const t = portalCopy(locale);
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [guestId, setGuestId] = useState("");
  const [stats, setStats] = useState<EventStats | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const link = useAction();
  const send = useAction();
  const sim = useAction();
  const loadErr = useRef(false);

  const g = guests?.find((x) => x.id === guestId) ?? null;
  const cancelled = eventStatus === "cancelled";
  const confirmed = ["confirmed", "live"].includes(eventStatus);
  const lang = g?.language ?? defaultLang;

  const refresh = useCallback(async () => {
    const [a, b] = await Promise.all([listGuestsAction(eventId, {}), getEventStatsAction(eventId)]);
    if (a.ok) setGuests(a.data); else loadErr.current = true;
    if (b.ok) setStats(b.data);
    setCheckedAt(new Date());
  }, [eventId]);

  useEffect(() => { void refresh(); }, [refresh]);
  // Poll while a guest is selected so the reply shows up without clicking. Pauses when the tab is hidden.
  useEffect(() => {
    if (!guestId) return;
    const id = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 4000);
    return () => clearInterval(id);
  }, [guestId, refresh]);

  const hasPass = !!g && g.rsvp === "accepted" && g.invitationStatus !== "revoked" && (g.hasActivePass || !!g.checkedInAt);
  useEffect(() => {
    let off = false;
    if (!g || !hasPass) { setToken(null); return; }
    getPassTokenAction(g.id).then((r) => { if (!off) setToken(r.ok ? r.data : null); });
    return () => { off = true; };
  }, [g?.id, hasPass, g?.checkedInAt]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(id: string) {
    setGuestId(id); setUrl(null); setToken(null); setCopied(false); setSentNote(false); setCheck(null);
    link.setError(null); send.setError(null); sim.setError(null);
  }

  const content = useMemo(() => buildContent(data.source, g ? `${g.firstName} ${g.lastName}`.trim() : ""), [data.source, g]);

  async function getLink() {
    if (!g) return;
    const r = await link.run(() => getLinkAction(g.id, lang));
    if (r.ok) setUrl(r.data.url);
  }
  async function doSend() {
    if (!g) return;
    const r = await send.run(() => sendInvitationsAction(eventId, [g.id]));
    if (r.ok) { setSentNote(true); await refresh(); }
  }
  async function checkIn() {
    if (!g) return;
    const r = await sim.run(() => simulateCheckInAction(g.id));
    if (r.ok) { setCheck({ ok: r.data.ok, result: r.data.result, at: "at" in r.data ? r.data.at : undefined }); await refresh(); }
  }

  const revoked = g?.invitationStatus === "revoked";
  // 0 not sent · 1 sent · 2 opened · 3 replied · 4 checked in
  const stage = !g ? -1 : g.checkedInAt ? 4 : g.rsvp !== "pending" ? 3 : g.invitationStatus === "opened" ? 2 : g.sentAt ? 1 : 0;
  const track = [t.test.track.draft, t.test.track.sent, t.test.track.opened, t.test.track.replied, t.test.track.arrived];
  const off = !g;

  if (cancelled) return <Notice tone="error">{t.test.cancelled}</Notice>;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="eyebrow">{t.test.eyebrow}</p>
        <div className="flex flex-wrap items-center gap-3"><h2 className="display-3">{t.test.title}</h2><DemoTag>{t.c.simulation}</DemoTag></div>
        <p className="max-w-2xl text-ink-soft">{t.test.sub}</p>
        <Notice tone="demo">{t.test.simBanner}</Notice>
        {!confirmed && <Notice tone="info">{t.test.needConfirmed}</Notice>}
      </div>

      {guests && guests.length === 0 ? (
        <div className="border border-dashed border-ink/20 px-6 py-12 text-center"><p className="font-display text-2xl">{t.test.needGuests}</p><div className="mt-5"><Button href={guestsHref} size="sm" variant="secondary">{t.test.addGuests}</Button></div></div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
          <ol className="min-w-0">
            <Step off={off} word={t.test.step} n={1} title={t.test.s1} help={t.test.s1Help} done={!!g}>
              <div className="max-w-sm">
                <SelectInput label={t.test.guest} value={guestId} onChange={(e) => choose(e.target.value)} name="test-guest" data-testid="test-guest">
                  <option value="">—</option>
                  {(guests ?? []).map((x) => <option key={x.id} value={x.id}>{`${x.firstName} ${x.lastName}`.trim()}</option>)}
                </SelectInput>
              </div>
            </Step>

            <Step off={off} word={t.test.step} n={2} title={t.test.s2} help={t.test.s2Help} done={!!g}>
              <p className="text-sm text-ink-soft lg:hidden">{g ? `${g.firstName} ${g.lastName}`.trim() : "—"} ↓</p>
            </Step>

            <Step off={off} word={t.test.step} n={3} title={t.test.s3} help={t.test.s3Help} done={!!url}>
              {revoked ? <Notice tone="error">{t.test.revokedNote}</Notice> : url ? (
                <div className="space-y-2">
                  <label className="sr-only" htmlFor="test-link">{t.test.linkLabel}</label>
                  <input id="test-link" readOnly dir="ltr" value={url} className={`${controlCls} text-sm`} onFocus={(e) => e.currentTarget.select()} data-testid="test-link" />
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm" variant="secondary" onClick={async () => setCopied(await copyText(url))}>{copied ? t.c.copied : t.c.copy}</Button>
                    <a href={url} target="_blank" rel="noopener" className="link-quiet text-sm" data-testid="open-guest-page">{t.test.openAsGuest}</a>
                  </div>
                </div>
              ) : <Button size="sm" variant="secondary" disabled={off || link.pending} onClick={getLink} data-testid="test-get-link">{link.pending ? t.c.working : t.test.getLink}</Button>}
              {link.error && <Notice tone="error">{errText(t, { error: link.error, fields: link.fields })}</Notice>}
            </Step>

            <Step off={off} word={t.test.step} n={4} title={t.test.s4} help={t.test.s4Help} done={!!g?.sentAt}>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" disabled={off || revoked || !confirmed || send.pending} onClick={doSend} data-testid="test-send">{send.pending ? t.c.working : g?.sentAt ? t.test.resend : t.test.send}</Button>
                {g?.sentAt && <Badge tone="champagne">{t.test.sentAlready}</Badge>}
              </div>
              <div aria-live="polite">
                {sentNote && <Notice tone="success">{t.test.sentOk}</Notice>}
                {send.error && <Notice tone="error">{errText(t, { error: send.error, fields: send.fields })}</Notice>}
              </div>
            </Step>

            <Step off={off} word={t.test.step} n={5} title={t.test.s5} help={t.test.s5Help} done={stage >= 3}>
              <ol className="flex flex-wrap gap-x-2 gap-y-2" aria-label={t.test.statusNow}>
                {track.map((label, i) => (
                  <li key={label} aria-current={i === stage ? "step" : undefined} className={`flex items-center gap-2 border px-3 py-1.5 text-xs ${i <= stage ? "border-olive bg-sage/20 text-olive" : "border-line text-taupe"} ${i === stage ? "font-medium" : ""}`}>
                    <span aria-hidden>{i <= stage ? "●" : "○"}</span>{label}
                  </li>
                ))}
              </ol>
              <div aria-live="polite" className="text-sm" data-testid="test-status">
                {g && <p>{t.test.statusNow}: <strong>{g.checkedInAt ? track[track.length - 1] : g.rsvp === "accepted" ? t.gu.reply.accepted : g.rsvp === "declined" ? t.gu.reply.declined : g.sentAt ? t.gu.reply.pending : t.gu.inv.not_sent}</strong>{g.respondedAt && <span className="text-ink-soft"> · {fmtDateTime(g.respondedAt, locale)}</span>}</p>}
                {g?.rsvp === "declined" && <p className="mt-2 text-ink-soft">{t.test.declinedNote}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={off} data-testid="test-refresh">{t.test.checkNow}</Button>
                {checkedAt && <span className="text-xs text-taupe">{t.test.lastChecked}: {checkedAt.toLocaleTimeString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB")}</span>}
              </div>
            </Step>

            <Step off={off} word={t.test.step} n={6} title={t.test.s6} help={t.test.s6Help} done={!!token}>
              {token && g ? (
                <div className="space-y-2"><PassQr value={token} label={`${t.gu.qrAlt} ${g.firstName}`} /><p className="text-sm text-ink-soft">{g.checkedInAt ? t.gu.passUsed : t.gu.passHelp}</p></div>
              ) : <p className="text-sm text-ink-soft" data-testid="pass-wait">{t.test.passWait}</p>}
            </Step>

            <Step off={off} word={t.test.step} n={7} title={t.test.s7} help={t.test.s7Help} done={!!g?.checkedInAt}>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" disabled={off || !hasPass || !!g?.checkedInAt || sim.pending || !canCheckin} onClick={checkIn} data-testid="test-checkin">{sim.pending ? t.c.working : t.test.checkIn}</Button>
                <DemoTag>{t.c.simulation}</DemoTag>
              </div>
              <div aria-live="polite" className="space-y-3">
                {g?.checkedInAt && <Notice tone="success">{t.test.checkedOk} · {t.test.checkedAt} {fmtDateTime(g.checkedInAt, locale)}</Notice>}
                {check && !check.ok && check.result !== "success" && <Notice tone="error">{(t.test.r as Record<string, string>)[check.result] ?? t.err.unknown}</Notice>}
                {sim.error && <Notice tone="error">{errText(t, { error: sim.error, fields: sim.fields })}</Notice>}
              </div>
              {stats && (
                <div data-testid="test-attendance" className="pt-3">
                  <h4 className="tracked mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-taupe">{t.test.attendance}</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                    <Stat label={t.test.att.accepted} value={stats.accepted} />
                    <Stat label={t.test.att.checkedIn} value={stats.checkedIn} tone="olive" />
                    <Stat label={t.test.att.notArrived} value={stats.notYetArrived} />
                    <Stat label={t.test.att.seats} value={stats.seats} />
                  </div>
                </div>
              )}
              {g && <div className="pt-2"><button type="button" className="link-quiet text-sm" onClick={() => choose("")}>{t.test.reset}</button></div>}
            </Step>
          </ol>

          <aside aria-label={t.iv.previewLabel} className="lg:sticky lg:top-6 lg:self-start">
            <div className="mx-auto max-w-[22rem]" data-testid="test-preview">
              <InvitationRenderer content={content} layout={data.layout} palette={data.palette} fontPair={data.fontPair} align={data.align} asset={data.asset} />
              <p className="mt-4 text-center text-xs text-taupe">{g ? `${g.firstName} ${g.lastName}`.trim() : t.test.s1}</p>
            </div>
          </aside>
        </div>
      )}
      {guests === null && !loadErr.current && <p role="status" className="text-ink-soft">{t.c.loading}</p>}
    </div>
  );
}
