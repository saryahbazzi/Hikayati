"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addGuestAction, commitImportAction, deleteGuestAction, listGuestsAction, previewImportAction, updateGuestAction } from "@/app/actions/guests";
import { Button } from "@/components/ui/button";
import { SelectInput, TextArea, TextInput, controlCls } from "@/components/ui/form";
import { Badge, EmptyState, Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { GUEST_CSV_TEMPLATE } from "@/lib/csv";
import { COUNTRIES, formatPhone } from "@/lib/phone";
import type { Locale } from "@/lib/i18n";
import type { guestsCopy } from "@/lib/i18n/guests";
import type { GuestRow, ImportRow } from "@/lib/server/guests";

type T = ReturnType<typeof guestsCopy>;
type Form = { firstName: string; lastName: string; dial: string; phone: string; language: string; companions: string; notes: string };
const blank: Form = { firstName: "", lastName: "", dial: "+966", phone: "", language: "", companions: "0", notes: "" };

/**
 * Guest list for one event: search, filter, add, edit, delete, CSV import with a validated preview, CSV template.
 * Used by the wizard (step 5) and the customer's Guest Management tab. All reads/writes go through server actions
 * that re-check access on the server. Pass `onChange` to be told when the list changes (e.g. to refresh counts).
 */
export function GuestManager({ eventId, locale, t, canEdit = true, canExport = false, onChange }: { eventId: string; locale: Locale; t: T; canEdit?: boolean; canExport?: boolean; onChange?: (guests: GuestRow[]) => void }) {
  const [guests, setGuests] = useState<GuestRow[] | null>(null);
  const [q, setQ] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [arrival, setArrival] = useState("");
  const [sent, setSent] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const form = useAction();
  const err = (k?: string) => (k ? ((t.err as Record<string, string>)[k] ?? t.err.unknown) : undefined);

  const load = useCallback(async () => {
    const r = await listGuestsAction(eventId, {});
    if (r.ok) { setGuests(r.data); onChange?.(r.data); }
  }, [eventId, onChange]);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => (guests ?? []).filter((g) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${g.firstName} ${g.lastName} ${g.phone}`.toLowerCase().includes(needle)) return false;
    if (rsvp && g.rsvp !== rsvp) return false;
    if (arrival === "yes" && !g.checkedInAt) return false;
    if (arrival === "no" && g.checkedInAt) return false;
    if (sent === "yes" && !g.sentAt) return false;
    if (sent === "no" && g.sentAt) return false;
    return true;
  }), [guests, q, rsvp, arrival, sent]);

  const startEdit = (g: GuestRow) => {
    const dial = COUNTRIES.map((c) => c.dial).sort((a, b) => b.length - a.length).find((d) => g.phone.startsWith(d)) ?? "+966";
    setEditing({ id: g.id, form: { firstName: g.firstName, lastName: g.lastName, dial, phone: g.phone.slice(dial.length), language: g.language ?? "", companions: String(g.companions), notes: g.notes } });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const f = editing.form;
    const input = { firstName: f.firstName, lastName: f.lastName, dial: f.dial, phone: f.phone, language: f.language, companions: f.companions, notes: f.notes };
    const r = await form.run(async () => (editing.id ? (await updateGuestAction(editing.id, input)) as never : (await addGuestAction(eventId, input)) as never));
    if (r.ok) { setEditing(null); await load(); }
  }

  async function remove(id: string) {
    const r = await form.run(() => deleteGuestAction(id));
    setConfirmDel(null);
    if (r.ok) await load();
  }

  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEditing((s) => (s ? { ...s, form: { ...s.form, [k]: e.target.value } } : s));
  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + GUEST_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "hikayati-guests-template.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="guest-manager">
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && <Button size="sm" onClick={() => { setImporting(false); setEditing({ id: null, form: blank }); form.setFields({}); }} data-testid="add-guest">{t.add}</Button>}
        {canEdit && <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setImporting((v) => !v); }}>{t.import}</Button>}
        {canEdit && <Button size="sm" variant="secondary" onClick={downloadTemplate}>{t.template}</Button>}
        {canExport && <Button size="sm" variant="secondary" href={`/api/events/${eventId}/guests.csv`} download>{t.export}</Button>}
        <span className="ms-auto text-sm text-ink-soft">{guests?.length ?? 0} {t.summary}</span>
      </div>

      {editing && (
        <form onSubmit={save} className="space-y-4 border border-line bg-paper/70 p-6" aria-label={editing.id ? t.edit : t.add} noValidate>
          <h3 className="font-display text-xl">{editing.id ? t.edit : t.add}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label={t.firstName} required value={editing.form.firstName} onChange={upd("firstName")} error={err(form.fields.firstName)} name="firstName" />
            <TextInput label={t.lastName} value={editing.form.lastName} onChange={upd("lastName")} name="lastName" />
            <div className="grid grid-cols-[8rem_1fr] gap-3 sm:col-span-2">
              <SelectInput label={t.country} value={editing.form.dial} onChange={upd("dial")} name="dial">
                {COUNTRIES.map((c) => <option key={c.iso} value={c.dial}>{c.dial} · {locale === "ar" ? c.ar : c.en}</option>)}
              </SelectInput>
              <TextInput label={t.phone} required type="tel" inputMode="tel" dir="ltr" value={editing.form.phone} onChange={upd("phone")} error={err(form.fields.phone)} name="phone" />
            </div>
            <SelectInput label={t.language} value={editing.form.language} onChange={upd("language")} name="language">
              <option value="">{t.langAny}</option><option value="ar">العربية</option><option value="en">English</option>
            </SelectInput>
            <TextInput label={t.companions} type="number" min={0} max={20} value={editing.form.companions} onChange={upd("companions")} error={err(form.fields.companions)} name="companions" />
            <TextArea label={t.notes} wrapperClassName="sm:col-span-2" value={editing.form.notes} onChange={upd("notes")} rows={2} name="notes" />
          </div>
          {form.error && !Object.keys(form.fields).length && <Notice tone="error">{err(form.error === "forbidden" ? "forbidden" : "unknown")}</Notice>}
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={form.pending}>{form.pending ? t.saving : t.save}</Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>{t.cancel}</Button>
          </div>
        </form>
      )}

      {importing && <ImportPanel eventId={eventId} t={t} onDone={async () => { setImporting(false); await load(); }} />}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1"><label className="sr-only" htmlFor="guest-search">{t.search}</label><input id="guest-search" className={controlCls} placeholder={t.search} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label={t.filterRsvp} className={controlCls} value={rsvp} onChange={(e) => setRsvp(e.target.value)}><option value="">{t.filterRsvp}: —</option>{(["pending", "accepted", "declined"] as const).map((s) => <option key={s} value={s}>{t.rsvp[s]}</option>)}</select>
        <select aria-label={t.filterArrival} className={controlCls} value={arrival} onChange={(e) => setArrival(e.target.value)}><option value="">{t.filterArrival}: —</option><option value="yes">{t.arrived.yes}</option><option value="no">{t.arrived.no}</option></select>
        <select aria-label={t.filterSent} className={controlCls} value={sent} onChange={(e) => setSent(e.target.value)}><option value="">{t.filterSent}: —</option><option value="yes">{t.sent.yes}</option><option value="no">{t.sent.no}</option></select>
      </div>

      {guests === null ? null : guests.length === 0 ? (
        <EmptyState title={t.empty} body={t.emptyBody} />
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-ink-soft">{t.noMatch}</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-bone/60 text-start text-xs uppercase tracking-wider text-taupe">
              <tr>{[t.cols.name, t.cols.phone, t.cols.companions, t.cols.invitation, t.cols.reply, t.cols.arrival, ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-start font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((g) => (
                <tr key={g.id} data-testid="guest-row">
                  <td className="px-4 py-3"><span className="text-ink">{g.firstName} {g.lastName}</span>{g.notes && <span className="block max-w-[14rem] truncate text-xs text-ink-soft">{g.notes}</span>}</td>
                  <td className="px-4 py-3" dir="ltr"><bdi>{formatPhone(g.phone)}</bdi></td>
                  <td className="px-4 py-3">{g.companions}</td>
                  <td className="px-4 py-3">{g.sentAt ? <Badge tone="champagne">{t.sent.yes}</Badge> : <Badge>{t.sent.no}</Badge>}</td>
                  <td className="px-4 py-3"><Badge tone={g.rsvp === "accepted" ? "olive" : g.rsvp === "declined" ? "danger" : "neutral"}>{t.rsvp[g.rsvp]}</Badge></td>
                  <td className="px-4 py-3">{g.checkedInAt ? <Badge tone="olive">{t.arrived.yes}</Badge> : <span className="text-ink-soft">{t.arrived.no}</span>}</td>
                  <td className="px-4 py-3 text-end">
                    {canEdit && (confirmDel === g.id ? (
                      <span className="inline-flex items-center gap-3 text-xs"><span>{t.confirmDel}</span><button className="text-[#8a3b32] underline" onClick={() => remove(g.id)}>{t.yesDel}</button><button className="underline" onClick={() => setConfirmDel(null)}>{t.cancel}</button></span>
                    ) : (
                      <span className="inline-flex gap-4"><button className="link-quiet text-xs" onClick={() => startEdit(g)}>{t.edit}</button><button className="text-xs text-ink-soft hover:text-[#8a3b32]" onClick={() => setConfirmDel(g.id)}>{t.del}</button></span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form.error === "validation" && form.fields.guest && <Notice tone="error">{err(form.fields.guest)}</Notice>}
    </div>
  );
}

function ImportPanel({ eventId, t, onDone }: { eventId: string; t: T; onDone: () => void }) {
  const [text, setText] = useState("");
  const [dial] = useState("+966");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const a = useAction();

  async function preview(csv: string) {
    setText(csv); setResult(null);
    const r = await a.run(() => previewImportAction(eventId, csv, dial));
    if (r.ok) { setRows(r.data.rows); setHeaderError(r.data.headerError ?? null); }
  }
  async function commit() {
    const r = await a.run(() => commitImportAction(eventId, text, dial));
    if (r.ok) { setResult(`${t.import_.done}: ${r.data.imported}`); setRows(null); setText(""); onDone(); }
  }
  const ok = rows?.filter((r) => r.ok).length ?? 0;
  return (
    <section className="space-y-4 border border-line bg-paper/70 p-6" aria-label={t.import_.title}>
      <h3 className="font-display text-xl">{t.import_.title}</h3>
      <p className="text-sm leading-6 text-ink-soft">{t.import_.help}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm" htmlFor="csv-file">{t.import_.file}</label>
          <input id="csv-file" type="file" accept=".csv,text/csv" className="block w-full text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await preview(await f.text()); }} />
        </div>
        <TextArea label={t.import_.paste} rows={3} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && preview(text)} dir="ltr" />
      </div>
      {headerError && <Notice tone="error">{(t.import_ as Record<string, string>)[headerError] ?? t.err.unknown}</Notice>}
      {rows && rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm"><strong>{ok}</strong> {t.import_.valid} · <strong>{rows.length - ok}</strong> {t.import_.invalid}</p>
          <div className="max-h-72 overflow-auto border border-line">
            <table className="w-full text-xs"><thead className="sticky top-0 bg-bone text-taupe"><tr><th className="px-3 py-2 text-start font-normal">{t.import_.line}</th><th className="px-3 py-2 text-start font-normal">{t.cols.name}</th><th className="px-3 py-2 text-start font-normal">{t.cols.phone}</th><th className="px-3 py-2 text-start font-normal">{t.import_.status}</th></tr></thead>
              <tbody className="divide-y divide-line">{rows.map((r) => (
                <tr key={r.line} className={r.ok ? "" : "bg-[#8a3b32]/5"}><td className="px-3 py-2">{r.line}</td><td className="px-3 py-2">{r.input.firstName} {r.input.lastName}</td><td className="px-3 py-2" dir="ltr">{r.phone ? formatPhone(r.phone) : r.input.phone}</td>
                  <td className="px-3 py-2">{r.ok ? <span className="text-olive">{t.import_.ok}</span> : <span className="text-[#8a3b32]">{Object.entries(r.errors).map(([k, v]) => `${(t.err as Record<string, string>)[v] ?? v} (${k})`).join(", ")}</span>}</td></tr>
              ))}</tbody></table>
          </div>
          <Button size="sm" onClick={commit} disabled={a.pending || ok === 0}>{t.import_.commit}</Button>
        </div>
      )}
      {result && <Notice tone="success">{result}</Notice>}
    </section>
  );
}
