"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export interface NavItem { href: string; label: string }

/** Customer portal navigation: a quiet row on desktop, a disclosure on mobile. */
export function PortalNav({ items, locale, menuLabel, signOut, userName }: { items: NavItem[]; locale: Locale; menuLabel: string; signOut: string; userName: string }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const active = (href: string) => path === href || (href !== `/${locale}/begin` && path.startsWith(href + "/"));
  const link = (i: NavItem, mobile = false) => (
    <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? "page" : undefined}
      className={mobile ? `block py-3 font-display text-xl ${active(i.href) ? "text-olive" : "text-ink"}` : `tracked whitespace-nowrap border-b pb-1 text-[0.76rem] uppercase tracking-[0.14em] transition-colors ${active(i.href) ? "border-champagne text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}>
      {i.label}
    </Link>
  );
  return (
    <>
      <nav className="hidden items-center gap-7 lg:flex" aria-label="Portal">{items.map((i) => link(i))}</nav>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden max-w-[10rem] truncate text-sm text-ink-soft xl:inline">{userName}</span>
        <form action="/api/auth/logout" method="post" className="hidden lg:block"><input type="hidden" name="locale" value={locale} /><button className="tracked text-[0.74rem] uppercase tracking-[0.14em] text-ink-soft hover:text-ink">{signOut}</button></form>
        <button type="button" className="p-2 lg:hidden" aria-expanded={open} aria-controls="portal-menu" aria-label={menuLabel} onClick={() => setOpen((v) => !v)}>
          <span className="block w-6 space-y-[7px]" aria-hidden><span className="block h-px bg-ink" /><span className="block h-px bg-ink" /></span>
        </button>
      </div>
      {open && <nav id="portal-menu" aria-label={menuLabel} className="absolute inset-x-0 top-full z-30 border-b border-line bg-ivory px-6 pb-4 lg:hidden"><div className="divide-y divide-line">{items.map((i) => link(i, true))}<form action="/api/auth/logout" method="post"><input type="hidden" name="locale" value={locale} /><button className="block py-3 font-display text-xl text-ink-soft">{signOut}</button></form></div></nav>}
    </>
  );
}
