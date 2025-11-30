# Quick Fix Guide - Production Build Issues

## The Problem

Your production build was crashing immediately after opening because:

1. Environment variables (Supabase credentials) weren't being included in the production build
2. The app threw errors on startup when these were missing
3. No error boundary to catch these errors gracefully

## The Solution

### Files Changed:

1. ✅ `services/supabaseClient.ts` - Now warns instead of crashing
2. ✅ `components/ErrorBoundary.tsx` - New error boundary component (catches crashes)
3. ✅ `app/_layout.tsx` - Wrapped app in error boundary
4. ✅ `.env.production` - Template for your credentials
5. ✅ `.github/workflows/react-native-cicd.yaml` - Updated to use secrets
6. ✅ `PRODUCTION_BUILD_GUIDE.md` - Comprehensive setup guide

## Quick Start

### Step 1: Set Up Your Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.production .env
```

Then edit `.env` with your actual values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_VISION_API_KEY=AIzaSy...  # Optional
SITE_URL=https://yourapp.com
```

### Step 2: Test Development Build First

```bash
npm install
npx expo start
```

Make sure the app works in development mode.

### Step 3: Build Production APK Locally

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Build for production
eas build --platform android --profile production-apk --local
```

### Step 4: Test the APK

1. Install the generated APK on your Android device
2. Open the app
3. If there are any errors, the error boundary will catch them
4. Check if you can sign in and use all features

## For GitHub Actions (CI/CD)

Add these secrets to your GitHub repository:

1. Go to: Settings > Secrets and variables > Actions
2. Add New Repository Secrets:
   - `SUPABASE_URL` → Your Supabase URL
   - `SUPABASE_KEY` → Your Supabase Anon Key
   - `GOOGLE_VISION_API_KEY` → Your Google Vision API Key (optional)
   - `SITE_URL` → Your app URL
   - `EXPO_TOKEN` → Your Expo token (if using EAS Build)

## Troubleshooting

### Still Crashing?

1. **Check .env file exists**: `ls -la .env`
2. **Verify values are set**: `cat .env` (be careful not to share this!)
3. **Check app.config.js**: Make sure `require("dotenv").config()` is at the top
4. **Try cleaning**:
   ```bash
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

### Error Boundary Not Showing?

If the error boundary isn't displaying:

1. The error might be happening before React mounts
2. Check `app.config.js` for syntax errors
3. Check if `components/ErrorBoundary.tsx` exists

### Supabase Not Connecting?

1. Verify your Supabase URL and Key are correct
2. Test connection in Supabase dashboard
3. Check RLS policies in your Supabase project
4. Make sure your Supabase project is active (not paused)

## What the Error Boundary Does

The error boundary will:

- **Catch any crashes** that happen in the React component tree
- **Show a friendly error message** to users instead of a blank screen
- **Display error details** in development mode (for debugging)
- **Allow users to try again** with a "Try Again" button

## Testing the Error Boundary

To test if it's working, you can temporarily add this to any component:

```tsx
// Test error boundary
if (true) {
  throw new Error("Test error for error boundary");
}
```

The app should show the error boundary screen instead of crashing.

## Next Steps

1. ✅ Set up `.env` file with your credentials
2. ✅ Test development build works
3. ✅ Build production APK locally
4. ✅ Test production APK on device
5. ✅ Set up GitHub secrets for CI/CD (optional)
6. ✅ Deploy!

## Need More Help?

Check the full guide: `PRODUCTION_BUILD_GUIDE.md`

## Important Security Notes

⚠️ **NEVER commit `.env` files to git!**  
⚠️ **NEVER share your Supabase keys publicly!**  
⚠️ **Use GitHub Secrets for CI/CD, not hardcoded values!**

The `.env` file is already in `.gitignore`, so it won't be committed by accident.
