-- Avatars and vehicle photos: stored as bucket paths, not full URLs.
-- The migration's URL -> path rewrite strips host and ?query for Supabase
-- storage URLs of the named bucket, leaves external URLs (Google avatars)
-- and bare paths alone, and queues no webhooks. Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/image_paths.sql
begin;

do $$
declare
  u uuid[]; v uuid; vs uuid[]; vis uuid[];
  inputs text[]; expected text[];
  q_before bigint; got text; i int;
begin
  select array_agg(id order by created_at) into u from auth.users;
  if coalesce(array_length(u, 1), 0) < 4 then raise exception 'setup: need four auth users in seed'; end if;

  -- a) no stored value is a Supabase public storage URL any more
  if exists (select 1 from public.profiles where avatar_url ~ '/storage/v1/object/public/') then
    raise exception 'a: profiles.avatar_url still holds storage URLs'; end if;
  if exists (select 1 from public.vehicles where main_image_url ~ '/storage/v1/object/public/') then
    raise exception 'a: vehicles.main_image_url still holds storage URLs'; end if;
  if exists (select 1 from public.vehicle_images where image_url ~ '/storage/v1/object/public/') then
    raise exception 'a: vehicle_images.image_url still holds storage URLs'; end if;

  -- b) setup: one row per case in each column
  --   1 local URL, 2 emulator URL with ?t=1, 3 Google avatar, 4 bare path
  -- profiles
  inputs := array[
    'http://127.0.0.1:54321/storage/v1/object/public/profile-avatars/' || u[1] || '/a.jpg',
    'http://10.0.2.2:54321/storage/v1/object/public/profile-avatars/' || u[2] || '/b.jpg?t=1',
    'https://lh3.googleusercontent.com/a/ACg8ocK-test=s96-c',
    u[4] || '/d.jpg'];
  expected := array[u[1] || '/a.jpg', u[2] || '/b.jpg', inputs[3], inputs[4]];
  for i in 1..4 loop
    update public.profiles set avatar_url = inputs[i] where id = u[i];
  end loop;

  -- vehicles + vehicle_images (same inputs, vehicle-images bucket)
  inputs := array[
    'http://127.0.0.1:54321/storage/v1/object/public/vehicle-images/' || u[1] || '/v1.jpg',
    'http://10.0.2.2:54321/storage/v1/object/public/vehicle-images/' || u[1] || '/v2.jpg?t=1',
    'https://lh3.googleusercontent.com/a/ACg8ocK-test=s96-c',
    u[1] || '/v4.jpg'];
  for i in 1..4 loop
    insert into public.vehicles (user_id, make, model, year, license_plate, main_image_url)
    values (u[1], 'Test', 'ImgPath' || i, 2020, 'TSTIMG' || i, inputs[i]) returning id into v;
    vs := vs || v;
    insert into public.vehicle_images (vehicle_id, image_url, uploaded_by)
    values (v, inputs[i], u[1]) returning id into v;
    vis := vis || v;
  end loop;

  -- b/c) the migration's UPDATEs. COPY of supabase/migrations/20261018000000_image_paths.sql;
  -- keep the regexes in sync with it.
  select count(*) into q_before from net.http_request_queue;

  UPDATE public.profiles
     SET avatar_url = regexp_replace(split_part(avatar_url, '?', 1),
           '^https?://[^/]+/storage/v1/object/public/profile-avatars/', '')
   WHERE avatar_url ~ '^https?://[^/]+/storage/v1/object/public/profile-avatars/';

  UPDATE public.vehicles
     SET main_image_url = regexp_replace(split_part(main_image_url, '?', 1),
           '^https?://[^/]+/storage/v1/object/public/vehicle-images/', '')
   WHERE main_image_url ~ '^https?://[^/]+/storage/v1/object/public/vehicle-images/';

  UPDATE public.vehicle_images
     SET image_url = regexp_replace(split_part(image_url, '?', 1),
           '^https?://[^/]+/storage/v1/object/public/vehicle-images/', '')
   WHERE image_url ~ '^https?://[^/]+/storage/v1/object/public/vehicle-images/';

  -- b) Supabase URLs become the exact path; Google URL and bare path unchanged
  for i in 1..4 loop
    select avatar_url into got from public.profiles where id = u[i];
    if got is distinct from expected[i] then
      raise exception 'b: profiles case %: expected %, got %', i, expected[i], got; end if;
  end loop;

  expected := array[u[1] || '/v1.jpg', u[1] || '/v2.jpg', inputs[3], inputs[4]];
  for i in 1..4 loop
    select main_image_url into got from public.vehicles where id = vs[i];
    if got is distinct from expected[i] then
      raise exception 'b: vehicles case %: expected %, got %', i, expected[i], got; end if;
    select image_url into got from public.vehicle_images where id = vis[i];
    if got is distinct from expected[i] then
      raise exception 'b: vehicle_images case %: expected %, got %', i, expected[i], got; end if;
  end loop;

  -- c) the rewrite queues no webhook
  if (select count(*) from net.http_request_queue) <> q_before then
    raise exception 'c: rewrite queued a webhook'; end if;

  raise notice 'image_paths: all checks passed';
end $$;

rollback;
