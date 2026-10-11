import { makeT, p } from "./index";

export const home = makeT({
  meta: {
    title: p("Hikayati · حكايتي — Digital invitations for meaningful occasions", "حكايتي · Hikayati — دعوات رقمية للمناسبات التي تستحق أن تُروى"),
    description: p("From invitation to arrival, make every guest part of yours. Create, share and manage beautifully personal invitations and guest experiences in Saudi Arabia.", "من الدعوة الأولى حتى لحظة الوصول، اجعل كل ضيف جزءًا من حكايتك. صمّم دعواتك وشاركها وأدر تجربة ضيوفك بأسلوب أنيق في المملكة العربية السعودية."),
  },
  hero: {
    tagline: p("Every gathering has a story.", "لكل لقاء حكاية"),
    line: p("From invitation to arrival, make every guest part of yours.", "من الدعوة الأولى حتى لحظة الوصول، اجعل كل ضيف جزءًا من حكايتك."),
    primary: p("Begin Your Story", "ابدأ حكايتك"), secondary: p("Discover Hikayati", "اكتشف حكايتي"), sr: p("Hikayati — حكايتي, “My Story”", "حكايتي — Hikayati، «قصتي»"),
  },
  about: {
    eyebrow: p("About Hikayati", "عن حكايتي"),
    heading: p("A story worth sharing.", "حكاية تستحق أن تُروى."),
    body: p(
      "At Hikayati, we believe every gathering begins with a story worth sharing. From beautifully crafted invitations to effortless guest management, we bring each detail together so you can focus on the people and moments that matter.",
      "في حكايتي، نؤمن بأن لكل لقاء حكاية تستحق أن تُروى. من تصميم الدعوات الأنيقة إلى إدارة الضيوف بكل سهولة، نجمع تفاصيل مناسبتك في تجربة واحدة، لتتفرغ للحظات والأشخاص الذين يصنعونها.",
    ),
    more: p("Read our story", "اقرأ حكايتنا"),
  },
  showcase: {
    eyebrow: p("The invitation experience", "تجربة الدعوة"),
    heading: p("A beautifully personal experience.", "تجربة شخصية وأنيقة"),
    body: p("Each guest receives a personalised invitation, confirms attendance, and receives a unique QR code for seamless entry.", "يتلقى كل ضيف دعوته الخاصة، يؤكد حضوره، ثم يحصل على رمز QR مخصص لتسهيل الدخول إلى المناسبة."),
    invitation: p("The invitation", "الدعوة"), guest: p("The guest’s experience", "تجربة الضيف"),
    fictional: p("Fictional demonstration — names, venue and details are samples.", "عرض توضيحي وهمي — الأسماء والموقع والتفاصيل أمثلة فقط."),
  },
  how: {
    eyebrow: p("How Hikayati works", "كيف تعمل حكايتي"),
    heading: p("From the first idea to the last arrival.", "من الفكرة الأولى إلى آخر الواصلين."),
    steps: [
      { n: p("01", "٠١"), title: p("Create", "صمّم"), body: p("Choose the occasion and begin your story.", "اختر المناسبة وابدأ حكايتك.") },
      { n: p("02", "٠٢"), title: p("Personalise", "خصّص"), body: p("Make the invitation yours — names, words, colour and type.", "اجعل الدعوة دعوتك — الأسماء والكلمات واللون والخط.") },
      { n: p("03", "٠٣"), title: p("Share", "شارك"), body: p("Send each guest their own private invitation.", "أرسل لكل ضيف دعوته الخاصة.") },
      { n: p("04", "٠٤"), title: p("Welcome", "استقبل"), body: p("Track replies and greet every guest with ease.", "تابع الردود واستقبل كل ضيف بكل سهولة.") },
    ],
  },
  occasions: {
    eyebrow: p("Occasions", "المناسبات"), heading: p("A story for every occasion.", "لكل مناسبة حكاية"),
    list: [p("Weddings", "حفلات الزفاف"), p("Engagements", "حفلات الخطوبة والملكة"), p("Henna Nights", "ليلة الحناء"), p("Birthdays", "أعياد الميلاد"), p("Graduations", "حفلات التخرج"), p("Baby Celebrations", "استقبال المواليد"), p("Private Gatherings", "المناسبات الخاصة"), p("Corporate Celebrations", "الفعاليات الرسمية")],
    all: p("See every occasion", "شاهد كل المناسبات"),
  },
  packages: {
    eyebrow: p("Packages", "الباقات"), heading: p("Choose how your story is told.", "اختر كيف تُروى حكايتك."),
    soon: p("Pricing Coming Soon", "الأسعار قريبًا"), all: p("Explore the packages", "استكشف الباقات"),
    items: [
      { name: p("Standard", "القياسية"), line: p("A refined invitation, simply delivered.", "دعوة أنيقة، بتجربة بسيطة.") },
      { name: p("Signature", "المميزة"), line: p("Premium designs and a fuller guest experience.", "تصاميم راقية وتجربة ضيافة أكمل.") },
      { name: p("Bespoke", "الخاصة"), line: p("Designed around your occasion, including motion and video.", "مصممة خصيصًا لمناسبتك، تشمل الفيديو والحركة.") },
      { name: p("Event Planner", "منسّق المناسبات"), line: p("For studios and planners running many events.", "للمنسّقين والاستوديوهات التي تدير مناسبات متعددة.") },
    ],
  },
  final: { line1: p("Every gathering has a story.", "لكل لقاء حكاية"), line2: p("Let yours begin here.", "ابدأ حكايتك من هنا"), button: p("Begin Your Story", "ابدأ حكايتك") },
});
