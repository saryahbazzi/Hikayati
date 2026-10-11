"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageToggle } from "@/components/site/language-toggle";
import { Wordmark } from "@/components/site/wordmark";
import type { Locale } from "@/lib/i18n";

export interface AdminNavItem { key: string; href: string; label: string }
export interface AdminNavLabels { menu: string; sections: string; signOut: string; language: string; title: string; signedInAs: string; publicSite: string; skip: string }

/**
 * Sidebar on desktop, disclosure on small screens. Items are computed on the server from the actor's role,
 * so this only ever renders sections the actor may open (every page still re-checks on the server).
 */
export function AdminNav({ items, locale, labels, userName, roleLabel }: { items: AdminNavItem[]; locale: Locale; labels: AdminNavLabels; userName: string; roleLabel: string }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const base = `/${locale}/admin`;
  const active = (href: string) => (href === base ? path === base : path === href || path.startsWith(`${href}/`));
  return (
    <aside className="border-b border-line bg-paper/70 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-e">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">{labels.skip}</a>
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
        <div>
          <Link href={base} aria-label="Hikayati" className="block"><Wordmark /></Link>
          <p className="mt-1 hidden text-xs tracking-wide text-taupe lg:block">{labels.title}</p>
        </div>
        <button type="button" className="border border-ink/25 px-3 py-1.5 text-sm lg:hidden" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen((v) => !v)}>{labels.menu}</button>
      </div>
      <div id="admin-menu" className={`${open ? "block" : "hidden"} lg:flex lg:flex-1 lg:flex-col`}>
        <nav aria-label={labels.sections} className="px-2 pb-3 lg:flex-1">
          <ul className="grid gap-0.5">
            {items.map((i) => (
              <li key={i.key}>
                <Link href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? "page" : undefined}
                  className={`block border-s-2 px-3 py-2 text-sm transition-colors ${active(i.href) ? "border-champagne bg-bone/70 text-ink" : "border-transparent text-ink-soft hover:bg-bone/40 hover:text-ink"}`}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-3 border-t border-line px-5 py-4 text-sm">
          <p className="min-w-0 text-xs leading-5 text-ink-soft"><span className="block">{labels.signedInAs}</span><span className="block truncate text-sm text-ink">{userName}</span><span className="block text-taupe">{roleLabel}</span></p>
          <LanguageToggle locale={locale} label={labels.language} />
          <div className="flex items-center justify-between gap-3">
            <Link href={`/${locale}`} className="text-xs text-ink-soft hover:text-ink">{labels.publicSite}</Link>
            <form action="/api/auth/logout" method="post"><input type="hidden" name="locale" value={locale} /><button type="submit" className="text-xs text-ink-soft underline decoration-champagne underline-offset-4 hover:text-ink">{labels.signOut}</button></form>
          </div>
        </div>
      </div>
    </aside>
  );
}
