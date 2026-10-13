-- Each log insert/update/delete records who did it; purges record nothing;
-- app roles cannot read the table. Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/log_change_actors.sql
begin;

do $$
declare
  a uuid; b uuid; v uuid; l uuid; got uuid; n int;
begin
  select id into a from auth.users order by created_at limit 1;
  select id into b from auth.users where id <> a order by created_at limit 1;

  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (a, 'Test', 'Actor', 2020, 'TSTACT') returning id into v;

  -- insert as a
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.mileage_logs (vehicle_id, user_id, date, odometer_reading)
  values (v, a, date '2030-06-01', 100) returning id into l;
  select actor into got from public.log_change_actors
  where table_name = 'mileage_logs' and row_id = l and op = 'INSERT' order by created_at desc limit 1;
  if got is distinct from a then raise exception 'insert: expected actor a, got %', got; end if;

  -- update as b (not the creator)
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  update public.mileage_logs set odometer_reading = 150 where id = l;
  select actor into got from public.log_change_actors
  where table_name = 'mileage_logs' and row_id = l and op = 'UPDATE' order by created_at desc limit 1;
  if got is distinct from b then raise exception 'update: expected actor b, got %', got; end if;

  -- delete as b: row is gone but the actor is recorded against its id
  delete from public.mileage_logs where id = l;
  select actor into got from public.log_change_actors
  where table_name = 'mileage_logs' and row_id = l and op = 'DELETE' order by created_at desc limit 1;
  if got is distinct from b then raise exception 'delete: expected actor b, got %', got; end if;

  -- purge transactions record nothing
  perform set_config('app.bulk_purge', 'on', true);
  select count(*) into n from public.log_change_actors;
  insert into public.mileage_logs (vehicle_id, user_id, date, odometer_reading)
  values (v, a, date '2030-06-02', 200);
  if (select count(*) from public.log_change_actors) <> n then
    raise exception 'purge: actor row written'; end if;
  perform set_config('app.bulk_purge', 'off', true);

  -- app roles cannot read it: RLS on, no policies
  if exists (select 1 from pg_policies where tablename = 'log_change_actors') then
    raise exception 'log_change_actors must have no RLS policies'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.log_change_actors'::regclass) then
    raise exception 'RLS not enabled on log_change_actors'; end if;

  raise notice 'log_change_actors: all checks passed';
end $$;

rollback;
