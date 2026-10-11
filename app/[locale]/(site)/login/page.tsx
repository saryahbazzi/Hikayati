import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { demoAccountsAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/site/login-form";
import { isLocale } from "@/lib/i18n";
import { authCopy } from "@/lib/i18n/auth";
import { getActor } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in · Hikayati", robots: { index: false } };

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  const actor = await getActor();
  if (actor) redirect(`/${locale}${actor.role === "customer" ? "/my-events" : "/admin"}`);
  const t = authCopy(locale);
  return (
    <section className="section">
      <div className="wrap-narrow">
        <p className="eyebrow">Hikayati · حكايتي</p>
        <h1 className="display-2 mt-5">{t.title}</h1>
        <p className="lead mt-4">{t.sub}</p>
        <div className="mt-12"><LoginForm locale={locale} t={t} next={next} demoAccounts={await demoAccountsAction()} /></div>
      </div>
    </section>
  );
}
