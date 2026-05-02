alter table project_quotes add column if not exists quoted_total_cents integer;
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz default now()
);

alter table project_quotes add column if not exists terms_version text;
alter table project_quotes add column if not exists terms_accepted_at timestamptz;
alter table project_quotes add column if not exists deposit_paid_at timestamptz;
alter table project_quotes add column if not exists stripe_payment_status text;

create table if not exists client_projects (
  id bigserial primary key,
  quote_id bigint not null unique references project_quotes(id) on delete cascade,
  user_id text not null,
  email text,
  kind text not null check (kind in ('website','app','software')),
  classification text not null check (classification in ('basic','custom')),
  project_name text,
  status text not null default 'deposit_paid',
  deposit_paid boolean default false,
  quoted_total_cents integer,
  maintenance_cents integer,
  setup_completed boolean default false,
  client_approved boolean default false,
  stripe_checkout_session_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_projects_user_id on client_projects(user_id, created_at desc);

create table if not exists project_setup_submissions (
  id bigserial primary key,
  project_id bigint not null unique references client_projects(id) on delete cascade,
  user_id text not null,
  answers_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
