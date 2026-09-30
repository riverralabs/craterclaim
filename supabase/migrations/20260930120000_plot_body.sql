-- Separate Moon and Mars claims. Existing rows stay on the Moon.

alter table public.plots
  add column if not exists body text not null default 'moon';

alter table public.plots
  drop constraint if exists plots_body_check;

alter table public.plots
  add constraint plots_body_check check (body in ('moon', 'mars'));

create index if not exists plots_body_status_idx on public.plots (body, status);

grant select (body) on table public.plots to anon, authenticated;
