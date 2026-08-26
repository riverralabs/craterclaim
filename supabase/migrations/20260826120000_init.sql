-- CraterClaim V1 schema. Public reads of active plots. Owners reserve their own claims.
-- Admins (profiles.is_admin) can moderate. Activation after payment uses the service role.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
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
  social_handle text,
  logo_url text,
  payment_provider text,
  payment_id text,
  moderation_notes text,
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

create or replace function public.protect_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
    if current_setting('role', true) not in ('service_role', 'postgres') then
      raise exception 'cannot change admin flag';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_admin_flag();

alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.plot_events enable row level security;
alter table public.lunar_features enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Lunar features are public" on public.lunar_features;
create policy "Lunar features are public"
  on public.lunar_features for select
  using (true);

drop policy if exists "Active plots are public" on public.plots;
create policy "Active plots are public"
  on public.plots for select
  using (
    status = 'active'
    or owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

drop policy if exists "Users insert their own reservations" on public.plots;
create policy "Users insert their own reservations"
  on public.plots for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and status in ('reserved', 'payment_pending')
  );

drop policy if exists "Users update own open claims" on public.plots;
create policy "Users update own open claims"
  on public.plots for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    and status in ('reserved', 'payment_pending')
  )
  with check (
    (select auth.uid()) = owner_id
    and status in ('reserved', 'payment_pending')
  );

drop policy if exists "Admins update plots" on public.plots;
create policy "Admins update plots"
  on public.plots for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

drop policy if exists "Users read own plot events" on public.plot_events;
create policy "Users read own plot events"
  on public.plot_events for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.lunar_features to anon, authenticated;
grant select on public.plots to anon, authenticated;
grant insert, update on public.plots to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.plot_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plot-logos',
  'plot-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "Public read plot logos" on storage.objects;
create policy "Public read plot logos"
  on storage.objects for select
  using (bucket_id = 'plot-logos');

drop policy if exists "Owners upload plot logos" on storage.objects;
create policy "Owners upload plot logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plot-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners update plot logos" on storage.objects;
create policy "Owners update plot logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'plot-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'plot-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
