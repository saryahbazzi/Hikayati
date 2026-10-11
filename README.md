# Hikayati · حكايتي

Bilingual (English LTR / Arabic RTL) digital invitations and guest experiences for Saudi occasions.
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · PostgreSQL (PGlite locally, any Postgres via `DATABASE_URL`).

> **This is a prototype.** Messaging is *simulated* (no WhatsApp/SMS is ever sent), checkout is a *demo* (no payments),
> OTP sign-in shows the code on screen in demo mode, and contact details in the footer are *placeholders*.
> Everything else — events, guests, RSVPs, signed links, QR passes, check-in, reminders, roles, audit log — is real and persisted.

## Run it

```bash
npm install
npm run dev                # http://localhost:3000  → /en  (Arabic: /ar)
```

No environment variables are needed locally: data lives in `./.data/pglite` (a real Postgres compiled to WASM),
demo/dev access is on, and the demo data is seeded on first request. Delete `.data/` to start over.
See `.env.example` for every setting.

```bash
npm run typecheck && npm run lint
npm test                   # unit + integration + component tests (Vitest)
npm run test:e2e           # builds, starts a server and runs the full browser journey (Playwright)
```

## Try it yourself (≈ 5 minutes)

1. Open `/en`, switch to Arabic with **EN / عربي**, and watch the wordmark being written.
2. **Sign in** (`/en/login`) → use the **Demo accounts** list (or any number + the on-screen code):

   | Account | Role | Lands on |
   |---|---|---|
   | Demo Event Host | customer | My Events |
   | Hikayati Event Manager (demo) | event_manager | Admin (assigned events only) |
   | Event Check-In Staff (demo) | check_in_staff | Admin → Check-In (assigned event only) |
   | Hikayati Admin (demo) | admin | Admin |
   | Hikayati Super Admin (demo) | super_admin | Admin (everything) |
   | Demo Planner Studio | customer | My Events (has no events; collaborator on none) |

   All are **fictional**; phones are `+96650000000x`; guests are `+96650000xxxx`. They exist only while demo access is enabled.
3. As the host choose **Begin Your Story** and walk the wizard: occasion → details → language → design → guests → review → demo confirm.
4. On the event's **Test** tab: pick a guest → copy their private link → *Simulate send* → open the link, **Accept** → see the QR →
   back on the Test tab **Simulate check-in** (or sign in as door staff and use the scanner/manual entry) → watch the counts change.
5. Sign in as **Super Admin** and review the event, packages & pricing, templates, team, audit log.

The 22-step journey from the brief is automated in `e2e/journey.spec.ts`.

## Architecture

```
app/[locale]/(site)/      public pages: home, about, occasions, packages, contact, templates, login, privacy, terms
app/[locale]/(guest)/     /i/[token]   a guest's private invitation + RSVP + QR pass (no account)
app/[locale]/(portal)/    customer area: begin (wizard), my-events/[id], guests, invitations, reminders, account
app/[locale]/(admin)/     staff area: overview, events, customers, guests, templates, packages, messaging, check-in, reports, team, settings, audit
app/actions/              server actions (thin: authenticate → call a service → return a typed result)
app/api/                  me, auth/logout, invitation/[token], events/[id]/guests.csv, cron/reminders, admin/*
lib/server/               ALL business logic + authorization (db, auth, permissions, events, guests, invitations, checkin, reminders, catalog, templates, admin, audit, tokens, messaging/)
lib/domain/               pure shared logic (occasions, wizard validation, pricing, time, invitation content, design)
lib/i18n/                 [English, Arabic] pairs side by side — one source of truth for all copy
db/migrations/            SQL schema (applied automatically; PGlite and Postgres)
components/               ui kit · site · invitation renderer (8 layouts + image overlay) · wizard · portal · admin · guest
tests/  e2e/              Vitest and Playwright
```

**Design tokens** live in `app/globals.css` (`@theme`): ivory / olive / champagne palette, Cormorant Garamond + Jost (Latin),
Amiri + Noto Naskh Arabic. Components never hard-code colours; the invitation renderer takes palette/fonts as data.

### Roles and authorization

| Role | Global permissions | Event access |
|---|---|---|
| `super_admin` | everything | all events |
| `admin` | operations: all events, customers, templates, reports, messaging, check-in | all events |
| `event_manager` | staff portal only | events they are **assigned** to: manage invitations/guests |
| `check_in_staff` | staff portal only | assigned events: check-in only (no guest list, no export) |
| `customer` | none | events they own, or are invited to as a collaborator |

Rules live in `lib/server/permissions.ts` and are enforced **server-side**: layouts call `requirePermission`, every service call
re-derives access from the database (`eventAccess`), and inaccessible events return *not found* so ids cannot be probed.
Roles are never taken from the client, the email address or a hidden menu. Staff roles can only be granted by a super admin.
Sensitive actions are written to `audit_logs` (no personal data in the metadata).

