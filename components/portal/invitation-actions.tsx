"use client";

import { useEffect, useState } from "react";
import { getLinkAction, getPassTokenAction, regenerateLinkAction, regeneratePassAction, restoreInvitationAction, revokeInvitationAction, sendInvitationsAction } from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";
import { controlCls } from "@/components/ui/form";
import { Badge, DemoTag, EmptyState, Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import type { Locale } from "@/lib/i18n";
import { portalCopy, } from "@/lib/i18n/portal";
import type { GuestRow } from "@/lib/server/guests";
import { PassQr } from "./pass-qr";
import { copyText, errText, fmtDateTime } from "./util";

export interface InvitationActionsProps {
  eventId: string; locale: Locale; eventStatus: string; defaultLang: "ar" | "en"; guests: GuestRow[] | null;
  canManage: boolean; canGuests: boolean; onMutated: () => void;
}

const invLabel = (t: ReturnType<typeof portalCopy>, g: GuestRow) =>
  g.invitationStatus === "revoked" ? t.gu.inv.revoked : g.invitationStatus === "responded" ? t.gu.inv.responded : g.invitationStatus === "opened" ? t.gu.inv.opened
    : g.invitationStatus === "sent" || g.sentAt ? (g.delivery === "demo_simulated" ? t.gu.inv.sent : t.gu.inv.sentReal) : t.gu.inv.not_sent;
const invTone = (g: GuestRow) => (g.invitationStatus === "revoked" ? "danger" : g.invitationStatus === "responded" ? "olive" : g.sentAt ? "champagne" : "neutral") as "danger" | "olive" | "champagne" | "neutral";

/**
 * Per-guest invitation controls beside the guest list: copy / regenerate the private RSVP link, revoke or restore,
 * show the QR entry pass, and simulate sending. Sending is a demo: the demo provider contacts nobody.
 */
export function InvitationActions({ eventId, locale, eventStatus, defaultLang, guests, canManage, canGuests, onMutated }: InvitationActionsProps) {
  const t = portalCopy(locale);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const send = useAction();

  const sendable = (g: GuestRow) => g.invitationStatus !== "revoked" && !g.optedOut;
  const unsent = (guests ?? []).filter((g) => !g.sentAt && sendable(g));
  const canSend = canManage && ["confirmed", "live"].includes(eventStatus);
  const selectedIds = (guests ?? []).filter((g) => sel.has(g.id) && sendable(g)).map((g) => g.id);

  async function doSend(ids: string[]) {
    setNote(null);
    const r = await send.run(() => sendInvitationsAction(eventId, ids));
    if (r.ok) {
      setNote(`${t.gu.sentResult} ${r.data.sent}${r.data.skipped ? ` · ${r.data.skipped} ${t.gu.skipped}` : ""}. ${t.gu.noRealMsg}`);
      setSel(new Set());
      onMutated();
    }
  }
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const all = guests && guests.length > 0 && guests.every((g) => sel.has(g.id));

  return (
    <section id="invitation-actions" aria-labelledby="inv-actions-h" className="scroll-mt-24 space-y-5" data-testid="invitation-actions">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="inv-actions-h" className="font-display text-2xl">{t.gu.actions}</h2>
        <DemoTag>{t.c.simulation}</DemoTag>
      </div>
      <Notice tone="demo">{t.gu.simBanner}</Notice>

      {canManage && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" disabled={!canSend || send.pending || unsent.length === 0} onClick={() => doSend(unsent.map((g) => g.id))} data-testid="send-unsent">
              {send.pending ? t.gu.sending : `${t.gu.sendUnsent} (${unsent.length})`}
            </Button>
            <Button size="sm" variant="secondary" disabled={!canSend || send.pending || selectedIds.length === 0} onClick={() => doSend(selectedIds)} data-testid="send-selected">
              {`${t.gu.sendSelected} (${selectedIds.length})`}
            </Button>
          </div>
          {eventStatus === "cancelled" ? <p className="text-sm text-ink-soft">{t.gu.eventCancelled}</p> : !["confirmed", "live"].includes(eventStatus) ? <p className="text-sm text-ink-soft">{t.gu.needConfirmed}</p>
            : guests && guests.length > 0 && unsent.length === 0 ? <p className="text-sm text-ink-soft">{t.gu.nothingToSend}</p> : null}
        </div>
      )}
      <div aria-live="polite" className="space-y-3">
        {note && <Notice tone="success">{note}</Notice>}
        {send.error && <Notice tone="error">{errText(t, { error: send.error, fields: send.fields })}</Notice>}
      </div>

      {guests === null ? (
        <p role="status" className="py-6 text-ink-soft">{t.gu.loadingGuests}</p>
      ) : guests.length === 0 ? (
        <EmptyState title={t.gu.actions} body={t.gu.noGuests} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">{t.gu.actions}</caption>
            <thead className="bg-bone/60 text-xs uppercase tracking-wider text-taupe">
              <tr>
                {canManage && <th scope="col" className="w-10 px-4 py-3 text-start font-normal"><input type="checkbox" aria-label={t.gu.selectAll} checked={!!all} onChange={(e) => setSel(e.target.checked ? new Set(guests.filter(sendable).map((g) => g.id)) : new Set())} className="accent-[var(--color-olive)]" /></th>}
                {[t.gu.cols.guest, t.gu.cols.invitation, t.gu.cols.reply, t.gu.cols.pass].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-normal">{h}</th>)}
                <th scope="col" className="px-4 py-3 text-end font-normal">{t.gu.cols.act}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {guests.map((g) => {
                const name = `${g.firstName} ${g.lastName}`.trim();
                const isOpen = open === g.id;
                return (
                  <FragmentRows key={g.id}>
                    <tr data-testid="inv-row" className={isOpen ? "bg-bone/30" : ""}>
                      {canManage && <td className="px-4 py-3"><input type="checkbox" aria-label={`${t.gu.selectOne} ${name}`} checked={sel.has(g.id)} disabled={!sendable(g)} onChange={() => toggle(g.id)} className="accent-[var(--color-olive)]" /></td>}
                      <th scope="row" className="px-4 py-3 text-start font-normal text-ink">{name}{g.optedOut && <span className="block text-xs text-ink-soft">{t.gu.optedOut}</span>}</th>
                      <td className="px-4 py-3"><Badge tone={invTone(g)}>{invLabel(t, g)}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={g.rsvp === "accepted" ? "olive" : g.rsvp === "declined" ? "danger" : "neutral"}>{t.gu.reply[g.rsvp]}</Badge></td>
                      <td className="px-4 py-3 text-ink-soft">{g.checkedInAt ? t.gu.pass.used : g.hasActivePass ? t.gu.pass.active : t.gu.pass.none}</td>
                      <td className="px-4 py-3 text-end">
                        {canGuests && <button type="button" className="link-quiet text-xs" aria-expanded={isOpen} aria-controls={`detail-${g.id}`} aria-label={`${isOpen ? t.gu.hide : t.gu.manage}: ${name}`} onClick={() => setOpen(isOpen ? null : g.id)} data-testid="inv-manage">{isOpen ? t.gu.hide : t.gu.manage}</button>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr id={`detail-${g.id}`}>
                        <td colSpan={canManage ? 6 : 5} className="bg-bone/30 px-4 pb-6 pt-2">
                          <GuestDetail g={g} name={name} eventId={eventId} locale={locale} defaultLang={defaultLang} canSend={canSend} onMutated={onMutated} />
                        </td>
                      </tr>
                    )}
                  </FragmentRows>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) { return <>{children}</>; }

function GuestDetail({ g, name, eventId, locale, defaultLang, canSend, onMutated }: { g: GuestRow; name: string; eventId: string; locale: Locale; defaultLang: "ar" | "en"; canSend: boolean; onMutated: () => void }) {
  const t = portalCopy(locale);
  const link = useAction();
  const act = useAction();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ask, setAsk] = useState<"link" | "revoke" | "pass" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const lang = g.language ?? defaultLang;
  const revoked = g.invitationStatus === "revoked";
  const hasPass = !revoked && (g.hasActivePass || !!g.checkedInAt);

  useEffect(() => {
    let off = false;
    if (!hasPass) { setToken(null); return; }
    getPassTokenAction(g.id).then((r) => { if (!off) setToken(r.ok ? r.data : null); });
    return () => { off = true; };
  }, [g.id, hasPass, g.checkedInAt]);

  async function getLink(regen = false) {
    setMsg(null); setCopied(false);
    const r = await link.run(() => (regen ? regenerateLinkAction(g.id, lang) : getLinkAction(g.id, lang)));
    if (r.ok) { setUrl(r.data.url); setAsk(null); if (regen) { setMsg(t.gu.regenDone); onMutated(); } }
  }
  async function toggleRevoke() {
    setMsg(null);
    const r = await act.run(() => (revoked ? restoreInvitationAction(g.id) : revokeInvitationAction(g.id)));
    setAsk(null);
    if (r.ok) { setUrl(null); setMsg(revoked ? t.gu.restored : t.gu.revoked); onMutated(); }
  }
  async function regenPass() {
    setMsg(null);
    const r = await act.run(() => regeneratePassAction(g.id));
    setAsk(null);
    if (r.ok) { setToken(r.data.token); setMsg(t.gu.passRegenDone); onMutated(); }
  }
  async function sendOne() {
    setMsg(null);
    const r = await act.run(() => sendInvitationsAction(eventId, [g.id]));
    if (r.ok) { setMsg(`${t.gu.sentResult} ${r.data.sent}. ${t.gu.noRealMsg}`); onMutated(); }
  }
  const errs = errText(t, link.error ? { error: link.error, fields: link.fields } : act.error ? { error: act.error, fields: act.fields } : null);

  return (
    <div className="grid gap-8 pt-4 lg:grid-cols-2" aria-label={`${t.gu.detailsFor} ${name}`}>
      <div className="space-y-4">
        <h3 className="font-display text-lg">{t.gu.linkTitle}</h3>
        <p className="text-sm text-ink-soft">{t.gu.linkHelp}</p>
        {revoked ? <Notice tone="error">{t.gu.revokeWarn}</Notice> : url ? (
          <div className="space-y-2">
            <input readOnly dir="ltr" value={url} aria-label={t.gu.linkTitle} className={`${controlCls} text-sm`} onFocus={(e) => e.currentTarget.select()} data-testid="rsvp-link" />
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" variant="secondary" onClick={async () => setCopied(await copyText(url))} data-testid="copy-link">{copied ? t.c.copied : t.c.copy}</Button>
              <a href={url} target="_blank" rel="noopener" className="link-quiet text-sm">{t.c.openNewTab}</a>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => getLink()} disabled={link.pending} data-testid="get-link">{link.pending ? t.c.working : t.gu.getLink}</Button>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
          {!revoked && (ask === "link" ? (
            <Confirm text={t.gu.regenWarn} yes={t.gu.regenYes} no={t.c.cancel} onYes={() => getLink(true)} onNo={() => setAsk(null)} busy={link.pending} />
          ) : <button type="button" className="link-quiet text-sm" onClick={() => setAsk("link")} data-testid="regen-link">{t.gu.regen}</button>)}
          {canSend && !revoked && <button type="button" className="link-quiet text-sm" onClick={sendOne} disabled={act.pending} data-testid="send-one">{t.gu.sendOne}</button>}
        </div>
        <div className="pt-1">
          {ask === "revoke" ? <Confirm text={t.gu.revokeWarn} yes={t.gu.revokeYes} no={t.c.cancel} onYes={toggleRevoke} onNo={() => setAsk(null)} busy={act.pending} danger />
            : revoked ? <div className="space-y-2"><p className="text-xs text-ink-soft">{t.gu.restoreNote}</p><Button size="sm" variant="secondary" onClick={toggleRevoke} disabled={act.pending} data-testid="restore-inv">{t.gu.restore}</Button></div>
            : <button type="button" className="text-sm text-ink-soft underline decoration-[#8a3b32]/40 underline-offset-4 hover:text-[#8a3b32]" onClick={() => setAsk("revoke")} data-testid="revoke-inv">{t.gu.revoke}</button>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-lg">{t.gu.passTitle}</h3>
        {revoked || !hasPass ? (
          <p className="text-sm text-ink-soft">{t.gu.passNone}</p>
        ) : token === undefined ? (
          <p role="status" className="text-sm text-ink-soft">{t.c.loading}</p>
        ) : token ? (
          <div className="space-y-3">
            <PassQr value={token} label={`${t.gu.qrAlt} ${name}`} />
            <p className="text-sm text-ink-soft">{g.checkedInAt ? `${t.gu.passUsed} (${fmtDateTime(g.checkedInAt, locale)})` : t.gu.passHelp}</p>
            {!g.checkedInAt && (ask === "pass" ? <Confirm text={t.gu.passRegenWarn} yes={t.gu.passRegenYes} no={t.c.cancel} onYes={regenPass} onNo={() => setAsk(null)} busy={act.pending} />
              : <button type="button" className="link-quiet text-sm" onClick={() => setAsk("pass")} data-testid="regen-pass">{t.gu.passRegen}</button>)}
          </div>
        ) : <p className="text-sm text-ink-soft">{t.gu.passNone}</p>}
      </div>

      <div aria-live="polite" className="space-y-3 lg:col-span-2">
        {msg && <Notice tone="success">{msg}</Notice>}
        {errs && <Notice tone="error">{errs}</Notice>}
      </div>
    </div>
  );
}

function Confirm({ text, yes, no, onYes, onNo, busy, danger }: { text: string; yes: string; no: string; onYes: () => void; onNo: () => void; busy?: boolean; danger?: boolean }) {
  return (
    <div role="alertdialog" aria-label={text} className="w-full space-y-3 border border-champagne bg-champagne/10 p-4">
      <p className="text-sm text-ink">{text}</p>
      <div className="flex flex-wrap gap-3">
        <Button size="sm" variant={danger ? "danger" : "primary"} onClick={onYes} disabled={busy} data-testid="confirm-yes">{busy ? "…" : yes}</Button>
        <Button size="sm" variant="secondary" onClick={onNo}>{no}</Button>
      </div>
    </div>
  );
}
