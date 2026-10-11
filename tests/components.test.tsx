// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvitationRenderer } from "@/components/invitation/renderer";
import { LAYOUTS } from "@/components/invitation/layouts";
import { QrImage } from "@/components/guest/qr-image";
import { buildContent, SAMPLE_SOURCE } from "@/lib/domain/invitation-content";
import { guestsCopy } from "@/lib/i18n/guests";
import { authCopy } from "@/lib/i18n/auth";
import { guestCopy } from "@/lib/i18n/guest";

vi.mock("@/app/actions/guests", () => ({
  listGuestsAction: vi.fn(async () => ({ ok: true, data: [
    { id: "g1", eventId: "e", firstName: "Noura", lastName: "Demo", phone: "+966500000101", language: "ar", companions: 1, notes: "", invitationId: "i1", invitationStatus: "sent", rsvp: "accepted", delivery: "demo_simulated", sentAt: "2026-01-01T00:00:00Z", respondedAt: null, companionsAttending: 0, hasActivePass: true, checkedInAt: null, optedOut: false },
    { id: "g2", eventId: "e", firstName: "Layla", lastName: "Demo", phone: "+971500000105", language: "en", companions: 0, notes: "", invitationId: "i2", invitationStatus: "not_sent", rsvp: "pending", delivery: "none", sentAt: null, respondedAt: null, companionsAttending: 0, hasActivePass: false, checkedInAt: null, optedOut: false },
  ] })),
  addGuestAction: vi.fn(async () => ({ ok: false, error: "validation", fields: { phone: "invalid", firstName: "required" } })),
  updateGuestAction: vi.fn(), deleteGuestAction: vi.fn(), previewImportAction: vi.fn(), commitImportAction: vi.fn(),
}));
vi.mock("@/app/actions/auth", () => ({
  requestOtpAction: vi.fn(async () => ({ ok: false, error: "auth", code: "invalid_phone" })),
  verifyOtpAction: vi.fn(), demoLoginAction: vi.fn(),
}));
const rsvpMock = vi.fn(async () => ({ ok: true, data: { response: "accepted", companions: 0 } }));
vi.mock("@/app/actions/invitations", () => ({ rsvpAction: (...a: unknown[]) => rsvpMock(...(a as [])) }));

afterEach(cleanup);

