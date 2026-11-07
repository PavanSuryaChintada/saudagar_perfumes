-- 0003 Capture an optional birthday at signup (used by birthday coupons). A valid date is stored and locked;
-- anything unparseable or out of range is ignored so signup never fails because of it.

create or replace function public.safe_birthday(input text)
returns date language plpgsql immutable set search_path = '' as $$
declare d date;
begin
  if input is null or input !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  begin
    d := input::date;
  exception when others then
    return null;
  end;
  if d < date '1900-01-01' or d > current_date then return null; end if;
  return d;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare dob date := public.safe_birthday(new.raw_user_meta_data ->> 'date_of_birth');
begin
  insert into public.profiles (id, email, full_name, phone, date_of_birth, dob_locked)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    public.normalize_indian_phone(new.raw_user_meta_data ->> 'phone'),
    dob,
    dob is not null
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end $$;
