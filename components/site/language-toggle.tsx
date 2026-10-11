"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { switchLocalePath, type Locale } from "@/lib/i18n";

/** EN / عربي. Keeps the current page (and query string) when switching. */
export function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  // Read the query string after mount: keeps public pages statically renderable.
  const [qs, setQs] = useState("");
  useEffect(() => setQs(window.location.search.replace(/^\?/, "")), [pathname]);
  const href = (to: Locale) => `${switchLocalePath(pathname, to)}${qs ? `?${qs}` : ""}`;
  return (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label={label}>
      <Link href={href("en")} hrefLang="en" lang="en" aria-current={locale === "en" ? "true" : undefined} className={`tracked tracking-[0.14em] ${locale === "en" ? "text-ink" : "text-ink-soft/70 hover:text-ink"}`}>EN</Link>
      <span className="h-3 w-px bg-line" aria-hidden />
      <Link href={href("ar")} hrefLang="ar" lang="ar" aria-current={locale === "ar" ? "true" : undefined} className={`font-arabic text-base ${locale === "ar" ? "text-ink" : "text-ink-soft/70 hover:text-ink"}`}>عربي</Link>
    </div>
  );
}
