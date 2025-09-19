# Database Setup for OCR Feature

## Step 1: Run SQL in Supabase Dashboard

Go to your Supabase project dashboard, navigate to the SQL Editor, and run the following commands:

### A. Create Storage Bucket and Policies

```sql
-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-images',
  'receipt-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for receipt images
CREATE POLICY "Users can upload their own receipt images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipt images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipt images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'receipt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipt images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'receipt-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### B. Add OCR Columns to service_logs Table

```sql
-- Add the new OCR-related columns to service_logs table
ALTER TABLE service_logs
ADD COLUMN IF NOT EXISTS receipt_image_url text,
ADD COLUMN IF NOT EXISTS ocr_extracted_data jsonb,
ADD COLUMN IF NOT EXISTS auto_filled boolean DEFAULT false;
```

## Step 2: Verify Storage Bucket

After running the SQL, verify the storage bucket was created:

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `receipt-images`
3. The bucket should be set to "Public" (for reading images)

## Step 3: Test Permissions

You can test the storage permissions by trying to upload a test file:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'receipt-images';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%receipt%';
```

## Step 4: Environment Variables

Make sure your `.env` file includes:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GOOGLE_VISION_API_KEY=your_google_vision_api_key
```

## Common Issues & Solutions

### Issue: Storage bucket creation fails
**Solution:** Ensure you have the necessary permissions in your Supabase project.

### Issue: RLS policies fail to create
**Solution:** Check if storage policies already exist. You can drop existing ones if needed:
```sql
DROP POLICY IF EXISTS "Users can upload their own receipt images" ON storage.objects;
-- Then re-run the policy creation commands
```

### Issue: Column addition fails
**Solution:** The columns might already exist. Check with:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_logs'
AND column_name IN ('receipt_image_url', 'ocr_extracted_data', 'auto_filled');
```

## Verification Commands

Run these to verify everything is set up correctly:

```sql
-- 1. Check storage bucket
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'receipt-images';

-- 2. Check new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_logs'
AND column_name IN ('receipt_image_url', 'ocr_extracted_data', 'auto_filled');

-- 3. Check storage policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%receipt%';
```

Expected results:
- Storage bucket should exist with 10MB limit and public access
- Three new columns should be added to service_logs table
- Four storage policies should be created for CRUD operations