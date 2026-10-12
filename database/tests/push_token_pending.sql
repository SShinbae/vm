-- register_push_token does nothing while the caller's account is pending
-- deletion (signing back in must not restore push). Rolled back.
begin;

do $$
declare u uuid;
begin
  select id into u from auth.users order by created_at limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  delete from public.push_tokens where user_id = u;

  update public.profiles set deletion_scheduled_at = now() + interval '30 days' where id = u;
  perform public.register_push_token('ExponentPushToken[pending-test]', 'android');
  if exists (select 1 from public.push_tokens where token = 'ExponentPushToken[pending-test]') then
    raise exception 'pending account registered a push token'; end if;

  update public.profiles set deletion_scheduled_at = null where id = u;
  perform public.register_push_token('ExponentPushToken[pending-test]', 'android');
  if not exists (select 1 from public.push_tokens where token = 'ExponentPushToken[pending-test]' and user_id = u) then
    raise exception 'active account could not register a push token'; end if;

  raise notice 'push_token_pending: all checks passed';
end $$;

rollback;
