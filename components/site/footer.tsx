import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { common } from "@/lib/i18n/common";
import { Wordmark } from "./wordmark";

type C = ReturnType<typeof common>;

/**
 * Minimal footer. The email, phone and Instagram are PLACEHOLDERS and are labelled as such —
 * replace them in lib/i18n/common.ts (footer.*) before launch.
 */
export function Footer({ locale, t }: { locale: Locale; t: C }) {
  const f = t.footer;
  const base = `/${locale}`;
  const tag = <span className="ms-2 text-[0.68rem] uppercase tracking-[0.14em] text-taupe">({f.placeholder})</span>;
  return (
    <footer id="contact" className="relative border-t border-line pb-10 pt-20">
      <div className="wrap grid gap-14 md:grid-cols-[1.3fr_1fr]">
        <div>
          <Wordmark size="lg" />
          <p className="mt-6 max-w-md leading-8 text-ink-soft">{f.line}</p>
        </div>
        <dl className="space-y-4 text-[0.98rem]">
          <Row label={f.email}><a href="mailto:hikayati@gmail.com" dir="ltr" className="hover:text-olive">hikayati@gmail.com</a>{tag}</Row>
          <Row label={f.phone}><span dir="ltr">{f.phoneValue}</span>{tag}</Row>
          <Row label={f.location}>{f.locationValue}</Row>
          <Row label={f.instagram}><span dir="ltr">{f.instagramValue}</span>{tag}</Row>
        </dl>
      </div>
      <p className="wrap mt-10 text-xs text-taupe">{f.placeholderNote}</p>
      <div className="wrap mt-8 flex flex-col gap-6 border-t border-line pt-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          <li><Link href={`${base}/privacy`} className="hover:text-ink">{f.privacy}</Link></li>
          <li><Link href={`${base}/terms`} className="hover:text-ink">{f.terms}</Link></li>
          <li><Link href={`${base}/contact`} className="hover:text-ink">{f.contact}</Link></li>
        </ul>
        <p>© {new Date().getFullYear()} Hikayati · حكايتي. {f.rights}</p>
      </div>
    </footer>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-line pb-4">
      <dt className="tracked text-[0.7rem] uppercase tracking-[0.22em] text-taupe">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
