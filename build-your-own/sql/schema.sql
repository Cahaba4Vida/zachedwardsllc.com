
create table if not exists public.sites (
  id text primary key,
  owner_id text not null,
  site_name text not null,
  site_kind text not null default 'website',
  template_id text,
  site_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_owner_id_idx on public.sites(owner_id);
create index if not exists sites_updated_at_idx on public.sites(updated_at desc);


create table if not exists public.builder_orders (
  id text primary key,
  site_id text,
  owner_id text,
  site_name text not null,
  customer_name text,
  customer_email text,
  business_name text,
  host_preference text,
  wants_domain boolean not null default false,
  requested_domain text,
  gallery_opt_in boolean not null default false,
  gallery_note text,
  customer_built_note boolean not null default true,
  preview_slug text,
  quoted_now_cents integer not null default 0,
  estimated_domain_cents integer not null default 0,
  feature_flags jsonb not null default '{}'::jsonb,
  additional_features text,
  terms_accepted boolean not null default false,
  status text not null default 'pending',
  stripe_session_id text,
  quote_json jsonb not null default '{}'::jsonb,
  intake_json jsonb not null default '{}'::jsonb,
  site_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists builder_orders_owner_id_idx on public.builder_orders(owner_id);
create index if not exists builder_orders_status_idx on public.builder_orders(status);
create index if not exists builder_orders_preview_slug_idx on public.builder_orders(preview_slug);

create table if not exists public.builder_gallery_projects (
  id text primary key,
  order_id text references public.builder_orders(id) on delete cascade,
  preview_slug text unique not null,
  site_name text not null,
  business_name text,
  gallery_note text,
  customer_built_note boolean not null default true,
  preview_enabled boolean not null default true,
  quote_json jsonb not null default '{}'::jsonb,
  site_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
