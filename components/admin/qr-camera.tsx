"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnPrimary, btnQuiet } from "./ui";

interface BarcodeDetectorLike { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> }
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

export type CamError = "denied" | "missing" | "unsupported" | "error";
export interface CamLabels { start: string; stop: string; off: string; starting: string; scanning: string; denied: string; missing: string; unsupported: string; error: string }

/**
 * Camera QR reader. Uses the browser's BarcodeDetector when available, otherwise decodes video frames with jsQR
 * on a canvas. The stream is always stopped on unmount, when the tab is hidden, and when the user presses Stop.
 */
export function QrCamera({ onCode, labels, disabled }: { onCode: (raw: string) => void; labels: CamLabels; disabled?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = useRef(false);
  const cb = useRef(onCode);
  const [state, setState] = useState<"off" | "starting" | "on">("off");
  const [err, setErr] = useState<CamError | null>(null);
  useEffect(() => { cb.current = onCode; }, [onCode]);

  const stop = useCallback(() => {
    live.current = false;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
    setState("off");
  }, []);

  const start = useCallback(async () => {
    setErr(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) { setErr("unsupported"); return; }
    setState("starting");
    let s: MediaStream;
    try {
      try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); }
      catch (e) {
        if ((e as DOMException).name === "OverconstrainedError") s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        else throw e;
      }
    } catch (e) {
      const n = (e as DOMException).name;
      setErr(n === "NotAllowedError" || n === "SecurityError" ? "denied" : n === "NotFoundError" || n === "OverconstrainedError" ? "missing" : "error");
      setState("off");
      return;
    }
    stream.current = s;
    const v = video.current;
    if (!v) { s.getTracks().forEach((t) => t.stop()); return; }
    v.srcObject = s;
    try { await v.play(); } catch { stop(); setErr("error"); return; }
    live.current = true;
    setState("on");

    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    let detector: BarcodeDetectorLike | null = null;
    try { detector = Ctor ? new Ctor({ formats: ["qr_code"] }) : null; } catch { detector = null; }
    let jsQR: typeof import("jsqr").default | null = null;
    if (!detector) jsQR = (await import("jsqr")).default;
    if (!live.current) return;
    canvas.current ??= document.createElement("canvas");

    const tick = async () => {
      if (!live.current) return;
      try {
        if (v.readyState >= 2 && v.videoWidth > 0) {
          let raw: string | undefined;
          if (detector) {
            raw = (await detector.detect(v))[0]?.rawValue;
          } else if (jsQR) {
            const scale = Math.min(1, 640 / v.videoWidth);
            const w = Math.round(v.videoWidth * scale), h = Math.round(v.videoHeight * scale);
            const c = canvas.current!;
            c.width = w; c.height = h;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (ctx) { ctx.drawImage(v, 0, 0, w, h); raw = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" })?.data; }
          }
          if (raw) cb.current(raw);
        }
      } catch { /* a bad frame is not fatal; keep scanning */ }
      if (live.current) timer.current = setTimeout(tick, 180);
    };
    timer.current = setTimeout(tick, 180);
  }, [stop]);

  useEffect(() => {
    const onVis = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); stop(); };
  }, [stop]);

  const msg = err ? { denied: labels.denied, missing: labels.missing, unsupported: labels.unsupported, error: labels.error }[err] : null;
  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/90" style={{ maxHeight: "26rem" }}>
        <video ref={video} muted playsInline className={`h-full w-full object-cover ${state === "on" ? "" : "invisible"}`} aria-label={labels.scanning} />
        {state !== "on" && <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-paper/80">{state === "starting" ? labels.starting : labels.off}</p>}
        {state === "on" && <span aria-hidden className="pointer-events-none absolute inset-[18%] border-2 border-champagne/90" />}
      </div>
      {state === "on" && <p className="text-xs text-ink-soft" role="status">{labels.scanning}</p>}
      {msg && <p role="alert" className="border border-[#8a3b32]/40 bg-[#8a3b32]/8 px-3 py-2 text-sm text-[#8a3b32]">{msg}</p>}
      <div>
        {state === "off" ? <button type="button" className={btnPrimary} onClick={start} disabled={disabled}>{labels.start}</button>
          : <button type="button" className={btnQuiet} onClick={stop}>{labels.stop}</button>}
      </div>
    </div>
  );
}
