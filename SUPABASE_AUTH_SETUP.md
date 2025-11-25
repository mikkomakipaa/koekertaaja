# Supabase Authentication Setup

This guide explains how to enable and configure Supabase Authentication for the admin section (`/create` page).

## Overview

Authentication is **required** for:
- `/create` page (creating question sets)
- `/api/generate-questions` (API route)
- `/api/delete-question-set` (API route)

Public access (no auth required):
- `/` (home page)
- `/play` (browse question sets)
- `/play/[code]` (play questions)

## Setup Steps

### 1. Enable Email Authentication in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Providers**
3. Find **Email** provider
4. Enable it (toggle switch)
5. Configure settings:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email**: OFF (for easier testing, turn ON for production)
   - ✅ **Secure email change**: ON (recommended)
   - ✅ **Secure password change**: ON (recommended)

### 2. Configure Site URL and Redirect URLs

Go to **Authentication → URL Configuration**:

**Site URL**: `http://localhost:3000` (development) or your production URL

**Redirect URLs** (add these):
- `http://localhost:3000/**` (development)
- `https://your-domain.vercel.app/**` (production)

### 3. Create Admin Users

You have two options:

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication → Users**
2. Click **"Add user"** or **"Invite user"**
3. Select **"Create new user"**
4. Enter email and password
5. Toggle **"Auto Confirm User"** to ON (skip email confirmation)
6. Click **"Create user"**

#### Option B: Via Sign Up Page (Optional)

If you want to allow self-registration:

1. Create a sign-up page (not included in current implementation)
2. Or temporarily modify `/login` page to include sign-up form
3. After testing, remove or restrict sign-up

### 4. Configure Email Templates (Optional)

If you enabled email confirmation, customize templates:

Go to **Authentication → Email Templates**:
- Confirm signup
- Magic Link
- Reset password
- Change email

## Testing Authentication Locally

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Login Flow

1. Visit `http://localhost:3000`
2. Click on "Luo koealue" or navigate to `/create`
3. You should be redirected to `/login`
4. Enter your admin credentials
5. You should be redirected back to `/create`

### 3. Test Protected API Routes

With browser DevTools open:
1. Log in to `/create`
2. Try creating a question set
3. Check Network tab - `/api/generate-questions` should return 200 (not 401)
4. Log out
5. Try creating again - should fail with 401 Unauthorized

### 4. Test Logout

1. Click "Kirjaudu ulos" button in `/create` page
2. You should be redirected to home page
3. Try accessing `/create` - should redirect to `/login`

## Security Considerations

### Production Checklist

- [ ] Enable email confirmation (prevents fake signups)
- [ ] Set secure Site URL (your production domain)
- [ ] Add only necessary redirect URLs
- [ ] Enable RLS on any new tables (if you add user-specific data)
- [ ] Consider adding rate limiting to login endpoint
- [ ] Add password strength requirements
- [ ] Enable 2FA for admin accounts (Supabase Pro feature)

### Environment Variables

Ensure these are set in both local and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### "Unauthorized" errors even when logged in

**Cause**: Session not being persisted or cookies not working

**Solution**:
1. Check browser console for errors
2. Verify cookies are enabled
3. Check that Supabase URL in env variables is correct
4. Clear browser cookies and try again

### Redirect loop on `/create` page

**Cause**: Auth state not loading properly

**Solution**:
1. Check browser console for errors
2. Verify `useAuth` hook is working
3. Check Network tab for auth requests
4. Ensure Supabase client is initialized correctly

### Cannot create users in Supabase

**Cause**: Email provider not enabled

**Solution**:
1. Go to Authentication → Providers
2. Enable Email provider
3. Save changes
4. Try creating user again

### 401 errors on API routes even when logged in

**Cause**: Server-side auth not getting session from cookies

**Solution**:
1. Check that cookies are being sent with requests
2. Verify `server-auth.ts` is correctly reading cookies
3. Check that session is valid (not expired)
4. Try logging out and back in

## Implementation Details

### Files Added/Modified

**New Files**:
- `src/lib/supabase/auth.ts` - Client-side auth utilities
- `src/lib/supabase/server-auth.ts` - Server-side auth verification
- `src/hooks/useAuth.ts` - React hook for authentication
- `src/app/login/page.tsx` - Login page
- `src/components/auth/AuthGuard.tsx` - Route protection component
- `src/components/auth/UserMenu.tsx` - User menu with logout

**Modified Files**:
- `src/app/create/page.tsx` - Added AuthGuard and UserMenu
- `src/app/api/generate-questions/route.ts` - Added auth check
- `src/app/api/delete-question-set/route.ts` - Added auth check

### Architecture

```
Client (Browser)
  ↓
useAuth hook
  ↓
Supabase Client (auth.ts)
  ↓ (session in cookies)
Next.js Server
  ↓
API Route (requireAuth)
  ↓
Supabase Server Client (server-auth.ts)
  ↓
Verify session with Supabase
```

## Next Steps

After authentication is working:

1. **Test thoroughly** in development
2. **Deploy to Vercel** and test in production
3. **Create your admin accounts**
4. **Document credentials** securely (password manager)
5. **Monitor authentication logs** in Supabase dashboard
6. **Consider adding** user roles/permissions if needed

## Support

If you encounter issues:
1. Check Supabase logs: Authentication → Logs
2. Check browser console for client-side errors
3. Check Vercel logs for server-side errors
4. Refer to [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
