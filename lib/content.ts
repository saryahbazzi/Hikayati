// All homepage copy, in both languages. Static/mock data only.
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

type Copy = {
  meta: { title: string; description: string };
  nav: { home: string; occasions: string; how: string; about: string; contact: string };
  cta: string;
  langLabel: string;
  menu: string;
  hero: { tagline: string; line: string; primary: string; secondary: string; scroll: string };
  intro: { eyebrow: string; heading: string; body: string };
  showcase: {
    eyebrow: string;
    heading: string;
    body: string;
    invitationLabel: string;
    guestLabel: string;
  };
  steps: { heading: string; items: { title: string; body: string }[] };
  occasions: { heading: string; items: string[] };
  final: { line1: string; line2: string; button: string };
  footer: {
    line: string;
    contact: string;
    emailLabel: string;
    phoneLabel: string;
    locationLabel: string;
    location: string;
    links: { instagram: string; privacy: string; terms: string; contact: string };
    rights: string;
  };
};

const en: Copy = {
  meta: {
    title: "Hikayati · حكايتي — Digital invitations for meaningful occasions",
    description:
      "From invitation to arrival, Hikayati helps you create, share, and manage beautifully personal guest experiences.",
  },
  nav: { home: "Home", occasions: "Occasions", how: "How It Works", about: "About", contact: "Contact" },
  cta: "Create Invitation",
  langLabel: "Language",
  menu: "Menu",
  hero: {
    tagline: "Every gathering has a story.",
    line: "From invitation to arrival, Hikayati helps you create, share, and manage beautifully personal guest experiences.",
    primary: "Create Your Invitation",
    secondary: "Explore Hikayati",
    scroll: "Scroll",
  },
  intro: {
    eyebrow: "About",
    heading: "More than an invitation.",
    body: "Hikayati brings your occasion together from the very first invite to the moment your guests arrive. Create a beautifully personalised invitation, send it directly to your guests, collect RSVPs, and manage attendance — all in one place.",
  },
  showcase: {
    eyebrow: "How it works, by example",
    heading: "A beautifully personal experience.",
    body: "Each guest receives a personalised invitation, confirms attendance, and receives a unique QR code for seamless entry.",
    invitationLabel: "The invitation",
    guestLabel: "The guest’s experience",
  },
  steps: {
    heading: "How Hikayati works",
    items: [
      { title: "Create", body: "Choose the occasion and personalise your invitation." },
      { title: "Share", body: "Send personalised invitations directly to your guests." },
      { title: "Confirm", body: "Guests RSVP and receive their dedicated QR access." },
      { title: "Welcome", body: "Track responses and welcome your guests with ease." },
    ],
  },
  occasions: {
    heading: "A story for every occasion.",
    items: [
      "Weddings",
      "Engagements",
      "Henna Nights",
      "Birthdays",
      "Graduations",
      "Baby Celebrations",
      "Private Gatherings",
      "Corporate Events",
    ],
  },
  final: { line1: "Every gathering has a story.", line2: "Let yours begin here.", button: "Create Your Invitation" },
  footer: {
    line: "Digital invitations and guest experiences for meaningful occasions.",
    contact: "Contact",
    emailLabel: "Email",
    phoneLabel: "Phone",
    locationLabel: "Location",
    location: "Riyadh, Saudi Arabia",
    links: { instagram: "Instagram", privacy: "Privacy Policy", terms: "Terms", contact: "Contact" },
    rights: "All rights reserved.",
  },
};

