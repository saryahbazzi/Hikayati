"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { isLocale, type Locale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";
import { portalCopy } from "@/lib/i18n/portal";

const useLocale = (): Locale => {
  const l = String((useParams() as { locale?: string }).locale ?? "en");
  return isLocale(l) ? l : "en";
};

/** Segment error boundary body: a calm message and a retry. */
export function PortalError({ reset }: { error: Error; reset: () => void }) {
  const t = portalCopy(useLocale());
  return (
    <div className="mx-auto max-w-xl space-y-6 py-16">
      <Notice tone="error">{t.err.load}</Notice>
      <Button variant="secondary" size="sm" onClick={reset}>{t.err.retry}</Button>
    </div>
  );
}

/** Quiet skeleton while a portal page loads. */
export function PortalLoading() {
  const t = common(useLocale());
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 py-4">
      <span className="sr-only">{t.actions.loading}</span>
      <div className="h-9 w-64 animate-pulse bg-bone" />
      <div className="h-4 w-96 max-w-full animate-pulse bg-bone/70" />
      <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse border border-line bg-bone/40" />)}</div>
      <div className="h-56 animate-pulse border border-line bg-bone/30" />
    </div>
  );
}

/** 404 body for the event workspace. */
export function PortalNotFound() {
  const locale = useLocale();
  const t = common(locale);
  return (
    <div className="mx-auto max-w-xl space-y-4 py-20 text-center">
      <h1 className="display-3">{t.notFound.title}</h1>
      <p className="text-ink-soft">{t.notFound.body}</p>
      <div className="pt-4"><Button href={`/${locale}/my-events`} variant="secondary" size="sm">{t.portal.myEvents}</Button></div>
    </div>
  );
}