describe("invitation renderer", () => {
  it.each(Object.keys(LAYOUTS))("renders layout %s in Arabic, English and bilingual", (layout) => {
    for (const language of ["ar", "en", "both"] as const) {
      const { container, unmount } = render(<InvitationRenderer content={buildContent({ ...SAMPLE_SOURCE, language })} layout={layout} palette="ivory" fontPair="classic" />);
      expect(container.textContent).toContain("فهد آل سعود");
      unmount();
    }
  });
  it("sets direction per language block and shows the personalised guest name", () => {
    const { container } = render(<InvitationRenderer content={buildContent({ ...SAMPLE_SOURCE, language: "both" }, "نورة")} layout="classic-frame" palette="ivory" fontPair="classic" />);
    expect(container.querySelector('[dir="rtl"][lang="ar"]')).not.toBeNull();
    expect(container.querySelector('[dir="ltr"][lang="en"]')).not.toBeNull();
    expect(container.textContent).toContain("نورة");
  });
  it("hides family names and optional details the host switched off", () => {
    const hidden = buildContent({ ...SAMPLE_SOURCE, visibility: { family: false, venueAddress: false, rsvpDeadline: false } });
    const { container } = render(<InvitationRenderer content={hidden} layout="classic-frame" palette="ivory" fontPair="classic" />);
    expect(container.textContent).not.toContain("مها العتيبي");
    expect(container.textContent).not.toContain("الرياض، المملكة");
  });
  it("overlays text on an uploaded image without editing the image itself", () => {
    const { container } = render(<InvitationRenderer content={buildContent(SAMPLE_SOURCE)} layout="image-overlay" palette="ivory" fontPair="classic"
      asset={{ kind: "png", url: "/x.png", overlayFields: [{ key: "names", x: 10, y: 40, w: 80 }] }} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/x.png");
    expect(container.textContent).toContain("فهد آل سعود");
  });
});

describe("QR image", () => {
  it("draws a deterministic code for the token and nothing else", () => {
    const a = render(<QrImage value="HK1.abc.def" label="qr" />).container.innerHTML;
    cleanup();
    const b = render(<QrImage value="HK1.abc.def" label="qr" />).container.innerHTML;
    cleanup();
    const c = render(<QrImage value="HK1.abc.xyz" label="qr" />).container.innerHTML;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(screen.queryByText(/abc/)).toBeNull();
  });
});

describe("guest manager", () => {
  it("lists, searches and filters guests; validation errors from the server are shown on the fields", async () => {
    const { GuestManager } = await import("@/components/guests/guest-manager");
    const user = userEvent.setup();
    render(<GuestManager eventId="e" locale="en" t={guestsCopy("en")} />);
    expect(await screen.findAllByTestId("guest-row")).toHaveLength(2);
    await user.type(screen.getByLabelText("Search name or number"), "lay");
    expect(screen.getAllByTestId("guest-row")).toHaveLength(1);
    await user.clear(screen.getByLabelText("Search name or number"));
    await user.selectOptions(screen.getByLabelText("Reply"), "accepted");
    const rows = screen.getAllByTestId("guest-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText(/Noura/)).toBeTruthy();
    await user.click(screen.getByTestId("add-guest"));
    await user.click(screen.getByRole("button", { name: "Save guest" }));
    expect(await screen.findByText("Invalid number")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
  });
  it("renders Arabic copy and is read-only without edit permission", async () => {
    const { GuestManager } = await import("@/components/guests/guest-manager");
    render(<GuestManager eventId="e" locale="ar" t={guestsCopy("ar")} canEdit={false} />);
    await screen.findAllByTestId("guest-row");
    expect(screen.queryByTestId("add-guest")).toBeNull();
    expect(screen.getAllByText("بانتظار الرد").length).toBeGreaterThan(0);
  });
});

describe("login form", () => {
  it("shows a translated error for an invalid number and hides demo accounts when the server provides none", async () => {
    const { LoginForm } = await import("@/components/site/login-form");
    const user = userEvent.setup();
    render(<LoginForm locale="en" t={authCopy("en")} demoAccounts={[]} />);
    expect(screen.queryByText("Demo accounts")).toBeNull();
    await user.type(screen.getByLabelText(/Mobile number/), "12");
    await user.click(screen.getByRole("button", { name: "Send code" }));
    expect(await screen.findByText(/valid phone number/)).toBeTruthy();
  });
  it("lists demo accounts only when provided", async () => {
    const { LoginForm } = await import("@/components/site/login-form");
    render(<LoginForm locale="ar" t={authCopy("ar")} demoAccounts={[{ key: "host", name: "Demo Event Host", role: "customer", staff: false }]} />);
    expect(screen.getByTestId("demo-host")).toBeTruthy();
    expect(screen.getByText("حسابات تجريبية")).toBeTruthy();
  });
});

describe("guest RSVP panel", () => {
  const inv = (over = {}) => ({
    invitationId: "i", eventId: "e", guest: { firstName: "Noura", lastName: "Demo", language: "ar", companionsAllowed: 2 },
    event: { title: "T", occasion: "wedding", occasionCustom: null, status: "live", startsAt: "2030-01-01T17:00:00Z", endsAt: null, timezone: "Asia/Riyadh", venueName: "V", venueAddress: null, mapUrl: null, dressCode: null, instructions: null, hostFirstName: null, hostLastName: null, cohostName: null, language: "ar", rsvpDeadline: null, details: {}, visibility: {} },
    design: { templateSlug: null, layout: "classic-frame", palette: "ivory", fontPair: "classic", align: "center", fields: {} },
    rsvp: { status: "pending", companionsAttending: 0, respondedAt: null, deadlinePassed: false, canChange: true }, pass: null, checkedInAt: null, ...over,
  });
  it("offers accept and decline, and submits the choice with the selected companions", async () => {
    const { RsvpPanel } = await import("@/components/guest/rsvp-panel");
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => inv({ rsvp: { status: "accepted", companionsAttending: 1, respondedAt: "x", deadlinePassed: false, canChange: true }, pass: { token: "HK1.a.b", status: "active" } }) })));
    render(<RsvpPanel token="tok" inv={inv() as never} locale="en" t={guestCopy("en")} />);
    await user.selectOptions(screen.getByLabelText(/companions/i), "1");
    await user.click(screen.getByTestId("rsvp-accept"));
    await waitFor(() => expect(rsvpMock).toHaveBeenCalledWith("tok", "accepted", 1));
    expect(await screen.findByTestId("rsvp-accepted")).toBeTruthy();
    expect(screen.getByRole("img", { name: /entry pass/i })).toBeTruthy();
    expect(screen.getByText(/delighted you’ll be joining us/)).toBeTruthy();
    vi.unstubAllGlobals();
  });
  it("shows no QR after a decline and no controls when the deadline has passed", async () => {
    const { RsvpPanel } = await import("@/components/guest/rsvp-panel");
    render(<RsvpPanel token="t" inv={inv({ rsvp: { status: "declined", companionsAttending: 0, respondedAt: "x", deadlinePassed: false, canChange: true } }) as never} locale="ar" t={guestCopy("ar")} />);
    expect(screen.getByTestId("rsvp-declined")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    cleanup();
    render(<RsvpPanel token="t" inv={inv({ rsvp: { status: "pending", companionsAttending: 0, respondedAt: null, deadlinePassed: true, canChange: false } }) as never} locale="en" t={guestCopy("en")} />);
    expect(screen.queryByTestId("rsvp-accept")).toBeNull();
    expect(screen.getByText("The reply deadline has passed.")).toBeTruthy();
  });
});
