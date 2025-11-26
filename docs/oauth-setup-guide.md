# OAuth Provider Setup Guide

This guide walks you through setting up OAuth authentication providers for Slop Cultivator. We're implementing Google and Discord OAuth for the initial release.

## Prerequisites

- Access to Supabase dashboard for your project
- Google Cloud Console account (for Google OAuth)
- Discord Developer Portal account (for Discord OAuth)

## Supabase Auth Configuration

### 1. Configure Site URL and Redirect URLs

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set the following URLs:

**For Local Development:**
- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: Add `http://localhost:5173/**` (the wildcard allows all paths)

**For Production:**
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: Add `https://yourdomain.com/**`

> **Note**: You'll need to update these URLs when deploying to production.

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name (e.g., "Slop Cultivator")
4. Click **Create**

### Step 2: Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen:

1. In your project, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: "Slop Cultivator"
   - **User support email**: Select your email from dropdown
   - **App logo**: (Optional) Upload a logo
   - **Application home page**: (Optional) Your website URL
   - **Authorized domains**: (Leave empty for now, add your domain later)
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. **Scopes**: Click **Save and Continue** (no additional scopes needed for basic auth)
7. **Test users**: (Optional) Add test users if you want to test before publishing
8. Click **Save and Continue**
9. Review the summary and click **Back to Dashboard**

> **Note**: Your app will be in "Testing" mode. Users can still sign in, but you may see an "unverified app" warning. You can publish the app later to remove this warning.

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name: "Slop Cultivator Web Client"
5. Under **Authorized JavaScript origins**, click **Add URI**:
   - For local development: `http://localhost:5173`
   - For production (add later): `https://yourdomain.com`
6. Under **Authorized redirect URIs**, click **Add URI**:
   - Get your Supabase callback URL:
     - Go to Supabase Dashboard → **Authentication** → **Providers**
     - Click on **Google** from the accordion list to expand it
     - Scroll down to find **Callback URL (for OAuth)** at the bottom
     - Click the **Copy** button next to the URL
     - Format: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Paste this URL into Google Cloud Console
7. Click **Create**
8. A dialog will appear with your **Client ID** and **Client Secret**
9. Copy both values (you can also download the JSON file)

> **Important**: Keep your Client Secret secure. Don't commit it to version control.

### Step 4: Configure in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Sign in with Google** to ON
5. In the **Client IDs** field, paste your **Client ID** (from Google Cloud Console)
6. In the **Client Secret (for OAuth)** field, paste your **Client Secret** (from Google Cloud Console)
7. Click **Save**

### Testing Google OAuth

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click the Google sign-in button
4. You should be redirected to Google's consent screen
5. After granting permission, you should be redirected back to your app

## Discord OAuth Setup

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Enter application name (e.g., "Slop Cultivator")
4. Accept the Terms of Service
5. Click **Create**

### Step 2: Configure OAuth2 Settings

1. In your application, go to **OAuth2** in the left sidebar
2. Under **Redirects**, click **Add Redirect**
3. Add your Supabase callback URL:
   - Get it from Supabase dashboard:
     - Go to **Authentication** → **Providers** → **Discord**
     - Copy the "Callback URL (for OAuth)" (format: `https://[project-ref].supabase.co/auth/v1/callback`)
   - Paste this URL into Discord's redirect field
4. Click **Save Changes**

### Step 3: Get Client Credentials

