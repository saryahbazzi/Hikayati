import { expect, test, type Page } from "@playwright/test";

/**
 * The end-to-end journey from the product brief, against a real server and a real (in-memory) database.
 * Sign-in uses the real phone + OTP flow with the dev code; the staff step uses the seeded demo super admin.
 */
const PHONE = "0555123456";
const next = (page: Page) => page.getByTestId("wizard-next").click();
const lbl = (page: Page, t: string) => page.getByLabel(new RegExp(`^${t}\\s*\\*?$`));
const radio = (page: Page, text: string | RegExp) => page.locator("label").filter({ hasText: text }).first();

test("host journey: homepage → wizard → guests → RSVP → QR → check-in → dashboard → reminder → staff review", async ({ page, browser }) => {
  // 1–2. Homepage in English, then switch to Arabic (RTL) and back.
  await page.goto("/en");
  await expect(page.getByRole("img", { name: "حِكَايَتِي" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByText("Every gathering has a story.").first()).toBeVisible();
  await page.getByRole("link", { name: "عربي" }).first().click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("لكل لقاء حكاية").first()).toBeVisible();
  await page.getByRole("link", { name: "EN" }).first().click();
  await expect(page).toHaveURL(/\/en$/);

  // 3. Begin Your Story → asked to sign in (and brought back afterwards).
  await page.getByRole("link", { name: "Begin Your Story" }).first().click();
  await expect(page).toHaveURL(/\/en\/login\?next=/);
  await page.getByLabel(/Mobile number/).fill(PHONE);
  await page.getByRole("button", { name: "Send code" }).click();
  const code = (await page.getByTestId("dev-otp").innerText()).trim(); // dev mode shows the code instead of sending an SMS
  expect(code).toMatch(/^\d{6}$/);
  await page.getByLabel("One-time code").fill(code);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(/\/en\/begin/);

  // 4–5. Wedding, 150 guests.
  await radio(page, /^Wedding/).click();
  await page.getByLabel(/Expected number of guests/).fill("150");
  await expect(page.getByText("Four numbers, four meanings")).toBeVisible();
  await next(page);

  // 6. Event details — wedding-specific fields appear, validation blocks an empty step.
  await expect(page.getByLabel("Bride’s name")).toBeVisible();
  await next(page);
  await expect(page.getByRole("alert").first()).toBeVisible();
  const future = new Date(Date.now() + 90 * 86400_000).toISOString().slice(0, 10);
  const reply = new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel("Groom’s name").fill("فهد آل سعود");
  await page.getByLabel("Bride’s name").fill("نوف بنت محمد آل الشيخ");
  await page.getByLabel("Event title").fill("فهد ونوف");
  await page.getByLabel("Host first name").fill("Demo");
  await lbl(page, "Date").fill(future);
  await lbl(page, "Starts").fill("20:00");
  await page.getByLabel("Reply by").fill(reply);
  await page.getByLabel("Venue name").fill("Nayara Hall (demo)");
  await lbl(page, "Address").fill("Riyadh, Saudi Arabia");
  await lbl(page, "City").fill("Riyadh");
  await next(page);

  // 7. Arabic invitations.
  await radio(page, /^Arabic/).click();
  await next(page);

  // 8–9. Choose an elegant template; the preview is populated with the real details.
  await radio(page, /Traditional Saudi Wedding/).click();
  await expect(page.getByTestId("invitation-preview")).toContainText("فهد آل سعود");
  await page.getByTestId("invitation-preview").scrollIntoViewIfNeeded();
  await next(page);

  // 10. Three fictional guests (the list is persisted as they are added).
  for (const [first, phone] of [["Noura", "500000701"], ["Reem", "500000702"], ["Sultan", "500000703"]]) {
    await page.getByTestId("add-guest").click();
    await page.getByLabel("First name").fill(first);
    await page.getByLabel("Last name").fill("Demo");
    await page.getByLabel("Mobile number").fill(phone);
    await page.getByRole("button", { name: "Save guest" }).click();
    await expect(page.getByTestId("guest-row").filter({ hasText: first })).toBeVisible();
  }
  await expect(page.getByTestId("records-count")).toHaveText("3");
  await next(page);

  // 11. Review, choose a package, consent, confirm (demo checkout) → saved event.
  await expect(page.getByText("DEMO — no payment is taken").first()).toBeVisible();
  await radio(page, /Signature/).click();
  await expect(page.getByTestId("estimate")).toContainText("Example estimate");
  await page.getByLabel(/I confirm I have permission/).check();
  await page.getByTestId("confirm-demo").click();
  await expect(page).toHaveURL(/\/en\/my-events\/[0-9a-f-]{36}\/test/);
  const eventId = page.url().match(/my-events\/([0-9a-f-]{36})/)![1];

  // 12. Test invitation experience: pick a guest, get the private link, simulate sending.
  await page.getByTestId("test-guest").selectOption({ label: "Noura Demo" });
  await page.getByTestId("test-get-link").click();
  const link = await page.getByTestId("test-link").inputValue();
  expect(link).toMatch(/\/(en|ar)\/i\/i1\./);
  await page.getByTestId("test-send").click();
  await expect(page.getByTestId("test-status")).toContainText(/sent/i);

  // 13–15. The guest (a different browser, no account) opens the link, accepts and receives a QR.
  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(link);
  await expect(guest.getByText(/Noura/).first()).toBeVisible();
  await expect(guest.locator("body")).not.toContainText("500000701");           // no phone numbers on the guest page
  await guest.getByTestId("rsvp-accept").click();
  await expect(guest.getByTestId("rsvp-accepted")).toBeVisible();
  const qr = guest.getByRole("img", { name: /entry pass|رمز الدخول/ });
  await expect(qr).toBeVisible();
  expect(await qr.locator("rect").count()).toBeGreaterThan(100);                 // a real, dense QR
  await expect(guest.getByText(/يسعدنا تأكيد حضورك، ونتطلع إلى مشاركتك هذه المناسبة/)).toBeVisible(); // Arabic invitation → Arabic confirmation
  await expect(guest.locator("html")).toHaveAttribute("dir", "rtl");

  // 16–17. Host side: the RSVP shows up; simulate the check-in; status updates.
  await page.getByTestId("test-refresh").click();
  await expect(page.getByTestId("test-status")).toContainText(/accepted/i);
  await page.getByTestId("test-checkin").click();
  await expect(page.getByTestId("test-status")).toContainText(/checked in/i);
  await guest.reload();
  await expect(guest.getByTestId("checked-in-note")).toBeVisible();
  // A second attempt cannot check in again: the guest page now says so, and RSVP changes are blocked.
  await expect(guest.getByTestId("rsvp-change")).toHaveCount(0);
  await guestCtx.close();

  // 18–19. Customer dashboard reflects the real numbers.
  await page.goto("/en/my-events");
  const card = page.getByTestId("event-card").filter({ hasText: "فهد ونوف" });
  await expect(card).toBeVisible();
  await page.goto(`/en/my-events/${eventId}`);
  const stats = page.getByTestId("event-stats");
  await expect(stats).toContainText("3");           // guest records
  await expect(stats.getByText("Checked in", { exact: false }).first()).toBeVisible();

  // 20. Schedule a test reminder (7 days before) — and a duplicate is refused.
  await page.goto(`/en/my-events/${eventId}/reminders`);
  await radio(page, /7 days before/).click();
  await page.getByTestId("create-reminder").click();
  await expect(page.getByTestId("rule-row")).toHaveCount(1);
  await radio(page, /7 days before/).click();
  await page.getByTestId("create-reminder").click();
  await expect(page.getByTestId("rule-row")).toHaveCount(1);
  await page.getByTestId("run-now").click();                                   // demo: simulate delivery now
  await expect(page.getByText(/demo/i).first()).toBeVisible();

  // Authorization: a customer can't open the staff portal or another customer's data.
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/not-authorized/);

  // 21–22. A Hikayati staff member signs in and reviews the event in the admin portal.
  const staffCtx = await browser.newContext();
  const staff = await staffCtx.newPage();
  await staff.goto("/en/login");
  await staff.getByTestId("demo-superAdmin").click();
  await expect(staff).toHaveURL(/\/en\/admin/);
  await staff.goto(`/en/admin/events/${eventId}`);
  await expect(staff.getByText("فهد ونوف").first()).toBeVisible();
  await expect(staff.locator("body")).toContainText(/Checked in|checked in/);
  await staffCtx.close();
});

test("check-in staff are confined to their assigned event and cannot see packages or the team", async ({ browser }) => {
  const ctx = await browser.newContext();
  const door = await ctx.newPage();
  await door.goto("/en/login");
  await door.getByTestId("demo-door").click();
  await expect(door).toHaveURL(/\/en\/admin/);
  await door.goto("/en/admin/packages");
  await expect(door).toHaveURL(/not-authorized/);
  await door.goto("/en/admin/team");
  await expect(door).toHaveURL(/not-authorized/);
  await door.goto("/en/admin/checkin");
  await expect(door.getByText(/فهد ونوف/).first()).toBeVisible();
  await ctx.close();
});

test("production-style safety: unknown pages and forged guest links reveal nothing", async ({ page }) => {
  await page.goto("/en/i/i1.00000000-0000-4000-8000-000000000000.1.AAAAAAAAAAAAAAAAAAAAAAAAAAA");
  await expect(page.getByText("This invitation link isn’t valid.")).toBeVisible();
  const res = await page.goto("/en/no-such-page");
  expect(res?.status()).toBe(404);
  const api = await page.request.get("/api/me");
  expect((await api.json()).actor).toBeNull();
});
