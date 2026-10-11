/**
 * Hikayati core schema (PostgreSQL). Runs on PGlite locally and on any Postgres via DATABASE_URL.
 * Authorization is enforced in the server layer (lib/server/permissions.ts + owner-scoped queries);
 * every guest-facing credential is stored only as a SHA-256 hash.
 */
export const init = `
create table users (
  id          uuid primary key default gen_random_uuid(),
  phone_e164  text unique check (phone_e164 is null or phone_e164 ~ '^\\+[1-9][0-9]{6,14}$'),
  email       text,
  full_name   text not null default '',
  locale      text not null default 'ar' check (locale in ('ar','en')),
  role        text not null default 'customer'
              check (role in ('super_admin','admin','event_manager','check_in_staff','customer')),
  is_demo     boolean not null default false,
  disabled_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  user_agent   text
);
create index sessions_user_idx on sessions(user_id);

create table otp_challenges (
  id          uuid primary key default gen_random_uuid(),
  phone_e164  text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index otp_phone_idx on otp_challenges(phone_e164, created_at desc);

-- ---------- packages ----------
create table packages (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name_i18n      jsonb not null,
  tagline_i18n   jsonb not null default '{}',
  features       jsonb not null default '[]',   -- [{ "en": "...", "ar": "..." }]
  limits         jsonb not null default '{}',   -- { "maxGuests": 150, "events": 1, ... }
  pricing_status text not null default 'coming_soon' check (pricing_status in ('coming_soon','published')),
  is_public      boolean not null default true,
  sort           int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table package_prices (
  id               uuid primary key default gen_random_uuid(),
  package_id       uuid not null references packages(id) on delete cascade,
  model            text not null check (model in ('flat','per_guest','subscription')),
  currency         text not null default 'SAR',
  amount_minor     bigint not null check (amount_minor >= 0),   -- halalas
  min_guests       int not null default 0,
  max_guests       int,                                          -- null = unlimited (tier upper bound)
  billing_interval text check (billing_interval in ('month','year')),
  label            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  check (max_guests is null or max_guests >= min_guests)
);
create index package_prices_pkg_idx on package_prices(package_id);

create table package_addons (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_i18n   jsonb not null,
  pricing     text not null default 'flat' check (pricing in ('flat','per_guest')),
  price_minor bigint not null check (price_minor >= 0),
  active      boolean not null default true
);

create table discounts (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  percent    numeric(5,2) not null check (percent > 0 and percent <= 100),
  active     boolean not null default true,
  expires_at timestamptz
);

-- ---------- templates ----------
create table invitation_templates (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name_i18n        jsonb not null,
  description_i18n jsonb not null default '{}',
  occasion_groups  text[] not null default '{}',
  style            text not null default '',
  kind             text not null default 'static' check (kind in ('static','motion','video')),
  status           text not null default 'published' check (status in ('published','coming_soon','draft')),
  layout           text not null,              -- key of the renderer in components/invitation/layouts
  palette          text not null default 'ivory',
  font_pair        text not null default 'classic',
  sort             int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table template_assets (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references invitation_templates(id) on delete cascade,
  kind           text not null check (kind in ('png','jpg','svg','pdf','video')),
  url            text not null,
  width          int,
  height         int,
  overlay_fields jsonb not null default '[]',  -- [{ key, x, y, w, align, size, color }] in percent of the asset box
  created_at     timestamptz not null default now()
);

-- ---------- events ----------
create table events (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references users(id),
  status                text not null default 'draft'
                        check (status in ('draft','confirmed','live','completed','cancelled')),
  wizard_step           int not null default 1,
  occasion              text not null default 'wedding',
  occasion_custom       text,
  title                 text not null default '',
  estimated_guests      int check (estimated_guests is null or estimated_guests > 0),
  host_first_name       text not null default '',
  host_last_name        text not null default '',
  cohost_name           text not null default '',
  starts_at             timestamptz,
  ends_at               timestamptz,
  timezone              text not null default 'Asia/Riyadh',
  venue_name            text not null default '',
  venue_address         text not null default '',
  city                  text not null default '',
  country               text not null default 'SA',
  map_url               text not null default '',
  dress_code            text not null default '',
  instructions          text not null default '',
  notes                 text not null default '',
  rsvp_deadline         timestamptz,
  allow_rsvp_change     boolean not null default true,
  details               jsonb not null default '{}',   -- occasion-specific fields
  invitation_visibility jsonb not null default '{}',   -- which fields appear on the invitation
  invitation_language   text not null default 'ar' check (invitation_language in ('ar','en','both')),
  package_id            uuid references packages(id),
  consent_attested_at   timestamptz,
  confirmed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index events_owner_idx on events(owner_id, status);
create index events_starts_idx on events(starts_at);

create table event_assignments (
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       text not null check (role in ('manager','check_in')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id, role)
);
create index event_assignments_user_idx on event_assignments(user_id);

create table event_collaborators (
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  permission text not null check (permission in ('view_stats','manage_guests')),
  invited_by uuid references users(id),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_collaborators_user_idx on event_collaborators(user_id);

create table invitation_designs (
  event_id    uuid primary key references events(id) on delete cascade,
  template_id uuid references invitation_templates(id),
  fields      jsonb not null default '{}',   -- text overrides keyed by field, e.g. {"headline":"..."}
  palette     text not null default 'ivory',
  font_pair   text not null default 'classic',
  align       text not null default 'center' check (align in ('start','center','end')),
  updated_at  timestamptz not null default now()
);

-- ---------- guests & invitations ----------
create table guests (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references events(id) on delete cascade,
  first_name         text not null,
  last_name          text not null default '',
  phone_e164         text not null check (phone_e164 ~ '^\\+[1-9][0-9]{6,14}$'),
  preferred_language text check (preferred_language in ('ar','en')),
  companions         int not null default 0 check (companions between 0 and 20),
  notes              text not null default '',
  opted_out_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (event_id, phone_e164)
);
create index guests_event_idx on guests(event_id);

create table invitations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  guest_id            uuid not null unique references guests(id) on delete cascade,
  link_version        int not null default 1,   -- bump to invalidate every previously issued link
  status              text not null default 'not_sent'
                      check (status in ('not_sent','sent','opened','responded','revoked')),
  rsvp_status         text not null default 'pending' check (rsvp_status in ('pending','accepted','declined')),
  companions_attending int not null default 0,
  delivery_status     text not null default 'none'
                      check (delivery_status in ('none','demo_simulated','sent','delivered','read','failed')),
  sent_at             timestamptz,
  opened_at           timestamptz,
  responded_at        timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index invitations_event_idx on invitations(event_id, rsvp_status);

create table rsvp_responses (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  response      text not null check (response in ('accepted','declined')),
  companions    int not null default 0,
  created_at    timestamptz not null default now()
);

-- A pass exists only while a guest has accepted. RSVP is separate from check-in.
-- Guest links and passes are HMAC-signed ids (lib/server/tokens.ts): nothing personal inside, revocable here.
create table entry_passes (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  event_id      uuid not null references events(id) on delete cascade,
  guest_id      uuid not null references guests(id) on delete cascade,
  status        text not null default 'active' check (status in ('active','revoked','used')),
  issued_at     timestamptz not null default now(),
  revoked_at    timestamptz,
  used_at       timestamptz
);
create unique index entry_passes_one_active on entry_passes(invitation_id) where status = 'active';
create index entry_passes_event_idx on entry_passes(event_id);

-- One check-in per guest per event, enforced by the database.
create table guest_checkins (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  guest_id      uuid not null references guests(id) on delete cascade,
  entry_pass_id uuid not null references entry_passes(id),
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references users(id),
  method        text not null check (method in ('scanner','manual','demo_simulated')),
  meta          jsonb not null default '{}',
  unique (guest_id),
  unique (entry_pass_id)
);
create index guest_checkins_event_idx on guest_checkins(event_id, checked_in_at desc);

create table checkin_attempts (
  id         bigint generated always as identity primary key,
  event_id   uuid references events(id) on delete cascade,
  guest_id   uuid,
  result     text not null check (result in ('success','already_checked_in','invalid','wrong_event','not_accepted','revoked','forbidden')),
  by_user    uuid references users(id),
  method     text not null,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index checkin_attempts_event_idx on checkin_attempts(event_id, created_at desc);

-- ---------- messaging & reminders ----------
create table message_records (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  guest_id      uuid references guests(id) on delete set null,
  invitation_id uuid references invitations(id) on delete set null,
  provider      text not null check (provider in ('demo','whatsapp')),
  kind          text not null check (kind in ('invite','reminder','rsvp_confirmation','pass')),
  status        text not null default 'queued'
                check (status in ('queued','demo_simulated','sent','delivered','read','failed')),
  locale        text not null default 'ar',
  body          text not null,
  meta          jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index message_records_event_idx on message_records(event_id, created_at desc);

create table reminder_rules (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  kind        text not null check (kind in ('before_event','custom')),
  days_before int,
  run_at      timestamptz not null,
  audience    text not null check (audience in ('not_responded','confirmed','all_invited')),
  message     text,
  status      text not null default 'active' check (status in ('active','cancelled','completed')),
  created_by  uuid references users(id),
  created_at  timestamptz not null default now(),
  unique (event_id, audience, run_at)
);

create table reminder_jobs (
  id           uuid primary key default gen_random_uuid(),
  rule_id      uuid not null references reminder_rules(id) on delete cascade,
  guest_id     uuid not null references guests(id) on delete cascade,
  run_at       timestamptz not null,
  state        text not null default 'pending' check (state in ('pending','simulated','skipped','cancelled')),
  processed_at timestamptz,
  message_id   uuid references message_records(id) on delete set null,
  unique (rule_id, guest_id)
);
create index reminder_jobs_due_idx on reminder_jobs(run_at) where state = 'pending';

-- ---------- commerce (demo only) ----------
create table orders (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  user_id        uuid not null references users(id),
  package_id     uuid references packages(id),
  status         text not null default 'demo_confirmed' check (status in ('demo_confirmed','pending','cancelled')),
  is_demo        boolean not null default true,
  currency       text not null default 'SAR',
  subtotal_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  tax_minor      bigint not null default 0,
  total_minor    bigint not null default 0,
  breakdown      jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

create table subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  package_id uuid not null references packages(id),
  status     text not null default 'demo_active' check (status in ('demo_active','cancelled')),
  interval   text check (interval in ('month','year')),
  started_at timestamptz not null default now()
);

-- ---------- public contact form ----------
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  reply_to   text not null,           -- email or phone typed by the visitor
  message    text not null,
  locale     text not null default 'en',
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- platform ----------
create table platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  actor_role text,
  action     text not null,
  entity     text,
  entity_id  text,
  event_id   uuid,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs(created_at desc);
create index audit_logs_event_idx on audit_logs(event_id);
`;
