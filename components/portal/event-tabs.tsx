"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Tab { href: string; label: string; exact?: boolean }

/** Link-based tab nav for the event workspace. Scrolls sideways on small screens. */
export function EventTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  const on = (t: Tab) => (t.exact ? path === t.href : path === t.href || path.startsWith(t.href + "/"));
  return (
    <nav aria-label={label} className="-mx-6 overflow-x-auto border-b border-line px-6 lg:mx-0 lg:px-0">
      <ul className="flex min-w-max gap-8">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link href={t.href} aria-current={on(t) ? "page" : undefined}
              className={`tracked block whitespace-nowrap border-b-2 pb-3 pt-1 text-[0.78rem] uppercase tracking-[0.16em] transition-colors ${on(t) ? "border-champagne text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
