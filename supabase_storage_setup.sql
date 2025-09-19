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

-- Add the new OCR-related columns to service_logs table
ALTER TABLE service_logs
ADD COLUMN IF NOT EXISTS receipt_image_url text,
ADD COLUMN IF NOT EXISTS ocr_extracted_data jsonb,
ADD COLUMN IF NOT EXISTS auto_filled boolean DEFAULT false;