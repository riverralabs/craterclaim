-- Lock geometry, price, and payment fields so the public anon key cannot
-- cheapen or enlarge a reservation. Service role (the app) can still write.

create or replace function public.protect_plot_economics()
returns trigger
language plpgsql
as $$
begin
  if current_setting('role', true) in ('service_role', 'postgres') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('reserved', 'payment_pending') then
      raise exception 'cannot insert a settled plot';
    end if;
    return new;
  end if;

  if new.x is distinct from old.x
    or new.y is distinct from old.y
    or new.width is distinct from old.width
    or new.height is distinct from old.height
    or new.pixel_count is distinct from old.pixel_count
    or new.quoted_price is distinct from old.quoted_price
    or new.zone is distinct from old.zone
    or new.center_latitude is distinct from old.center_latitude
    or new.center_longitude is distinct from old.center_longitude
    or new.owner_id is distinct from old.owner_id
    or new.price_paid is distinct from old.price_paid
    or new.payment_id is distinct from old.payment_id
    or new.payment_provider is distinct from old.payment_provider
    or new.status not in ('reserved', 'payment_pending')
  then
    raise exception 'cannot change locked plot fields';
  end if;

  return new;
end;
$$;

drop trigger if exists plots_protect_economics on public.plots;
create trigger plots_protect_economics
  before insert or update on public.plots
  for each row execute function public.protect_plot_economics();

revoke all on function public.expire_stale_plots() from public;
revoke execute on function public.expire_stale_plots() from anon, authenticated;
grant execute on function public.expire_stale_plots() to service_role;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable' and p.pronargs = 0
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated';
  end if;
end $$;
