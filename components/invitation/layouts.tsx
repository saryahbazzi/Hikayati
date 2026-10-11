import type { CSSProperties, ReactNode } from "react";
import { langsOf, type InvitationContent, type Lang } from "@/lib/domain/invitation-content";
import type { Align } from "@/lib/domain/design";
import { Lozenge, Sprig } from "../floral";

/**
 * Invitation layouts. Every layout shares the same text engine (<Body>) and differs in its decoration,
 * type scale and rhythm. Sizes use container-query units (1cqw = 1% of card width) so a thumbnail and a
 * full-size card are the same design. All colours/fonts come from CSS variables set by <InvitationRenderer>.
 */
export interface LayoutOpts {
  frame: (a: { c: InvitationContent }) => ReactNode;
  pad: string;           // card padding (cqw based)
  name: number;          // name size in cqw
  nameWeight?: number;
  nameCase?: "uppercase" | "none";
  nameTrack?: string;
  nameFont?: "display" | "body";
  intro: number;
  body: number;
  rule: "lozenge" | "line" | "none";
  justify?: "center" | "between";
  dark?: boolean;
}

const L = {
  ar: { dress: "الزي", rsvp: "يُرجى تأكيد الحضور قبل", zaffa: "الزفة", guest: "الدعوة باسم", end: "حتى" },
  en: { dress: "Dress code", rsvp: "Kindly reply by", zaffa: "Zaffa", guest: "Invitation for", end: "until" },
};

const t = (n: number): CSSProperties => ({ fontSize: `${n}cqw` });

function Rule({ kind }: { kind: LayoutOpts["rule"] }) {
  if (kind === "none") return <div style={{ height: "3cqw" }} />;
  if (kind === "line") return <div aria-hidden className="mx-auto my-[3cqw] h-px w-[14cqw]" style={{ background: "var(--iv-accent)" }} />;
  return <Lozenge className="mx-auto my-[3cqw] w-[20cqw]" />;
}

