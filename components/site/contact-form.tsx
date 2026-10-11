"use client";

import { useState } from "react";
import { submitContactAction } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { TextArea, TextInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import type { Locale } from "@/lib/i18n";
import type { pages } from "@/lib/i18n/pages";

type T = ReturnType<typeof pages>["contact"];

export function ContactForm({ locale, t }: { locale: Locale; t: T }) {
  const [v, setV] = useState({ name: "", replyTo: "", message: "" });
  const [done, setDone] = useState(false);
  const a = useAction();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await a.run(() => submitContactAction({ ...v, locale }));
    if (r.ok) { setDone(true); setV({ name: "", replyTo: "", message: "" }); }
  }
  if (done) return <Notice tone="success">{t.thanks}</Notice>;
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <TextInput label={t.name} required value={v.name} onChange={set("name")} error={a.fields.name && t.required} autoComplete="name" />
      <TextInput label={t.replyTo} required value={v.replyTo} onChange={set("replyTo")} error={a.fields.replyTo && t.required} autoComplete="email" dir="ltr" />
      <TextArea label={t.message} required rows={6} value={v.message} onChange={set("message")} error={a.fields.message && t.required} />
      {a.fields.form === "rate_limited" && <Notice tone="error">{t.tooMany}</Notice>}
      {a.error && a.error !== "validation" && <Notice tone="error">{t.error}</Notice>}
      <Button type="submit" disabled={a.pending}>{a.pending ? t.sending : t.send}</Button>
    </form>
  );
}
