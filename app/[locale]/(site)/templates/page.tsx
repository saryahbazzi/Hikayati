import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/misc";
import { buildContent, SAMPLE_SOURCE } from "@/lib/domain/invitation-content";
import { isLocale, makeT, p } from "@/lib/i18n";
import { getDb } from "@/lib/server/db";
import { listTemplates } from "@/lib/server/templates";

export const dynamic = "force-dynamic";

const copy = makeT({
  title: p("Invitation designs", "تصاميم الدعوات"),
  sub: p("Original templates, each fully personalised with your names, words, colours and type. These samples use fictional details.", "قوالب أصلية، يمكن تخصيص كل منها بأسمائك وكلماتك وألوانك وخطوطك. هذه العينات بتفاصيل وهمية."),
  soon: p("Coming soon", "قريبًا"),
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${copy(locale).title} · Hikayati` : "Hikayati" };
}

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy(locale);
  const templates = await listTemplates(await getDb());
  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">{t.title}</p>
        <h1 className="display-2 mt-6 max-w-3xl text-balance">{t.title}</h1>
        <p className="lead mt-6 max-w-2xl">{t.sub}</p>
        <div className="mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((tpl, i) => {
            const group = tpl.groups[0];
            const sample = { ...SAMPLE_SOURCE, language: locale === "en" ? "en" as const : "ar" as const };
            if (group === "birthday") Object.assign(sample, { occasion: "birthday", title: "Reem", details: { celebrantName: "Reem" } });
            if (group === "corporate") Object.assign(sample, { occasion: "corporate_event", title: "Annual Gathering", details: {} });
            if (group === "graduation") Object.assign(sample, { occasion: "graduation", title: "Class of 2026", details: {} });
            return (
              <Reveal key={tpl.id} delay={(i % 4) * 0.06}>
                <div className={tpl.status === "coming_soon" ? "opacity-60" : ""}>
                  <InvitationRenderer content={buildContent(sample)} layout={tpl.layout} palette={tpl.palette} fontPair={tpl.fontPair} asset={tpl.asset} />
                </div>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div><h2 className="font-display text-xl">{tpl.name[locale]}</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{tpl.description[locale]}</p></div>
                  {tpl.status === "coming_soon" && <Badge tone="champagne">{t.soon}</Badge>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