function Details({ c, lang, o }: { c: InvitationContent; lang: Lang; o: LayoutOpts }) {
  const l = L[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const when = [c.date[lang], c.time[lang] && (c.endTime ? `${c.time[lang]} ${l.end} ${c.endTime[lang]}` : c.time[lang])].filter(Boolean).join(" · ");
  return (
    <div dir={dir} lang={lang} className="space-y-[1.2cqw]" style={{ ...t(o.body), color: "var(--iv-soft)", lineHeight: 1.75 }}>
      {when && <p style={{ color: "var(--iv-ink)", fontWeight: 500 }}>{when}</p>}
      {c.hijri && lang === "ar" && <p>{c.hijri}</p>}
      {c.zaffa && <p>{l.zaffa}: <bdi>{c.zaffa}</bdi></p>}
      {c.venue && <p style={{ color: "var(--iv-ink)" }}>{c.venue}</p>}
      {c.address && <p>{c.address}</p>}
      {c.dressCode && <p>{l.dress}: {c.dressCode}</p>}
      {c.instructions && <p>{c.instructions}</p>}
      {c.rsvpBy && <p>{l.rsvp} {c.rsvpBy[lang]}</p>}
    </div>
  );
}

export function Body({ c, o, align }: { c: InvitationContent; o: LayoutOpts; align: Align }) {
  const langs = langsOf(c);
  const primary: Lang = langs[0];
  const ta = align === "center" ? "center" : align === "start" ? "start" : "end";
  const nameFam = o.nameFont === "body" ? "var(--iv-body)" : "var(--iv-display)";
  return (
    <div className="relative flex h-full flex-col" style={{ padding: o.pad, textAlign: ta, color: "var(--iv-ink)", fontFamily: "var(--iv-body)" }}>
      {c.guestName && (
        <p dir={primary === "ar" ? "rtl" : "ltr"} lang={primary} style={{ ...t(o.body), color: "var(--iv-accent)", marginBottom: "3cqw" }}>
          {L[primary].guest} <strong style={{ fontWeight: 600, color: "var(--iv-ink)" }}>{c.guestName}</strong>
        </p>
      )}
      {langs.map((lang) => (c.blessing[lang] ? (
        <p key={`b${lang}`} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ ...t(o.intro * 0.95), color: "var(--iv-accent)", fontFamily: "var(--iv-display)", lineHeight: 1.7 }}>{c.blessing[lang]}</p>
      ) : null))}
      {c.blessing[primary] && <Rule kind={o.rule} />}
      {langs.map((lang, i) => (
        <p key={`i${lang}`} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ ...t(i === 0 ? o.intro : o.intro * 0.85), color: "var(--iv-soft)", lineHeight: 1.8, marginTop: i ? "1cqw" : 0 }}>{c.intro[lang]}</p>
      ))}
      {c.family.length > 0 && (
        <div dir={primary === "ar" ? "rtl" : "ltr"} lang={primary} className="mt-[2cqw]" style={{ ...t(o.body), color: "var(--iv-soft)", lineHeight: 1.7 }}>
          {c.family.map((f, i) => <p key={i}>{f}</p>)}
        </div>
      )}

      <div className={o.justify === "between" ? "my-auto py-[4cqw]" : "py-[4cqw]"}>
        {c.names.map((n, i) => (
          <div key={i}>
            {i > 0 && c.names.length > 1 && <p aria-hidden style={{ ...t(o.name * 0.55), color: "var(--iv-accent)", fontFamily: "var(--iv-display)", lineHeight: 1.1 }}>{c.namesJoin[primary]}</p>}
            <p dir="auto" style={{ ...t(o.name), fontFamily: nameFam, fontWeight: o.nameWeight ?? 400, textTransform: o.nameCase ?? "none", letterSpacing: o.nameTrack ?? "normal", lineHeight: 1.3 }}>{n}</p>
          </div>
        ))}
      </div>

      <Rule kind={o.rule} />
      {c.lang === "both" ? (
        <div dir="ltr" className="grid grid-cols-2 gap-[4cqw]" style={{ textAlign: "start" }}>
          <Details c={c} lang="en" o={o} />
          <Details c={c} lang="ar" o={o} />
        </div>
      ) : (
        <Details c={c} lang={primary} o={o} />
      )}
      {c.extra && <p dir="auto" className="mt-[2cqw]" style={{ ...t(o.body), color: "var(--iv-soft)" }}>{c.extra}</p>}
      <div className="mt-[4cqw]">
        {langs.map((lang) => (
          <p key={lang} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ ...t(o.intro), color: "var(--iv-accent)", fontFamily: "var(--iv-display)" }}>{c.closing[lang]}</p>
        ))}
      </div>
    </div>
  );
}

/* ───────────── decorations ───────────── */
const DoubleFrame = () => (
  <>
    <div aria-hidden className="absolute inset-[3.4cqw]" style={{ border: "1px solid var(--iv-accent)", opacity: 0.75 }} />
    <div aria-hidden className="absolute inset-[4.4cqw]" style={{ border: "1px solid var(--iv-accent)", opacity: 0.35 }} />
  </>
);

