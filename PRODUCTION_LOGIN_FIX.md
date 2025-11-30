# Production Login/Crash Troubleshooting Guide

## Issue: App Crashes After Login

If your production app crashes after entering email and password, this is typically caused by:

### Root Causes:

1. **Database Query Failures** - Dashboard tries to load data immediately after login
2. **Missing Database Functions** - RPC functions not deployed to production database
3. **RLS Policy Issues** - Row Level Security blocking queries
4. **Network Timeouts** - Slow or failed network requests causing crashes
5. **Console Errors in Production** - Some Android devices crash on console methods

### Fixes Applied:

✅ **Error Boundary** - Catches crashes and shows friendly error messages
✅ **Try-Catch Wrappers** - All database queries wrapped in try-catch
✅ **No Re-throwing** - Errors are logged but don't crash the app
✅ **Fallback Values** - Default empty data instead of crashes
✅ **Dev-Only Console** - Console methods only run in development
✅ **Promise.allSettled** - Ensures all promises complete even if some fail
✅ **Session Delay** - 500ms delay after login to ensure session is established

---

## Testing Checklist

### 1. Test Environment Variables

```bash
# Check .env file exists
cat .env

# Verify values are correct (don't share output!)
# Should show your real Supabase URL and Key
```

### 2. Test Development Build First

```bash
# Start development server
npx expo start

# Try logging in
# Check console for any errors
```

### 3. Test Production Build

```bash
# Build production APK
eas build --platform android --profile production-apk --local

# Install on device
# Try logging in
```

### 4. Check Supabase Connection

1. Go to your Supabase Dashboard
2. Check if the project is active (not paused)
3. Verify RLS policies are correct
4. Test queries in SQL Editor:

```sql
-- Test if the RPC function exists
SELECT * FROM pg_proc WHERE proname = 'get_user_vehicles_with_sharing';

-- Test basic vehicle query
SELECT * FROM vehicles LIMIT 1;

-- Test profiles table
SELECT * FROM profiles LIMIT 1;
```

---

## Common Issues & Solutions

### Issue: "App unresponsive" after login

**Cause**: Database queries timing out or failing

**Solution**:
1. Check your internet connection
2. Verify Supabase project is active
3. Check if RLS policies are blocking queries
4. Try clearing app data and cache

### Issue: App crashes silently

**Cause**: JavaScript errors not caught by error boundary

**Solution**:
1. Enable USB debugging on Android
2. Connect to computer via USB
3. Run: `adb logcat | grep -i "crash\|error\|exception"`
4. Check the logs for actual error

### Issue: Stuck on loading screen

**Cause**: Network timeout or infinite loop

**Solution**:
1. Check network connection
2. Force close and restart app
3. Clear app data
4. Reinstall app

### Issue: "Failed to load dashboard"

**Cause**: Database queries returning errors

**Solution**:
1. Check Supabase RLS policies
2. Verify database functions exist
3. Check if user has proper permissions

---

## Debug Production APK

### Enable Logs in Production

Add this to your component to see what's happening:

```tsx
// Temporary debugging code
useEffect(() => {
  console.log("User:", user);
  console.log("Loading:", loading);
  console.log("Error:", error);
}, [user, loading, error]);
```

Build and install, then check logs:

```bash
# View Android logs
adb logcat | grep -i "console\|ReactNativeJS"
```

### Test Database Connection

Add temporary test button in your app:

```tsx
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('vehicles').select('*').limit(1);
    alert(error ? `Error: ${error.message}` : `Success: ${data?.length} vehicles`);
  } catch (err) {
    alert(`Crash: ${err}`);
  }
};

// Add button in your UI
<Button title="Test DB" onPress={testConnection} />
```

---

## Advanced Debugging

### Check Network Requests

1. Use a network monitoring tool like Charles Proxy or mitmproxy
2. Monitor requests to Supabase
3. Check if requests are failing or timing out

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to Logs section
3. Look for API errors or failed queries

### Check RLS Policies

Run this in Supabase SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies for vehicles table
SELECT * FROM pg_policies WHERE tablename = 'vehicles';

-- Check policies for profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## Emergency Fixes

### If App Still Crashes After All Fixes:

1. **Disable Dashboard Auto-Load**:
   - Comment out the `useEffect` in `useDashboardData.ts`
   - Add manual "Load Data" button
   - This isolates if dashboard is causing crash

2. **Skip Profile Fetch**:
   - In `AuthContext.tsx`, skip `fetchUserProfile`
   - Use basic user info from session only
   - This isolates if profile fetch is causing crash

3. **Simplify Dashboard**:
   - Remove RPC function call
   - Use basic SELECT queries only
   - This isolates if database function is causing crash

---

## Production Monitoring

### Recommended Setup:

1. **Error Tracking**: Add Sentry or similar
   ```bash
   npm install @sentry/react-native
   ```

2. **Analytics**: Add Firebase Analytics
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/analytics
   ```

3. **Crash Reports**: Enable Google Play Console crash reports

---

## When to Ask for Help

If you've tried all the above and still have issues, gather this info:

1. Error logs from `adb logcat`
2. Network request logs
3. Supabase error logs
4. Steps to reproduce
5. What you've already tried

---

## Files Modified for Login Fix

1. ✅ `hooks/useDashboardData.ts` - Better error handling
2. ✅ `lib/contexts/AuthContext.tsx` - Wrapped setUser in try-catch
3. ✅ `app/(auth)/login.tsx` - Added delay and better error handling
4. ✅ `services/supabaseClient.ts` - Fallback values for missing env
5. ✅ `components/ErrorBoundary.tsx` - Catches all crashes

---

## Quick Test Script

Create this file to test your production build:

**test-production.sh**:
```bash
#!/bin/bash

echo "🧪 Testing Production Build..."

# Check environment
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo "✅ .env exists"
else
    echo "❌ .env missing!"
    exit 1
fi

# Build
echo "2. Building production APK..."
eas build --platform android --profile production-apk --local

# Remind to test
echo "3. Install and test on device:"
echo "   - Install APK on Android device"
echo "   - Try logging in"
echo "   - Check if dashboard loads"
echo "   - If crashes, run: adb logcat | grep -i crash"
```

Run it:
```bash
chmod +x test-production.sh
./test-production.sh
```

---

## Success Checklist

Before considering it fixed, verify:

- [ ] App opens successfully
- [ ] Login screen appears
- [ ] Can enter email and password
- [ ] Login succeeds without crash
- [ ] Dashboard loads (even if empty)
- [ ] No "unresponsive" warnings
- [ ] Error boundary shows if something fails (not blank crash)
- [ ] Can navigate between tabs
- [ ] Can logout and login again

If all checked, your production build is working! 🎉
