# Production Build Setup Guide

## Critical Issues Fixed

This guide addresses the production build crash issues that were causing the app to close immediately after opening.

### Issues Identified and Fixed:

1. **Missing Environment Variables** - App crashed because environment variables weren't available in production builds
2. **Hard Error on Startup** - Supabase client threw errors immediately if env vars were missing
3. **No Error Boundary** - Crashes weren't caught gracefully
4. **Missing Production Configuration** - EAS Build profiles didn't include environment variables

---

## Setup Instructions

### 1. Configure Environment Variables

#### Option A: Using .env.production file (Local Builds)

1. Copy `.env.production` to `.env`:

   ```bash
   cp .env.production .env
   ```

2. Fill in your actual values in `.env`:
   ```bash
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
   GOOGLE_VISION_API_KEY=AIzaSy...  # Optional
   SITE_URL=https://yourapp.com
   ```

#### Option B: Using EAS Secrets (Cloud Builds)

1. Install EAS CLI if not already installed:

   ```bash
   npm install -g eas-cli
   ```

2. Login to your EAS account:

   ```bash
   eas login
   ```

3. Set environment variables as secrets:

   ```bash
   eas secret:create --scope project --name SUPABASE_URL --value "https://xxxxxxxxxxxxx.supabase.co" --type string
   eas secret:create --scope project --name SUPABASE_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --type string
   eas secret:create --scope project --name GOOGLE_VISION_API_KEY --value "AIzaSy..." --type string
   eas secret:create --scope project --name SITE_URL --value "https://yourapp.com" --type string
   ```

4. Update `eas.json` to reference these secrets:
   ```json
   {
     "build": {
       "production-apk": {
         "env": {
           "SUPABASE_URL": "$SUPABASE_URL",
           "SUPABASE_KEY": "$SUPABASE_KEY",
           "GOOGLE_VISION_API_KEY": "$GOOGLE_VISION_API_KEY",
           "SITE_URL": "$SITE_URL"
         }
       }
     }
   }
   ```

---

## Building for Production

### Local Production Builds

#### Build Development APK (for testing):

```bash
eas build --platform android --profile development --local
```

#### Build Production APK:

```bash
# Make sure .env is configured with production values
eas build --platform android --profile production-apk --local
```

#### Build Production AAB (for Play Store):

```bash
# Make sure .env is configured with production values
eas build --platform android --profile production --local
```

### Cloud Builds (EAS Build)

#### Build Production APK:

```bash
# Make sure EAS secrets are configured
eas build --platform android --profile production-apk
```

#### Build Production AAB:

```bash
# Make sure EAS secrets are configured
eas build --platform android --profile production
```

---

## Testing Production Builds

### Before Releasing:

1. **Test Environment Variables**:
   - Open the app
   - Try to sign in/sign up
   - Verify Supabase connection works
   - Check if all features work correctly

2. **Test Error Handling**:
   - The app should not crash if there's an error
   - Error boundary should show a friendly error message
   - Users should be able to "Try Again"

3. **Test Offline Behavior**:
   - Turn off internet
   - Open the app
   - Verify graceful error messages

---

## Troubleshooting

### App Crashes Immediately

**Cause**: Missing environment variables

**Solution**:

1. Check if `.env` file exists and has correct values
2. For EAS builds, verify secrets are set: `eas secret:list`
3. Check `app.config.js` is correctly reading env vars

### Supabase Connection Errors

**Cause**: Invalid Supabase URL or Key

**Solution**:

1. Verify your Supabase credentials are correct
2. Check Supabase dashboard is accessible
3. Ensure RLS policies are properly configured

### Environment Variables Not Loading

**Cause**: Build process not including env vars

**Solution**:

1. Ensure `dotenv` is installed: `npm install dotenv`
2. Verify `app.config.js` has `require("dotenv").config()` at the top
3. For EAS builds, ensure secrets are properly set

---

## CI/CD Setup (GitHub Actions)

### Add Secrets to GitHub Repository:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GOOGLE_VISION_API_KEY` (optional)
   - `SITE_URL`
   - `EXPO_TOKEN` (for EAS builds)

### Update Workflow:

The workflow file (`.github/workflows/react-native-cicd.yaml`) needs to be updated to use these secrets:

```yaml
- name: 📱 Build Production APK
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    GOOGLE_VISION_API_KEY: ${{ secrets.GOOGLE_VISION_API_KEY }}
    SITE_URL: ${{ secrets.SITE_URL }}
  run: |
    export NODE_OPTIONS="--max_old_space_size=4096"
    eas build --platform android --profile production-apk --local --non-interactive
```

---

## Error Boundary

The app now includes an error boundary that catches and displays errors gracefully:

- **Development Mode**: Shows full error details for debugging
- **Production Mode**: Shows user-friendly error message with "Try Again" button

Location: `components/ErrorBoundary.tsx`

---

## Files Modified

1. `services/supabaseClient.ts` - Changed error throw to warning
2. `eas.json` - Added env configuration to production profiles
3. `app/_layout.tsx` - Wrapped app in ErrorBoundary
4. `components/ErrorBoundary.tsx` - New error boundary component
5. `.env.production` - Template for production environment variables

---

## Important Notes

1. **Never commit `.env` files** - They should be in `.gitignore`
2. **Keep secrets secure** - Don't share Supabase keys or API keys
3. **Test before releasing** - Always test production builds before publishing
4. **Monitor errors** - Consider adding Sentry or similar for production error tracking

---

## Next Steps

1. Fill in your environment variables in `.env` or EAS secrets
2. Test a local production build
3. If successful, try a cloud build with EAS
4. Test the production APK/AAB thoroughly
5. Submit to Google Play Store (if ready)

---

## Support

If you encounter issues:

1. Check the error boundary message (it shows helpful details in dev mode)
2. Verify all environment variables are set correctly
3. Check Supabase dashboard for connection issues
4. Review the console logs for any warnings

For more help, check:

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Supabase Documentation](https://supabase.com/docs)
