"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccountDisabledAction } from "@/app/actions/admin";
import { useAction } from "@/components/ui/use-action";
import { errorText, type CommonT } from "./feedback";
import { btnDanger, btnQuiet } from "./ui";

/** Disable / enable an account. The server action checks `team.manage` (super admin) and the last-super-admin / self rules. */
export function AccountToggle({ userId, disabled, labels, c, extraErrors }: { userId: string; disabled: boolean; labels: { disable: string; enable: string; confirm: string; cancel: string }; c: CommonT; extraErrors?: Record<string, string> }) {
  const router = useRouter();
  const a = useAction();
  const [confirming, setConfirming] = useState(false);
  async function go(next: boolean) {
    const r = await a.run(() => setAccountDisabledAction(userId, next));
    setConfirming(false);
    if (r.ok) router.refresh();
  }
  const err = errorText(c, a.error, a.fields, extraErrors);
  return (
    <div className="flex flex-col items-start gap-1">
      {!confirming ? (
        <button type="button" className={disabled ? btnQuiet : btnDanger} disabled={a.pending} onClick={() => (disabled ? go(false) : setConfirming(true))}>{disabled ? labels.enable : labels.disable}</button>
      ) : (
        <span className="grid gap-2" role="group" aria-label={labels.confirm}>
          <span className="max-w-[16rem] text-xs leading-5 text-ink-soft">{labels.confirm}</span>
          <span className="flex gap-2"><button type="button" className={btnDanger} disabled={a.pending} onClick={() => go(true)}>{labels.disable}</button><button type="button" className={btnQuiet} onClick={() => setConfirming(false)}>{labels.cancel}</button></span>
        </span>
      )}
      {err && <span role="alert" className="text-xs text-[#8a3b32]">{err}</span>}
    </div>
  );
}
