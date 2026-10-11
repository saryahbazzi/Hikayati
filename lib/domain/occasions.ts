export type OccasionGroup = "wedding" | "engagement" | "henna" | "birthday" | "baby" | "graduation" | "dinner" | "corporate" | "general";
/** Which detail fields the wizard shows: Saudi wedding family, birthday celebrant, or the general set. */
export type FieldSet = "wedding" | "birthday" | "general";

export interface Occasion { key: string; en: string; ar: string; group: OccasionGroup; fieldSet: FieldSet }

export const OCCASIONS: Occasion[] = [
  { key: "wedding", en: "Wedding", ar: "حفل زفاف", group: "wedding", fieldSet: "wedding" },
  { key: "engagement_party", en: "Engagement Party", ar: "حفل خطوبة", group: "engagement", fieldSet: "wedding" },
  { key: "engagement_dinner", en: "Engagement Dinner", ar: "عشاء خطوبة", group: "engagement", fieldSet: "wedding" },
  { key: "katb_kitab", en: "Katb Kitab", ar: "عقد قران", group: "wedding", fieldSet: "wedding" },
  { key: "malka", en: "Malka", ar: "ملكة", group: "engagement", fieldSet: "wedding" },
  { key: "henna_night", en: "Henna Night", ar: "ليلة حناء", group: "henna", fieldSet: "wedding" },
  { key: "birthday", en: "Birthday", ar: "عيد ميلاد", group: "birthday", fieldSet: "birthday" },
  { key: "birthday_brunch", en: "Birthday Brunch", ar: "برنش عيد ميلاد", group: "birthday", fieldSet: "birthday" },
  { key: "bridal_shower", en: "Bridal Shower", ar: "حفل ما قبل الزفاف", group: "henna", fieldSet: "general" },
  { key: "baby_shower", en: "Baby Shower", ar: "حفل استقبال مولود", group: "baby", fieldSet: "general" },
  { key: "graduation", en: "Graduation", ar: "حفل تخرج", group: "graduation", fieldSet: "general" },
  { key: "anniversary", en: "Anniversary", ar: "ذكرى سنوية", group: "general", fieldSet: "general" },
  { key: "dinner_gathering", en: "Dinner Gathering", ar: "دعوة عشاء", group: "dinner", fieldSet: "general" },
  { key: "iftar", en: "Iftar", ar: "إفطار رمضاني", group: "dinner", fieldSet: "general" },
  { key: "eid_gathering", en: "Eid Gathering", ar: "تجمع العيد", group: "general", fieldSet: "general" },
  { key: "corporate_event", en: "Corporate Event", ar: "فعالية شركات", group: "corporate", fieldSet: "general" },
  { key: "product_launch", en: "Product Launch", ar: "حفل إطلاق", group: "corporate", fieldSet: "general" },
  { key: "private_celebration", en: "Private Celebration", ar: "مناسبة خاصة", group: "general", fieldSet: "general" },
  { key: "other", en: "Other", ar: "أخرى", group: "general", fieldSet: "general" },
];

export const occasionByKey = (k: string) => OCCASIONS.find((o) => o.key === k);
export const occasionLabel = (k: string, locale: "ar" | "en", custom?: string | null) =>
  k === "other" && custom ? custom : (occasionByKey(k)?.[locale] ?? k);

/** Which invitation fields the host may show/hide. */
export const VISIBILITY_KEYS = ["hosts", "family", "endTime", "venueAddress", "mapLink", "dressCode", "instructions", "rsvpDeadline", "hijri", "zaffa"] as const;
export type VisibilityKey = (typeof VISIBILITY_KEYS)[number];
export const DEFAULT_VISIBILITY: Record<VisibilityKey, boolean> = {
  hosts: true, family: true, endTime: false, venueAddress: true, mapLink: true, dressCode: true, instructions: true, rsvpDeadline: true, hijri: false, zaffa: true,
};

export const MEAL_TYPES = ["brunch", "lunch", "evening"] as const;
