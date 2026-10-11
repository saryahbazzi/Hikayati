import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { ContentSource } from "@/lib/domain/invitation-content";
import { getDb, uuidLike } from "@/lib/server/db";
import { loadEvent } from "@/lib/server/events";
import { ForbiddenError, NotFoundError } from "@/lib/server/permissions";
import { requireActor } from "@/lib/server/session";
import { listTemplates } from "@/lib/server/templates";

/** Load one event for the signed-in actor (cached per request). Unknown / inaccessible ids render a 404, so ids can’t be probed. */
export const getWorkspace = cache(async (locale: string, id: string) => {
  if (!uuidLike.test(id)) notFound();
  const db = await getDb();
  const actor = await requireActor(locale);
  try {
    const ev = await loadEvent(db, actor, id);
    return { db, actor, ...ev };
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof ForbiddenError) notFound();
    throw e;
  }
});

export type Workspace = Awaited<ReturnType<typeof getWorkspace>>;

export interface PreviewData {
  source: ContentSource;
  layout: string; palette: string; fontPair: string; align: "start" | "center" | "end";
  asset: { kind: string; url: string; overlayFields: { key: string; x: number; y: number; w: number; align?: "start" | "center" | "end"; size?: number; color?: string }[] } | null;
  templateName: { en: string; ar: string } | null; paletteKey: string;
}

/** Everything needed to draw the stored event’s invitation: a ContentSource plus the design (template layout, palette, fonts). */
export async function buildPreview(ws: Workspace): Promise<PreviewData> {
  const { row, draft, db } = ws;
  const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
  const source: ContentSource = {
    occasion: draft.occasion, occasionCustom: draft.occasionCustom || null, title: draft.title, language: draft.language,
    startsAt: iso(row.starts_at), endsAt: iso(row.ends_at), rsvpDeadline: iso(row.rsvp_deadline), timezone: row.timezone,
    hostFirstName: draft.hostFirstName, hostLastName: draft.hostLastName, cohostName: draft.cohostName,
    venueName: draft.venueName, venueAddress: draft.venueAddress, mapUrl: draft.mapUrl, dressCode: draft.dressCode, instructions: draft.instructions,
    details: draft.details, visibility: draft.visibility, fields: draft.design.fields,
  };
  const tpl = draft.design.templateSlug ? (await listTemplates(db, { includeDrafts: true })).find((t) => t.slug === draft.design.templateSlug) : undefined;
  return {
    source, layout: tpl?.layout ?? "classic-frame", palette: draft.design.palette, fontPair: draft.design.fontPair, align: draft.design.align, paletteKey: draft.design.palette,
    asset: tpl?.asset && tpl.layout === "image-overlay" ? { kind: tpl.asset.kind, url: tpl.asset.url, overlayFields: tpl.asset.overlayFields } : null,
    templateName: tpl?.name ?? null,
  };
}
