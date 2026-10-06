import type { ReactNode } from "react";

type Props = { href: string; children: ReactNode; variant?: "primary" | "ghost"; className?: string };

/** Quiet, squared-off buttons: solid charcoal for the primary action, hairline outline for the secondary. */
export function Button({ href, children, variant = "primary", className = "" }: Props) {
  const base =
    "tracked inline-flex items-center justify-center gap-3 px-8 py-3.5 text-[0.78rem] font-medium uppercase tracking-[0.2em] transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-olive";
  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-olive"
      : "border border-ink/35 text-ink hover:border-olive hover:text-olive";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}
