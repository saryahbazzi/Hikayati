import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/misc";
import { AccountForm } from "@/components/portal/account-form";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { getDb } from "@/lib/server/db";
import { getProfile } from "@/lib/server/extras";
import { requireActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account Settings · Hikayati", robots: { index: false } };

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const db = await getDb();
  const actor = await requireActor(locale);
  const t = portalCopy(locale);
  const profile = await getProfile(db, actor);
  const a = t.acct;
  const points: [string, string][] = [[a.pPurpose, a.pPurposeBody], [a.pAccess, a.pAccessBody], [a.pConsent, a.pConsentBody], [a.pRetention, a.pRetentionBody], [a.pRights, a.pRightsBody]];

  return (
    <>
      <PageHeading title={a.title} sub={a.sub} />
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[26rem_1fr]">
        <section aria-labelledby="profile-h" className="min-w-0">
          <h2 id="profile-h" className="font-display mb-6 text-2xl">{a.profile}</h2>
          <AccountForm locale={locale} initial={profile} />
          <div className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-2xl">{a.session}</h2>
            <p className="mt-2 text-sm text-ink-soft">{a.signOutBody}</p>
            <form action="/api/auth/logout" method="post" className="mt-5">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="secondary" size="sm" data-testid="signout">{a.signOut}</Button>
            </form>
          </div>
        </section>

        <section aria-labelledby="privacy-h" className="min-w-0 max-w-2xl">
          <h2 id="privacy-h" className="font-display text-2xl">{a.privacy}</h2>
          <p className="mt-2 text-ink-soft">{a.privacyIntro}</p>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {points.map(([k, v]) => (
              <div key={k} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-8">
                <dt className="tracked text-[0.72rem] uppercase tracking-[0.18em] text-olive">{k}</dt>
                <dd className="text-sm leading-7 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-ink-soft">{a.pLaw}</p>
          <div className="mt-6 flex flex-wrap gap-6">
            <Button href={`/${locale}#contact`} variant="quiet" size="sm" className="!whitespace-normal text-start leading-6">{a.pContact}</Button>
          </div>
        </section>
      </div>
    </>
  );
}
