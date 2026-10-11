"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cancelReminderAction, createReminderAction, runReminderNowAction } from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";
import { SelectInput, TextArea, TextInput } from "@/components/ui/form";
import { Badge, DemoTag, EmptyState, Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { addDays, utcToZoned, zonedToUtc } from "@/lib/domain/time";
import type { Locale } from "@/lib/i18n";
import { portalCopy, } from "@/lib/i18n/portal";
import { reminderBody } from "@/lib/server/messaging/templates";
import type { Audience, ReminderRuleRow } from "@/lib/server/reminders";
import { MessageLog } from "./message-log";
import { errText, fmtDate, fmtDateTime } from "./util";
import { formatTime } from "@/lib/domain/time";

type Kind = "d7" | "d1" | "custom";
const AUDIENCES: Audience[] = ["not_responded", "confirmed", "all_invited"];

export interface ReminderEventInfo { id: string; title: string; startsAt: string | null; venue: string; timezone: string; language: "ar" | "en" | "both"; status: string }

/** Rule list, create form (with audience count, schedule and message preview) and the demo notification log for one event. */
export function RemindersPanel({ event, locale, rules, audienceCounts, canManage }: { event: ReminderEventInfo; locale: Locale; rules: ReminderRuleRow[]; audienceCounts: Record<Audience, number>; canManage: boolean }) {
  const t = portalCopy(locale);
  const router = useRouter();
  const create = useAction();
  const rowAct = useAction();
  const [kind, setKind] = useState<Kind>("d7");
  const [audience, setAudience] = useState<Audience>("not_responded");
  const [customAt, setCustomAt] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState<{ tone: "success" | "info"; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const tz = event.timezone;
  const cancelled = event.status === "cancelled";

  const runAt = useMemo(() => {
    if (kind === "custom") return customAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(customAt) ? zonedToUtc(customAt.slice(0, 10), customAt.slice(11), tz) : null;
    if (!event.startsAt) return null;
    return addDays(zonedToUtc(utcToZoned(event.startsAt, tz).date, "10:00", tz), kind === "d7" ? -7 : -1);
  }, [kind, customAt, event.startsAt, tz]);
  const isPast = !!runAt && runAt.getTime() <= Date.now();

  const previews = useMemo(() => {
    const langs: ("ar" | "en")[] = event.language === "both" ? ["ar", "en"] : [event.language];
    return langs.map((l) => ({ l, body: reminderBody(l, {
      guestName: t.rem.previewName, eventTitle: event.title, date: fmtDate(event.startsAt, l, tz), time: event.startsAt ? formatTime(event.startsAt, l, tz) : "", venue: event.venue, link: t.rem.previewLink }, message) }));
  }, [event, message, tz, t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    const input = kind === "custom" ? { kind: "custom" as const, customAt, audience, message } : { kind: "before_event" as const, daysBefore: kind === "d7" ? 7 : 1, audience, message };
    const r = await create.run(() => createReminderAction(event.id, input));
    if (r.ok) { setNote({ tone: "success", text: t.rem.created }); setMessage(""); router.refresh(); }
  }
  async function runNow(id: string) {
    setNote(null);
    const r = await rowAct.run(() => runReminderNowAction(id));
    if (r.ok) { setNote({ tone: r.data.sent ? "success" : "info", text: r.data.sent ? `${t.rem.runDone} ${r.data.sent}. ${t.rem.demoNote}` : t.rem.runNone }); setReload((n) => n + 1); router.refresh(); }
  }
  async function cancel(id: string) {
    setNote(null);
    const r = await rowAct.run(() => cancelReminderAction(id));
    setConfirmCancel(null);
    if (r.ok) { setNote({ tone: "success", text: t.rem.cancelled }); router.refresh(); }
  }
  const kindText = (r: ReminderRuleRow) => (r.kind === "before_event" ? (r.daysBefore === 1 ? t.rem.day : `${r.daysBefore} ${t.rem.days}`) : t.rem.kindLabel.custom);
  const createErr = create.error ? errText(t, { error: create.error, fields: create.fields }) : null;
  const rowErr = rowAct.error ? errText(t, { error: rowAct.error, fields: rowAct.fields }) : null;
  const dateKindNoDate = kind !== "custom" && !event.startsAt;

  return (
    <div className="space-y-14">
      <Notice tone="demo">{t.rem.demoNote}</Notice>

      {canManage && !cancelled ? (
        <section aria-labelledby="new-rem-h" className="border border-line p-6">
          <h2 id="new-rem-h" className="font-display text-2xl">{t.rem.createTitle}</h2>
          <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-2" noValidate data-testid="reminder-form">
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm text-ink">{t.rem.when}</legend>
                <div className="grid gap-2">
                  {([["d7", t.rem.k7], ["d1", t.rem.k1], ["custom", t.rem.kCustom]] as const).map(([k, label]) => (
                    <label key={k} className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors ${kind === k ? "border-olive bg-paper" : "border-ink/20 hover:border-olive/60"}`}>
                      <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[var(--color-olive)]" />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {kind === "custom" && <TextInput label={t.rem.customAt} hint={t.rem.customHint} type="datetime-local" required value={customAt} onChange={(e) => setCustomAt(e.target.value)} name="customAt" dir="ltr" />}
              <SelectInput label={t.rem.audience} value={audience} onChange={(e) => setAudience(e.target.value as Audience)} name="audience">
                {AUDIENCES.map((a) => <option key={a} value={a}>{t.rem.aud[a]}</option>)}
              </SelectInput>
              <p className="text-sm text-ink-soft" data-testid="audience-now"><span className="font-display text-2xl text-ink">{audienceCounts[audience]}</span> {t.rem.audienceNow}. <span className="block text-xs">{t.rem.audienceNote}</span></p>
              <TextArea label={t.rem.message} hint={`${t.rem.messageHint} (${t.rem.messageMax})`} value={message} maxLength={400} onChange={(e) => setMessage(e.target.value)} rows={3} name="message" />
            </div>

            <div className="space-y-5">
              <div>
                <p className="tracked text-[0.68rem] uppercase tracking-[0.2em] text-taupe">{t.rem.scheduled}</p>
                <p className="mt-1 text-lg text-ink" data-testid="scheduled-for">
                  {dateKindNoDate ? <span className="text-ink-soft">{t.rem.noDateYet}</span> : runAt ? <>{fmtDateTime(runAt.toISOString(), locale, tz)} <span className="text-sm text-ink-soft">· {t.c.eventTime}</span></> : <span className="text-ink-soft">—</span>}
                </p>
                {isPast && <p role="alert" className="mt-1 text-sm text-[#8a3b32]">{t.rem.passed}</p>}
              </div>
              <div>
                <p className="tracked mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-taupe">{t.rem.preview}</p>
                <div className="space-y-3">
                  {previews.map((p) => <p key={p.l} lang={p.l} dir={p.l === "ar" ? "rtl" : "ltr"} className="whitespace-pre-line border border-line bg-paper/70 p-4 text-sm leading-7 text-ink">{p.body}</p>)}
                </div>
              </div>
            </div>
            <div className="space-y-3 lg:col-span-2" aria-live="polite">
              {createErr && <Notice tone="error">{createErr}</Notice>}
              {note && <Notice tone={note.tone === "success" ? "success" : "info"}>{note.text}</Notice>}
              <Button type="submit" size="sm" disabled={create.pending || dateKindNoDate || (kind === "custom" && !customAt)} data-testid="create-reminder">{create.pending ? t.rem.creating : t.rem.create}</Button>
            </div>
          </form>
        </section>
      ) : (
        <Notice tone="info">{cancelled ? t.rem.cancelledEvent : t.rem.needManage}</Notice>
      )}

      <section aria-labelledby="rules-h" className="space-y-4">
        <h2 id="rules-h" className="font-display text-2xl">{t.rem.rules}</h2>
        {!(canManage && !cancelled) && note && <Notice tone="success">{note.text}</Notice>}
        <div aria-live="polite">{rowErr && <Notice tone="error">{rowErr}</Notice>}</div>
        {rules.length === 0 ? (
          <EmptyState title={t.rem.none} body={t.rem.noneBody} />
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[52rem] text-sm" data-testid="rules-table">
              <caption className="sr-only">{t.rem.rules}</caption>
              <thead className="bg-bone/60 text-xs uppercase tracking-wider text-taupe">
                <tr>{[t.rem.cols.when, t.rem.cols.kind, t.rem.cols.audience, t.rem.cols.status, t.rem.cols.audNow, t.rem.cols.sent].map((h) => <th key={h} scope="col" className="px-4 py-3 text-start font-normal">{h}</th>)}<th scope="col" className="px-4 py-3 text-end font-normal">{t.rem.cols.act}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rules.map((r) => (
                  <tr key={r.id} data-testid="rule-row">
                    <th scope="row" className="px-4 py-3 text-start font-normal text-ink">{fmtDateTime(r.runAt, locale, tz)}{r.message && <span className="block max-w-[16rem] truncate text-xs text-ink-soft">“{r.message}”</span>}</th>
                    <td className="px-4 py-3 text-ink-soft">{kindText(r)}</td>
                    <td className="px-4 py-3">{t.rem.audShort[r.audience]}</td>
                    <td className="px-4 py-3"><Badge tone={r.status === "active" ? "champagne" : r.status === "completed" ? "olive" : "neutral"}>{(t.rem.status as Record<string, string>)[r.status] ?? r.status}</Badge></td>
                    <td className="px-4 py-3">{r.status === "active" ? r.audienceNow : "—"}</td>
                    <td className="px-4 py-3">{r.sent > 0 ? <span className="inline-flex items-center gap-2">{r.sent} <DemoTag>{t.c.simulated}</DemoTag></span> : 0}</td>
                    <td className="px-4 py-3 text-end">
                      {canManage && r.status === "active" && !cancelled && (confirmCancel === r.id ? (
                        <span className="inline-flex flex-wrap items-center justify-end gap-3 text-xs"><span>{t.rem.cancelAsk}</span>
                          <button type="button" className="text-[#8a3b32] underline" onClick={() => cancel(r.id)} disabled={rowAct.pending} data-testid="cancel-yes">{t.rem.cancelYes}</button>
                          <button type="button" className="underline" onClick={() => setConfirmCancel(null)}>{t.c.cancel}</button></span>
                      ) : (
                        <span className="inline-flex gap-5">
                          <button type="button" className="link-quiet text-xs" onClick={() => runNow(r.id)} disabled={rowAct.pending} data-testid="run-now">{t.rem.runNow}</button>
                          <button type="button" className="text-xs text-ink-soft hover:text-[#8a3b32]" onClick={() => setConfirmCancel(r.id)} data-testid="cancel-rule">{t.rem.cancel}</button>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MessageLog eventId={event.id} locale={locale} kind="reminder" title={t.rem.logTitle} note={t.rem.logNote} empty={t.rem.logEmpty} limit={30} reloadKey={reload} />
    </div>
  );
}
