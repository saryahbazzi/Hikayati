/**
 * Bilingual copy lives as [English, Arabic] pairs side by side, so a translation can never silently go
 * missing and both languages are reviewed together. `resolve()` turns a tree of pairs into plain strings.
 */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
export const otherLocale = (l: Locale): Locale => (l === "ar" ? "en" : "ar");

export type Pair = readonly [en: string, ar: string];
export const p = (en: string, ar: string): Pair => [en, ar];

export type Tree = { [key: string]: Pair | Tree | readonly (Pair | Tree)[] };
export type Resolved<T> = T extends Pair ? string : T extends readonly (infer U)[] ? Resolved<U>[] : T extends object ? { [K in keyof T]: Resolved<T[K]> } : never;

const isPair = (v: unknown): v is Pair => Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string";

export function resolve<T extends Tree>(tree: T, locale: Locale): Resolved<T> {
  const i = locale === "ar" ? 1 : 0;
  const walk = (v: unknown): unknown => {
    if (isPair(v)) return v[i];
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(tree) as Resolved<T>;
}

/** Memoised accessor: `const t = makeT(tree); t("ar").hero.title`. */
export function makeT<T extends Tree>(tree: T) {
  const cache = new Map<Locale, Resolved<T>>();
  return (locale: Locale): Resolved<T> => {
    let r = cache.get(locale);
    if (!r) { r = resolve(tree, locale); cache.set(locale, r); }
    return r;
  };
}

/** Swap the locale segment of a path: /en/packages → /ar/packages. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1] ?? "")) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join("/") || `/${to}`;
}
