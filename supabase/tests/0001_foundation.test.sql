-- Foundation: signup trigger, profile guard, single default address, RLS on settings/profiles.
-- Runs inside BEGIN … ROLLBACK (scripts/db-test.mjs). Any raised exception fails the file.

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'cust1@test.local', '{"full_name":"Test Customer","phone":"+91 98765 43210"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'cust2@test.local', '{"full_name":"Other Person","phone":"12345"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.local', '{"full_name":"Admin"}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000ad', 'admin');

do $$ begin
  assert (select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = '9876543210',
    'signup trigger should normalise +91 phone to 10 digits';
  assert (select phone from public.profiles where id = '00000000-0000-0000-0000-0000000000a2') is null,
    'invalid phone should be stored as null';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Test Customer',
    'full name copied from metadata';
  assert (select email from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'cust1@test.local',
    'email copied';
  assert exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a1' and role = 'customer'),
    'customer role granted on signup';
end $$;

-- ===== act as customer 1 =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$ begin
  assert not public.is_admin(), 'customer is not admin';
  assert (select count(*) from public.profiles) = 1, 'customer sees only their own profile';
end $$;

update public.profiles set date_of_birth = '1995-04-12' where id = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  assert (select dob_locked from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
    'setting DOB locks it';
end $$;

do $$ begin
  begin
    update public.profiles set date_of_birth = '1996-01-01' where id = '00000000-0000-0000-0000-0000000000a1';
    raise exception 'TEST_FAIL: second DOB change should be refused';
  exception when others then
    if sqlerrm not like 'DOB_LOCKED%' then
      raise exception 'expected DOB_LOCKED, got: %', sqlerrm;
    end if;
  end;
end $$;

update public.profiles set email = 'hacker@x.com', dob_locked = false, full_name = 'Renamed'
  where id = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  assert (select email from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'cust1@test.local',
    'customer cannot change email';
  assert (select dob_locked from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
    'customer cannot unlock DOB';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = 'Renamed',
    'customer can change their name';
end $$;

-- addresses: first is default; a new default clears others; deleting the default promotes another
insert into public.addresses (label, full_name, phone, line1, city, state, pincode)
  values ('Home', 'Test Customer', '9876543210', '1 MG Road', 'Bengaluru', 'Karnataka', '560001');
do $$ begin
  assert (select count(*) from public.addresses where is_default) = 1, 'first address becomes default';
end $$;
insert into public.addresses (label, full_name, phone, line1, city, state, pincode, is_default)
  values ('Work', 'Test Customer', '9876543210', '2 Brigade Road', 'Bengaluru', 'Karnataka', '560025', true);
do $$ begin
  assert (select count(*) from public.addresses where is_default) = 1, 'exactly one default after second default';
  assert (select label from public.addresses where is_default) = 'Work', 'newest default wins';
end $$;
delete from public.addresses where label = 'Work';
do $$ begin
  assert (select label from public.addresses where is_default) = 'Home', 'deleting the default promotes the remaining address';
end $$;
do $$ begin
  begin
    insert into public.addresses (label, full_name, phone, line1, city, state, pincode)
      values ('Other', 'X', '9876543210', 'x', 'x', 'x', '012345');
    raise exception 'TEST_FAIL: bad pincode accepted';
  exception when check_violation then null;
  end;
end $$;

do $$ declare n int; begin
  update public.settings set value = '0'::jsonb where key = 'shipping.fee';
  get diagnostics n = row_count;
  assert n = 0, 'customer cannot update settings';
  assert not exists (select 1 from public.settings where not is_public), 'customer cannot read private settings';
end $$;

-- ===== act as anon =====
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  assert exists (select 1 from public.settings where key = 'shipping.fee'), 'anon reads public settings';
  assert not exists (select 1 from public.settings where not is_public), 'anon cannot read private settings';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
  assert (public.site_bootstrap() -> 'settings' ->> 'shipping.fee')::int = 250, 'bootstrap exposes public settings';
  assert (public.site_bootstrap() -> 'settings' -> 'orders.prefix') is null, 'bootstrap hides private settings';
end $$;

-- ===== act as admin =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);
do $$ declare n int; begin
  assert public.is_admin(), 'admin is admin';
  update public.settings set value = '300'::jsonb where key = 'shipping.fee';
  get diagnostics n = row_count;
  assert n = 1, 'admin can update settings';
  assert (select count(*) from public.profiles) >= 3, 'admin sees all profiles';
  update public.profiles set date_of_birth = '1990-01-01' where id = '00000000-0000-0000-0000-0000000000a1';
  assert (select date_of_birth from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') = '1990-01-01',
    'admin can correct a locked DOB';
end $$;
reset role;

-- birthday captured at signup is stored and locked
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-0000000000a3', 'bday@test.local', '{"full_name":"Bday","date_of_birth":"1992-08-15"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'badbday@test.local', '{"full_name":"Bad","date_of_birth":"not-a-date"}', 'authenticated', 'authenticated');
do $$ begin
  assert (select date_of_birth from public.profiles where id = '00000000-0000-0000-0000-0000000000a3') = '1992-08-15',
    'signup birthday stored';
  assert (select dob_locked from public.profiles where id = '00000000-0000-0000-0000-0000000000a3'), 'signup birthday locked';
  assert (select date_of_birth from public.profiles where id = '00000000-0000-0000-0000-0000000000a4') is null,
    'invalid signup birthday ignored, signup still succeeds';
end $$;
