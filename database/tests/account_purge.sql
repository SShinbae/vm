-- Purge removes a user's own vehicles and logs, anonymises their logs on
-- other users' vehicles, queues no webhooks during the purge, and lists
-- their storage objects. Runs in a rolled-back transaction.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/account_purge.sql
begin;

do $$
declare
  owner_u uuid;
  gone_u  uuid;
  own_v   uuid;
  other_v uuid;
  log_id  uuid;
  q_before bigint;
  q_after  bigint;
  n integer;
  m integer;
begin
  select id into owner_u from auth.users order by created_at limit 1;
  select id into gone_u  from auth.users where id <> owner_u order by created_at limit 1;
  if gone_u is null then raise exception 'setup: need two auth users in seed'; end if;

  -- gone_u owns a vehicle with a log; gone_u also logged on owner_u's vehicle
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (gone_u, 'Test', 'Gone', 2020, 'TSTGONE') returning id into own_v;
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (own_v, gone_u, date '2030-02-01', 100, 10);

  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (owner_u, 'Test', 'Keep', 2020, 'TSTKEEP') returning id into other_v;
  insert into public.service_logs (vehicle_id, user_id, date, service_type, description, odometer_reading)
  values (other_v, gone_u, date '2030-02-01', 'oil_change', 'purge test', 5000) returning id into log_id;

  select current_mileage into n from public.vehicles where id = other_v;

  -- not due (no date, or a future date): purge refuses, nothing deleted
  declare ok boolean;
  begin
    update public.profiles set deletion_scheduled_at = null where id = gone_u;
    ok := true;
    begin perform public.purge_account_data(gone_u); exception when others then ok := false; end;
    if ok then raise exception 'purge of a not-scheduled account: expected error'; end if;
    update public.profiles set deletion_scheduled_at = now() + interval '1 day' where id = gone_u;
    ok := true;
    begin perform public.purge_account_data(gone_u); exception when others then ok := false; end;
    if ok then raise exception 'purge of a future-dated account: expected error'; end if;
    if not exists (select 1 from public.vehicles where id = own_v) then
      raise exception 'refused purge still deleted data'; end if;
  end;

  update public.profiles set deletion_scheduled_at = now() - interval '1 minute' where id = gone_u;
  select count(*) into q_before from net.http_request_queue;
  perform public.purge_account_data(gone_u);
  select count(*) into q_after from net.http_request_queue;

  if exists (select 1 from public.vehicles where id = own_v) then
    raise exception 'own vehicle: expected deleted'; end if;
  if exists (select 1 from public.fuel_logs where vehicle_id = own_v) then
    raise exception 'own logs: expected deleted'; end if;
  if (select user_id from public.service_logs where id = log_id) is not null then
    raise exception 'other-vehicle log: expected user_id NULL'; end if;
  select current_mileage into m from public.vehicles where id = other_v;
  if m is distinct from n then
    raise exception 'other vehicle mileage changed: % -> %', n, m; end if;
  if q_after <> q_before then
    raise exception 'purge queued % webhook request(s)', q_after - q_before; end if;
  if exists (select 1 from public.group_members where user_id = gone_u) then
    raise exception 'memberships: expected deleted'; end if;

  -- anonymised fuel log still drives the auto mileage log (Review Focus 5)
  insert into public.fuel_logs (vehicle_id, user_id, date, odometer_reading, liters_filled)
  values (other_v, owner_u, date '2030-03-01', 6000, 10);
  update public.fuel_logs set user_id = null
  where vehicle_id = other_v and date = date '2030-03-01';
  if not exists (select 1 from public.mileage_logs
                 where vehicle_id = other_v and date = date '2030-03-01' and source = 'fuel_log') then
    raise exception 'auto mileage log missing for anonymised fuel log'; end if;

  -- normal traffic after the purge still fires webhooks (Review Focus 3)
  select count(*) into q_before from net.http_request_queue;
  insert into public.mileage_logs (vehicle_id, user_id, date, odometer_reading)
  values (other_v, owner_u, date '2030-04-01', 7000);
  select count(*) into q_after from net.http_request_queue;
  if q_after <= q_before then
    raise exception 'normal insert after purge queued no webhook'; end if;

  -- pending-deletion column exists and defaults to NULL
  if (select deletion_scheduled_at from public.profiles where id = owner_u) is not null then
    raise exception 'deletion_scheduled_at: expected NULL by default'; end if;

  -- storage helper lists the user's objects, except receipts still attached
  -- to a surviving (anonymised) log on someone else's vehicle
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('receipt-images', gone_u || '/kept_receipt.jpg', gone_u, gone_u::text),
         ('receipt-images', gone_u || '/orphan_receipt.jpg', gone_u, gone_u::text);
  update public.service_logs set receipt_image_url = gone_u || '/kept_receipt.jpg'
  where id = log_id;
  if exists (select 1 from public.account_storage_objects(gone_u)
             where name = gone_u || '/kept_receipt.jpg') then
    raise exception 'account_storage_objects: would delete a receipt a kept log still uses'; end if;
  if not exists (select 1 from public.account_storage_objects(gone_u)
                 where name = gone_u || '/orphan_receipt.jpg') then
    raise exception 'account_storage_objects: missed an unreferenced object'; end if;

  raise notice 'account_purge: all checks passed';
end $$;

rollback;
