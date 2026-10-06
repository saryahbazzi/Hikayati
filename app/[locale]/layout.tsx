import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Amiri, Cormorant_Garamond, Jost, Noto_Naskh_Arabic } from "next/font/google";
import { content, isLocale, locales } from "@/lib/content";
import "../globals.css";

// One display serif + one clean sans for Latin; Amiri (display) + Naskh (text) for Arabic.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost", display: "swap" });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-naskh", display: "swap" });

export const dynamicParams = false;
export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { title, description } = content[locale].meta;
  return {
    title,
    description,
    alternates: { languages: { en: "/en", ar: "/ar" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cormorant.variable} ${jost.variable} ${amiri.variable} ${naskh.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
