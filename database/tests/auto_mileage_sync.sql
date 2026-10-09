-- Checks that each day's auto mileage log (source = 'fuel_log') mirrors that
-- day's fuel logs: max remaining reading, removed when the day has none, and
-- manual logs never touched. Runs in a rolled-back transaction.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/auto_mileage_sync.sql
begin;

do $$
declare
  u uuid := (select id from auth.users order by created_at limit 1);
  v uuid;
  f1 uuid;
  f2 uuid;
  got integer;
  n integer;
  d1 date := date '2030-01-10';
  d2 date := date '2030-01-11';
begin
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (u, 'Test', 'AutoSync', 2020, 'TST0003') returning id into v;

  -- add fuel: auto log created at the reading
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (v, u, d1, 1000, 10) returning id into f1;
  select odometer_reading into got from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if got is distinct from 1000 then raise exception 'create: expected 1000, got %', got; end if;

  -- add higher: raised
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (v, u, d1, 1200, 10) returning id into f2;
  select odometer_reading into got from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if got is distinct from 1200 then raise exception 'raise: expected 1200, got %', got; end if;
  select count(*) into n from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if n <> 1 then raise exception 'one per day: expected 1 auto log, got %', n; end if;

  -- delete the highest: drops to the next
  delete from public.fuel_logs where id = f2;
  select odometer_reading into got from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if got is distinct from 1000 then raise exception 'drop: expected 1000, got %', got; end if;

  -- move the remaining fuel log to another date: old day removed, new day created
  update public.fuel_logs set date = d2 where id = f1;
  select count(*) into n from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if n <> 0 then raise exception 'move (old day): expected 0 auto logs, got %', n; end if;
  select odometer_reading into got from public.mileage_logs where vehicle_id = v and date = d2 and source = 'fuel_log';
  if got is distinct from 1000 then raise exception 'move (new day): expected 1000, got %', got; end if;

  -- delete all fuel that day: auto log removed, vehicle mileage follows
  delete from public.fuel_logs where id = f1;
  select count(*) into n from public.mileage_logs where vehicle_id = v and source = 'fuel_log';
  if n <> 0 then raise exception 'delete all: expected 0 auto logs, got %', n; end if;
  select current_mileage into got from public.vehicles where id = v;
  if got is not null then raise exception 'delete all: expected NULL mileage, got %', got; end if;

  -- manual log that day: never touched, no auto log created beside it
  insert into public.mileage_logs (vehicle_id, user_id, date, odometer_reading, notes)
  values (v, u, d1, 500, 'manual');
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (v, u, d1, 1500, 10);
  select odometer_reading into got from public.mileage_logs where vehicle_id = v and date = d1 and source = 'manual';
  if got is distinct from 500 then raise exception 'manual: expected untouched 500, got %', got; end if;
  select count(*) into n from public.mileage_logs where vehicle_id = v and date = d1 and source = 'fuel_log';
  if n <> 0 then raise exception 'manual: expected no auto log beside it, got %', n; end if;

  raise notice 'auto_mileage_sync: all checks passed';
end $$;

rollback;
