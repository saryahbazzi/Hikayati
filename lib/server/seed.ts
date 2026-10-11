import "server-only";
import { TEMPLATE_SEEDS } from "@/lib/domain/design";
import { addDays } from "@/lib/domain/time";
import { emptyDraft, type EventDraft } from "@/lib/domain/wizard";
import type { Db, Queryable } from "./db";
import { checkInByToken } from "./checkin";
import { confirmEvent, saveDraft } from "./events";
import { addGuest } from "./guests";
import { respond, sendInvitations } from "./invitations";
import { createReminder } from "./reminders";
import type { Actor, Role } from "./permissions";
import { signInvitationToken, signPassToken } from "./tokens";

/** Reference data every environment needs (packages, templates, settings). Idempotent. */
export async function seedReference(db: Queryable) {
  const have = (await db.query<{ n: number }>("select count(*)::int as n from packages")).rows[0].n;
  if (!have) {
    const pk = async (slug: string, sort: number, name: [string, string], tagline: [string, string], features: [string, string][], limits: object) =>
      (await db.query<{ id: string }>(
        "insert into packages (slug, sort, name_i18n, tagline_i18n, features, limits) values ($1,$2,$3,$4,$5,$6) returning id",
        [slug, sort, JSON.stringify({ en: name[0], ar: name[1] }), JSON.stringify({ en: tagline[0], ar: tagline[1] }), JSON.stringify(features.map(([en, ar]) => ({ en, ar }))), JSON.stringify(limits)])).rows[0].id;
    const price = (id: string, model: string, amount: number, min: number, max: number | null, interval: string | null, label: string) =>
      db.query("insert into package_prices (package_id, model, amount_minor, min_guests, max_guests, billing_interval, label) values ($1,$2,$3,$4,$5,$6,$7)", [id, model, amount, min, max, interval, label]);

    const std = await pk("standard", 1, ["Standard", "القياسية"], ["A refined invitation, simply delivered.", "دعوة أنيقة، بتجربة بسيطة."],
      [["Static invitation templates", "قوالب دعوات ثابتة"], ["Basic personalisation", "تخصيص أساسي"], ["Guest RSVP", "تأكيد الحضور من الضيوف"], ["Personal QR entry pass", "رمز دخول QR شخصي"], ["Simple guest tracking", "متابعة بسيطة للضيوف"]], { maxGuests: 150, events: 1 });
    const sig = await pk("signature", 2, ["Signature", "المميزة"], ["Premium designs and a fuller guest experience.", "تصاميم راقية وتجربة ضيافة أكمل."],
      [["Premium invitation designs", "تصاميم دعوات راقية"], ["Extended customisation", "تخصيص موسّع"], ["Larger guest lists", "قوائم ضيوف أكبر"], ["Guest reminders", "تذكيرات للضيوف"], ["Advanced event features", "ميزات متقدمة للمناسبة"]], { maxGuests: 500, events: 1, reminders: true });
    const bes = await pk("bespoke", 3, ["Bespoke", "الخاصة"], ["Designed around your occasion.", "مصممة خصيصًا لمناسبتك."],
      [["Custom invitation design", "تصميم دعوة خاص"], ["Video & motion invitations", "دعوات فيديو ومتحركة"], ["Large-scale events", "مناسبات كبيرة الحجم"], ["Premium event management", "إدارة مناسبات متميزة"], ["Special requests", "طلبات خاصة"]], { maxGuests: 5000, events: 1, reminders: true, video: true });
    const plan = await pk("event-planner", 4, ["Event Planner", "منسّق المناسبات"], ["For studios and planners running many events.", "للمنسّقين والاستوديوهات التي تدير مناسبات متعددة."],
      [["Multiple events and customers", "مناسبات وعملاء متعددون"], ["Subscription plans", "خطط اشتراك"], ["Team access", "وصول للفريق"], ["Higher usage limits", "حدود استخدام أعلى"], ["Advanced reporting", "تقارير متقدمة"]], { maxGuests: 20000, events: 50, reminders: true, team: true });
    // INTERNAL EXAMPLE pricing only (SAR, in halalas). Public pages say "Pricing coming soon".
    await price(std, "flat", 29900, 0, null, null, "Example base");
    await price(std, "per_guest", 400, 0, 150, null, "Example per guest");
    await price(sig, "flat", 69900, 0, null, null, "Example base");
    await price(sig, "per_guest", 500, 0, 100, null, "Example per guest (≤100)");
    await price(sig, "per_guest", 400, 101, 500, null, "Example per guest (101–500)");
    await price(bes, "flat", 249900, 0, null, null, "Example base");
    await price(bes, "per_guest", 600, 0, null, null, "Example per guest");
    await price(plan, "subscription", 99900, 0, null, "month", "Example monthly plan");
    await db.query("insert into package_addons (slug, name_i18n, pricing, price_minor) values ('custom-design',$1,'flat',120000),('motion-invitation',$2,'flat',150000),('extra-reminders',$3,'per_guest',100)",
      [JSON.stringify({ en: "Custom design", ar: "تصميم خاص" }), JSON.stringify({ en: "Motion invitation (coming soon)", ar: "دعوة متحركة (قريبًا)" }), JSON.stringify({ en: "Extra reminders", ar: "تذكيرات إضافية" })]);
    await db.query("insert into discounts (code, percent) values ('WELCOME10', 10)");
  }
  for (const t of TEMPLATE_SEEDS) {
    await db.query(
      `insert into invitation_templates (slug, name_i18n, description_i18n, occasion_groups, style, kind, status, layout, palette, font_pair, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict (slug) do nothing`,
      [t.slug, JSON.stringify({ en: t.en, ar: t.ar }), JSON.stringify({ en: t.descEn, ar: t.descAr }), t.groups, t.style, t.kind, t.status, t.layout, t.palette, t.fontPair, t.sort]);
  }
  await db.query("insert into platform_settings (key, value) values ('tax', $1), ('pricing', $2) on conflict (key) do nothing", [JSON.stringify({ rate: 0.15 }), JSON.stringify({ publicStatus: "coming_soon" })]);
}

