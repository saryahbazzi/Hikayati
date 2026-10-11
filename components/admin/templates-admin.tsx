"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { registerTemplateAction, setTemplateStatusAction, updateOverlayAction, updateTemplateAction } from "@/app/actions/admin";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { Notice } from "@/components/ui/misc";
import { useAction } from "@/components/ui/use-action";
import { buildContent, SAMPLE_SOURCE } from "@/lib/domain/invitation-content";
import type { Locale } from "@/lib/i18n";
import type { adminCopy } from "@/lib/i18n/admin";
import type { OverlayField, TemplateView } from "@/lib/server/templates";
import { ErrorNotice, OkNotice, errorText } from "./feedback";
import { Lbl, Td, TableWrap, Th, btnPrimary, btnQuiet, ctl, tableCls } from "./ui";
import { Badge } from "@/components/ui/misc";

type T = ReturnType<typeof adminCopy>;
type Status = "published" | "coming_soon" | "draft";

const DEFAULT_OVERLAY: OverlayField[] = [
  { key: "intro", x: 10, y: 20, w: 80, align: "center", size: 3.6 },
  { key: "names", x: 10, y: 32, w: 80, align: "center", size: 7 },
  { key: "date", x: 10, y: 52, w: 80, align: "center", size: 4 },
  { key: "venue", x: 10, y: 60, w: 80, align: "center", size: 4 },
  { key: "guest", x: 10, y: 74, w: 80, align: "center", size: 3.6 },
];
const pretty = (f: OverlayField[]) => JSON.stringify(f, null, 2);
const urlOk = (u: string) => /^(https:\/\/|\/)[^\s"'<>]+$/.test(u) && !u.startsWith("//");
const sample = buildContent({ ...SAMPLE_SOURCE, fields: {} }, "ضيفنا الكريم");

function parseOverlay(s: string): OverlayField[] | null {
  try { const v = JSON.parse(s); return Array.isArray(v) ? (v as OverlayField[]) : null; } catch { return null; }
}

function Preview({ kind, url, overlay, layout, palette, fontPair, t }: { kind: string; url: string; overlay: OverlayField[] | null; layout: string; palette: string; fontPair: string; t: T["templates"] }) {
  const renderable = ["png", "jpg", "svg"].includes(kind);
  return (
    <div className="mx-auto w-full max-w-[18rem]">
      {kind === "builtin" ? <InvitationRenderer content={sample} layout={layout} palette={palette} fontPair={fontPair} />
        : renderable && urlOk(url) && overlay ? <InvitationRenderer content={sample} layout="image-overlay" palette="ivory" fontPair="classic" asset={{ kind, url, overlayFields: overlay }} />
        : <div className="flex aspect-[3/4.25] items-center justify-center border border-dashed border-ink/25 p-4 text-center text-xs text-ink-soft">{renderable && urlOk(url) && !overlay ? t.overlayInvalid : t.noPreview}</div>}
      <p className="mt-2 text-center text-xs text-taupe">{t.previewNote}</p>
    </div>
  );
}

export function TemplatesAdmin({ templates, locale, t }: { templates: TemplateView[]; locale: Locale; t: T }) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const st = useAction();
  const tt = t.templates;
  const label = (s: string) => (tt.status as Record<string, string>)[s] ?? s;

  async function setStatus(id: string, s: Status) {
    setOk(null);
    const r = await st.run(() => setTemplateStatusAction(id, s));
    if (r.ok) { setOk(t.common.saved); router.refresh(); }
  }
  const cannotPublish = (x: TemplateView) => x.kind !== "static" || x.asset?.kind === "pdf" || x.asset?.kind === "video";
  const editing = templates.find((x) => x.id === editId) ?? null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Notice tone="info"><strong className="font-medium">{tt.importantTitle}.</strong> {tt.important}</Notice>
      <ErrorNotice text={errorText(t.common, st.error, st.fields, { notSupported: tt.cantPublish })} />
      <OkNotice text={ok} />
      <TableWrap label={tt.title}>
        <table className={tableCls}>
          <caption className="sr-only">{tt.title}</caption>
          <thead><tr><Th>{t.common.name}</Th><Th>{tt.layout}</Th><Th>{t.common.status}</Th><Th>{tt.sort}</Th><Th><span className="sr-only">{t.common.actions}</span></Th></tr></thead>
          <tbody>
            {templates.map((x) => (
              <tr key={x.id} className={editId === x.id ? "bg-bone/40" : ""}>
                <Td><span className="font-medium text-ink">{x.name[locale]}</span><span className="block text-xs text-taupe" dir="ltr" style={{ textAlign: "start" }}>{x.slug}</span></Td>
                <Td>{x.asset ? <Badge tone="info">{tt.uploaded} · {x.asset.kind.toUpperCase()}</Badge> : <Badge>{tt.builtin}</Badge>} <span className="ms-1 text-xs text-ink-soft">{(tt.kind as Record<string, string>)[x.kind]}</span></Td>
                <Td><Badge tone={x.status === "published" ? "olive" : x.status === "coming_soon" ? "champagne" : "neutral"}>{label(x.status)}</Badge></Td>
                <Td mono><span dir="ltr">{x.sort}</span></Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-2">
                    {x.status !== "published" && <button type="button" className={btnQuiet} disabled={st.pending || cannotPublish(x)} title={cannotPublish(x) ? tt.cantPublish : undefined} onClick={() => setStatus(x.id, "published")}>{tt.publish}</button>}
                    {x.status !== "coming_soon" && <button type="button" className={btnQuiet} disabled={st.pending} onClick={() => setStatus(x.id, "coming_soon")}>{tt.comingSoon}</button>}
                    {x.status === "published" && <button type="button" className={btnQuiet} disabled={st.pending} onClick={() => setStatus(x.id, "draft")}>{tt.unpublish}</button>}
                    <button type="button" className={btnQuiet} aria-expanded={editId === x.id} onClick={() => setEditId(editId === x.id ? null : x.id)}>{t.common.edit}</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && <EditPanel key={editing.id} tpl={editing} t={t} locale={locale} onDone={() => { setOk(t.common.saved); router.refresh(); }} onClose={() => setEditId(null)} />}
      <RegisterPanel t={t} onDone={(id) => { setOk(tt.registered); setEditId(id); router.refresh(); }} />
    </div>
  );
}

function EditPanel({ tpl, t, locale, onDone, onClose }: { tpl: TemplateView; t: T; locale: Locale; onDone: () => void; onClose: () => void }) {
  const tt = t.templates;
  const [f, setF] = useState({ en: tpl.name.en, ar: tpl.name.ar, descEn: tpl.description.en ?? "", descAr: tpl.description.ar ?? "", sort: String(tpl.sort) });
  const [overlay, setOverlay] = useState(tpl.asset ? pretty(tpl.asset.overlayFields) : "");
  const meta = useAction();
  const ov = useAction();
  const parsed = useMemo(() => (tpl.asset ? parseOverlay(overlay) : null), [overlay, tpl.asset]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    const r = await meta.run(() => updateTemplateAction(tpl.id, { en: f.en, ar: f.ar, descEn: f.descEn, descAr: f.descAr, sort: Number(f.sort) || 0 }));
    if (r.ok) onDone();
  }
  async function saveOverlay() {
    const r = await ov.run(() => updateOverlayAction(tpl.id, overlay));
    if (r.ok) onDone();
  }
  return (
    <section aria-label={tt.editTitle} className="border border-line bg-paper/70">
      <div className="flex items-center justify-between border-b border-line px-5 py-3"><h2 className="text-sm font-medium">{tt.editTitle}: {tpl.name[locale]}</h2><button type="button" className={btnQuiet} onClick={onClose}>{tt.close}</button></div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
          <form onSubmit={saveMeta} className="grid gap-3 sm:grid-cols-2">
            <Lbl label={tt.nameEn}><input className={ctl} value={f.en} onChange={set("en")} required maxLength={80} dir="ltr" /></Lbl>
            <Lbl label={tt.nameAr}><input className={ctl} value={f.ar} onChange={set("ar")} required maxLength={80} dir="rtl" /></Lbl>
            <Lbl label={tt.descEn}><textarea className={ctl} rows={2} value={f.descEn} onChange={set("descEn")} maxLength={200} dir="ltr" /></Lbl>
            <Lbl label={tt.descAr}><textarea className={ctl} rows={2} value={f.descAr} onChange={set("descAr")} maxLength={200} dir="rtl" /></Lbl>
            <Lbl label={tt.sort}><input className={ctl} type="number" value={f.sort} onChange={set("sort")} dir="ltr" /></Lbl>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button type="submit" className={btnPrimary} disabled={meta.pending}>{meta.pending ? t.common.saving : t.common.save}</button>
              <ErrorNotice text={errorText(t.common, meta.error, meta.fields, { name: tt.errName })} />
            </div>
          </form>
          {tpl.asset && (
            <div className="grid gap-2">
              <Lbl label={tt.overlay} hint={tt.overlayHint} error={parsed ? undefined : tt.overlayInvalid}>
                <textarea className={`${ctl} font-mono text-xs`} rows={10} dir="ltr" spellCheck={false} value={overlay} onChange={(e) => setOverlay(e.target.value)} aria-invalid={!parsed} />
              </Lbl>
              <div className="flex items-center gap-3"><button type="button" className={btnPrimary} disabled={ov.pending || !parsed} onClick={saveOverlay}>{ov.pending ? t.common.saving : tt.saveOverlay}</button>
                <ErrorNotice text={errorText(t.common, ov.error, ov.fields, { invalid: tt.overlayInvalid })} /></div>
            </div>
          )}
        </div>
        <Preview kind={tpl.asset ? tpl.asset.kind : "builtin"} url={tpl.asset?.url ?? ""} overlay={parsed} layout={tpl.layout} palette={tpl.palette} fontPair={tpl.fontPair} t={tt} />
      </div>
    </section>
  );
}

function RegisterPanel({ t, onDone }: { t: T; onDone: (id: string) => void }) {
  const tt = t.templates;
  const [f, setF] = useState({ slug: "", en: "", ar: "", groups: "wedding", kind: "svg", url: "", overlay: pretty(DEFAULT_OVERLAY) });
  const reg = useAction();
  const parsed = useMemo(() => parseOverlay(f.overlay), [f.overlay]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const unsupported = f.kind === "pdf" || f.kind === "video";
  const urlBad = f.url !== "" && !urlOk(f.url);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await reg.run(() => registerTemplateAction({ slug: f.slug, en: f.en, ar: f.ar, groups: f.groups, kind: f.kind, url: f.url, overlayJson: f.overlay }));
    if (r.ok) { setF({ ...f, slug: "", en: "", ar: "", url: "" }); onDone(r.data.id); }
  }
  const fe = reg.fields;
  return (
    <section aria-labelledby="reg-h" className="border border-line bg-paper/70">
      <div className="border-b border-line px-5 py-3"><h2 id="reg-h" className="text-sm font-medium">{tt.registerTitle}</h2></div>
      <form onSubmit={submit} className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Lbl label={tt.slug} hint={tt.slugHint} error={fe.slug ? (fe.slug === "duplicate" ? tt.errSlug : tt.errSlug) : undefined}><input className={ctl} value={f.slug} onChange={set("slug")} required maxLength={60} dir="ltr" /></Lbl>
          <Lbl label={tt.assetKind}>
            <select className={ctl} value={f.kind} onChange={set("kind")}><option value="svg">SVG</option><option value="png">PNG</option><option value="jpg">JPG</option><option value="pdf">PDF</option><option value="video">Video</option></select>
          </Lbl>
          <Lbl label={tt.nameEn}><input className={ctl} value={f.en} onChange={set("en")} required maxLength={80} dir="ltr" /></Lbl>
          <Lbl label={tt.nameAr}><input className={ctl} value={f.ar} onChange={set("ar")} required maxLength={80} dir="rtl" /></Lbl>
          <Lbl label={tt.assetUrl} hint={tt.assetHint} error={urlBad || fe.url ? tt.errUrl : undefined} className="sm:col-span-2"><input className={ctl} value={f.url} onChange={set("url")} required placeholder="/templates/sample-backdrop.svg" dir="ltr" aria-invalid={urlBad || !!fe.url} /></Lbl>
          <Lbl label={tt.groups} hint={tt.groupsHint} className="sm:col-span-2"><input className={ctl} value={f.groups} onChange={set("groups")} dir="ltr" /></Lbl>
          {unsupported ? <div className="sm:col-span-2"><Notice tone="demo">{tt.pdfVideo}</Notice></div> : (
            <div className="sm:col-span-2">
              <Lbl label={tt.overlay} hint={tt.overlayHint} error={parsed ? (fe.overlay ? tt.overlayInvalid : undefined) : tt.overlayInvalid}>
                <textarea className={`${ctl} font-mono text-xs`} rows={9} dir="ltr" spellCheck={false} value={f.overlay} onChange={set("overlay")} aria-invalid={!parsed} />
              </Lbl>
              <button type="button" className={`${btnQuiet} mt-2`} onClick={() => setF({ ...f, overlay: pretty(DEFAULT_OVERLAY) })}>{tt.insert}</button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" className={btnPrimary} disabled={reg.pending || (!unsupported && !parsed)}>{reg.pending ? t.common.saving : tt.register}</button>
            <ErrorNotice text={errorText(t.common, reg.error, reg.fields, { name: tt.errName, required: tt.errName })} />
          </div>
        </div>
        <Preview kind={f.kind} url={f.url} overlay={unsupported ? null : parsed} layout="image-overlay" palette="ivory" fontPair="classic" t={tt} />
      </form>
    </section>
  );
}
