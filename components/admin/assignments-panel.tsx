"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignStaffAction, unassignStaffAction } from "@/app/actions/admin";
import { useAction } from "@/components/ui/use-action";
import { ErrorNotice, OkNotice, errorText, type CommonT } from "./feedback";
import { Lbl, Td, TableWrap, Th, btnDanger, btnPrimary, ctl, tableCls } from "./ui";

export interface AssignT { assignHelp: string; manager: string; checkInRole: string; noAssigned: string; pickStaff: string; assign: string; unassign: string; assignedOk: string; noCandidates: string; name: string; role: string; actions: string; assignments: string; saving: string; roles: { event_manager: string; check_in_staff: string } }

/** Assign / unassign event managers and check-in staff. Authorization is re-checked by the server action. */
export function AssignmentsPanel({ eventId, assignments, candidates, canAssign, t, c }: {
  eventId: string; canAssign: boolean; t: AssignT; c: CommonT;
  assignments: { userId: string; name: string; role: "manager" | "check_in"; phone: string; disabled: boolean }[];
  candidates: { id: string; name: string; role: string; phone: string }[];
}) {
  const router = useRouter();
  const [pick, setPick] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const a = useAction();
  const free = candidates.filter((u) => !assignments.some((x) => x.userId === u.id && x.role === (u.role === "event_manager" ? "manager" : "check_in")));

  async function assign() {
    if (!pick) return;
    setOk(null);
    const r = await a.run(() => assignStaffAction(eventId, pick));
    if (r.ok) { setPick(""); setOk(t.assignedOk); router.refresh(); }
  }
  async function unassign(userId: string, role: "manager" | "check_in") {
    setOk(null);
    const r = await a.run(() => unassignStaffAction(eventId, userId, role));
    if (r.ok) { setOk(t.assignedOk); router.refresh(); }
  }
  return (
    <div className="grid gap-4">
      <p className="text-xs leading-5 text-ink-soft">{t.assignHelp}</p>
      {assignments.length === 0 ? <p className="text-sm text-ink-soft">{t.noAssigned}</p> : (
        <TableWrap label={t.assignments}>
          <table className={tableCls}>
            <thead><tr><Th>{t.name}</Th><Th>{t.role}</Th>{canAssign && <Th><span className="sr-only">{t.actions}</span></Th>}</tr></thead>
            <tbody>
              {assignments.map((x) => (
                <tr key={`${x.userId}-${x.role}`}>
                  <Td>{x.name}<span className="block text-xs text-taupe" dir="ltr" style={{ textAlign: "start" }}>{x.phone}</span></Td>
                  <Td>{x.role === "manager" ? t.manager : t.checkInRole}</Td>
                  {canAssign && <Td className="text-end"><button type="button" className={btnDanger} disabled={a.pending} onClick={() => unassign(x.userId, x.role)}>{t.unassign}</button></Td>}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      {canAssign && (free.length === 0 ? <p className="text-sm text-ink-soft">{t.noCandidates}</p> : (
        <div className="flex flex-wrap items-end gap-3">
          <Lbl label={t.pickStaff} className="w-72">
            <select value={pick} onChange={(e) => setPick(e.target.value)} className={ctl}>
              <option value="">—</option>
              {free.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role === "event_manager" ? t.roles.event_manager : t.roles.check_in_staff}</option>)}
            </select>
          </Lbl>
          <button type="button" className={btnPrimary} disabled={!pick || a.pending} onClick={assign}>{a.pending ? t.saving : t.assign}</button>
        </div>
      ))}
      <ErrorNotice text={errorText(c, a.error, a.fields)} />
      <OkNotice text={ok} />
    </div>
  );
}
