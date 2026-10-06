import type { Locale } from "@/lib/content";
import { contact, content } from "@/lib/content";

type T = (typeof content)[Locale];

/** Minimal footer: wordmark, one line, contact details, four links. */
export function Footer({ t }: { t: T }) {
  const f = t.footer;
  const links = [
    { label: f.links.instagram, href: "#" },
    { label: f.links.privacy, href: "#" },
    { label: f.links.terms, href: "#" },
    { label: f.links.contact, href: "#contact" },
  ];
  return (
    <footer id="contact" className="relative border-t border-line px-6 pb-10 pt-20">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p dir="ltr" className="flex items-baseline gap-3 text-start">
            <span className="text-2xl font-light tracking-[0.3em]" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              HIKAYATI
            </span>
            <span aria-hidden className="text-taupe">—</span>
            <span className="font-arabic text-2xl text-olive">حكايتي</span>
          </p>
          <p className="mt-5 max-w-md leading-8 text-ink-soft">{f.line}</p>
        </div>

        <dl className="space-y-4 text-[0.98rem]">
          <Row label={f.emailLabel}>
            <a href={`mailto:${contact.email}`} dir="ltr" className="hover:text-olive">
              {contact.email}
            </a>
          </Row>
          <Row label={f.phoneLabel}>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-olive">
              {contact.phone}
            </a>
          </Row>
          <Row label={f.locationLabel}>{f.location}</Row>
        </dl>
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-6 border-t border-line pt-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p>
          © {new Date().getFullYear()} Hikayati · حكايتي. {f.rights}
        </p>
      </div>
    </footer>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 border-b border-line pb-4">
      <dt className="tracked text-[0.7rem] uppercase tracking-[0.22em] text-taupe">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
