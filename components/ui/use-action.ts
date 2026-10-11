"use client";

import { useCallback, useState, useTransition } from "react";

type Res<T> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string>; code?: string };

/**
 * Call a server action with pending state and a normalised error.
 *   const { run, pending, error, fields } = useAction();
 *   const r = await run(() => saveGuest(...));
 */
export function useAction() {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const run = useCallback(async <T,>(fn: () => Promise<Res<T>>): Promise<Res<T>> => {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const r = await fn();
      if (!r.ok) {
        setError(r.error);
        setFields(r.fields ?? {});
      }
      return r;
    } catch {
      setError("unknown");
      return { ok: false, error: "unknown" };
    } finally {
      setBusy(false);
    }
  }, []);

  return { run, pending: pending || busy, error, fields, setError, setFields, start };
}
