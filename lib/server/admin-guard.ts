import "server-only";
import { redirect } from "next/navigation";
import { canOpen, type Section } from "./admin";
import type { Actor } from "./permissions";
import { requireActor } from "./session";

/** Page-level gate for an admin section: signed in, then allowed to open it — else /not-authorized. Decided on the server only. */
export async function requireSection(locale: string, section: Section, next?: string): Promise<Actor> {
  const actor = await requireActor(locale, next ?? `/${locale}/admin`);
  if (!canOpen(actor, section)) redirect(`/${locale}/not-authorized`);
  return actor;
}
