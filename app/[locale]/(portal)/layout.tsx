import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PortalNav } from "@/components/portal/portal-nav";
import { LanguageToggle } from "@/components/site/language-toggle";
import { Wordmark } from "@/components/site/wordmark";
import { DemoBanner } from "@/components/site/demo-banner";
import { isLocale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Authenticated customer area. The actor is resolved on the server; unauthenticated visitors are redirected to sign in. */
export default async function PortalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireActor(locale, (await headers()).get("x-hk-path") ?? undefined);
  const t = common(locale);
  const base = `/${locale}`;
  const items = [
    { href: `${base}/my-events`, label: t.portal.myEvents },
    { href: `${base}/begin`, label: t.portal.createEvent },
    { href: `${base}/guests`, label: t.portal.guests },
    { href: `${base}/invitations`, label: t.portal.invitations },
    { href: `${base}/reminders`, label: t.portal.reminders },
    { href: `${base}/account`, label: t.portal.settings },
  ];
  return (
    <div className="min-h-screen">
      <DemoBanner text={t.demo.banner} />
      <header className="relative border-b border-line bg-ivory/95">
        <div className="mx-auto flex h-[4.25rem] max-w-[84rem] items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6 lg:px-10">
          <Link href={base} aria-label="Hikayati — حكايتي"><Wordmark /></Link>
          <PortalNav items={items} locale={locale} menuLabel={t.nav.menu} signOut={t.nav.signOut} userName={actor.fullName || actor.phone || ""} />
          <LanguageToggle locale={locale} label={t.nav.language} />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[84rem] px-6 py-12 lg:px-10">{children}</main>
    </div>
  );
}
