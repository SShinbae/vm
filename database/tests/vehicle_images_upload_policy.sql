-- Storage uploads to vehicle-images, profile-avatars and receipt-images only
-- land in the caller's own folder, or (vehicle-images) the owner's folder for a
-- vehicle shared with the caller. The loose "any folder" vehicle-images policy
-- is gone. Runs as the authenticated role with real storage.objects inserts.
-- Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/vehicle_images_upload_policy.sql
begin;

do $$
declare
  o uuid; m uuid; x uuid;      -- owner, member, non-member
  v uuid; v_priv uuid; g uuid; -- shared vehicle, unshared vehicle (owned by x), group
begin
  select id into o from auth.users order by created_at limit 1;
  select id into m from auth.users where id <> o order by created_at limit 1;
  select id into x from auth.users where id not in (o, m) order by created_at limit 1;
  if x is null then raise exception 'setup: need three auth users in seed'; end if;

  -- setup as postgres
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (o, 'Test', 'Upload', 2020, 'TSTUPL1') returning id into v;
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (x, 'Test', 'Private', 2020, 'TSTUPL2') returning id into v_priv;
  insert into public.groups (name, owner_id) values ('Upload Policy Test', o) returning id into g;
  insert into public.group_members (group_id, user_id) values (g, o), (g, m);
  insert into public.vehicle_group_shares (vehicle_id, group_id, shared_by) values (v, g, o);

  -- ===== as member m =====
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- a) member uploads into another user's folder for a vehicle not shared with them
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('vehicle-images', x || '/vehicle_' || v_priv || '_a.jpg', m, m::text);
    raise exception 'a: upload into another user folder: expected error';
  exception when insufficient_privilege then null;
  end;

  -- b) member uploads into their own folder
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('vehicle-images', m || '/own_test.jpg', m, m::text);

  -- c) member uploads a main photo to the owner's folder for a shared vehicle
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('vehicle-images', o || '/vehicle_' || v || '_x.jpg', m, m::text);

  -- e) avatar: own folder allowed, someone else's folder rejected
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('profile-avatars', m || '/avatar_test.jpg', m, m::text);
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('profile-avatars', o || '/avatar_test.jpg', m, m::text);
    raise exception 'e: avatar into another folder: expected error';
  exception when insufficient_privilege then null;
  end;

  -- f) receipt: own folder allowed, someone else's folder rejected
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('receipt-images', m || '/receipt_test.jpg', m, m::text);
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('receipt-images', o || '/receipt_test.jpg', m, m::text);
    raise exception 'f: receipt into another folder: expected error';
  exception when insufficient_privilege then null;
  end;

  -- ===== as non-member x =====
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);

  -- d) non-member uploads the main-photo path for the shared vehicle
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('vehicle-images', o || '/vehicle_' || v || '_y.jpg', x, x::text);
    raise exception 'd: non-member upload into owner folder: expected error';
  exception when insufficient_privilege then null;
  end;

  -- ===== as owner o =====
  perform set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);

  -- owner uploads their own main photo
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('vehicle-images', o || '/vehicle_' || v || '_own.jpg', o, o::text);

  -- ===== catalogue checks as postgres =====
  reset role;
  perform set_config('request.jwt.claims', '', true);

  -- g) the loose policy is gone, and the own-folder policy is still there
  if exists (select 1 from pg_policies
             where schemaname = 'storage' and tablename = 'objects'
               and policyname = 'Allow authenticated uploads to vehicle-images') then
    raise exception 'g: loose vehicle-images insert policy still exists'; end if;
  if not exists (select 1 from pg_policies
                 where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'Users can upload vehicle images'
                   and cmd = 'INSERT' and with_check like '%foldername%') then
    raise exception 'g: own-folder vehicle-images insert policy missing'; end if;

  raise notice 'vehicle_images_upload_policy: all checks passed';
end $$;

rollback;
