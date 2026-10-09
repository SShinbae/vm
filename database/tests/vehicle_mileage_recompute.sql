-- Checks that vehicles.current_mileage always equals the highest odometer
-- reading across fuel, mileage and service logs. Runs in a transaction that is
-- rolled back. Raises an exception on the first failure.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/vehicle_mileage_recompute.sql
begin;

do $$
declare
  v_owner uuid := (select id from auth.users order by created_at limit 1);
  v1 uuid;
  v2 uuid;
  f1 uuid;
  f2 uuid;
  m1 uuid;
  got integer;
begin
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (v_owner, 'Test', 'MileageA', 2020, 'TST0001') returning id into v1;
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (v_owner, 'Test', 'MileageB', 2020, 'TST0002') returning id into v2;

  -- add: goes up
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (v1, v_owner, current_date, 1000, 10) returning id into f1;
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (v1, v_owner, current_date, 2000, 10) returning id into f2;
  insert into public.mileage_logs (vehicle_id, user_id, date, odometer_reading)
  values (v1, v_owner, current_date, 1500) returning id into m1;
  select current_mileage into got from public.vehicles where id = v1;
  if got is distinct from 2000 then raise exception 'add: expected 2000, got %', got; end if;

  -- delete the highest: drops to next highest
  delete from public.fuel_logs where id = f2;
  select current_mileage into got from public.vehicles where id = v1;
  if got is distinct from 1500 then raise exception 'delete highest: expected 1500, got %', got; end if;

  -- edit downwards: drops
  update public.mileage_logs set odometer_reading = 900 where id = m1;
  select current_mileage into got from public.vehicles where id = v1;
  if got is distinct from 1000 then raise exception 'edit down: expected 1000, got %', got; end if;

  -- move a log to another vehicle: both correct
  update public.fuel_logs set vehicle_id = v2 where id = f1;
  select current_mileage into got from public.vehicles where id = v1;
  if got is distinct from 900 then raise exception 'move (old vehicle): expected 900, got %', got; end if;
  select current_mileage into got from public.vehicles where id = v2;
  if got is distinct from 1000 then raise exception 'move (new vehicle): expected 1000, got %', got; end if;

  -- delete all: NULL
  delete from public.mileage_logs where id = m1;
  select current_mileage into got from public.vehicles where id = v1;
  if got is not null then raise exception 'delete all: expected NULL, got %', got; end if;

  raise notice 'vehicle_mileage_recompute: all checks passed';
end $$;

rollback;
