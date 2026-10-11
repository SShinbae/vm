-- Only the current owner can transfer, only to an existing member; the new
-- owner gets an in-app notification. Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/group_transfer.sql
begin;

do $$
declare
  a uuid; b uuid; c uuid; g uuid; ok boolean;
begin
  select id into a from auth.users order by created_at limit 1;
  select id into b from auth.users where id <> a order by created_at limit 1;
  select id into c from auth.users where id not in (a, b) order by created_at limit 1;

  insert into public.groups (name, owner_id) values ('Transfer Test', a) returning id into g;
  insert into public.group_members (group_id, user_id) values (g, a), (g, b);

  -- non-owner b cannot transfer
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  ok := true;
  begin perform public.transfer_group_ownership(g, b); exception when others then ok := false; end;
  if ok then raise exception 'non-owner transfer: expected error'; end if;

  -- owner a cannot transfer to non-member c
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  if c is not null then
    ok := true;
    begin perform public.transfer_group_ownership(g, c); exception when others then ok := false; end;
    if ok then raise exception 'transfer to non-member: expected error'; end if;
  end if;
  if (select owner_id from public.groups where id = g) <> a then
    raise exception 'failed transfers changed owner_id'; end if;

  -- owner a transfers to member b
  perform public.transfer_group_ownership(g, b);
  if (select owner_id from public.groups where id = g) <> b then
    raise exception 'transfer: owner_id not updated'; end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = a) then
    raise exception 'transfer: old owner lost membership'; end if;
  if not exists (select 1 from public.notifications
                 where user_id = b and related_group_id = g and notification_type = 'group_member') then
    raise exception 'transfer: new owner not notified'; end if;

  -- service_role path (purge job): no auth.uid(); explicit from/to
  perform set_config('request.jwt.claims', '', true);
  perform public.transfer_group_ownership_admin(g, b, a);
  if (select owner_id from public.groups where id = g) <> a then
    raise exception 'admin transfer: owner_id not updated'; end if;

  -- admin path still refuses a stale "from" (already not the owner)
  ok := true;
  begin perform public.transfer_group_ownership_admin(g, b, a); exception when others then ok := false; end;
  if ok then raise exception 'admin transfer from non-owner: expected error'; end if;

  -- owner cannot "transfer" to themselves
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  ok := true;
  begin perform public.transfer_group_ownership(g, a); exception when others then ok := false; end;
  if ok then raise exception 'self transfer: expected error'; end if;

  -- the admin function is not callable by app users
  if has_function_privilege('authenticated', 'public.transfer_group_ownership_admin(uuid, uuid, uuid)', 'execute') then
    raise exception 'admin transfer: authenticated must not have execute'; end if;

  raise notice 'group_transfer: all checks passed';
end $$;

rollback;
