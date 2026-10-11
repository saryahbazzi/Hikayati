import type { EventDraft } from "@/lib/domain/wizard";
import type { Locale } from "@/lib/i18n";
import type { wizardCopy } from "@/lib/i18n/wizard";

export type T = ReturnType<typeof wizardCopy>;

export interface StepProps {
  draft: EventDraft;
  /** Shallow patch of the draft. Nested objects (details, visibility, design) must be passed whole. */
  set: (patch: Partial<EventDraft>) => void;
  errors: Record<string, string>;
  t: T;
  locale: Locale;
}

/** Translate a validation code ("required", "past", …) into the visible message. */
export function errText(t: T, code?: string): string | undefined {
  if (!code) return undefined;
  return (t.errors as Record<string, string>)[code] ?? t.errors.required;
}

export function StepHeading({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <header className="mb-10 max-w-2xl">
      <h2 id={id} tabIndex={-1} className="display-3 text-balance outline-none">{title}</h2>
      {sub && <p className="mt-3 text-ink-soft">{sub}</p>}
    </header>
  );
}