1. Still in the **OAuth2** section
2. Copy your **Client ID** (at the top of the page)
3. Click **Reset Secret** to generate a new Client Secret
4. Copy the **Client Secret** (you won't be able to see it again!)

### Step 4: Configure in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Discord** and click to expand
4. Toggle **Enable Sign in with Discord** to ON
5. In the **Client IDs** field, paste your **Client ID** (from Discord Developer Portal)
6. In the **Client Secret (for OAuth)** field, paste your **Client Secret** (from Discord Developer Portal)
7. Click **Save**

### Testing Discord OAuth

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click the Discord sign-in button
4. You should be redirected to Discord's authorization screen
5. After authorizing, you should be redirected back to your app

## GitHub OAuth Setup (Optional - For Future)

GitHub OAuth can be added later following a similar pattern:

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to Supabase callback URL
4. Copy Client ID and Client Secret
5. Configure in Supabase Authentication → Providers → GitHub

## Production Deployment Checklist

When deploying to production, update the following:

### Google Cloud Console
- [ ] Add production domain to Authorized JavaScript origins
- [ ] Add production Supabase callback URL to Authorized redirect URIs
- [ ] Update OAuth consent screen with production URLs
- [ ] Remove test users restriction (publish app)

### Discord Developer Portal
- [ ] Add production Supabase callback URL to Redirects
- [ ] Update application description and icon
- [ ] Verify Terms of Service URL

### Supabase Dashboard
- [ ] Update Site URL to production domain
- [ ] Update Redirect URLs to production domain
- [ ] Verify OAuth provider credentials are correct
- [ ] Test authentication flow in production

## Troubleshooting

### "Redirect URI mismatch" Error

**Problem**: OAuth provider rejects the redirect because the URI doesn't match.

**Solution**:
1. Verify the callback URL in Supabase matches exactly what's configured in the OAuth provider
2. Check for trailing slashes (they matter!)
3. Ensure you're using the correct protocol (http vs https)

### "Invalid Client" Error

**Problem**: OAuth provider doesn't recognize your client credentials.

**Solution**:
1. Verify Client ID and Client Secret are copied correctly (no extra spaces)
2. Check if Client Secret has expired or been regenerated
3. Ensure the OAuth provider is enabled in Supabase

### Users Can't Sign In Locally

**Problem**: OAuth works in production but not locally.

**Solution**:
1. Verify `http://localhost:5173` is added to authorized origins/redirects
2. Check that Site URL in Supabase is set to `http://localhost:5173`
3. Clear browser cookies and try again
4. Check browser console for CORS errors

### Profile Not Created After Sign In

**Problem**: User signs in successfully but no profile is created.

**Solution**:
1. Check if the database trigger `on_auth_user_created` exists
2. Verify the `handle_new_user()` function is working
3. Check Supabase logs for errors
4. Ensure RLS policies allow profile insertion

## Security Best Practices

1. **Never commit OAuth secrets**: Keep Client Secrets in environment variables
2. **Use HTTPS in production**: OAuth providers require HTTPS for production
3. **Rotate secrets regularly**: Change Client Secrets periodically
4. **Limit OAuth scopes**: Only request necessary permissions
5. **Validate redirect URIs**: Keep the whitelist as restrictive as possible
6. **Monitor OAuth usage**: Check for unusual authentication patterns

## Testing Authentication

### Dependency Injection for Testing

The `AuthService` class supports dependency injection to enable proper testing without requiring a live Supabase instance.

**Production Usage** (default):
```typescript
import { authService } from '../shared/utils/auth-service';

// Uses the real Supabase client
const session = await authService.getSession();
```

**Testing Usage** (with mock):
```typescript
import { AuthService } from '../shared/utils/auth-service';

// Create a mock Supabase client
const mockSupabase = {
  auth: {
    signInWithOAuth: async () => ({ data: { url: 'mock-url' }, error: null }),
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    // ... other methods
  }
};

// Inject the mock client
const testAuthService = new AuthService(mockSupabase as any);

// Now test with the mock
const result = await testAuthService.handleOAuthCallback();
```

**Why This Is Safe**:
- Production code always uses the default singleton `authService` which uses the real Supabase client
- The constructor parameter is only accessible to your own code, not user input
- No new attack surface is created - it's the same pattern used by React props, Express middleware, etc.
- This is a standard software design pattern (dependency injection), not a security vulnerability

**Benefits**:
- Enables property-based testing with 100+ test iterations
- No need for test Supabase instances or complex mocking frameworks
- Tests run faster without network calls
- More reliable tests that don't depend on external services

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## Support

If you encounter issues not covered in this guide:

1. Check Supabase logs in the dashboard
2. Check browser console for errors
3. Verify all URLs and credentials are correct
4. Test with a different browser or incognito mode
5. Consult the Supabase community or Discord
