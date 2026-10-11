"use client";

import { useRouter } from "next/navigation";
import { markContactHandledAction } from "@/app/actions/admin";
import { useAction } from "@/components/ui/use-action";
import { errorText, type CommonT } from "./feedback";
import { btnQuiet } from "./ui";

export function ContactHandled({ id, label, c }: { id: string; label: string; c: CommonT }) {
  const router = useRouter();
  const a = useAction();
  async function go() { const r = await a.run(() => markContactHandledAction(id)); if (r.ok) router.refresh(); }
  const err = errorText(c, a.error, a.fields);
  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" className={btnQuiet} disabled={a.pending} onClick={go}>{label}</button>
      {err && <span role="alert" className="text-xs text-[#8a3b32]">{err}</span>}
    </div>
  );
}
