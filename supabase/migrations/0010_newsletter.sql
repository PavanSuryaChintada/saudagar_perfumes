-- 0010 Newsletter sign-ups from the footer (and the newsletter section). Write-only for visitors.
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists newsletter_signups_email_ci on public.newsletter_signups (lower(email));
alter table public.newsletter_signups enable row level security;
drop policy if exists newsletter_admin on public.newsletter_signups;
create policy newsletter_admin on public.newsletter_signups for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, update, delete on public.newsletter_signups to authenticated;

create or replace function public.subscribe_newsletter(p_email text, p_source text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(e) > 254 then
    raise exception 'EMAIL_INVALID: Enter a valid email address.';
  end if;
  insert into public.newsletter_signups (email, source) values (e, left(p_source, 40))
  on conflict ((lower(email))) do nothing;
end $$;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;
