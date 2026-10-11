import { beforeAll, describe, expect, it } from "vitest";
import { adminListEvents, adminPricing, assignStaff, changeStaffRole, getCheckinPanel, listCheckinEvents, reportCsv, setAccountDisabled, adminSetTemplateStatus, adminListGuests } from "@/lib/server/admin";
import { checkInByToken, simulateCheckIn } from "@/lib/server/checkin";
import { createTestDb, type Db } from "@/lib/server/db";
import { ForbiddenError, NotFoundError, ValidationError, type Actor } from "@/lib/server/permissions";
import { DEMO_USERS } from "@/lib/server/seed";
import { signPassToken } from "@/lib/server/tokens";

const A = (u: (typeof DEMO_USERS)[keyof typeof DEMO_USERS]): Actor => ({ id: u.id, role: u.role, fullName: u.name, phone: u.phone, locale: u.locale });
let db: Db; let wedding: string; let brunch: string;
beforeAll(async () => {
  db = await createTestDb({ demo: true });
  const ev = (await db.query<{ id: string; title: string }>("select id, title from events")).rows;
  wedding = ev.find((e) => e.title === "فهد ونوف")!.id; brunch = ev.find((e) => e.title.startsWith("Demo Birthday"))!.id;
});

describe("admin authorization", () => {
  it("customers and door staff cannot use privileged services", async () => {
    await expect(adminPricing(db, A(DEMO_USERS.door))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(adminPricing(db, A(DEMO_USERS.admin))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(adminListEvents(db, A(DEMO_USERS.host), {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(adminListEvents(db, A(DEMO_USERS.door), {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(reportCsv(db, A(DEMO_USERS.manager))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(adminSetTemplateStatus(db, A(DEMO_USERS.manager), wedding, "draft")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setAccountDisabled(db, A(DEMO_USERS.admin), DEMO_USERS.host.id, true)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(assignStaff(db, A(DEMO_USERS.manager), wedding, DEMO_USERS.door.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("event manager sees assigned events only; admin sees all; phones masked unless manage_all", async () => {
    expect((await adminListEvents(db, A(DEMO_USERS.manager), {})).total).toBe(2);
    expect((await adminListEvents(db, A(DEMO_USERS.admin), {})).total).toBe(3);
    const g = await adminListGuests(db, A(DEMO_USERS.manager), {});
    expect(g.masked).toBe(true);
    expect(g.rows.every((r) => r.phone.includes("•"))).toBe(true);
    expect((await adminListGuests(db, A(DEMO_USERS.admin), {})).rows[0].phone).not.toContain("•");
  });
  it("door staff only reach assigned check-in events", async () => {
    const list = await listCheckinEvents(db, A(DEMO_USERS.door));
    expect(list.map((e) => e.id)).toEqual([wedding]);
    await expect(getCheckinPanel(db, A(DEMO_USERS.door), wedding)).resolves.toBeTruthy();
    await expect(getCheckinPanel(db, A(DEMO_USERS.door), brunch)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("cannot demote/disable self or the last super admin", async () => {
    const sa = A(DEMO_USERS.superAdmin);
    await expect(changeStaffRole(db, sa, sa.id, "admin")).rejects.toBeInstanceOf(ValidationError);
    await expect(setAccountDisabled(db, sa, sa.id, true)).rejects.toBeInstanceOf(ValidationError);
    await db.query("insert into users (phone_e164, role, full_name) values ('+966500009999','super_admin','Second')");
    const second = (await db.query<{ id: string }>("select id from users where phone_e164='+966500009999'")).rows[0].id;
    await changeStaffRole(db, sa, second, "admin"); // fine: another super admin (me) remains
    await db.query("update users set role='super_admin' where id=$1", [second]);
    const other: Actor = { ...sa, id: second };
    await db.query("update users set disabled_at = now() where id = $1", [sa.id]);
    await expect(changeStaffRole(db, other, sa.id, "admin")).resolves.toBeUndefined(); // sa already disabled, second is the last active super admin
    await expect(changeStaffRole(db, { ...other, id: DEMO_USERS.admin.id, role: "super_admin" }, second, "admin")).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("check-in flow", () => {
  it("simulate then second attempt is already_checked_in; counts update", async () => {
    const door = A(DEMO_USERS.door);
    const before = (await getCheckinPanel(db, door, wedding)).counts.attended;
    const guest = (await getCheckinPanel(db, door, wedding)).simulate!.find((g) => !g.checkedIn)!;
    const r1 = await simulateCheckIn(db, door, guest.id);
    expect(r1.result).toBe("success");
    expect((await getCheckinPanel(db, door, wedding)).counts.attended).toBe(before + 1);
    const pass = (await db.query<{ id: string }>("select id from entry_passes where guest_id = $1", [guest.id])).rows[0];
    const r2 = await checkInByToken(db, door, signPassToken(pass.id), { expectedEventId: wedding, method: "manual" });
    expect(r2.result).toBe("already_checked_in");
    const wrong = await checkInByToken(db, door, signPassToken(pass.id), { expectedEventId: brunch, method: "manual" });
    expect(["wrong_event", "forbidden"]).toContain(wrong.result);
    expect((await checkInByToken(db, door, "garbage")).result).toBe("invalid");
  });
});
