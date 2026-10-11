import type { ReactNode } from "react";

/** Standard public page frame: eyebrow, title, lead, then content. */
export function PageShell({ eyebrow, title, lead, children, narrow = false }: { eyebrow: string; title: string; lead?: string; children?: ReactNode; narrow?: boolean }) {
  return (
    <section className="section">
      <div className={narrow ? "wrap-narrow" : "wrap"}>
        <header className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <span aria-hidden className="mt-6 block h-12 w-px bg-champagne" />
          <h1 className="display-1 mt-8 text-balance !text-[clamp(2.4rem,5.5vw,4.5rem)]">{title}</h1>
          {lead && <p className="lead mt-8">{lead}</p>}
        </header>
        {children && <div className="mt-20">{children}</div>}
      </div>
    </section>
  );
}
