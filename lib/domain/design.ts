export interface Palette { key: string; en: string; ar: string; bg: string; paper: string; ink: string; soft: string; accent: string; accent2: string }

/** Muted, tonal palettes only. */
export const PALETTES: Palette[] = [
  { key: "ivory", en: "Ivory & Champagne", ar: "عاجي وشامبانيا", bg: "#fdfbf6", paper: "#fdfbf6", ink: "#24241f", soft: "#55554b", accent: "#b9a273", accent2: "#e6dcc3" },
  { key: "sage", en: "Sage", ar: "أخضر مريمية", bg: "#eef0e6", paper: "#f6f7f0", ink: "#2c3126", soft: "#5d6454", accent: "#7f8a6a", accent2: "#cdd4bd" },
  { key: "champagne", en: "Champagne", ar: "شامبانيا", bg: "#f6eedd", paper: "#faf4e6", ink: "#33291a", soft: "#6d5f45", accent: "#b39a62", accent2: "#e8d9b3" },
  { key: "botanical", en: "Botanical", ar: "نباتي", bg: "#f2f1e8", paper: "#f8f7ef", ink: "#27301f", soft: "#566049", accent: "#66724f", accent2: "#c5cdb0" },
  { key: "blue", en: "Blue & Ivory", ar: "أزرق وعاجي", bg: "#f6f5ef", paper: "#fbfaf5", ink: "#1f2a3a", soft: "#51607a", accent: "#5f7aa0", accent2: "#c9d4e4" },
  { key: "taupe", en: "Taupe", ar: "رمادي دافئ", bg: "#efe9e1", paper: "#f6f1ea", ink: "#2d2823", soft: "#6a6157", accent: "#9b8a76", accent2: "#d9cfc1" },
  { key: "charcoal", en: "Charcoal", ar: "فحمي", bg: "#2a2a26", paper: "#2f2f2a", ink: "#f4efe3", soft: "#c9c3b4", accent: "#c9b68b", accent2: "#4a4a42" },
];
export const paletteByKey = (k: string) => PALETTES.find((p) => p.key === k) ?? PALETTES[0];

export interface FontPair { key: string; en: string; ar: string; display: string; body: string }
/** CSS variables come from next/font in app/[locale]/layout.tsx. */
export const FONT_PAIRS: FontPair[] = [
  { key: "classic", en: "Classic serif", ar: "كلاسيكي", display: "var(--font-cormorant), var(--font-amiri), serif", body: "var(--font-jost), var(--font-naskh), sans-serif" },
  { key: "calligraphic", en: "Calligraphic", ar: "خط مزخرف", display: "var(--font-amiri), var(--font-cormorant), serif", body: "var(--font-amiri), var(--font-cormorant), serif" },
  { key: "modern", en: "Modern", ar: "عصري", display: "var(--font-jost), var(--font-naskh), sans-serif", body: "var(--font-jost), var(--font-naskh), sans-serif" },
  { key: "editorial", en: "Editorial", ar: "تحريري", display: "var(--font-cormorant), var(--font-amiri), serif", body: "var(--font-naskh), var(--font-jost), serif" },
];
export const fontPairByKey = (k: string) => FONT_PAIRS.find((f) => f.key === k) ?? FONT_PAIRS[0];

export const ALIGNS = ["start", "center", "end"] as const;
export type Align = (typeof ALIGNS)[number];

export interface TemplateSeed {
  slug: string; en: string; ar: string; descEn: string; descAr: string;
  groups: string[]; style: string; kind: "static" | "motion" | "video"; status: "published" | "coming_soon";
  layout: string; palette: string; fontPair: string; sort: number;
}

