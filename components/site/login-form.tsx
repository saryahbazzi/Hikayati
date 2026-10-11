"use client";

import { useState } from "react";
import { demoLoginAction, requestOtpAction, verifyOtpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SelectInput, TextInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { COUNTRIES } from "@/lib/phone";
import type { Locale } from "@/lib/i18n";
import type { authCopy } from "@/lib/i18n/auth";

type T = ReturnType<typeof authCopy>;
export interface DemoAccount { key: string; name: string; role: string; staff: boolean }

/** Phone + OTP. In development a visible code replaces SMS; seeded demo accounts appear only when the server enables them. */
export function LoginForm({ locale, t, next, demoAccounts }: { locale: Locale; t: T; next?: string; demoAccounts: DemoAccount[] }) {
  const [dial, setDial] = useState("+966");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | undefined>();
  const { run, pending, error } = useAction();
  const msg = error ? (t.errors as Record<string, string>)[error] ?? t.errors.unknown : null;
  const [localErr, setLocalErr] = useState<string | null>(null);
  const shown = localErr ?? msg;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr(null);
    const r = await run(() => requestOtpAction(phone, dial));
    if (r.ok) { setDevCode(r.data.devCode); setStep("code"); }
    else if (r.error === "auth") setLocalErr((t.errors as Record<string, string>)[r.code ?? "unknown"] ?? t.errors.unknown);
    else if (r.error === "rate_limited") setLocalErr(t.errors.rate_limited);
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr(null);
    const r = await run(() => verifyOtpAction(phone, code, dial, locale, next));
    if (r.ok) window.location.assign(r.data.to);
    else if (r.error === "auth" || r.error === "rate_limited") setLocalErr((t.errors as Record<string, string>)[r.code ?? r.error] ?? t.errors.unknown);
  }
  async function demo(key: string) {
    setLocalErr(null);
    const r = await run(() => demoLoginAction(key as never, locale, next));
    if (r.ok) window.location.assign(r.data.to);
    else setLocalErr(t.errors.demo_disabled);
  }

  return (
    <div className="space-y-10">
      {step === "phone" ? (
        <form onSubmit={send} className="space-y-5" noValidate>
          <div className="grid grid-cols-[9rem_1fr] gap-3">
            <SelectInput label={t.country} value={dial} onChange={(e) => setDial(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c.iso} value={c.dial}>{c.dial} · {locale === "ar" ? c.ar : c.en}</option>)}
            </SelectInput>
            <TextInput label={t.phone} hint={t.phoneHint} type="tel" inputMode="tel" autoComplete="tel-national" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          {shown && <Notice tone="error">{shown}</Notice>}
          <Button type="submit" disabled={pending || !phone.trim()}>{t.sendCode}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-5" noValidate>
          {devCode && (
            <Notice tone="demo">
              <p className="font-medium">{t.devTitle}</p>
              <p className="mt-1">{t.devCode} <bdi dir="ltr" className="font-mono text-base tracking-[0.3em]" data-testid="dev-otp">{devCode}</bdi></p>
            </Notice>
          )}
          <TextInput label={t.code} inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
          {shown && <Notice tone="error">{shown}</Notice>}
          <div className="flex items-center gap-6">
            <Button type="submit" disabled={pending || code.length < 6}>{t.verify}</Button>
            <Button variant="quiet" onClick={() => { setStep("phone"); setCode(""); setLocalErr(null); }}>{t.change}</Button>
          </div>
        </form>
      )}

      {demoAccounts.length > 0 && (
        <section aria-labelledby="demo-h" className="border-t border-line pt-8">
          <h2 id="demo-h" className="font-display text-xl">{t.demoTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{t.demoSub}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((a) => (
              <li key={a.key}>
                <button type="button" disabled={pending} onClick={() => demo(a.key)} data-testid={`demo-${a.key}`} className="w-full border border-ink/20 px-4 py-3 text-start text-sm transition-colors hover:border-olive hover:bg-paper disabled:opacity-50">
                  <span className="block text-ink">{a.name}</span>
                  <span className="mt-0.5 block text-xs uppercase tracking-wider text-taupe">{t.continueAs} · {a.role.replace("_", " ")}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