export const DEMO_USERS = {
  superAdmin: { id: "00000000-0000-4000-8000-000000000001", phone: "+966500000001", name: "Hikayati Super Admin (demo)", role: "super_admin" as Role, locale: "en" as const },
  admin: { id: "00000000-0000-4000-8000-000000000002", phone: "+966500000002", name: "Hikayati Admin (demo)", role: "admin" as Role, locale: "en" as const },
  manager: { id: "00000000-0000-4000-8000-000000000003", phone: "+966500000003", name: "Hikayati Event Manager (demo)", role: "event_manager" as Role, locale: "en" as const },
  host: { id: "00000000-0000-4000-8000-000000000004", phone: "+966500000004", name: "Demo Event Host", role: "customer" as Role, locale: "ar" as const },
  door: { id: "00000000-0000-4000-8000-000000000005", phone: "+966500000005", name: "Event Check-In Staff (demo)", role: "check_in_staff" as Role, locale: "ar" as const },
  planner: { id: "00000000-0000-4000-8000-000000000006", phone: "+966500000006", name: "Demo Planner Studio", role: "customer" as Role, locale: "en" as const },
};

const asActor = (u: (typeof DEMO_USERS)[keyof typeof DEMO_USERS]): Actor => ({ id: u.id, role: u.role, fullName: u.name, phone: u.phone, locale: u.locale });

export async function seedDemoIfEmpty(db: Db) {
  const n = (await db.query<{ n: number }>("select count(*)::int as n from users where is_demo")).rows[0].n;
  if (!n) await seedDemo(db);
}

