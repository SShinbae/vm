-- Receipts: stored as bucket paths, bucket private, readable by anyone who
-- can see the service log (owner + group members), plus the uploader's own
-- folder for previews. The URL -> path normalization queues no webhooks and
-- writes no change-actor rows. Runs as the authenticated role. Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/private_receipts.sql
begin;

do $$
declare
  a uuid; b uuid; c uuid;          -- owner, group member, non-member
  v uuid; g uuid; l uuid; l2 uuid;
  ra text; rb text; ro text;       -- A's attached, B's attached, A's orphan
  q_before bigint; act_before bigint; n int;
begin
  select id into a from auth.users order by created_at limit 1;
  select id into b from auth.users where id <> a order by created_at limit 1;
  select id into c from auth.users where id not in (a, b) order by created_at limit 1;
  if c is null then raise exception 'setup: need three auth users in seed'; end if;

  ra := a || '/priv_test_a.jpg';
  rb := b || '/priv_test_b.jpg';
  ro := a || '/priv_test_orphan.jpg';

  -- a) no stored value is a full URL any more
  if exists (select 1 from public.service_logs where receipt_image_url ~ '^https?://') then
    raise exception 'a: service_logs still holds full receipt URLs'; end if;

  -- setup as postgres
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (a, 'Test', 'Receipt', 2020, 'TSTRCPT') returning id into v;
  insert into public.groups (name, owner_id) values ('Receipt Test', a) returning id into g;
  insert into public.group_members (group_id, user_id) values (g, a), (g, b);
  insert into public.vehicle_group_shares (vehicle_id, group_id, shared_by) values (v, g, a);

  insert into public.service_logs (vehicle_id, user_id, date, service_type, description, odometer_reading, receipt_image_url)
  values (v, a, date '2030-05-01', 'oil_change', 'receipt a', 1000,
          'http://127.0.0.1:54321/storage/v1/object/public/receipt-images/' || ra)
  returning id into l;
  insert into public.service_logs (vehicle_id, user_id, date, service_type, description, odometer_reading, receipt_image_url)
  values (v, b, date '2030-05-02', 'oil_change', 'receipt b', 1100,
          'https://x.supabase.co/storage/v1/object/sign/receipt-images/' || rb || '?token=abc.def')
  returning id into l2;

  -- a/b) the migration's normalization, under the same bulk_purge flag
  select count(*) into q_before from net.http_request_queue;
  select count(*) into act_before from public.log_change_actors;
  perform set_config('app.bulk_purge', 'on', true);
  update public.service_logs
     set receipt_image_url = regexp_replace(
           split_part(receipt_image_url, '?', 1),
           '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/receipt-images/',
           '')
   where receipt_image_url ~ '^https?://' and id in (l, l2);
  perform set_config('app.bulk_purge', 'off', true);

  if (select receipt_image_url from public.service_logs where id = l) is distinct from ra then
    raise exception 'a: public URL normalized to %', (select receipt_image_url from public.service_logs where id = l); end if;
  if (select receipt_image_url from public.service_logs where id = l2) is distinct from rb then
    raise exception 'a: signed URL normalized to %', (select receipt_image_url from public.service_logs where id = l2); end if;
  if (select count(*) from net.http_request_queue) <> q_before then
    raise exception 'b: normalization queued a webhook'; end if;
  if (select count(*) from public.log_change_actors) <> act_before then
    raise exception 'b: normalization wrote a change-actor row'; end if;

  -- c) bucket is private
  if (select public from storage.buckets where id = 'receipt-images') then
    raise exception 'c: receipt-images bucket is public'; end if;

  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('receipt-images', ra, a, a::text),
         ('receipt-images', rb, b, b::text),
         ('receipt-images', ro, a, a::text);

  set local role authenticated;

  -- ===== as member b =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  -- d) member reads the owner's receipt on a shared vehicle
  select count(*) into n from storage.objects where bucket_id = 'receipt-images' and name = ra;
  if n <> 1 then raise exception 'd: member sees owner receipt: expected 1, got %', n; end if;
  -- g) ...but not an unattached object in the owner's folder
  select count(*) into n from storage.objects where bucket_id = 'receipt-images' and name = ro;
  if n <> 0 then raise exception 'g: member sees unattached owner object: expected 0, got %', n; end if;

  -- ===== as owner a =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  -- e) owner reads the member's receipt (member's folder) on their vehicle
  select count(*) into n from storage.objects where bucket_id = 'receipt-images' and name = rb;
  if n <> 1 then raise exception 'e: owner sees member receipt: expected 1, got %', n; end if;
  -- h) uploader still sees their own unattached receipt (preview)
  select count(*) into n from storage.objects where bucket_id = 'receipt-images' and name = ro;
  if n <> 1 then raise exception 'h: uploader sees own unattached receipt: expected 1, got %', n; end if;

  -- ===== as non-member c =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  -- f) non-member gets nothing, even knowing the paths
  select count(*) into n from storage.objects where bucket_id = 'receipt-images' and name in (ra, rb, ro);
  if n <> 0 then raise exception 'f: non-member sees receipts: expected 0, got %', n; end if;

  reset role;
  raise notice 'private_receipts: all checks passed';
end $$;

rollback;