/** Original sample templates. To add a Canva-made design later, register a `template_assets` row (see README). */
export const TEMPLATE_SEEDS: TemplateSeed[] = [
  { slug: "traditional-wedding-ivory", en: "Traditional Saudi Wedding — Ivory", ar: "زفاف سعودي تقليدي — عاجي", descEn: "Double hairline frame, blind-embossed botanicals, calligraphic names.", descAr: "إطار مزدوج رفيع وزخارف نباتية ناعمة وأسماء بخط مزخرف.", groups: ["wedding"], style: "traditional", kind: "static", status: "published", layout: "classic-frame", palette: "ivory", fontPair: "calligraphic", sort: 1 },
  { slug: "modern-wedding-sage", en: "Modern Saudi Wedding — Sage", ar: "زفاف سعودي عصري — مريمية", descEn: "Quiet asymmetric layout with a sage field and fine rules.", descAr: "تنسيق هادئ غير متماثل بلون مريمية وخطوط دقيقة.", groups: ["wedding"], style: "modern", kind: "static", status: "published", layout: "modern-split", palette: "sage", fontPair: "classic", sort: 2 },
  { slug: "elegant-engagement-champagne", en: "Elegant Engagement — Champagne", ar: "خطوبة أنيقة — شامبانيا", descEn: "An arched window frames the names in soft champagne.", descAr: "نافذة مقوسة تحتضن الأسماء بلون شامبانيا ناعم.", groups: ["engagement"], style: "elegant", kind: "static", status: "published", layout: "arch", palette: "champagne", fontPair: "classic", sort: 3 },
  { slug: "henna-celebration-botanical", en: "Henna Celebration — Botanical", ar: "ليلة الحناء — نباتي", descEn: "A hand-drawn vine borders the page in muted olive.", descAr: "غصن مرسوم يحيط بالصفحة بلون زيتوني هادئ.", groups: ["henna"], style: "botanical", kind: "static", status: "published", layout: "botanical-border", palette: "botanical", fontPair: "calligraphic", sort: 4 },
  { slug: "birthday-brunch-blue-ivory", en: "Birthday Brunch — Blue & Ivory", ar: "برنش عيد ميلاد — أزرق وعاجي", descEn: "Fine blue striping on ivory, light and fresh.", descAr: "خطوط زرقاء رفيعة على خلفية عاجية، خفيف ومنعش.", groups: ["birthday"], style: "fresh", kind: "static", status: "published", layout: "stripe", palette: "blue", fontPair: "editorial", sort: 5 },
  { slug: "birthday-celebration-editorial", en: "Birthday Celebration — Editorial", ar: "احتفال عيد ميلاد — تحريري", descEn: "Large editorial type and a single rule.", descAr: "خط تحريري كبير وخط فاصل واحد.", groups: ["birthday", "general", "baby", "dinner"], style: "editorial", kind: "static", status: "published", layout: "editorial", palette: "taupe", fontPair: "editorial", sort: 6 },
  { slug: "graduation-minimal", en: "Graduation — Minimal", ar: "حفل تخرج — بسيط", descEn: "Almost nothing: type, space, one gold line.", descAr: "تفاصيل قليلة: كتابة ومساحة وخط ذهبي واحد.", groups: ["graduation", "general"], style: "minimal", kind: "static", status: "published", layout: "minimal", palette: "ivory", fontPair: "modern", sort: 7 },
  { slug: "corporate-contemporary", en: "Corporate Invitation — Contemporary", ar: "دعوة شركات — معاصر", descEn: "Grid-led, charcoal and champagne.", descAr: "تنسيق شبكي بالفحمي والشامبانيا.", groups: ["corporate"], style: "contemporary", kind: "static", status: "published", layout: "contemporary", palette: "charcoal", fontPair: "modern", sort: 8 },
  { slug: "motion-wedding-reveal", en: "Motion Invitation — Reveal", ar: "دعوة متحركة — كشف", descEn: "Animated envelope-and-card reveal. Coming soon.", descAr: "ظرف وبطاقة متحركان. قريبًا.", groups: ["wedding", "engagement"], style: "motion", kind: "motion", status: "coming_soon", layout: "classic-frame", palette: "ivory", fontPair: "calligraphic", sort: 20 },
  { slug: "video-story", en: "Video Invitation — Story", ar: "دعوة فيديو — حكاية", descEn: "A short bespoke film for your guests. Coming soon.", descAr: "فيلم قصير مخصص لضيوفك. قريبًا.", groups: ["wedding", "engagement", "birthday", "corporate", "general"], style: "video", kind: "video", status: "coming_soon", layout: "editorial", palette: "taupe", fontPair: "editorial", sort: 21 },
];
