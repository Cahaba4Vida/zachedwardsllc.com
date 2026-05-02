create table if not exists user_profiles (
  user_id text primary key,
  email text,
  interests text[] default '{}',
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists device_identities (
  device_id text primary key,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table if not exists user_device_links (
  user_id text not null,
  device_id text not null,
  device_name text,
  is_enabled boolean default true,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  primary key (user_id, device_id)
);

create table if not exists project_quotes (
  id bigserial primary key,
  user_id text not null,
  email text,
  kind text not null check (kind in ('website','app','software')),
  classification text not null check (classification in ('basic','custom')),
  quoted_total_cents integer,
  deposit_cents integer not null,
  monthly_cents integer,
  intake_json jsonb not null default '{}'::jsonb,
  headline text,
  summary text,
  status text default 'pending',
  stripe_checkout_session_id text,
  created_at timestamptz default now()
);

create index if not exists idx_project_quotes_user_id on project_quotes(user_id, created_at desc);
