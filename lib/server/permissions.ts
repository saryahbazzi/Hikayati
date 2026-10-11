import "server-only";
import type { Queryable } from "./db";

export const ROLES = ["super_admin", "admin", "event_manager", "check_in_staff", "customer"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: readonly Role[] = ["super_admin", "admin", "event_manager", "check_in_staff"];

export type Permission =
  | "staff.portal" // may open /admin at all
  | "events.read_all"
  | "events.manage_all"
  | "customers.read"
  | "templates.manage"
  | "packages.manage"
  | "team.manage"
  | "settings.manage"
  | "reports.read"
  | "messaging.read"
  | "audit.read"
  | "checkin.operate_all";

/** Least privilege: event_manager / check_in_staff get nothing global; they work on assigned events only. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: [
    "staff.portal", "events.read_all", "events.manage_all", "customers.read", "templates.manage", "packages.manage",
    "team.manage", "settings.manage", "reports.read", "messaging.read", "audit.read", "checkin.operate_all",
  ],
  admin: [
    "staff.portal", "events.read_all", "events.manage_all", "customers.read", "templates.manage",
    "reports.read", "messaging.read", "checkin.operate_all",
  ],
  event_manager: ["staff.portal"],
  check_in_staff: ["staff.portal"],
  customer: [],
};

export interface Actor { id: string; role: Role; fullName: string; phone: string | null; locale: "ar" | "en" }

export const hasPermission = (actor: Pick<Actor, "role">, p: Permission) => ROLE_PERMISSIONS[actor.role].includes(p);
export const isStaff = (actor: Pick<Actor, "role">) => STAFF_ROLES.includes(actor.role);

/** What the actor may do with one specific event. Always derived from the database, never from the client. */
export interface EventAccess {
  view: boolean;       // see event + stats
  manage: boolean;     // edit event, invitations, send, reminders
  guests: boolean;     // add / edit guests
  checkin: boolean;    // operate check-in
  owner: boolean;
  exportData: boolean; // download guest list (personal data)
}
const NONE: EventAccess = { view: false, manage: false, guests: false, checkin: false, owner: false, exportData: false };

export async function eventAccess(q: Queryable, actor: Actor, eventId: string): Promise<EventAccess> {
  const ev = await q.query<{ owner_id: string }>("select owner_id from events where id = $1", [eventId]);
  if (!ev.rows[0]) return NONE;
  if (ev.rows[0].owner_id === actor.id) return { view: true, manage: true, guests: true, checkin: true, owner: true, exportData: true };
  if (hasPermission(actor, "events.manage_all")) {
    return { view: true, manage: true, guests: true, checkin: hasPermission(actor, "checkin.operate_all"), owner: false, exportData: true };
  }
  const acc: EventAccess = { ...NONE };
  const asg = await q.query<{ role: string }>("select role from event_assignments where event_id = $1 and user_id = $2", [eventId, actor.id]);
  for (const { role } of asg.rows) {
    if (role === "manager" && actor.role === "event_manager") Object.assign(acc, { view: true, manage: true, guests: true, checkin: true, exportData: true });
    if (role === "check_in" && actor.role === "check_in_staff") Object.assign(acc, { view: true, checkin: true });
  }
  const col = await q.query<{ permission: string }>("select permission from event_collaborators where event_id = $1 and user_id = $2", [eventId, actor.id]);
  for (const { permission } of col.rows) {
    acc.view = true;
    if (permission === "manage_guests") acc.guests = true;
  }
  return acc;
}

export class ForbiddenError extends Error {
  constructor(msg = "forbidden") { super(msg); this.name = "ForbiddenError"; }
}
export class NotFoundError extends Error {
  constructor(msg = "not found") { super(msg); this.name = "NotFoundError"; }
}
export class ValidationError extends Error {
  constructor(public fields: Record<string, string>, msg = "validation failed") { super(msg); this.name = "ValidationError"; }
}

/** Throw NotFound (not Forbidden) when the actor cannot even see the event, so ids are not enumerable. */
export async function requireEventAccess(q: Queryable, actor: Actor, eventId: string, need: keyof EventAccess = "view"): Promise<EventAccess> {
  const a = await eventAccess(q, actor, eventId);
  if (!a.view && !a.checkin) throw new NotFoundError("event not found");
  if (!a[need]) throw new ForbiddenError(`missing ${need} access`);
  return a;
}
