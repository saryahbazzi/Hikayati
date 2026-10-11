import "server-only";
import type { Queryable } from "./db";
import type { Actor } from "./permissions";

/** Append-only record of sensitive actions. Never put personal data (phones, names) in `meta`. */
export async function audit(
  q: Queryable,
  actor: Pick<Actor, "id" | "role"> | null,
  action: string,
  target: { entity?: string; id?: string; eventId?: string } = {},
  meta: Record<string, unknown> = {},
) {
  await q.query(
    "insert into audit_logs (actor_id, actor_role, action, entity, entity_id, event_id, meta) values ($1,$2,$3,$4,$5,$6,$7)",
    [actor?.id ?? null, actor?.role ?? null, action, target.entity ?? null, target.id ?? null, target.eventId ?? null, JSON.stringify(meta)],
  );
}
