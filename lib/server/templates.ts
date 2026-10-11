import "server-only";
import { audit } from "./audit";
import type { Queryable } from "./db";
import { ValidationError, type Actor } from "./permissions";

export interface TemplateView {
  id: string; slug: string; name: { en: string; ar: string }; description: { en: string; ar: string }; groups: string[]; style: string;
  kind: "static" | "motion" | "video"; status: "published" | "coming_soon" | "draft"; layout: string; palette: string; fontPair: string; sort: number;
  asset: { id: string; kind: string; url: string; width: number | null; height: number | null; overlayFields: OverlayField[] } | null;
}
/** Position of a personalised text field on top of an uploaded asset, in percent of the asset box. */
export interface OverlayField { key: string; x: number; y: number; w: number; align?: "start" | "center" | "end"; size?: number; color?: string }

export async function listTemplates(q: Queryable, opts: { includeDrafts?: boolean } = {}): Promise<TemplateView[]> {
  const rows = (await q.query<Record<string, unknown>>(`select * from invitation_templates ${opts.includeDrafts ? "" : "where status <> 'draft'"} order by sort, slug`)).rows;
  const assets = (await q.query<Record<string, unknown>>("select * from template_assets order by created_at desc")).rows;
  return rows.map((t) => {
    const a = assets.find((x) => x.template_id === t.id);
    return {
      id: t.id as string, slug: t.slug as string, name: t.name_i18n as TemplateView["name"], description: t.description_i18n as TemplateView["description"], groups: t.occasion_groups as string[],
      style: t.style as string, kind: t.kind as TemplateView["kind"], status: t.status as TemplateView["status"], layout: t.layout as string, palette: t.palette as string, fontPair: t.font_pair as string, sort: t.sort as number,
      asset: a ? { id: a.id as string, kind: a.kind as string, url: a.url as string, width: a.width as number | null, height: a.height as number | null, overlayFields: a.overlay_fields as OverlayField[] } : null,
    };
  });
}

export async function setTemplateStatus(q: Queryable, actor: Actor, id: string, status: "published" | "coming_soon" | "draft") {
  await q.query("update invitation_templates set status = $2, updated_at = now() where id = $1", [id, status]);
  await audit(q, actor, "template.status", { entity: "template", id }, { status });
}

export async function updateTemplate(q: Queryable, actor: Actor, id: string, u: { en: string; ar: string; descEn: string; descAr: string; sort: number }) {
  if (!u.en.trim() || !u.ar.trim()) throw new ValidationError({ name: "required" });
  await q.query("update invitation_templates set name_i18n=$2, description_i18n=$3, sort=$4, updated_at=now() where id=$1",
    [id, JSON.stringify({ en: u.en.slice(0, 80), ar: u.ar.slice(0, 80) }), JSON.stringify({ en: u.descEn.slice(0, 200), ar: u.descAr.slice(0, 200) }), Math.trunc(u.sort) || 0]);
  await audit(q, actor, "template.update", { entity: "template", id });
}

/**
 * Register an uploaded design (PNG/JPG/SVG/PDF/video) as a template. The image is a flat backdrop: its own
 * pixels are not editable — personalised text is drawn on top using `overlayFields`.
 * Only https URLs or site-relative /paths are accepted.
 */
export async function registerAssetTemplate(q: Queryable, actor: Actor, input: { slug: string; en: string; ar: string; groups: string[]; kind: "png" | "jpg" | "svg" | "pdf" | "video"; url: string; overlayFields: OverlayField[] }) {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60);
  const errors: Record<string, string> = {};
  if (!slug) errors.slug = "required";
  if (!input.en.trim() || !input.ar.trim()) errors.name = "required";
  if (!/^(https:\/\/|\/)[^\s"'<>]+$/.test(input.url) || input.url.startsWith("//")) errors.url = "invalid";
  if (!["png", "jpg", "svg", "pdf", "video"].includes(input.kind)) errors.kind = "invalid";
  const fields = (input.overlayFields ?? []).slice(0, 20).filter((f) => /^[a-zA-Z]{1,20}$/.test(f.key) && [f.x, f.y, f.w].every((n) => Number.isFinite(n) && n >= 0 && n <= 100));
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const motion = input.kind === "video" ? "video" : "static";
  const t = (await q.query<{ id: string }>(
    `insert into invitation_templates (slug, name_i18n, occasion_groups, style, kind, status, layout, palette, font_pair, sort)
     values ($1,$2,$3,'custom',$4,$5,'image-overlay','ivory','classic',100) returning id`,
    [slug, JSON.stringify({ en: input.en.slice(0, 80), ar: input.ar.slice(0, 80) }), input.groups, motion, motion === "video" ? "coming_soon" : "draft"])).rows[0];
  await q.query("insert into template_assets (template_id, kind, url, overlay_fields) values ($1,$2,$3,$4)", [t.id, input.kind, input.url, JSON.stringify(fields)]);
  await audit(q, actor, "template.register_asset", { entity: "template", id: t.id });
  return { id: t.id };
}
