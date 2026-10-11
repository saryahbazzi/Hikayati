"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfileAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { errText } from "./util";

/** Name, email and language. The mobile number is how the user signs in, so it is shown read-only. */
export function AccountForm({ locale, initial }: { locale: Locale; initial: { fullName: string; email: string; phone: string; locale: Locale } }) {
  const t = portalCopy(locale);
  const router = useRouter();
  const a = useAction();
  const [name, setName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [lang, setLang] = useState<Locale>(initial.locale);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    const r = await a.run(() => updateProfileAction({ fullName: name, email, locale: lang }));
    if (!r.ok) return;
    if (lang !== locale) { router.replace(`/${lang}/account`); return; }
    setOk(true);
    router.refresh();
  }
  const fieldErr = (k: string) => (a.fields[k] ? errText(t, { error: "validation", fields: { [k]: a.fields[k] } }) ?? undefined : undefined);
  return (
    <form onSubmit={submit} className="space-y-5" noValidate aria-label={t.acct.profile} data-testid="account-form">
      <TextInput label={t.acct.name} value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} name="fullName" />
      <TextInput label={t.acct.email} hint={t.acct.emailHint} type="email" dir="ltr" autoComplete="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} error={fieldErr("email")} name="email" />
      <SelectInput label={t.acct.language} value={lang} onChange={(e) => setLang(e.target.value as Locale)} name="locale">
        <option value="en">English</option><option value="ar">العربية</option>
      </SelectInput>
      <TextInput label={t.acct.phone} hint={t.acct.phoneHint} value={initial.phone} readOnly dir="ltr" name="phone" className="bg-bone/50 text-ink-soft" />
      <div aria-live="polite" className="space-y-3">
        {a.error && !Object.keys(a.fields).length && <Notice tone="error">{errText(t, { error: a.error })}</Notice>}
        {ok && <Notice tone="success">{t.acct.saved}</Notice>}
      </div>
      <Button type="submit" size="sm" disabled={a.pending}>{a.pending ? t.acct.saving : t.acct.save}</Button>
    </form>
  );
}
