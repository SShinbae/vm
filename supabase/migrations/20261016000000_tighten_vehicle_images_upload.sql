-- Any authenticated user could upload anywhere in vehicle-images. Uploads now
-- need either the caller's own folder or (20261015000000) the owner's folder
-- of a vehicle shared with the caller.
DROP POLICY IF EXISTS "Allow authenticated uploads to vehicle-images" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'Users can upload vehicle images') THEN
    CREATE POLICY "Users can upload vehicle images" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'vehicle-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
END $$;
