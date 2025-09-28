# Sign-Up Confirmation Flow Debugging Guide

## Issues Fixed:

✅ **Environment Configuration**: Verified `.env` file exists with correct `SITE_URL=https://vm.wanahnaf.dev`

✅ **Added Comprehensive Debugging**: Added detailed console logs throughout the sign-up flow

## Debugging Added:

### 1. Registration Flow (`app/(auth)/register.tsx`)
- Added logging when registration starts
- Logs the email being registered
- Logs success/error states
- Logs redirect to email confirmation page

### 2. Auth Context (`lib/contexts/AuthContext.tsx`)
- Enhanced signup method with detailed logging
- Logs the email redirect URL being constructed
- Logs Supabase response data
- Tracks signup success/failure

### 3. Email Confirmation Handler (`app/auth/confirm.tsx`)
- Logs URL parameters (token_hash, type)
- Tracks verification attempts
- Logs user confirmation success
- Tracks redirect to success page

### 4. Email Confirmation Page (`app/(auth)/email-confirmation.tsx`)
- Logs when the page loads
- Tracks email parameter received

## How to Test:

1. **Start Development Server**:
   ```bash
   npm start
   ```

2. **Open in Browser**: Go to `http://localhost:8081`

3. **Test Sign-Up Flow**:
   - Navigate to registration page
   - Fill out the form with a real email address
   - Submit the form
   - Check browser console for debug logs

4. **Check Console Logs For**:
   - `=== REGISTRATION FLOW DEBUG ===`
   - `=== SIGNUP DEBUG INFO ===`
   - Email confirmation URL construction
   - Registration success/redirect

5. **Check Email**:
   - Look for verification email
   - Click the confirmation link
   - Should redirect to `/auth/confirm`

6. **Monitor Confirmation Flow**:
   - Check console for `=== EMAIL CONFIRMATION DEBUG ===`
   - Verify token processing
   - Check redirect to success page

## Expected Flow:

1. User fills registration form → Console logs registration start
2. `signUp()` called → Console logs signup data and email redirect URL
3. If successful → Redirect to `/(auth)/email-confirmation` → Console logs page load
4. User receives email with link to `https://vm.wanahnaf.dev/auth/confirm?token_hash=...&type=signup`
5. User clicks link → `app/auth/confirm.tsx` loads → Console logs confirmation process
6. If successful → Redirect to `/(auth)/confirmation-success` → Shows success page

## Potential Issues to Look For:

1. **Email Redirect URL**: Should be `https://vm.wanahnaf.dev/auth/confirm`
2. **Missing Environment Variables**: Check if SITE_URL is properly loaded
3. **Supabase Configuration**: Verify email templates in Supabase dashboard
4. **Authentication State**: Check if AuthGuard is interfering with flow
5. **Route Navigation**: Verify all routes are properly configured

## Console Log Patterns:

- ✅ Normal flow shows all debug sections in sequence
- ❌ Missing sections indicate where the flow is breaking
- ❌ Error messages indicate specific failure points

## Next Steps if Issues Persist:

1. Check Supabase dashboard for email template configuration
2. Verify domain settings in Supabase Auth
3. Test with different email providers
4. Check network requests in browser dev tools
5. Verify all route files exist and are properly configured