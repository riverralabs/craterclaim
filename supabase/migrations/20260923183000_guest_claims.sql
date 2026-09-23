-- Guest checkout. Secrets live on plots but are not readable with the public API key.
-- Buyers prove a reservation with claim_token_hash and edit a landing with edit_token_hash.

alter table public.plots
  add column if not exists buyer_email text,
  add column if not exists visitor_id text,
  add column if not exists claim_token_hash text,
  add column if not exists edit_token_hash text;

create index if not exists plots_visitor_hold_idx
  on public.plots (visitor_id)
  where status in ('reserved', 'payment_pending');

create index if not exists plots_buyer_email_idx
  on public.plots (buyer_email)
  where status = 'active';

create index if not exists plots_edit_token_idx
  on public.plots (edit_token_hash);

create table if not exists public.rate_events (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_events_bucket_idx
  on public.rate_events (bucket, created_at desc);

alter table public.rate_events enable row level security;

revoke all on table public.rate_events from anon, authenticated;
revoke all on table public.rate_events from public;
grant all on table public.rate_events to service_role;
grant usage, select on sequence public.rate_events_id_seq to service_role;

revoke select on table public.plots from anon, authenticated;
grant select (
  id,
  x,
  y,
  width,
  height,
  pixel_count,
  center_latitude,
  center_longitude,
  lunar_feature,
  zone,
  status,
  quoted_price,
  price_paid,
  claim_date,
  reserved_until,
  name,
  description,
  website_url,
  social_handle,
  logo_url,
  created_at
) on table public.plots to anon, authenticated;