### Guest links, passes and check-in

* An **invitation link** is `i1.<invitationId>.<version>.<HMAC>`; an **entry pass** (the QR payload) is `HK1.<passId>.<HMAC>`.
  They contain no personal data, cannot be forged without `HIKAYATI_SECRET`, and are revoked in the database
  (`invitations.link_version`, `entry_passes.status`). Hosts can re-show, regenerate (invalidates the old link) or revoke them.
* RSVP and attendance are **separate**: accepting issues exactly one active pass (partial unique index); declining revokes it.
* Check-in verifies the signature, the pass's event, the staff member's access to *that* event, RSVP state and revocation, then inserts into
  `guest_checkins` which is `UNIQUE(guest_id)` and `UNIQUE(entry_pass_id)` — concurrent scans cannot both succeed. Every attempt is logged.
* The public invitation payload never contains phone numbers or other guests.

### Demo mode vs production

`HIKAYATI_DEMO_ACCESS` (default: on in development, **off** in production) controls seeded fictional accounts, the on-screen OTP and
simulated check-in. There is no hard-coded bypass: with it off and no OTP provider configured, sign-in is refused. See `lib/server/config.ts`.

### Messaging (WhatsApp)

`lib/server/messaging/` defines a `MessageProvider` interface. `DemoProvider` (used now) marks messages `demo_simulated`.
`WhatsAppProvider` is a documented stub for the official WhatsApp Business Platform — approved templates, recorded opt-in, signed webhooks
(`verifyWebhookSignature`), idempotent status updates, retries and rate limits are listed in its header. Nothing claims delivery unless a
provider confirms it, and credentials only ever come from server environment variables.

### Calligraphy wordmark

`components/brand-mark.tsx` writes «حِكَايَتِي» (with fatha/kasra) by drawing pen strokes through SVG masks over real Amiri outlines,
body first, then dots, then vowel marks. Regenerate with `npm run calligraphy -- /path/to/Amiri-Regular.ttf` after editing `scripts/pen.json`.
**Replacement slot:** to use a bespoke hand-drawn wordmark, produce `lib/calligraphy.ts` in the same shape (outline `d`, `strokes`, `dots`).

### Adding your own (Canva) invitation designs

Export the design as PNG/JPG/SVG *without* the personal text, then in **Admin → Templates → Register uploaded design** give its URL and
the overlay fields (`names`, `date`, `time`, `venue`, …) as percentage boxes. The image is a flat backdrop — its pixels are not editable;
Hikayati draws the personalised text on top (`components/invitation/renderer.tsx`, layout `image-overlay`). PDF and video assets can be
registered but are shown as *coming soon*; motion/video rendering is **not** implemented.

### Optional About-section background video

Set `NEXT_PUBLIC_ABOUT_VIDEO_URL` (+ `NEXT_PUBLIC_ABOUT_POSTER_URL`) to **owner-supplied, licensed** footage: a short, silent, compressed loop.
It plays at ~14% opacity under an ivory wash, never with audio, and falls back to the poster for reduced-motion / data-saver users.
Without it a quiet tonal lattice is shown. No footage is bundled or downloaded.

## Deploying to Vercel (preview first)

1. Import the repo; framework **Next.js**, root `./`. Production branch stays `main`; `hikayati-v2` builds as a **Preview**.
2. Preview env vars: `HIKAYATI_SECRET` (random), `HIKAYATI_DEMO_ACCESS=true`, and ideally `DATABASE_URL` (Supabase/Neon/any Postgres).
   Without `DATABASE_URL`, serverless instances use an in-memory database that resets — fine to look around, not to keep data.
3. **Production** env: `HIKAYATI_SECRET`, `DATABASE_URL`, and **do not** set `HIKAYATI_DEMO_ACCESS`.
   Production sign-in additionally needs an OTP provider (not yet implemented in this prototype).

## Privacy (PDPL) notes

Hosts attest permission to contact guests (recorded); guests can be opted out; the guest list export is permission-checked and audited;
the privacy policy and terms are **drafts for review by Saudi counsel**; retention periods are described but automated purging is not built yet.
No real personal data is used in demo seeds.

## Honest status

Real: UI, i18n/RTL, database + migrations, OTP sessions, RBAC, wizard + autosave, templates renderer, guest CRUD + CSV, signed links, RSVP,
QR generation, scanner/check-in, reminders scheduling + processing, packages/pricing admin, reports, audit.
Simulated: message delivery, payments (demo checkout), OTP delivery (code shown on screen), reminders "sent".
Not built: WhatsApp provider, real OTP provider, payments, motion/video invitations, automated data purging, row-level security policies
(access is enforced by owner-scoped server queries over a single connection; RLS is a good hardening step if you move to Supabase client access).
