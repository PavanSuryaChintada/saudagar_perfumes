-- Newsletter: anyone can subscribe once per email; nobody but admins can read the list.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  perform public.subscribe_newsletter('  Tst.Reader@Example.com ', 'footer');
  perform public.subscribe_newsletter('tst.reader@example.com', 'footer');
  begin
    perform public.subscribe_newsletter('not-an-email', 'footer');
    raise exception 'TEST_FAIL: junk email accepted';
  exception when others then
    if sqlerrm not like 'EMAIL_INVALID%' then raise exception 'expected EMAIL_INVALID, got %', sqlerrm; end if;
  end;
  assert (select count(*) from public.newsletter_signups) = 0, 'anon cannot read the list';
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.newsletter_signups where email = 'tst.reader@example.com') = 1, 'stored once, normalised';
end $$;
