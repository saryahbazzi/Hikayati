"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** A real, scannable QR code for an entry-pass token (rendered to a PNG data URL in the browser). */
export function PassQr({ value, label, size = 208 }: { value: string; label: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    QRCode.toDataURL(value, { margin: 2, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#24241f", light: "#ffffff" } })
      .then((u) => { if (!off) setSrc(u); })
      .catch(() => { if (!off) setSrc(null); });
    return () => { off = true; };
  }, [value, size]);
  return (
    <div className="inline-block border border-line bg-white p-2" style={{ width: size + 18, height: size + 18 }} data-testid="pass-qr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={label} width={size} height={size} className="block" /> : <div aria-busy="true" className="animate-pulse bg-bone" style={{ width: size, height: size }} />}
    </div>
  );
}
