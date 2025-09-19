# Google Vision API Setup Guide

## Prerequisites

Before setting up Google Vision API, ensure you have:
- A Google Cloud Platform (GCP) account
- A GCP project with billing enabled
- Access to Google Cloud Console

## Step 1: Enable Google Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Cloud Vision API"
5. Click on "Cloud Vision API" and click **Enable**

## Step 2: Create Service Account Credentials

### Option A: API Key (Recommended for Development)

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the generated API key
4. (Optional) Click **Restrict Key** to limit usage:
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Vision API" from the list
   - Save the changes

### Option B: Service Account (Recommended for Production)

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **Service Account**
3. Fill in the service account details:
   - Name: `vehicles-management-ocr`
   - Description: `OCR service for vehicle management app`
4. Click **Create and Continue**
5. Grant roles:
   - **Cloud Vision API User** (minimum required)
6. Click **Continue** and **Done**
7. Click on the created service account
8. Go to **Keys** tab > **Add Key** > **Create new key**
9. Choose **JSON** format and download the key file

## Step 3: Configure Environment Variables

### For API Key Method

Add to your `.env` file:

```env
GOOGLE_VISION_API_KEY=your_api_key_here
```

### For Service Account Method

1. Place the downloaded JSON file in your project (e.g., `google-vision-key.json`)
2. Add to your `.env` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./google-vision-key.json
```

**Important**: Add `google-vision-key.json` to your `.gitignore` file!

## Step 4: Test the Setup

### Quick Test in Your App

1. Open your app and navigate to "Add Service Log"
2. Tap "Scan Receipt"
3. Take a photo of any receipt with text
4. Check if text is extracted successfully

### Manual Test with Development Tools

You can test the API directly using the storage setup tester:

```typescript
import { StorageSetupTester } from '@/lib/utils/testStorageSetup';

// Run comprehensive test
const testResults = await StorageSetupTester.runCompleteTest();
console.log('Setup test results:', testResults);
```

## Step 5: Monitor Usage and Costs

### Understanding Pricing

- **Free Tier**: 1,000 units per month
- **Paid Tier**: $1.50 per 1,000 units after free tier
- **Unit**: Each image processed = 1 unit

### Monitor Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Dashboard**
3. Click on "Cloud Vision API" to see usage metrics
4. Set up billing alerts:
   - Go to **Billing** > **Budgets & Alerts**
   - Create budget with alerts at 50%, 90%, and 100%

## Step 6: Security Best Practices

### For Production

1. **Use Service Accounts**: More secure than API keys
2. **Restrict API Keys**: Limit to specific APIs and referrer URLs
3. **Rotate Keys Regularly**: Change API keys every 3-6 months
4. **Monitor Usage**: Set up alerts for unusual activity
5. **Environment Variables**: Never commit keys to version control

### API Key Restrictions

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under "Application restrictions":
   - Choose "HTTP referrers" for web apps
   - Choose "Android apps" or "iOS apps" for mobile
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose only "Cloud Vision API"

## Troubleshooting

### Common Issues

#### 1. "API key not configured" Error
- **Cause**: Environment variable not set or incorrect
- **Solution**: Check `.env` file and restart development server

#### 2. "Permission denied" Error
- **Cause**: API not enabled or insufficient permissions
- **Solution**: Ensure Cloud Vision API is enabled and billing is active

#### 3. "Quota exceeded" Error
- **Cause**: Exceeded free tier limits
- **Solution**: Enable billing or wait for quota reset

#### 4. "Invalid API key" Error
- **Cause**: API key is wrong or has restrictions
- **Solution**: Verify API key and check restrictions

### Debugging Steps

1. **Check API Key**:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"requests":[{"image":{"content":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="},"features":[{"type":"TEXT_DETECTION","maxResults":1}]}]}' \
     "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY"
   ```

2. **Check Console Logs**: Look for specific error messages in app logs

3. **Test with Simple Image**: Use a clear image with text to test

## Performance Optimization

### Image Optimization

1. **Resize Images**: Limit to 2048x2048 pixels
2. **Compress Images**: Use JPEG with 80-90% quality
3. **Good Lighting**: Ensure clear, well-lit images
4. **Text Contrast**: Dark text on light background works best

### Request Optimization

1. **Batch Requests**: Process multiple images in one API call
2. **Cache Results**: Store OCR results to avoid re-processing
3. **Error Handling**: Implement retry logic for failed requests

## Production Deployment

### Environment Setup

1. **Staging Environment**: Test with real API in staging first
2. **Production Keys**: Use separate API keys for production
3. **Monitoring**: Set up logging and monitoring for OCR requests
4. **Backup Plan**: Have fallback for manual entry if OCR fails

### Scaling Considerations

- **Request Limits**: Default limit is 600 requests/minute
- **Concurrent Requests**: Limit concurrent OCR processing
- **Cost Management**: Monitor usage and set billing alerts
- **Performance**: Consider image preprocessing for better accuracy

## Additional Resources

- [Google Vision API Documentation](https://cloud.google.com/vision/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Best Practices Guide](https://cloud.google.com/vision/docs/best-practices)
- [Supported File Types](https://cloud.google.com/vision/docs/supported-files)

## Support

If you encounter issues:

1. Check the [Google Cloud Status Page](https://status.cloud.google.com/)
2. Review [Vision API Quotas](https://cloud.google.com/vision/quotas)
3. Post questions on [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-vision) with tag `google-cloud-vision`
4. Contact [Google Cloud Support](https://cloud.google.com/support) for billing/technical issues