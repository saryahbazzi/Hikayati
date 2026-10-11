import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice, Stat } from "@/components/ui/misc";
import { buildPreview, getWorkspace } from "@/components/portal/event-data";
import { InvitationPreview } from "@/components/portal/invitation-preview";
import { MessageLog } from "@/components/portal/message-log";
import { fmtDate } from "@/components/portal/util";
import { paletteByKey } from "@/lib/domain/design";
import { isLocale } from "@/lib/i18n";
import { portalCopy } from "@/lib/i18n/portal";
import { listGuests } from "@/lib/server/guests";
import { inviteBody } from "@/lib/server/messaging/templates";
import { formatTime } from "@/lib/domain/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event invitation · Hikayati", robots: { index: false } };

export default async function EventInvitation({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const ws = await getWorkspace(locale, id);
  const { db, actor, row, access } = ws;
  const t = portalCopy(locale);
  const data = await buildPreview(ws);
  const guests = access.guests ? await listGuests(db, actor, id) : [];
  const count = (f: (g: (typeof guests)[number]) => boolean) => guests.filter(f).length;
  const rev = (g: (typeof guests)[number]) => g.invitationStatus === "revoked";
  const summary: [string, number][] = [
    [t.iv.states.not_sent, count((g) => !rev(g) && !g.sentAt)],
    [t.iv.states.sent, count((g) => !rev(g) && !!g.sentAt && g.invitationStatus === "sent")],
    [t.iv.states.opened, count((g) => g.invitationStatus === "opened")],
    [t.iv.states.responded, count((g) => g.invitationStatus === "responded")],
    [t.iv.states.revoked, count(rev)],
  ];
  const langs: ("ar" | "en")[] = row.invitation_language === "both" ? ["ar", "en"] : [row.invitation_language];
  const startsIso = row.starts_at ? new Date(row.starts_at).toISOString() : null;
  const samples = langs.map((l) => ({ l, body: inviteBody(l, {
    guestName: t.iv.sampleGuest, eventTitle: row.title, date: fmtDate(startsIso, l, row.timezone), time: startsIso ? formatTime(startsIso, l, row.timezone) : "", venue: row.venue_name, link: t.iv.sampleLink }) }));
  const base = `/${locale}/my-events/${id}`;

  return (
    <div className="space-y-14">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-2xl">{t.iv.preview}</h2>
          <p className="mt-1 text-sm text-ink-soft">{data.templateName ? `${t.iv.template}: ${data.templateName[locale]} · ` : ""}{t.iv.palette}: {paletteByKey(data.paletteKey)[locale]}</p>
        </div>
        {access.manage && row.status !== "cancelled" && (
          <div className="max-w-xs text-sm text-ink-soft">
            <Button href={`/${locale}/begin?event=${id}`} variant="secondary" size="sm">{t.iv.edit}</Button>
            <p className="mt-2">{t.iv.editHint}</p>
          </div>
        )}
      </div>
      <InvitationPreview data={data} locale={locale} />

      {access.guests && (
        <section aria-labelledby="inv-status-h">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div><h2 id="inv-status-h" className="font-display text-2xl">{t.iv.summary}</h2><p className="text-sm text-ink-soft">{t.iv.summaryNote}</p></div>
            <Button href={`${base}/guests#invitation-actions`} variant="quiet" size="sm">{t.iv.manageSend}</Button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5" data-testid="invitation-summary">
            {summary.map(([label, n]) => <Stat key={label} label={label} value={n} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="msgs-h" className="space-y-8">
        <div><h2 id="msgs-h" className="font-display text-2xl">{t.iv.messages}</h2><div className="mt-3"><Notice tone="demo">{t.iv.messagesNote}</Notice></div></div>
        <div className="grid gap-6 md:grid-cols-2">
          {samples.map((s) => (
            <figure key={s.l} className="border border-line bg-paper/70 p-5">
              <figcaption className="tracked mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-taupe">{t.iv.sampleTitle} · {s.l === "ar" ? t.iv.arabic : t.iv.english}</figcaption>
              <p className="whitespace-pre-line text-ink" dir={s.l === "ar" ? "rtl" : "ltr"} lang={s.l}>{s.body}</p>
            </figure>
          ))}
        </div>
        <MessageLog eventId={id} locale={locale} kind="invite" title={t.iv.logTitle} note={t.iv.logNote} empty={t.iv.logEmpty} />
      </section>
    </div>
  );
}
