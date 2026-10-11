import type { ReactNode } from "react";

type Tone = "neutral" | "olive" | "champagne" | "danger" | "info" | "ink";
const tones: Record<Tone, string> = {
  neutral: "bg-bone text-ink-soft",
  olive: "bg-sage/25 text-olive",
  champagne: "bg-champagne/30 text-[#6b5a2c]",
  danger: "bg-[#8a3b32]/10 text-[#8a3b32]",
  info: "bg-[#5f7aa0]/15 text-[#3d5578]",
  ink: "bg-ink text-paper",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs ${tones[tone]}`}>{children}</span>;
}

/** Portal surface: hairline border on paper. No shadow. */
export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <Tag className={`border border-line bg-paper/70 ${className}`}>{children}</Tag>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: "olive" | "danger" }) {
  return (
    <div className="border-s border-line ps-5">
      <p className="tracked text-[0.68rem] uppercase tracking-[0.2em] text-taupe">{label}</p>
      <p className={`font-display mt-1 text-4xl font-light ${tone === "olive" ? "text-olive" : tone === "danger" ? "text-[#8a3b32]" : "text-ink"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-ink/20 px-6 py-14 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-soft">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children, role }: { tone?: "info" | "success" | "error" | "demo"; children: ReactNode; role?: "alert" | "status" }) {
  const cls = { info: "border-[#5f7aa0]/40 bg-[#5f7aa0]/8 text-[#3d5578]", success: "border-sage bg-sage/15 text-olive", error: "border-[#8a3b32]/40 bg-[#8a3b32]/8 text-[#8a3b32]", demo: "border-champagne bg-champagne/15 text-[#6b5a2c]" }[tone];
  return <div role={role ?? (tone === "error" ? "alert" : "status")} className={`border px-4 py-3 text-sm leading-6 ${cls}`}>{children}</div>;
}

/** Marks anything that is a simulation, so it can never be mistaken for a real send/payment. */
export function DemoTag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-sm border border-champagne bg-champagne/15 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.12em] text-[#6b5a2c]">{children}</span>;
}

export function PageHeading({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display-3 !text-[clamp(1.9rem,3.4vw,2.6rem)]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
