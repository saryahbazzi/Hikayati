"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkInManualAction, checkinPanelAction } from "@/app/actions/admin";
import { simulateCheckInAction } from "@/app/actions/invitations";
import { DemoTag, Notice } from "@/components/ui/misc";
import type { Locale } from "@/lib/i18n";
import type { adminCopy } from "@/lib/i18n/admin";
import type { CheckinPanel } from "@/lib/server/admin";
import type { CheckInResult } from "@/lib/server/checkin";
import { errorText } from "./feedback";
import { fmtTime } from "./format";
import { QrCamera } from "./qr-camera";
import { Lbl, Panel, StatusBadge, Td, TableWrap, Th, btnPrimary, ctl, tableCls } from "./ui";

type T = ReturnType<typeof adminCopy>;
const TOKEN = /HK1\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[A-Za-z0-9_-]{27}/i;
/** A QR may carry the bare pass code or a URL containing it. Anything else goes to the server, which rejects it as invalid. */
export const extractToken = (raw: string) => (TOKEN.exec(raw)?.[0] ?? raw.trim().slice(0, 300));

const tone = (r: CheckInResult["result"]) => (r === "success" ? "bg-olive text-paper" : r === "already_checked_in" ? "bg-champagne text-ink" : "bg-[#8a3b32] text-paper");
const glyph = (r: CheckInResult["result"]) => (r === "success" ? "✓" : r === "already_checked_in" ? "!" : "✕");

