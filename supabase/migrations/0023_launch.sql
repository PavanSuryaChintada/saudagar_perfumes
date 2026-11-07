-- 0023_launch: rate limits on the write paths the public can reach (orders, returns, reviews,
-- back-in-stock, newsletter), keyed by the signed-in user or the caller's IP, plus daily cleanup.

create table if not exists app_private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

-- Raises RATE_LIMITED when `p_key` has been used more than p_max times in the current window.
create or replace function app_private.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns void language plpgsql security definer set search_path = '' as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into app_private.rate_limits (key, window_start, hits) values (p_key, win, 1)
  on conflict (key, window_start) do update set hits = app_private.rate_limits.hits + 1
  returning hits into n;
  if n > p_max then
    raise exception 'RATE_LIMITED: Too many attempts. Please wait a few minutes and try again.';
  end if;
end $$;

-- Who is calling: the user id when signed in, else the first forwarded IP.
create or replace function app_private.caller_key()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    auth.uid()::text,
    'ip:' || nullif(split_part(coalesce((nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for'), ''), ',', 1), ''),
    'anon')
$$;

create or replace function app_private.rate_limit_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
declare max_hits int := tg_argv[0]::int; win int := tg_argv[1]::int;
begin
  -- Admins and internal jobs (no request) are never limited.
  if public.is_admin() or current_setting('request.headers', true) is null then
    return new;
  end if;
  perform app_private.check_rate_limit(tg_table_name || ':' || app_private.caller_key(), max_hits, win);
  return new;
end $$;

drop trigger if exists rate_limit on public.orders;
create trigger rate_limit before insert on public.orders for each row execute function app_private.rate_limit_trigger('10', '3600');
drop trigger if exists rate_limit on public.returns;
create trigger rate_limit before insert on public.returns for each row execute function app_private.rate_limit_trigger('5', '3600');
drop trigger if exists rate_limit on public.reviews;
create trigger rate_limit before insert on public.reviews for each row execute function app_private.rate_limit_trigger('10', '3600');
drop trigger if exists rate_limit on public.back_in_stock_requests;
create trigger rate_limit before insert on public.back_in_stock_requests for each row execute function app_private.rate_limit_trigger('20', '3600');
drop trigger if exists rate_limit on public.newsletter_signups;
create trigger rate_limit before insert on public.newsletter_signups for each row execute function app_private.rate_limit_trigger('5', '3600');
drop trigger if exists rate_limit on public.review_votes;
create trigger rate_limit before insert on public.review_votes for each row execute function app_private.rate_limit_trigger('60', '3600');

create or replace function app_private.cleanup_rate_limits()
returns void language sql security definer set search_path = '' as $$
  delete from app_private.rate_limits where window_start < now() - interval '2 days'
$$;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'cleanup-rate-limits';
    perform cron.schedule('cleanup-rate-limits', '40 3 * * *', 'select app_private.cleanup_rate_limits()');
  end if;
end $$;
