import { createTestDb, type Db } from "@/lib/server/db";
import { DEMO_USERS } from "@/lib/server/seed";
import type { Actor } from "@/lib/server/permissions";
import { signInvitationToken, signPassToken } from "@/lib/server/tokens";

export type DemoKey = keyof typeof DEMO_USERS;
export const actor = (k: DemoKey): Actor => {
  const u = DEMO_USERS[k];
  return { id: u.id, role: u.role, fullName: u.name, phone: u.phone, locale: u.locale };
};

export const freshDb = (): Promise<Db> => createTestDb({ demo: true });

export async function eventByOccasion(db: Db, occasion: string) {
  return (await db.query<{ id: string; title: string }>("select id, title from events where occasion = $1", [occasion])).rows[0];
}
export async function guestByName(db: Db, eventId: string, first: string) {
  return (await db.query<{ id: string }>("select id from guests where event_id = $1 and first_name = $2", [eventId, first])).rows[0];
}
export async function inviteToken(db: Db, guestId: string) {
  const r = (await db.query<{ id: string; link_version: number }>("select id, link_version from invitations where guest_id = $1", [guestId])).rows[0];
  return signInvitationToken(r.id, r.link_version);
}
export async function passToken(db: Db, guestId: string) {
  const r = (await db.query<{ id: string }>("select id from entry_passes where guest_id = $1 and status in ('active','used') order by issued_at desc limit 1", [guestId])).rows[0];
  return r ? signPassToken(r.id) : null;
}