export function CheckinConsole({ initial, locale, t }: { initial: CheckinPanel; locale: Locale; t: T }) {
  const c = t.checkin;
  const eventId = initial.event.id;
  const [panel, setPanel] = useState(initial);
  const [last, setLast] = useState<{ res: CheckInResult; key: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [sim, setSim] = useState("");
  const [pollErr, setPollErr] = useState<string | null>(null);
  const inflight = useRef(false);
  const seen = useRef<{ code: string; at: number } | null>(null);

  const refresh = useCallback(async () => {
    const r = await checkinPanelAction(eventId);
    if (r.ok) { setPanel(r.data); setPollErr(null); } else setPollErr(errorText(t.common, r.error));
  }, [eventId, t.common]);

  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) void refresh(); }, 6000);
    return () => clearInterval(id);
  }, [refresh]);

  const apply = useCallback(async (res: { ok: true; data: CheckInResult } | { ok: false; error: string }) => {
    if (res.ok) setLast({ res: res.data, key: Date.now() });
    else setLast({ res: { ok: false, result: "forbidden" }, key: Date.now() });
    await refresh();
  }, [refresh]);

  const submit = useCallback(async (raw: string, method: "scanner" | "manual") => {
    if (inflight.current) return;
    const token = extractToken(raw);
    if (!token) return;
    const now = Date.now();
    // the camera sees the same QR for many frames: ignore repeats for a few seconds
    if (method === "scanner" && seen.current && seen.current.code === token && now - seen.current.at < 4000) return;
    seen.current = { code: token, at: now };
    inflight.current = true; setBusy(true);
    try { await apply(await checkInManualAction(token, eventId, method)); } finally { inflight.current = false; setBusy(false); }
  }, [apply, eventId]);

  async function onManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.trim()) return;
    await submit(manual, "manual");
    setManual("");
  }
  async function onSim() {
    if (!sim || inflight.current) return;
    inflight.current = true; setBusy(true);
    try { await apply(await simulateCheckInAction(sim)); setSim(""); } finally { inflight.current = false; setBusy(false); }
  }

  const { attended, accepted } = panel.counts;
  const res = c.result as Record<string, string>;
  const body = c.resultBody as Record<string, string>;
  const methods = t.events.methodLabel as Record<string, string>;
  const pending = panel.simulate?.filter((g) => !g.checkedIn) ?? [];
  const rate = accepted ? Math.round((attended / accepted) * 100) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-6">
        <section aria-label={c.counter} className="border border-line bg-paper/70 p-5" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-ink-soft">{c.counter}</p>
              <p className="font-sans text-6xl font-light leading-none tabular-nums text-ink" dir="ltr" style={{ textAlign: "start" }}>{attended}<span className="text-3xl text-taupe"> / {accepted}</span></p>
              <p className="mt-1 text-xs text-ink-soft">{c.counterOf} · {c.seats}: <span dir="ltr">{panel.counts.seats}</span></p>
            </div>
            <p className="text-xs text-taupe">{c.live}</p>
          </div>
          <div className="mt-4 h-2 bg-bone" aria-hidden><div className="h-full bg-olive transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${rate}%` }} /></div>
          {pollErr && <p role="alert" className="mt-2 text-xs text-[#8a3b32]">{pollErr}</p>}
        </section>

        <section aria-label={c.result.success} aria-live="assertive" role="status">
          {last ? (
            <div key={last.key} className={`flex items-start gap-5 px-6 py-6 ${tone(last.res.result)}`}>
              <span aria-hidden className="font-display text-6xl leading-none">{glyph(last.res.result)}</span>
              <div className="min-w-0">
                <p className="font-display text-4xl leading-tight">{res[last.res.result]}</p>
                {"guest" in last.res && last.res.guest && <p className="mt-1 text-2xl"><bdi>{last.res.guest.name}</bdi>{"companions" in last.res.guest && last.res.guest.companions > 0 ? <span className="text-lg opacity-90"> +{last.res.guest.companions} {c.companions}</span> : null}</p>}
                <p className="mt-1 text-sm opacity-90">{body[last.res.result]}{"at" in last.res && last.res.at ? ` ${c.at} ${fmtTime(last.res.at, locale)}` : ""}</p>
              </div>
            </div>
          ) : <div className="border border-dashed border-ink/25 px-6 py-6 text-center text-sm text-ink-soft">{busy ? c.checking : c.idle}</div>}
        </section>

        <Panel title={c.recent} id="recent">
          {panel.history.length === 0 ? <p className="text-sm text-ink-soft">{c.noRecent}</p> : (
            <TableWrap label={c.recent}>
              <table className={tableCls}>
                <thead><tr><Th>{c.time}</Th><Th>{c.guest}</Th><Th>{c.outcome}</Th><Th>{c.method}</Th><Th>{c.by}</Th></tr></thead>
                <tbody>
                  {panel.history.map((h) => (
                    <tr key={h.id}><Td className="whitespace-nowrap">{fmtTime(h.at, locale)}</Td><Td>{h.guestName ?? "—"}</Td><Td><StatusBadge value={h.result} label={res[h.result] ?? h.result} /></Td><Td>{methods[h.method] ?? h.method}</Td><Td>{h.by ?? "—"}</Td></tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 content-start gap-6">
        <Panel title={c.scanTitle} id="scan">
          <QrCamera disabled={busy} onCode={(raw) => void submit(raw, "scanner")}
            labels={{ start: c.startCamera, stop: c.stopCamera, off: c.cameraOff, starting: c.cameraStarting, scanning: c.scanning, denied: c.camDenied, missing: c.camMissing, unsupported: c.camUnsupported, error: c.camError }} />
        </Panel>

        <Panel title={c.manualTitle} id="manual">
          <form onSubmit={onManual} className="grid gap-3">
            <Lbl label={c.manualLabel} hint={c.manualHint}><input className={`${ctl} font-mono`} value={manual} onChange={(e) => setManual(e.target.value)} dir="ltr" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="HK1.…" maxLength={300} /></Lbl>
            <div><button type="submit" className={btnPrimary} disabled={busy || !manual.trim()}>{busy ? c.checking : c.verify}</button></div>
          </form>
        </Panel>

        {panel.demo && panel.simulate && (
          <Panel title={<span className="flex items-center gap-2">{c.simTitle} <DemoTag>{t.common.demoTag}</DemoTag></span>} id="simulate">
            <div className="grid gap-3">
              <Notice tone="demo">{c.simNote}</Notice>
              {pending.length === 0 ? <p className="text-sm text-ink-soft">{c.simNone}</p> : (
                <div className="flex flex-wrap items-end gap-3">
                  <Lbl label={c.simPick} className="min-w-[14rem] flex-1"><select className={ctl} value={sim} onChange={(e) => setSim(e.target.value)}><option value="">—</option>{pending.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Lbl>
                  <button type="button" className={btnPrimary} disabled={!sim || busy} onClick={onSim}>{c.simRun}</button>
                </div>
              )}
              <p className="text-xs text-taupe">{panel.simulate.filter((g) => g.checkedIn).length} {c.simArrived} / {panel.simulate.length}</p>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
