# Quick Start: OCR Receipt Processing

## 🚀 Getting Started in 5 Minutes

### 1. Database Setup (Required)
Run this SQL in your Supabase SQL editor:

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

-- Add OCR columns to service_logs table
ALTER TABLE service_logs
ADD COLUMN IF NOT EXISTS receipt_image_url text,
ADD COLUMN IF NOT EXISTS ocr_extracted_data jsonb,
ADD COLUMN IF NOT EXISTS auto_filled boolean DEFAULT false;
```

### 2. Test the Feature
1. Open your app and navigate to "Add Service Log"
2. Look for the "Scan Receipt" button
3. Take a photo of any service receipt (or use a sample)
4. Review the extracted data
5. Accept or reject the auto-filled information

### 3. What to Expect

#### ✅ Currently Working:
- Photo capture from camera/gallery
- Text extraction simulation
- Service type detection
- Cost parsing
- Date recognition
- Auto-fill form integration
- Receipt storage

#### 🚧 For Production (Next Steps):
- Replace mock OCR with real API (Google Vision/AWS Textract)
- Fine-tune parsing algorithms
- Add more receipt formats
- Implement batch processing

## 📊 Expected Results

### High Accuracy (80%+ confidence):
- **Jiffy Lube, Valvoline**: Oil change services
- **Midas, Firestone**: Brake and tire services
- **Chain shops**: Most standardized receipts

### Medium Accuracy (50-79% confidence):
- **Independent shops**: Variable receipt formats
- **Handwritten receipts**: Manual verification needed
- **Faded/blurry images**: May need retaking

### Low Accuracy (<50% confidence):
- **Very poor image quality**
- **Non-English receipts** (future enhancement)
- **Unusual receipt formats**

## 🐛 Troubleshooting

### Common Issues:
1. **"Scan Receipt" button not visible**: Database migration may not be complete
2. **Camera permission denied**: Check app permissions in device settings
3. **Storage errors**: Verify Supabase storage bucket exists
4. **Low extraction accuracy**: Try better lighting or retake photo

### Debug Steps:
1. Check console logs for OCR processing details
2. Verify confidence scores in extracted data
3. Review raw text extraction in OCR results
4. Test with different receipt types

## 📱 User Flow

```
1. User taps "Scan Receipt"
   ↓
2. Choose Camera or Gallery
   ↓
3. Take/select receipt photo
   ↓
4. OCR processes image (1-3 seconds)
   ↓
5. Review extracted data
   ↓
6. Accept → Auto-fill form
   OR
   Reject → Manual entry
   ↓
7. Submit service log normally
```

## 💡 Tips for Best Results

### For Users:
- **Good lighting**: Use natural light when possible
- **Flat surface**: Place receipt on flat, contrasting surface
- **Full receipt**: Ensure entire receipt is visible in photo
- **Focus**: Wait for camera to focus before capturing

### For Developers:
- **Test various receipt formats** during development
- **Monitor confidence scores** to identify parsing issues
- **Collect user feedback** on extraction accuracy
- **Consider receipt preprocessing** for better OCR results

## 🔧 Customization Options

### Service Type Keywords:
Edit `SERVICE_TYPE_KEYWORDS` in `ocrService.ts` to add/modify detection patterns.

### Business Recognition:
Update `SERVICE_BUSINESSES` array to include local service providers.

### Confidence Thresholds:
Adjust confidence scoring logic in `parseExtractedText` method.

### Storage Settings:
Modify file size limits and mime types in storage bucket configuration.

## 📈 Success Metrics

Track these KPIs to measure OCR feature success:
- **Adoption Rate**: % of service logs using OCR
- **Accuracy Rate**: % of extractions with >70% confidence
- **Time Savings**: Reduction in form completion time
- **Error Rate**: % of OCR data requiring manual correction

## 🚀 Next Steps

1. **Production OCR API**: Integrate Google Vision or AWS Textract
2. **Enhanced Parsing**: Add support for more receipt types
3. **Batch Processing**: Allow multiple receipt uploads
4. **Analytics Dashboard**: Track OCR performance metrics
5. **User Feedback**: Collect accuracy ratings from users

---

**Need Help?** Check the full documentation in `OCR_FEATURE_README.md` or run the test suite in `lib/tests/ocrService.test.ts`.