export const LAYOUTS: Record<string, LayoutOpts> = {
  "classic-frame": {
    frame: () => (<><DoubleFrame /><Sprig className="absolute -start-2 -top-1 w-[24%] opacity-90" /><Sprig className="absolute -bottom-1 -end-2 w-[24%] opacity-90" flip /></>),
    pad: "12cqw 13cqw 11cqw", name: 7.6, nameFont: "display", intro: 3.7, body: 3.3, rule: "lozenge", justify: "between",
  },
  "modern-split": {
    frame: () => (<>
      <div aria-hidden className="absolute inset-y-0 start-0 w-[7cqw]" style={{ background: "var(--iv-accent2)" }} />
      <div aria-hidden className="absolute inset-y-[6cqw] start-[11cqw] w-px" style={{ background: "var(--iv-accent)", opacity: 0.6 }} />
    </>),
    pad: "12cqw 10cqw 10cqw 17cqw", name: 8.4, nameWeight: 300, intro: 3.5, body: 3.2, rule: "line", justify: "between",
  },
  arch: {
    frame: () => (
      <svg aria-hidden viewBox="0 0 100 140" className="absolute inset-x-[10%] top-[4%] h-[44%] w-[80%]" fill="none" preserveAspectRatio="none">
        <path d="M2 140 V50 C2 20 24 2 50 2 C76 2 98 20 98 50 V140" stroke="var(--iv-accent)" strokeWidth=".5" vectorEffect="non-scaling-stroke" opacity=".7" />
        <path d="M6 140 V50 C6 24 26 6 50 6 C74 6 94 24 94 50 V140" stroke="var(--iv-accent)" strokeWidth=".4" vectorEffect="non-scaling-stroke" opacity=".35" />
      </svg>
    ),
    pad: "15cqw 14cqw 10cqw", name: 7.4, intro: 3.6, body: 3.2, rule: "lozenge", justify: "between",
  },
  "botanical-border": {
    frame: () => (<>
      <div aria-hidden className="absolute inset-[3cqw]" style={{ border: "1px solid var(--iv-accent)", opacity: 0.5 }} />
      <Sprig className="absolute -start-3 top-[8%] w-[22%] rotate-90 opacity-95" />
      <Sprig className="absolute -end-3 top-[8%] w-[22%] -rotate-90 opacity-95" />
      <Sprig className="absolute -bottom-1 start-[6%] w-[20%] opacity-90" flip />
      <Sprig className="absolute -bottom-1 end-[6%] w-[20%] opacity-90" flip />
    </>),
    pad: "13cqw 15cqw 14cqw", name: 7.4, nameFont: "display", intro: 3.6, body: 3.2, rule: "lozenge", justify: "between",
  },
  stripe: {
    frame: () => (<>
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--iv-accent2) 0 2px, transparent 2px 14px)", opacity: 0.55 }} />
      <div aria-hidden className="absolute inset-[7cqw]" style={{ background: "var(--iv-paper)", border: "1px solid var(--iv-accent)" }} />
    </>),
    pad: "14cqw 14cqw 12cqw", name: 7.2, nameFont: "display", intro: 3.5, body: 3.2, rule: "line", justify: "between",
  },
  editorial: {
    frame: ({ c }) => (
      <div aria-hidden className="absolute -start-[2cqw] top-[1cqw] select-none leading-none" style={{ fontFamily: "var(--iv-display)", fontSize: "62cqw", color: "var(--iv-accent2)", opacity: 0.55, fontWeight: 300 }} dir="auto">
        {(c.names[0] ?? "").trim().charAt(0).toUpperCase()}
      </div>
    ),
    pad: "12cqw 11cqw 11cqw", name: 10, nameWeight: 300, nameCase: "none", intro: 3.4, body: 3.2, rule: "line", justify: "between",
  },
  minimal: {
    frame: () => (<div aria-hidden className="absolute inset-x-[11cqw] top-[10cqw] h-px" style={{ background: "var(--iv-accent)" }} />),
    pad: "17cqw 11cqw 11cqw", name: 6.2, nameFont: "body", nameCase: "uppercase", nameTrack: "0.18em", nameWeight: 300, intro: 3.2, body: 3.1, rule: "none", justify: "between",
  },
  contemporary: {
    frame: () => (<>
      <div aria-hidden className="absolute inset-y-0 start-[33.3%] w-px" style={{ background: "var(--iv-accent)", opacity: 0.25 }} />
      <div aria-hidden className="absolute inset-y-0 start-[66.6%] w-px" style={{ background: "var(--iv-accent)", opacity: 0.25 }} />
      <div aria-hidden className="absolute inset-x-[9cqw] top-[9cqw] h-[1.2cqw]" style={{ background: "var(--iv-accent)" }} />
    </>),
    pad: "17cqw 9cqw 10cqw", name: 7, nameFont: "body", nameWeight: 300, nameTrack: "0.04em", intro: 3.3, body: 3.1, rule: "none", justify: "between", dark: true,
  },
};
