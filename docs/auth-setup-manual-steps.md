# Authentication Setup - Manual Configuration Steps

This document outlines the manual steps you need to complete in the Supabase dashboard and OAuth provider consoles to enable authentication in Slop Cultivator.

## Overview

The database schema has been created via migration, but OAuth providers require manual configuration through their respective dashboards. This is a one-time setup process.

## Step-by-Step Checklist

### ✅ Step 1: Apply Database Migration

**Status**: Ready to apply

**Action**: Apply the migration file to create the authentication schema.

**Options**:

**Option A: Supabase Dashboard (Easiest)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Open `supabase/migrations/20241120000001_setup_authentication_schema.sql`
5. Copy all contents and paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success messages appear

**Option B: Supabase CLI**
```bash
supabase db push
```

**Verification**: Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'leaderboard_scores');
```
You should see both tables listed.

---

### ✅ Step 2: Configure Supabase Auth URLs

**Location**: Supabase Dashboard → Authentication → URL Configuration

**Action**: Set the Site URL and Redirect URLs for your application.

**For Local Development**:
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: Add `http://localhost:5173/**`

**For Production** (update later when deploying):
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: Add `https://yourdomain.com/**`

**Why**: These URLs tell Supabase where to redirect users after authentication.

---

### ✅ Step 3: Set Up Google OAuth

**Time Required**: ~10 minutes

**Prerequisites**: Google account

**Steps**:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project: "Slop Cultivator"

2. **Configure OAuth Consent Screen** (Required before creating credentials)
   - Go to APIs & Services → OAuth consent screen
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Slop Cultivator"
     - User support email: your email
     - Developer contact: your email
   - Save and continue through the steps (skip scopes, optionally add test users)

3. **Create OAuth Client**
   - Go to APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "Slop Cultivator Web Client"
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: Get from Supabase (see below)

4. **Get Supabase Callback URL**
   - In Supabase Dashboard → Authentication → Providers → Google
   - Copy the "Callback URL (for OAuth)"
   - Format: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Add this to Google's Authorized redirect URIs

5. **Copy Credentials to Supabase**
   - Copy Client ID from Google Cloud Console
   - Copy Client Secret from Google Cloud Console
   - In Supabase Dashboard → Authentication → Providers → Google:
     - Toggle "Enable Sign in with Google" to ON
     - Paste Client ID
     - Paste Client Secret
     - Click Save

**Detailed Guide**: See [OAuth Setup Guide - Google Section](./oauth-setup-guide.md#google-oauth-setup)

---

### ✅ Step 4: Set Up Discord OAuth

**Time Required**: ~5 minutes

**Prerequisites**: Discord account

**Steps**:

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Name: "Slop Cultivator"
   - Create

2. **Configure OAuth2**
   - In your application, go to OAuth2
   - Under Redirects, click "Add Redirect"
   - Get callback URL from Supabase (see below)

3. **Get Supabase Callback URL**
   - In Supabase Dashboard → Authentication → Providers → Discord
   - Copy the "Callback URL (for OAuth)"
   - Format: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Add this to Discord's Redirects

4. **Copy Credentials to Supabase**
   - In Discord Developer Portal → OAuth2:
     - Copy Client ID
     - Click "Reset Secret" to generate Client Secret
     - Copy Client Secret (you won't see it again!)
   - In Supabase Dashboard → Authentication → Providers → Discord:
     - Toggle "Enable Sign in with Discord" to ON
     - Paste Client ID
     - Paste Client Secret
     - Click Save

**Detailed Guide**: See [OAuth Setup Guide - Discord Section](./oauth-setup-guide.md#discord-oauth-setup)

---

### ⏭️ Step 5: GitHub OAuth (Optional - For Later)

**Status**: Not required for initial release

GitHub OAuth can be added later following the same pattern as Google and Discord.

**When to add**: After initial release, if users request it.

---

### ⏭️ Step 6: Steam Authentication (Optional - Requires Steam Partner)

**Status**: Not required for initial release

**Prerequisites**: 
- Steam Partner account
- Steam Web API Key

**Note**: Steam authentication requires a Steam Partner account, which requires an approved game on Steam. This is marked as optional in the implementation plan.

---

## Verification Checklist

After completing the setup, verify everything works:

### Database Schema
- [ ] Run verification query (Step 1) - both tables exist
- [ ] Check trigger exists: 
  ```sql
  SELECT trigger_name FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  ```

### Supabase Configuration
- [ ] Site URL is set to `http://localhost:5173`
- [ ] Redirect URLs include `http://localhost:5173/**`
- [ ] Google provider is enabled with credentials
- [ ] Discord provider is enabled with credentials

### OAuth Providers
- [ ] Google Cloud Console has correct redirect URI
- [ ] Discord Developer Portal has correct redirect URI
- [ ] Credentials are copied correctly (no extra spaces)

### Testing (After Implementation)
- [ ] Can sign in with Google
- [ ] Can sign in with Discord
- [ ] Profile is created automatically
- [ ] Can sign out
- [ ] Session persists across page refresh

---

## Common Issues

### "Redirect URI mismatch"

**Problem**: OAuth provider rejects redirect.

**Solution**: 
1. Verify callback URL in Supabase matches exactly what's in OAuth provider
2. Check for trailing slashes
3. Ensure correct protocol (http vs https)

### "Invalid Client"

**Problem**: OAuth provider doesn't recognize credentials.

**Solution**:
1. Verify Client ID and Secret are copied correctly
2. Check for extra spaces
3. Regenerate Client Secret if needed

### Profile Not Created

**Problem**: User signs in but no profile appears.

**Solution**:
1. Check if trigger exists (see verification query above)
2. Check Supabase logs for errors
3. Verify RLS policies allow insertion

---

## What Happens Next

After completing these manual steps:

1. ✅ Database schema is ready
2. ✅ OAuth providers are configured
3. ⏭️ Next: Implement AuthService (Task 2)
4. ⏭️ Next: Create authentication UI (Task 4)
5. ⏭️ Next: Integrate with game systems (Task 7)

---

## Time Estimate

- **Database Migration**: 5 minutes
- **Supabase URL Configuration**: 2 minutes
- **Google OAuth Setup**: 10 minutes
- **Discord OAuth Setup**: 5 minutes
- **Total**: ~25 minutes

---

## Need Help?

- **OAuth Setup Details**: See [OAuth Setup Guide](./oauth-setup-guide.md)
- **Database Schema**: See [AUTH_SETUP_README.md](../supabase/migrations/AUTH_SETUP_README.md)
- **Design Document**: See [User Authentication Design](../.kiro/specs/user-authentication/design.md)
- **Supabase Docs**: [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

## Production Deployment

When deploying to production, you'll need to:

1. Update Site URL and Redirect URLs in Supabase to production domain
2. Add production domain to Google Cloud Console authorized origins
3. Add production callback URL to Discord Developer Portal
4. Test authentication flow in production environment

See [OAuth Setup Guide - Production Checklist](./oauth-setup-guide.md#production-deployment-checklist) for details.
