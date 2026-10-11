"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Optional, extremely subtle looping background for the About section.
 *
 * Media is OWNER-SUPPLIED ONLY — no stock or scraped footage is bundled. Provide, in public/media/ or on a CDN:
 *   NEXT_PUBLIC_ABOUT_VIDEO_URL   a short, silent, compressed loop (≤ 2–3 MB, 1280px, H.264/WebM)
 *   NEXT_PUBLIC_ABOUT_POSTER_URL  a still frame (also the fallback for reduced-motion / data-saver)
 * With neither set, a tonal lattice pattern is shown instead. No audio is ever played.
 */
export function AmbientMedia({ videoUrl, posterUrl }: { videoUrl?: string; posterUrl?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setPlay(!reduce && !saveData);
  }, [videoUrl]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !play) return;
    v.play().catch(() => setPlay(false));
  }, [play]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.16] saturate-50" loading="lazy" />
      ) : (
        <Lattice />
      )}
      {videoUrl && play && (
        <video ref={ref} className="absolute inset-0 h-full w-full object-cover opacity-[0.14] saturate-50" muted loop playsInline preload="metadata" poster={posterUrl}>
          <source src={videoUrl} />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory/80 to-ivory" />
    </div>
  );
}

/** Quiet eight-point lattice, drawn in champagne at very low contrast. */
function Lattice() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.55]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hk-lattice" width="88" height="88" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#c9b68b" strokeOpacity=".45" strokeWidth=".8">
            <path d="M44 6 L82 44 L44 82 L6 44Z" />
            <path d="M44 22 L66 44 L44 66 L22 44Z" />
            <path d="M0 0 L88 88 M88 0 L0 88" strokeOpacity=".18" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hk-lattice)" />
    </svg>
  );
}
