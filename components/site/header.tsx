"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Resolved } from "@/lib/i18n";
import type { common } from "@/lib/i18n/common";
import { Button } from "../ui/button";
import { AccountNav } from "./account-nav";
import { LanguageToggle } from "./language-toggle";
import { Wordmark } from "./wordmark";

type C = ReturnType<typeof common>;

/**
 * Public header: quiet bar on desktop, full-height sheet on mobile.
 * Pages: Home, About, Begin Your Story, Occasions, Packages, Contact, Sign In.
 */
export function Header({ locale, t }: { locale: Locale; t: C }) {
  const [open, setOpen] = useState(false);
  const base = `/${locale}`;
  const links = [
    { href: base, label: t.nav.home },
    { href: `${base}/about`, label: t.nav.about },
    { href: `${base}/occasions`, label: t.nav.occasions },
    { href: `${base}/packages`, label: t.nav.packages },
    { href: `${base}/contact`, label: t.nav.contact },
  ];
  const labels = { signIn: t.nav.signIn, myEvents: t.portal.myEvents, account: t.nav.account, staffPortal: t.nav.staffPortal, signOut: t.nav.signOut };

  // Lock page scroll and close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:bg-paper focus:px-4 focus:py-2">{t.nav.skip}</a>
      <div className="mx-auto flex h-[4.5rem] max-w-[84rem] items-center justify-between gap-6 px-6 lg:px-10">
        <Link href={base} aria-label="Hikayati — حكايتي"><Wordmark /></Link>

        <nav className="hidden items-center gap-8 xl:gap-10 lg:flex" aria-label={t.nav.primary}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="tracked group relative text-[0.8rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink">
              {l.label}
              <span className="absolute inset-x-0 -bottom-1.5 h-px origin-center scale-x-0 bg-champagne transition-transform duration-500 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-6 lg:flex"><AccountNav locale={locale} labels={labels} /></div>
          <LanguageToggle locale={locale} label={t.nav.language} />
          <div className="hidden lg:block"><Button href={`${base}/begin`} size="sm">{t.nav.begin}</Button></div>
          <button type="button" className="-me-2 p-2 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.nav.close : t.nav.menu} onClick={() => setOpen((v) => !v)}>
            <span className="block w-6 space-y-[7px]" aria-hidden>
              <span className={`block h-px bg-ink transition-transform duration-300 ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`block h-px bg-ink transition-transform duration-300 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[4.5rem] z-30 overflow-y-auto bg-ivory px-6 pb-10 pt-4 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <nav aria-label={t.nav.menu}>
            <ul className="divide-y divide-line" onClick={() => setOpen(false)}>
              {links.slice(0, 2).map((l) => (<li key={l.href}><Link href={l.href} className="block py-4 font-display text-2xl text-ink">{l.label}</Link></li>))}
              <li><Link href={`${base}/begin`} className="block py-4 font-display text-2xl text-olive">{t.nav.begin}</Link></li>
              {links.slice(2).map((l) => (<li key={l.href}><Link href={l.href} className="block py-4 font-display text-2xl text-ink">{l.label}</Link></li>))}
              <li onClick={(e) => e.stopPropagation()}><div className="py-0"><AccountNav locale={locale} labels={labels} variant="stacked" /></div></li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

export type { Resolved };