/** Fictional users, events and guests. Every phone is a +96650000xxxx test number. Nothing here is real. */
export async function seedDemo(db: Queryable) {
  for (const u of Object.values(DEMO_USERS)) {
    await db.query("insert into users (id, phone_e164, full_name, role, locale, is_demo) values ($1,$2,$3,$4,$5,true) on conflict (id) do nothing", [u.id, u.phone, u.name, u.role, u.locale]);
  }
  const host = asActor(DEMO_USERS.host);
  const door = asActor(DEMO_USERS.door);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const day = (n: number) => addDays(new Date(), n).toISOString().slice(0, 10);

  const base = (over: Omit<Partial<EventDraft>, "design"> & { design: Partial<EventDraft["design"]> }): Partial<EventDraft> => ({
    ...emptyDraft(), hostFirstName: "Demo", hostLastName: "Host", city: "Riyadh", country: "SA", language: "ar", packageSlug: "signature", consent: true, ...over,
    design: { ...emptyDraft().design, ...over.design },
  });

  const wedding = await saveDraft(db, host, null, base({
    occasion: "wedding", estimatedGuests: 180, title: "فهد ونوف", date: day(60), startTime: "20:00", endTime: "23:30", rsvpDeadline: day(45),
    venueName: "نايراه هول", venueAddress: "الرياض، المملكة العربية السعودية", mapUrl: "https://maps.google.com/?q=Riyadh", dressCode: "رسمي", instructions: "يُرجى الحضور قبل الزفة بنصف ساعة.",
    details: { groomName: "فهد آل سعود", brideName: "نوف بنت محمد آل الشيخ", brideMother: "مها العتيبي", groomMother: "سارة آل سعود", zaffaTime: "20:00" },
    design: { templateSlug: "traditional-wedding-ivory", palette: "ivory", fontPair: "calligraphic" },
  }), 7);
  const brunch = await saveDraft(db, host, null, base({
    occasion: "birthday_brunch", estimatedGuests: 24, title: "Demo Birthday Brunch", language: "en", date: day(20), startTime: "11:00", rsvpDeadline: day(12),
    venueName: "The Garden Room (demo venue)", venueAddress: "Riyadh, Saudi Arabia", dressCode: "Smart casual", packageSlug: "standard",
    details: { celebrantName: "Reem (demo)", age: "30", mealType: "brunch" }, design: { templateSlug: "birthday-brunch-blue-ivory", palette: "blue", fontPair: "editorial" },
  }), 7);
  const dinner = await saveDraft(db, host, null, base({
    occasion: "engagement_dinner", estimatedGuests: 40, title: "Engagement Dinner", language: "both", date: day(35), startTime: "19:30", rsvpDeadline: day(25),
    venueName: "Demo Dining Hall", venueAddress: "Jeddah, Saudi Arabia", city: "Jeddah", packageSlug: "standard",
    details: { groomName: "Sultan (demo)", brideName: "Lina (demo)" }, design: { templateSlug: "elegant-engagement-champagne", palette: "champagne" },
  }), 7);

  const order = { totalMinor: 0, subtotalMinor: 0, discountMinor: 0, taxMinor: 0, breakdown: { demo: true } };
  for (const e of [wedding, brunch, dinner]) await confirmEvent(db, host, e.id, {}, order);

  const guest = (event: string, first: string, last: string, phone: string, extra: Partial<{ companions: number; language: string; dial: string }> = {}) =>
    addGuest(db, host, event, { firstName: first, lastName: last, dial: extra.dial ?? "+966", phone, language: extra.language, companions: extra.companions ?? 0 });
  const wg = [
    await guest(wedding.id, "نورة", "ضيفة تجريبية", "500000101", { companions: 1 }),
    await guest(wedding.id, "ريم", "ضيفة تجريبية", "500000102"),
    await guest(wedding.id, "سلطان", "ضيف تجريبي", "500000103", { companions: 2 }),
    await guest(wedding.id, "هند", "ضيفة تجريبية", "500000104"),
    await guest(wedding.id, "Layla", "Demo Guest", "500000105", { dial: "+971", language: "en" }),
    await guest(wedding.id, "ماجد", "ضيف تجريبي", "500000106"),
  ];
  for (const [f, l, p, c] of [["Noor", "Demo", "500000201", 0], ["Sara", "Demo", "500000202", 1], ["Omar", "Demo", "500000203", 0], ["Hala", "Demo", "500000204", 0]] as const)
    await guest(brunch.id, f, l, p, { language: "en", companions: c });
  for (const [f, l, p] of [["Khalid", "Demo", "500000301"], ["Maha", "Demo", "500000302"], ["Yasser", "Demo", "500000303"]] as const) await guest(dinner.id, f, l, p);

  await db.query("insert into event_assignments (event_id, user_id, role) values ($1,$2,'manager'),($3,$2,'manager'),($1,$4,'check_in')", [wedding.id, DEMO_USERS.manager.id, brunch.id, DEMO_USERS.door.id]);

  // Wedding: all invited; 3 accepted, 1 declined, 2 awaiting; one guest already arrived.
  await sendInvitations(db, host, wedding.id, "unsent", origin);
  const link = async (guestId: string) => {
    const r = (await db.query<{ id: string; link_version: number }>("select id, link_version from invitations where guest_id = $1", [guestId])).rows[0];
    return signInvitationToken(r.id, r.link_version);
  };
  await respond(db, await link(wg[0].id), "accepted", 1);
  await respond(db, await link(wg[1].id), "accepted", 0);
  await respond(db, await link(wg[2].id), "accepted", 2);
  await respond(db, await link(wg[3].id), "declined", 0);
  const pass = (await db.query<{ id: string }>("select id from entry_passes where guest_id = $1 and status = 'active'", [wg[1].id])).rows[0];
  await checkInByToken(db, door, signPassToken(pass.id), { expectedEventId: wedding.id, method: "scanner" });
  await createReminder(db, host, wedding.id, { kind: "before_event", daysBefore: 7, audience: "not_responded" });
}
