"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addCollaboratorAction, removeCollaboratorAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/form";
import { Badge, Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { COUNTRIES } from "@/lib/phone";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { errText } from "./util";

export interface CollabRow { userId: string; name: string; phone: string; permission: "view_stats" | "manage_guests" }

/** Owner-only panel to share an event with a planner or family member. */
export function Collaborators({ eventId, locale, initial }: { eventId: string; locale: Locale; initial: CollabRow[] }) {
  const t = portalCopy(locale);
  const router = useRouter();
  const add = useAction();
  const rm = useAction();
  const [dial, setDial] = useState("+966");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState<"view_stats" | "manage_guests">("view_stats");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await add.run(() => addCollaboratorAction(eventId, /^\s*(\+|00)/.test(phone) ? phone : `${dial}${phone.replace(/^\s*0+/, "")}`, level));
    if (r.ok) { setMsg(t.ov.share.added); setPhone(""); router.refresh(); }
  }
  async function remove(userId: string) {
    setMsg(null);
    const r = await rm.run(() => removeCollaboratorAction(eventId, userId));
    setConfirm(null);
    if (r.ok) { setMsg(t.ov.share.removed); router.refresh(); }
  }
  const phoneErr = add.error ? errText(t, { error: add.error, fields: add.fields }) : null;

  return (
    <section aria-labelledby="share-h" className="border border-line p-6" data-testid="collaborators">
      <h2 id="share-h" className="font-display text-xl">{t.ov.share.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{t.ov.share.body}</p>

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-[9rem_1fr_14rem_auto] sm:items-end" noValidate>
        <SelectInput label={t.ov.share.country} value={dial} onChange={(e) => setDial(e.target.value)} name="dial">
          {COUNTRIES.map((c) => <option key={c.iso} value={c.dial}>{c.dial} · {locale === "ar" ? c.ar : c.en}</option>)}
        </SelectInput>
        <TextInput label={t.ov.share.phone} type="tel" inputMode="tel" dir="ltr" required value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" />
        <SelectInput label={t.ov.share.level} value={level} onChange={(e) => setLevel(e.target.value as typeof level)} name="level">
          <option value="view_stats">{t.ov.share.viewStats}</option><option value="manage_guests">{t.ov.share.manageGuests}</option>
        </SelectInput>
        <Button type="submit" size="sm" disabled={add.pending || !phone.trim()}>{add.pending ? t.ov.share.adding : t.ov.share.add}</Button>
      </form>
      <p className="mt-2 text-xs text-ink-soft">{level === "view_stats" ? t.ov.share.viewHint : t.ov.share.manageHint}</p>
      <div className="mt-4 space-y-3" aria-live="polite">
        {phoneErr && <Notice tone="error">{phoneErr}</Notice>}
        {rm.error && <Notice tone="error">{errText(t, { error: rm.error, fields: rm.fields })}</Notice>}
        {msg && <Notice tone="success">{msg}</Notice>}
      </div>

      <h3 className="tracked mt-8 text-[0.7rem] uppercase tracking-[0.2em] text-taupe">{t.ov.share.listLabel}</h3>
      {initial.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{t.ov.share.none}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <caption className="sr-only">{t.ov.share.listLabel}</caption>
            <thead className="sr-only"><tr><th scope="col">{t.ov.share.who}</th><th scope="col">{t.ov.share.level}</th><th scope="col">{t.gu.cols.act}</th></tr></thead>
            <tbody className="divide-y divide-line border-y border-line">
              {initial.map((c) => (
                <tr key={c.userId}>
                  <th scope="row" className="py-3 pe-4 text-start font-normal"><span className="block text-ink">{c.name || "—"}</span><span className="block text-xs text-ink-soft" dir="ltr"><bdi>{c.phone}</bdi></span></th>
                  <td className="py-3 pe-4"><Badge tone={c.permission === "manage_guests" ? "olive" : "neutral"}>{c.permission === "manage_guests" ? t.ov.share.manageGuests : t.ov.share.viewStats}</Badge></td>
                  <td className="py-3 text-end">
                    {confirm === c.userId ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-3 text-xs"><span>{t.ov.share.removeAsk}</span>
                        <button type="button" className="text-[#8a3b32] underline" onClick={() => remove(c.userId)} disabled={rm.pending}>{t.ov.share.removeYes}</button>
                        <button type="button" className="underline" onClick={() => setConfirm(null)}>{t.c.cancel}</button></span>
                    ) : (
                      <button type="button" className="text-xs text-ink-soft hover:text-[#8a3b32]" onClick={() => setConfirm(c.userId)}>{t.ov.share.remove}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
