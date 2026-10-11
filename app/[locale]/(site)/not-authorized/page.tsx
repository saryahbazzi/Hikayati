import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isLocale } from "@/lib/i18n";
import { common } from "@/lib/i18n/common";

export default async function NotAuthorized({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = common(locale).notAuthorized;
  return (
    <section className="section text-center">
      <div className="wrap-narrow">
        <h1 className="display-2">{t.title}</h1>
        <p className="lead mt-4">{t.body}</p>
        <div className="mt-10"><Button href={`/${locale}`}>{t.home}</Button></div>
      </div>
    </section>
  );
}
