-- Group members a vehicle is shared with can edit its details and add a main
-- photo. Ownership, sharing, deletion and gallery photos stay owner-only.
-- Test: database/tests/shared_vehicle_member_edit.sql

-- 1. Members may update shared vehicles.
CREATE POLICY "Group members can update shared vehicles" ON public.vehicles FOR UPDATE TO authenticated
  USING (id IN (SELECT vehicle_id FROM public.get_accessible_vehicle_ids(auth.uid())))
  WITH CHECK (id IN (SELECT vehicle_id FROM public.get_accessible_vehicle_ids(auth.uid())));

-- 2. ...but no JWT caller may change user_id, the owner included (matches the
-- old owner-only policy, whose USING-as-WITH-CHECK blocked transfers). Only
-- no-JWT service paths (purge, anonymise) can. RLS alone can't enforce this:
-- "Users can manage own vehicles" passes a member setting user_id to
-- themselves, and policy 1 passes any other new user_id.
-- Fires before update_vehicles_updated_at (alphabetical BEFORE order).
CREATE OR REPLACE FUNCTION public.guard_vehicle_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only the owner can change vehicle ownership' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_vehicle_owner_change
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.guard_vehicle_owner_change();

-- 3. Members may add a main-photo row as themselves.
CREATE POLICY "Group members can add main photo to shared vehicles" ON public.vehicle_images FOR INSERT TO authenticated
  WITH CHECK (image_type = 'vehicle_main' AND uploaded_by = auth.uid()
    AND vehicle_id IN (SELECT vehicle_id FROM public.get_accessible_vehicle_ids(auth.uid())));

-- 4. Members may upload a main photo into the owner's folder:
-- <owner>/vehicle_<vehicle id>_... for a vehicle shared with them.
-- A malformed 36-char capture fails the uuid cast, which rejects the insert.
CREATE POLICY "Group members can upload main photo into owner folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-images'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = (substring(storage.filename(objects.name) from '^vehicle_([0-9a-f-]{36})_'))::uuid
        AND v.user_id::text = (storage.foldername(objects.name))[1]
        AND v.id IN (SELECT vehicle_id FROM public.get_accessible_vehicle_ids(auth.uid()))
    )
  );

-- 5. Account purge: vehicle-images objects are chosen by folder, not uploader.
--    A member's main photo in the owner's folder stays with the vehicle when
--    the member is purged, and goes when the owner is. Other buckets are
--    unchanged (by uploader), keeping the receipt exception. Body otherwise
--    copied from 20261012000000_account_deletion_data.sql.
CREATE OR REPLACE FUNCTION public.account_storage_objects(p_user uuid)
RETURNS TABLE (bucket_id text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.bucket_id, o.name
  FROM storage.objects o
  WHERE ((o.bucket_id = 'vehicle-images' AND (storage.foldername(o.name))[1] = p_user::text)
      OR (o.bucket_id IS DISTINCT FROM 'vehicle-images' AND o.owner = p_user))
    AND NOT (o.bucket_id = 'receipt-images' AND EXISTS (
      SELECT 1 FROM public.service_logs s
      WHERE s.receipt_image_url IS NOT NULL
        AND right(s.receipt_image_url, length(o.name)) = o.name));
$$;

REVOKE ALL ON FUNCTION public.account_storage_objects(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_storage_objects(uuid) TO service_role;
