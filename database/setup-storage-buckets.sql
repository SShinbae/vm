-- Setup storage buckets for the vehicles management app

-- Create vehicle-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create profile-avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for vehicle-images bucket

-- Policy: Allow authenticated users to upload vehicle images
CREATE POLICY "Allow authenticated uploads to vehicle-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Policy: Allow public read access to vehicle images
CREATE POLICY "Allow public read access to vehicle-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Policy: Allow users to delete their own vehicle images
CREATE POLICY "Allow users to delete own vehicle-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own vehicle images
CREATE POLICY "Allow users to update own vehicle-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up RLS policies for profile-avatars bucket

-- Policy: Allow authenticated users to upload profile avatars
CREATE POLICY "Allow authenticated uploads to profile-avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

-- Policy: Allow public read access to profile avatars
CREATE POLICY "Allow public read access to profile-avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

-- Policy: Allow users to delete their own profile avatars
CREATE POLICY "Allow users to delete own profile-avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own profile avatars
CREATE POLICY "Allow users to update own profile-avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);