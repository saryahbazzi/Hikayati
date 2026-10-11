"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addStaffAction, changeStaffRoleAction } from "@/app/actions/admin";
import { Badge, DemoTag } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { COUNTRIES } from "@/lib/phone";
import type { Locale } from "@/lib/i18n";
import type { adminCopy } from "@/lib/i18n/admin";
import type { StaffRow } from "@/lib/server/admin";
import { AccountToggle } from "./account-toggle";
import { ErrorNotice, OkNotice, errorText } from "./feedback";
import { Lbl, Panel, Td, TableWrap, Th, btnPrimary, btnQuiet, ctl } from "./ui";

type T = ReturnType<typeof adminCopy>;
const STAFF = ["super_admin", "admin", "event_manager", "check_in_staff"] as const;

export function TeamAdmin({ staff, locale, t }: { staff: StaffRow[]; locale: Locale; t: T }) {
  const m = t.team;
  const router = useRouter();
  const add = useAction();
  const [ok, setOk] = useState<string | null>(null);
  const [f, setF] = useState({ fullName: "", dial: "+966", phone: "", role: "event_manager" });
  const extra = { exists: m.errExists, phone: m.errPhone, invalid: m.errPhone, role: m.errRole, self: m.errSelf, lastSuperAdmin: m.errLast };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    const r = await add.run(() => addStaffAction(f));
    if (r.ok) { setF({ ...f, fullName: "", phone: "" }); setOk(m.added); router.refresh(); }
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Panel title={m.staff} id="staff">
        <TableWrap label={m.staff}>
          <table className="w-full min-w-[46rem] border-collapse text-start text-sm">
            <caption className="sr-only">{m.staff}</caption>
            <thead><tr><Th>{m.member}</Th><Th>{m.phone}</Th><Th>{t.common.role}</Th><Th>{t.common.status}</Th><Th><span className="sr-only">{m.actions}</span></Th></tr></thead>
            <tbody>{staff.map((s) => <StaffLine key={s.id} s={s} t={t} />)}</tbody>
          </table>
        </TableWrap>
      </Panel>
      <Panel title={m.addTitle} id="add-staff" note={m.addHelp}>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <Lbl label={m.fullName} className="w-56"><input className={ctl} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} maxLength={80} /></Lbl>
          <Lbl label={m.country} className="w-44"><select className={ctl} value={f.dial} onChange={(e) => setF({ ...f, dial: e.target.value })}>{COUNTRIES.map((c) => <option key={c.iso} value={c.dial}>{c[locale]} ({c.dial})</option>)}</select></Lbl>
          <Lbl label={m.mobile} className="w-48"><input className={ctl} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="off" required dir="ltr" /></Lbl>
          <Lbl label={t.common.role} className="w-48"><select className={ctl} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{STAFF.map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}</select></Lbl>
          <button type="submit" className={btnPrimary} disabled={add.pending}>{add.pending ? t.common.saving : m.addBtn}</button>
        </form>
        <div className="mt-3 grid gap-2"><ErrorNotice text={errorText(t.common, add.error, add.fields, extra)} /><OkNotice text={ok} /></div>
      </Panel>
    </div>
  );
}

function StaffLine({ s, t }: { s: StaffRow; t: T }) {
  const m = t.team;
  const router = useRouter();
  const a = useAction();
  const [role, setRole] = useState<string>(s.role);
  const [ok, setOk] = useState<string | null>(null);
  const extra = { self: m.errSelf, lastSuperAdmin: m.errLast };
  async function save() {
    setOk(null);
    const r = await a.run(() => changeStaffRoleAction(s.id, role));
    if (r.ok) { setOk(m.roleSaved); router.refresh(); }
    else setRole(s.role);
  }
  return (
    <tr>
      <Td>{s.name || <span className="text-taupe">{t.common.unnamed}</span>} {s.isSelf && <Badge tone="info">{t.common.you}</Badge>} {s.isDemo && <DemoTag>{t.common.demoTag}</DemoTag>}</Td>
      <Td mono><span dir="ltr">{s.phone || "—"}</span></Td>
      <Td>
        {s.isSelf ? <span>{t.roles[s.role]}<span className="block max-w-[14rem] text-xs text-taupe">{m.self}</span></span> : (
          <div className="flex items-center gap-2">
            <select aria-label={`${m.changeRole}: ${s.name}`} className={`${ctl} !w-44`} value={role} onChange={(e) => setRole(e.target.value)}>
              {(["super_admin", "admin", "event_manager", "check_in_staff", "customer"] as const).map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
            </select>
            <button type="button" className={btnQuiet} disabled={a.pending || role === s.role} onClick={save}>{t.common.save}</button>
          </div>
        )}
        <div className="mt-1 grid gap-1"><ErrorNotice text={errorText(t.common, a.error, a.fields, extra)} />{ok && <span role="status" className="text-xs text-olive">{ok}</span>}</div>
      </Td>
      <Td><Badge tone={s.disabled ? "danger" : "olive"}>{s.disabled ? t.common.disabled : t.common.active}</Badge></Td>
      <Td>{!s.isSelf && <AccountToggle userId={s.id} disabled={s.disabled} c={t.common} extraErrors={extra} labels={{ disable: m.disable, enable: m.enable, confirm: t.customers.confirmDisable, cancel: t.common.cancel }} />}</Td>
    </tr>
  );
}
