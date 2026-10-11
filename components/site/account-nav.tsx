"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

interface Me { actor: { role: string; fullName: string } | null; demo: boolean }
export interface AccountLabels { signIn: string; myEvents: string; account: string; staffPortal: string; signOut: string }

const STAFF = ["super_admin", "admin", "event_manager", "check_in_staff"];

/**
 * Public pages are static, so the signed-in state is fetched after hydration. Staff links appear only for
 * staff roles — and every staff page re-checks the role on the server regardless of what this shows.
 */
export function AccountNav({ locale, labels, variant = "inline" }: { locale: Locale; labels: AccountLabels; variant?: "inline" | "stacked" }) {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then((d: Me) => live && setMe(d)).catch(() => live && setMe({ actor: null, demo: false }));
    return () => { live = false; };
  }, []);

  const link = variant === "stacked" ? "block py-4 font-display text-2xl text-ink" : "tracked text-[0.8rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink";
  if (!me?.actor) {
    return <Link href={`/${locale}/login`} className={link}>{labels.signIn}</Link>;
  }
  const staff = STAFF.includes(me.actor.role);
  return (
    <>
      <Link href={staff && me.actor.role !== "customer" ? `/${locale}/admin` : `/${locale}/my-events`} className={link}>{staff ? labels.staffPortal : labels.myEvents}</Link>
      {!staff && variant === "stacked" && <Link href={`/${locale}/account`} className={link}>{labels.account}</Link>}
      <form action="/api/auth/logout" method="post" className={variant === "stacked" ? "block" : "inline"}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={`${link} text-start`}>{labels.signOut}</button>
      </form>
    </>
  );
}
