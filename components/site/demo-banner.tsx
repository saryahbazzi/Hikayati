"use client";

import { useEffect, useState } from "react";

/** Shown only when the server says demo access is enabled (dev, or an explicitly enabled preview). */
export function DemoBanner({ text, temporaryText }: { text: string; temporaryText?: string }) {
  const [demo, setDemo] = useState(false);
  const [temporary, setTemporary] = useState(false);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then((d) => { setDemo(!!d.demo); setTemporary(!!d.temporary); }).catch(() => undefined);
  }, []);
  if (!demo) return null;
  return (
    <div role="note" className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-paper">
      {text}
      {temporary && temporaryText && <span className="block text-champagne">{temporaryText}</span>}
    </div>
  );
}
