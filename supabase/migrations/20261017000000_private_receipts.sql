-- Receipts were publicly readable in production. Store bucket paths, make
-- the bucket private, and let anyone who can see the service log read its
-- receipt (the app shows it through a short-lived signed URL).

-- 1. URL -> path. One DO block so the transaction-local bulk_purge flag
--    covers the UPDATE: no "log updated" pushes and no change-actor rows.
DO $$
BEGIN
  PERFORM set_config('app.bulk_purge', 'on', true);
  UPDATE public.service_logs
     SET receipt_image_url = regexp_replace(
           split_part(receipt_image_url, '?', 1),
           '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/receipt-images/',
           '')
   WHERE receipt_image_url ~ '^https?://';
  PERFORM set_config('app.bulk_purge', 'off', true);
END $$;

-- 2. Private bucket.
UPDATE storage.buckets SET public = false WHERE id = 'receipt-images';

-- 3. Read access through the service log (kept: own-folder policy for previews).
DROP POLICY IF EXISTS "Vehicle members can view service log receipts" ON storage.objects;
CREATE POLICY "Vehicle members can view service log receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipt-images'
    AND EXISTS (
      SELECT 1 FROM public.service_logs s
      WHERE s.receipt_image_url = objects.name
        AND s.vehicle_id IN (SELECT vehicle_id FROM public.get_accessible_vehicle_ids(auth.uid()))
    )
  );
