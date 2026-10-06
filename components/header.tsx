"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/content";
import { content } from "@/lib/content";
import { Button } from "./button";

type T = (typeof content)[Locale];

/** Minimal sticky header: wordmark, five links, EN / عربي toggle and the primary CTA. */
export function Header({ locale, t }: { locale: Locale; t: T }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#home", label: t.nav.home },
    { href: "#occasions", label: t.nav.occasions },
    { href: "#how", label: t.nav.how },
    { href: "#about", label: t.nav.about },
    { href: "#contact", label: t.nav.contact },
  ];

  const toggle = (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label={t.langLabel}>
      <Link
        href="/en"
        hrefLang="en"
        lang="en"
        aria-current={locale === "en" ? "true" : undefined}
        className={`tracked tracking-[0.14em] ${locale === "en" ? "text-ink" : "text-ink-soft/70 hover:text-ink"}`}
      >
        EN
      </Link>
      <span className="h-3 w-px bg-line" aria-hidden />
      <Link
        href="/ar"
        hrefLang="ar"
        lang="ar"
        aria-current={locale === "ar" ? "true" : undefined}
        className={`font-arabic text-base ${locale === "ar" ? "text-ink" : "text-ink-soft/70 hover:text-ink"}`}
      >
        عربي
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <a href="#home" className="flex items-baseline gap-3" dir="ltr" aria-label="Hikayati — حكايتي">
          <span className="font-display text-[1.35rem] font-light tracking-[0.3em] text-ink" style={{ fontFamily: "var(--font-cormorant)" }}>
            HIKAYATI
          </span>
          <span className="font-arabic text-xl leading-none text-olive">حكايتي</span>
        </a>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="tracked group relative text-[0.8rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
              <span className="absolute inset-x-0 -bottom-1.5 h-px origin-center scale-x-0 bg-champagne transition-transform duration-500 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {toggle}
          <div className="hidden lg:block">
            <Button href="#contact" className="!px-6 !py-2.5">
              {t.cta}
            </Button>
          </div>
          <button
            type="button"
            className="-me-2 p-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block w-6 space-y-[7px]">
              <span className={`block h-px bg-ink transition-transform duration-300 ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`block h-px bg-ink transition-transform duration-300 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-ivory px-6 pb-8 pt-4 lg:hidden" aria-label="Mobile">
          <ul className="divide-y divide-line">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block py-4 font-display text-2xl text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href="#contact" className="mt-6 w-full">
            {t.cta}
          </Button>
        </nav>
      )}
    </header>
  );
}
