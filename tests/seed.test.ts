import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/server/db";
import type { Db } from "@/lib/server/db";
import { eventStats } from "@/lib/server/events";

let db: Db;
beforeAll(async () => { db = await createTestDb({ demo: true }); });

describe("seed", () => {
  it("creates the fictional demo data", async () => {
    const users = (await db.query<{ role: string }>("select role from users order by role")).rows.map((r) => r.role);
    expect(users).toEqual(expect.arrayContaining(["super_admin", "admin", "event_manager", "customer", "check_in_staff"]));
    const ev = (await db.query<{ id: string; title: string }>("select id, title from events order by created_at")).rows;
    expect(ev).toHaveLength(3);
    const s = await eventStats(db, ev[0].id);
    expect(s).toMatchObject({ guestRecords: 6, accepted: 3, declined: 1, awaiting: 2, checkedIn: 1, notYetArrived: 2 });
  });
});