const ar: Copy = {
  meta: {
    title: "حكايتي · Hikayati — دعوات رقمية للمناسبات التي تستحق أن تُروى",
    description:
      "من الدعوة الأولى وحتى لحظة وصول الضيوف، تساعدك حكايتي على تصميم الدعوات ومشاركتها وإدارة تجربة الضيوف بأسلوب أنيق وسهل.",
  },
  nav: { home: "الرئيسية", occasions: "المناسبات", how: "كيف تعمل", about: "عن حكايتي", contact: "تواصل" },
  cta: "ابدأ دعوتك",
  langLabel: "اللغة",
  menu: "القائمة",
  hero: {
    tagline: "لكل لقاء حكاية",
    line: "من الدعوة الأولى وحتى لحظة وصول الضيوف، تساعدك حكايتي على تصميم الدعوات ومشاركتها وإدارة تجربة الضيوف بأسلوب أنيق وسهل.",
    primary: "ابدأ دعوتك",
    secondary: "اكتشف حكايتي",
    scroll: "تابع",
  },
  intro: {
    eyebrow: "عن حكايتي",
    heading: "أكثر من مجرد دعوة",
    body: "تجمع حكايتي تفاصيل مناسبتك منذ لحظة إرسال الدعوة وحتى استقبال ضيوفك. صمّم دعوتك الخاصة، أرسلها مباشرة إلى ضيوفك، تابع تأكيدات الحضور، وأدر حضور ضيوفك بكل سهولة من مكان واحد.",
  },
  showcase: {
    eyebrow: "كيف تعمل، بمثال",
    heading: "تجربة شخصية وأنيقة",
    body: "يتلقى كل ضيف دعوته الخاصة، يؤكد حضوره، ثم يحصل على رمز QR مخصص لتسهيل الدخول إلى المناسبة.",
    invitationLabel: "الدعوة",
    guestLabel: "تجربة الضيف",
  },
  steps: {
    heading: "كيف تعمل حكايتي",
    items: [
      { title: "صمّم", body: "اختر المناسبة وخصص دعوتك." },
      { title: "أرسل", body: "شارك الدعوات مباشرة مع ضيوفك." },
      { title: "تأكيد الحضور", body: "يؤكد الضيوف حضورهم ويحصلون على رمز QR مخصص." },
      { title: "استقبل", body: "تابع الردود واستقبل ضيوفك بكل سهولة." },
    ],
  },
  occasions: {
    heading: "لكل مناسبة حكاية",
    items: [
      "حفلات الزفاف",
      "حفلات الخطوبة والملكة",
      "ليلة الحناء",
      "أعياد الميلاد",
      "حفلات التخرج",
      "استقبال المواليد",
      "المناسبات الخاصة",
      "الفعاليات الرسمية",
    ],
  },
  final: { line1: "لكل لقاء حكاية", line2: "ابدأ حكايتك من هنا", button: "ابدأ دعوتك" },
  footer: {
    line: "دعوات رقمية وتجارب ضيافة مصممة للمناسبات التي تستحق أن تُروى",
    contact: "تواصل",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "الهاتف",
    locationLabel: "الموقع",
    location: "الرياض، المملكة العربية السعودية",
    links: { instagram: "انستغرام", privacy: "سياسة الخصوصية", terms: "الشروط والأحكام", contact: "تواصل" },
    rights: "جميع الحقوق محفوظة.",
  },
};

export const content: Record<Locale, Copy> = { en, ar };

export const contact = { email: "hikayati@gmail.com", phone: "+966 55 123 4567" };

/** Mock wedding used by both showcase visuals (always Arabic — it is a Saudi invitation). */
export const sampleWedding = {
  blessing: "بارك الله لهما وبارك عليهما وجمع بينهما في خير",
  host: "تتشرف الأسرتان الكريمتان بدعوتكم لحضور حفل زفاف",
  mothers: ["سارة آل سعود", "مها العتيبي"],
  bride: "نوف بنت محمد آل الشيخ",
  groom: "فهد آل سعود",
  venueLabel: "الموقع",
  venue: "نايراه هول، الرياض، المملكة العربية السعودية",
  dateLabel: "التاريخ",
  date: "15 ديسمبر 2026",
  timeLabel: "الوقت",
  time: "الزفة 8:00 مساءً",
  closing: "نتشرف بحضوركم",
};
