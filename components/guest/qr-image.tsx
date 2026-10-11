"use client";

import QRCode from "qrcode";
import { useMemo } from "react";

/**
 * A real, scannable QR for a pass token, drawn as SVG modules (no HTML injection).
 * The payload is only the signed token (HK1.<id>.<sig>) — no names, phone numbers or event details.
 */
export function QrImage({ value, className = "", label }: { value: string; className?: string; label: string }) {
  const { size, cells } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const out: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.data[y * n + x]) out.push([x, y]);
    return { size: n, cells: out };
  }, [value]);
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className={className} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#24241f" />)}
    </svg>
  );
}

/** Render the pass (QR + labels) to a PNG and trigger a download. */
export async function downloadPassImage(opts: { token: string; guest: string; title: string; when: string; venue: string; note: string; filename: string; rtl: boolean }) {
  const W = 900, H = 1240;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#faf7f0"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#c9b68b"; g.lineWidth = 2; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = "rgba(201,182,139,.45)"; g.strokeRect(48, 48, W - 96, H - 96);
  g.textAlign = "center"; g.direction = opts.rtl ? "rtl" : "ltr";
  g.fillStyle = "#24241f"; g.font = '300 44px "Cormorant Garamond", serif';
  g.fillText("H I K A Y A T I   ·   حكايتي", W / 2, 130);
  g.fillStyle = "#66664a"; g.font = '600 54px "Amiri", "Cormorant Garamond", serif'; g.fillText(opts.guest, W / 2, 250);
  g.fillStyle = "#24241f"; g.font = '40px "Amiri", "Cormorant Garamond", serif'; g.fillText(opts.title, W / 2, 330);
  g.fillStyle = "#55554b"; g.font = '30px "Jost", "Noto Naskh Arabic", sans-serif';
  g.fillText(opts.when, W / 2, 392); g.fillText(opts.venue, W / 2, 438);
  const url = await QRCode.toDataURL(opts.token, { errorCorrectionLevel: "M", margin: 2, width: 560, color: { dark: "#24241f", light: "#ffffff" } });
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("qr")); img.src = url; });
  g.fillStyle = "#fff"; g.fillRect(170, 500, 560, 560);
  g.drawImage(img, 170, 500, 560, 560);
  g.fillStyle = "#55554b"; g.font = '28px "Jost", "Noto Naskh Arabic", sans-serif';
  g.fillText(opts.note, W / 2, 1130);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png"); a.download = opts.filename;
  a.click();
}
