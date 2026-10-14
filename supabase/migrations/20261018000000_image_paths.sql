-- Store bucket paths instead of full public URLs, so image links don't bake
-- in a storage host (e.g. 10.0.2.2 from the Android emulator). The app
-- builds the public URL at render time. Only Supabase storage URLs for the
-- named bucket are rewritten; other URLs (Google avatars) are left as is.
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
