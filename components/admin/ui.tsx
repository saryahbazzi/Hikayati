import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/misc";

/** Compact admin heading: less ceremony than the customer portal. */
export function AdminHeading({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink"><span aria-hidden className="rtl:rotate-180">←</span>{back.label}</Link>}
        <h1 className="font-display text-[1.9rem] font-normal leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, children, actions, className = "", id, note }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string; id?: string; note?: ReactNode }) {
  const hid = id ? `${id}-h` : undefined;
  return (
    <section id={id} aria-labelledby={title ? hid : undefined} className={`border border-line bg-paper/70 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title && <h2 id={hid} className="text-sm font-medium text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {note && <p className="border-b border-line bg-bone/40 px-5 py-2 text-xs leading-5 text-ink-soft">{note}</p>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="border border-line bg-paper/70 px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-display mt-0.5 text-3xl font-light leading-tight text-ink" dir="ltr" style={{ textAlign: "start" }}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-taupe">{sub}</p>}
    </div>
  );
}

export const tableCls = "w-full min-w-[40rem] border-collapse text-start text-sm";
export function TableWrap({ children, label }: { children: ReactNode; label: string }) {
  return <div className="overflow-x-auto border border-line bg-paper/70" role="region" aria-label={label} tabIndex={0}>{children}</div>;
}
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={`whitespace-nowrap border-b border-line bg-bone/50 px-4 py-2.5 text-start text-xs font-medium text-ink-soft ${className}`}>{children}</th>;
}
export function Td({ children, className = "", mono, dir }: { children?: ReactNode; className?: string; mono?: boolean; dir?: "ltr" | "rtl" }) {
  return <td dir={dir} className={`border-b border-line/70 px-4 py-2.5 align-middle ${mono ? "tabular-nums" : ""} ${className}`}>{children}</td>;
}

export const ctl = "block w-full min-w-0 border border-ink/25 bg-paper px-3 py-2 text-sm text-ink placeholder:text-taupe transition-colors focus:border-olive focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-[#8a3b32]";
export const btn = "inline-flex items-center justify-center gap-2 whitespace-nowrap border px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} border-ink bg-ink text-paper hover:bg-olive hover:border-olive`;
export const btnQuiet = `${btn} border-ink/30 text-ink hover:border-olive hover:text-olive`;
export const btnDanger = `${btn} border-[#8a3b32]/50 text-[#8a3b32] hover:bg-[#8a3b32] hover:text-paper`;
export const linkCls = "text-olive underline decoration-champagne decoration-1 underline-offset-4 hover:text-ink";

export function Lbl({ label, children, hint, error, className = "" }: { label: string; children: ReactNode; hint?: string; error?: string; className?: string }) {
  return (
    <label className={`grid min-w-0 gap-1 text-xs text-ink-soft ${className}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <span className="text-[0.7rem] leading-4 text-taupe">{hint}</span>}
      {error && <span role="alert" className="text-[0.7rem] leading-4 text-[#8a3b32]">{error}</span>}
    </label>
  );
}

/** GET filter form: works without JS and keeps filters in the URL. */
export function FilterBar({ children, apply, clear, clearHref, label }: { children: ReactNode; apply: string; clear: string; clearHref: string; label: string }) {
  return (
    <form method="get" role="search" aria-label={label} className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-paper/70 p-3">
      {children}
      <div className="flex items-center gap-2">
        <button type="submit" className={btnPrimary}>{apply}</button>
        <Link href={clearHref} className={btnQuiet}>{clear}</Link>
      </div>
    </form>
  );
}

export function Pager({ page, pageSize, total, hrefFor, t }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string; t: { prev: string; next: string; page: string; of: string; results: string } }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label={t.page} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
      <p><span dir="ltr">{total}</span> {t.results} · {t.page} <span dir="ltr">{page}</span> {t.of} <span dir="ltr">{pages}</span></p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={btnQuiet} href={hrefFor(page - 1)} rel="prev">{t.prev}</Link> : <span className={`${btnQuiet} opacity-40`} aria-disabled>{t.prev}</span>}
        {page < pages ? <Link className={btnQuiet} href={hrefFor(page + 1)} rel="next">{t.next}</Link> : <span className={`${btnQuiet} opacity-40`} aria-disabled>{t.next}</span>}
      </div>
    </nav>
  );
}

const toneOf: Record<string, "neutral" | "olive" | "champagne" | "danger" | "info" | "ink"> = {
  draft: "neutral", confirmed: "info", live: "olive", completed: "ink", cancelled: "danger",
  pending: "champagne", accepted: "olive", declined: "danger",
  queued: "neutral", demo_simulated: "champagne", sent: "info", delivered: "olive", read: "olive", failed: "danger",
  published: "olive", coming_soon: "champagne",
  success: "olive", already_checked_in: "champagne", invalid: "danger", wrong_event: "danger", not_accepted: "danger", revoked: "danger", forbidden: "danger",
};
export function StatusBadge({ value, label }: { value: string; label: string }) {
  return <Badge tone={toneOf[value] ?? "neutral"}>{label}</Badge>;
}

/** Horizontal CSS bar list. `max` defaults to the largest value. Values are always shown as numbers too. */
export function BarList({ rows, max, unit = "", label }: { rows: { label: string; value: number; note?: string }[]; max?: number; unit?: string; label: string }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-2.5" aria-label={label}>
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(6rem,11rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink" title={r.label}>{r.label}</span>
          <span className="h-3 bg-bone" aria-hidden><span className="block h-full bg-olive" style={{ width: `${Math.max(r.value > 0 ? 2 : 0, Math.min(100, (r.value / m) * 100))}%` }} /></span>
          <span className="tabular-nums text-ink-soft" dir="ltr">{r.value}{unit}{r.note ? ` · ${r.note}` : ""}</span>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-ink/20 px-5 py-10 text-center text-sm text-ink-soft">{children}</p>;
}

/** Builds a query string from defined, non-empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && String(v) !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
