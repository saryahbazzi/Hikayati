"use client";

import { Notice } from "@/components/ui/misc";

export interface CommonT { forbidden: string; invalid: string; notFound: string; unknown: string }

/** Maps an action error code to a bilingual message. `extra` can supply specific texts for validation field codes. */
export function errorText(t: CommonT, error: string | null, fields: Record<string, string> = {}, extra: Record<string, string> = {}): string | null {
  if (!error) return null;
  if (error === "validation") {
    for (const v of Object.values(fields)) if (extra[v]) return extra[v];
    for (const k of Object.keys(fields)) if (extra[k]) return extra[k];
    return t.invalid;
  }
  if (error === "forbidden" || error === "unauthenticated") return t.forbidden;
  if (error === "not_found") return t.notFound;
  return t.unknown;
}

export function ErrorNotice({ text }: { text: string | null }) {
  return text ? <Notice tone="error">{text}</Notice> : null;
}
export function OkNotice({ text }: { text: string | null }) {
  return text ? <Notice tone="success" role="status">{text}</Notice> : null;
}
