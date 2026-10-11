import type { CSSProperties } from "react";
import { fontPairByKey, paletteByKey, type Align } from "@/lib/domain/design";
import type { InvitationContent } from "@/lib/domain/invitation-content";
import { Body, LAYOUTS } from "./layouts";

export interface OverlayField { key: string; x: number; y: number; w: number; align?: "start" | "center" | "end"; size?: number; color?: string }
export interface RendererAsset { kind: string; url: string; overlayFields: OverlayField[] }

export interface RendererProps {
  content: InvitationContent;
  layout: string;
  palette: string;
  fontPair: string;
  align?: Align;
  asset?: RendererAsset | null;
  className?: string;
}

/**
 * The single place an invitation is drawn — used by the wizard preview, the template gallery, the host's
 * dashboard and the guest's page. Built-in layouts are vector/CSS. Uploaded designs (`layout="image-overlay"`)
 * are flat backdrops with personalised text laid over them at configured positions: the image's own pixels
 * are never "edited", only overlaid.
 */
export function InvitationRenderer({ content, layout, palette, fontPair, align = "center", asset, className = "" }: RendererProps) {
  const pal = paletteByKey(palette);
  const fonts = fontPairByKey(fontPair);
  const vars = {
    "--iv-bg": pal.bg, "--iv-paper": pal.paper, "--iv-ink": pal.ink, "--iv-soft": pal.soft, "--iv-accent": pal.accent, "--iv-accent2": pal.accent2,
    "--iv-display": fonts.display, "--iv-body": fonts.body, containerType: "inline-size", aspectRatio: "3 / 4.25",
  } as CSSProperties;
  const base = "relative w-full overflow-hidden shadow-[0_30px_60px_-30px_rgba(60,50,25,0.45),0_2px_6px_rgba(60,50,25,0.1)]";

  if (layout === "image-overlay" && asset && (asset.kind === "png" || asset.kind === "jpg" || asset.kind === "svg")) {
    return (
      <article className={`${base} ${className}`} style={{ ...vars, background: pal.bg }} aria-label={content.names.join(" ")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {asset.overlayFields.map((f) => (
          <div key={f.key} className="absolute" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, textAlign: f.align ?? "center", fontSize: `${f.size ?? 4}cqw`, color: f.color ?? pal.ink, fontFamily: "var(--iv-display)", lineHeight: 1.35 }} dir="auto">
            {overlayText(content, f.key)}
          </div>
        ))}
      </article>
    );
  }

  const o = LAYOUTS[layout] ?? LAYOUTS["classic-frame"];
  const dark = o.dark || palette === "charcoal";
  return (
    <article className={`${base} ${className}`} style={{ ...vars, background: dark ? pal.bg : pal.bg }} aria-label={content.names.join(" ")}>
      <div aria-hidden className="absolute inset-0" style={{ background: dark ? "none" : "radial-gradient(120% 90% at 30% 0%, rgba(255,255,255,0.7), transparent 60%)" }} />
      {o.frame({ c: content })}
      <div className="relative h-full"><Body c={content} o={o} align={align} /></div>
    </article>
  );
}

/** Map an overlay field key to the text it should show. */
export function overlayText(c: InvitationContent, key: string): string {
  const lang = c.lang === "en" ? "en" : "ar";
  switch (key) {
    case "names": return c.names.join(` ${c.namesJoin[lang]} `);
    case "intro": return c.intro[lang];
    case "blessing": return c.blessing[lang];
    case "date": return c.date[lang];
    case "time": return c.time[lang];
    case "venue": return c.venue;
    case "address": return c.address;
    case "hosts": return c.hosts;
    case "closing": return c.closing[lang];
    case "guest": return c.guestName;
    default: return "";
  }
}
