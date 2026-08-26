create or replace function public.expire_stale_plots()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.plots
  where status in ('reserved', 'payment_pending')
    and reserved_until is not null
    and reserved_until < now();
end;
$$;

revoke all on function public.expire_stale_plots() from public;
grant execute on function public.expire_stale_plots() to anon, authenticated, service_role;
