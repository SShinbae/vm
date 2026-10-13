-- A group member a vehicle is shared with can update its details and add a
-- main photo (row + storage file in the owner's folder), but cannot take
-- ownership, add gallery rows, or name someone else as uploader. Non-members
-- get nothing. No JWT caller (owner included) can change user_id; service role can.
-- Runs as the authenticated role (postgres bypasses RLS). Rolled back.
-- Run: psql "$DB_URL" -v ON_ERROR_STOP=1 -f database/tests/shared_vehicle_member_edit.sql
begin;

do $$
declare
  o uuid; m uuid; x uuid;      -- owner, member, non-member
  v uuid; v2 uuid; g uuid;     -- shared vehicle, unshared vehicle, group
  n int; ok boolean;
begin
  select id into o from auth.users order by created_at limit 1;
  select id into m from auth.users where id <> o order by created_at limit 1;
  select id into x from auth.users where id not in (o, m) order by created_at limit 1;
  if x is null then raise exception 'setup: need three auth users in seed'; end if;

  -- setup as postgres
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (o, 'Test', 'Shared', 2020, 'TSTSHR1') returning id into v;
  insert into public.vehicles (user_id, make, model, year, license_plate)
  values (o, 'Test', 'Private', 2020, 'TSTSHR2') returning id into v2;
  insert into public.groups (name, owner_id) values ('Share Edit Test', o) returning id into g;
  insert into public.group_members (group_id, user_id) values (g, o), (g, m);
  insert into public.vehicle_group_shares (vehicle_id, group_id, shared_by) values (v, g, o);

  -- ponytail: drop the loose "any folder" upload policy for this transaction
  -- only (rolled back) so case j exercises the new storage policy for real.
  -- Takes an ACCESS EXCLUSIVE lock on storage.objects until rollback.
  drop policy "Allow authenticated uploads to vehicle-images" on storage.objects;

  -- ===== as member m =====
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- a) member updates details
  update public.vehicles set make = 'Edited' where id = v;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'a: member update expected 1 row, got %', n; end if;

  -- b) member cannot take ownership: to self, to a third user, or to null
  begin
    update public.vehicles set user_id = m where id = v;
    raise exception 'b: member set user_id to self: expected error';
  exception when insufficient_privilege then
    if sqlerrm not like 'Only the owner%' then raise exception 'b: wrong 42501 source: %', sqlerrm; end if;
  end;
  begin
    update public.vehicles set user_id = x where id = v;
    raise exception 'b2: member set user_id to third user: expected error';
  exception when insufficient_privilege then
    if sqlerrm not like 'Only the owner%' then raise exception 'b2: wrong 42501 source: %', sqlerrm; end if;
  end;
  begin
    update public.vehicles set user_id = null where id = v;
    raise exception 'b3: member set user_id to null: expected error';
  exception when insufficient_privilege then
    if sqlerrm not like 'Only the owner%' then raise exception 'b3: wrong 42501 source: %', sqlerrm; end if;
  end;

  -- f) member adds a main photo row as themselves
  insert into public.vehicle_images (vehicle_id, image_url, image_type, uploaded_by)
  values (v, 'https://example.test/main.jpg', 'vehicle_main', m);

  -- g) member cannot add a gallery row
  begin
    insert into public.vehicle_images (vehicle_id, image_url, image_type, uploaded_by)
    values (v, 'https://example.test/gal.jpg', 'vehicle_gallery', m);
    raise exception 'g: member gallery insert: expected error';
  exception when insufficient_privilege then null;
  end;

  -- h) member cannot name the owner as uploader
  begin
    insert into public.vehicle_images (vehicle_id, image_url, image_type, uploaded_by)
    values (v, 'https://example.test/spoof.jpg', 'vehicle_main', o);
    raise exception 'h: member uploaded_by=owner: expected error';
  exception when insufficient_privilege then null;
  end;

  -- j) storage: member writes main photo into the owner's folder
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('vehicle-images', o || '/vehicle_' || v || '_x.jpg', m, m::text);

  -- j2) ...but not for an owner's vehicle that isn't shared with them
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('vehicle-images', o || '/vehicle_' || v2 || '_x.jpg', m, m::text);
    raise exception 'j2: unshared vehicle upload: expected error';
  exception when insufficient_privilege then null;
  end;

  -- j3) ...and not into a folder that isn't the vehicle owner's
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('vehicle-images', x || '/vehicle_' || v || '_x.jpg', m, m::text);
    raise exception 'j3: wrong folder upload: expected error';
  exception when insufficient_privilege then null;
  end;

  -- ===== as non-member x =====
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);

  -- c) non-member update changes nothing
  update public.vehicles set make = 'Hijack' where id = v;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'c: non-member update expected 0 rows, got %', n; end if;

  -- i) non-member cannot add any image row
  begin
    insert into public.vehicle_images (vehicle_id, image_url, image_type, uploaded_by)
    values (v, 'https://example.test/x.jpg', 'vehicle_main', x);
    raise exception 'i: non-member image insert: expected error';
  exception when insufficient_privilege then null;
  end;

  -- j4) non-member cannot write into the owner's folder
  begin
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('vehicle-images', o || '/vehicle_' || v || '_y.jpg', x, x::text);
    raise exception 'j4: non-member upload: expected error';
  exception when insufficient_privilege then null;
  end;

  -- d) not even the owner can change user_id with a JWT
  perform set_config('request.jwt.claims', json_build_object('sub', o, 'role', 'authenticated')::text, true);
  begin
    update public.vehicles set user_id = x where id = v;
    raise exception 'd: owner transfer: expected error';
  exception when insufficient_privilege then
    if sqlerrm not like 'Only the owner%' then raise exception 'd: wrong 42501 source: %', sqlerrm; end if;
  end;

  -- e) service role (no JWT sub) can change user_id, and back
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role service_role;
  update public.vehicles set user_id = x where id = v;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'e: service-role update expected 1 row, got %', n; end if;
  update public.vehicles set user_id = o where id = v;
  reset role;

  -- checks as postgres
  if (select make from public.vehicles where id = v) <> 'Edited' then
    raise exception 'a/c: make expected Edited'; end if;
  if (select user_id from public.vehicles where id = v) <> o then
    raise exception 'e: user_id expected owner'; end if;

  -- Review focus 5: purge picks vehicle-images by folder, not uploader.
  -- The member's photo in the owner's folder (case j, owner = m) stays with
  -- the vehicle on the member's purge and goes on the owner's; the member's
  -- own avatar is still theirs.
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('profile-avatars', m || '/avatar_test.jpg', m, m::text);
  if exists (select 1 from public.account_storage_objects(m)
             where bucket_id = 'vehicle-images' and name = o || '/vehicle_' || v || '_x.jpg') then
    raise exception 'purge: member purge would delete their photo in the owner folder'; end if;
  if not exists (select 1 from public.account_storage_objects(o)
                 where bucket_id = 'vehicle-images' and name = o || '/vehicle_' || v || '_x.jpg') then
    raise exception 'purge: owner purge misses the member photo in the owner folder'; end if;
  if not exists (select 1 from public.account_storage_objects(m)
                 where bucket_id = 'profile-avatars' and name = m || '/avatar_test.jpg') then
    raise exception 'purge: member avatar not listed for the member'; end if;

  raise notice 'shared_vehicle_member_edit: all checks passed';
end $$;

rollback;
