-- CraterClaim V1 schema. Run in the Supabase SQL editor or via CLI migration.
-- Public reads of active plots. Authenticated users reserve and finish their own claims.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.lunar_features (
  id text primary key,
  name text not null,
  type text,
  center_lat double precision,
  center_lng double precision,
  radius_deg double precision,
  is_premium boolean not null default false
);

create table if not exists public.plots (
  id text primary key,
  owner_id uuid references public.profiles(id),
  x integer not null,
  y integer not null,
  width integer not null,
  height integer not null,
  pixel_count integer not null,
  center_latitude double precision not null,
  center_longitude double precision not null,
  lunar_feature text not null,
  lunar_feature_id text references public.lunar_features(id),
  zone text not null check (zone in ('standard', 'premium')),
  status text not null default 'reserved'
    check (status in ('reserved', 'payment_pending', 'active', 'suspended', 'deleted')),
  quoted_price numeric(12, 2) not null,
  price_paid numeric(12, 2),
  claim_date timestamptz,
  reserved_until timestamptz,
  name text,
  description text,
  website_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plots_status_idx on public.plots (status);
create index if not exists plots_owner_idx on public.plots (owner_id);
create index if not exists plots_xy_idx on public.plots (x, y);

create table if not exists public.plot_events (
  id bigserial primary key,
  plot_id text references public.plots(id) on delete cascade,
  event_type text not null,
  actor_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.plot_events enable row level security;
alter table public.lunar_features enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Lunar features are public"
  on public.lunar_features for select
  using (true);

create policy "Active plots are public"
  on public.plots for select
  using (status = 'active' or owner_id = auth.uid());

create policy "Users insert their own reservations"
  on public.plots for insert
  with check (auth.uid() = owner_id);

create policy "Users update own open claims"
  on public.plots for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users read own plot events"
  on public.plot_events for select
  using (actor_id = auth.uid());
