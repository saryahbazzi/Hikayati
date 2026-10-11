import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Wizard } from "@/components/wizard/wizard";
import { DEFAULT_VISIBILITY, OCCASIONS } from "@/lib/domain/occasions";
import { emptyDraft, type EventDraft } from "@/lib/domain/wizard";
import { isLocale } from "@/lib/i18n";
import { wizardCopy } from "@/lib/i18n/wizard";
import { listPackages } from "@/lib/server/catalog";
import { getDb, uuidLike } from "@/lib/server/db";
import { loadEvent } from "@/lib/server/events";
import { requireActor } from "@/lib/server/session";
import { listTemplates } from "@/lib/server/templates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? `${wizardCopy(locale).title} · Hikayati` : "Hikayati" };
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BeginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const actor = await requireActor(locale, `/${locale}/begin`);
  const db = await getDb();
  const templates = await listTemplates(db);

  let initial: { eventId: string | null; step: number; draft: EventDraft } | null = null;
  const id = one(sp.event);
  if (id && uuidLike.test(id)) {
    try {
      const { row, draft } = await loadEvent(db, actor, id);
      if (row.status !== "draft") redirect(`/${locale}/my-events/${id}`);
      initial = { eventId: id, step: row.wizard_step || 1, draft: { ...draft, consent: false } };
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e) throw e; // redirect()
      initial = null; // not found / no access: start fresh
    }
  }
  if (!initial) {
    const draft = { ...emptyDraft(), visibility: { ...DEFAULT_VISIBILITY } };
    // Optional deep links from the public Occasions / Packages pages; validated against known lists.
    const occ = one(sp.occasion);
    if (OCCASIONS.some((o) => o.key === occ)) draft.occasion = occ;
    const pkg = one(sp.package);
    if (pkg && (await listPackages(db, { publicOnly: true })).some((p) => p.slug === pkg)) draft.packageSlug = pkg;
    initial = { eventId: null, step: 1, draft };
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Wizard locale={locale} initial={initial} templates={templates} />
    </div>
  );
}
