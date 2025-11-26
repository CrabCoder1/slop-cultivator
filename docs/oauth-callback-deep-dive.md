# OAuth Callback Deep Dive - Root Cause Analysis

**Date:** 2024-11-23  
**Issue:** OAuth login returns to login screen instead of completing authentication

## The Problem

**Symptom:** After Google OAuth redirect, user sees login screen again (not authenticated)

**Console Output:**
```
OAuth callback detected, cleaning URL and waiting for onAuthStateChange...
Auth state changed: INITIAL_SESSION null
```

## Root Cause

**We're interfering with Supabase's automatic OAuth handling.**

### How Supabase OAuth Works

1. User clicks "Sign in with Google"
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User is redirected to Google
4. Google redirects back to app with OAuth code in URL: `http://localhost:5173/auth/callback?code=...`
5. **Supabase client automatically detects code in URL** (via `detectSessionInUrl: true`)
6. Supabase exchanges code for session
7. Supabase triggers `onAuthStateChange` with `SIGNED_IN` event
8. Supabase cleans up URL automatically

### What We Were Doing Wrong

```typescript
if (hasOAuthParams) {
  console.log('OAuth callback detected, cleaning URL...');
  // ❌ PROBLEM: We clean URL immediately
  window.history.replaceState({}, document.title, window.location.pathname);
  // Now Supabase can't read the OAuth code!
  return;
}
```

**Timeline:**
1. OAuth callback URL loads: `http://localhost:5173/auth/callback?code=ABC123`
2. React app mounts
3. AuthContext `initAuth` runs
4. We detect OAuth params and **immediately clean URL**
5. URL becomes: `http://localhost:5173/`
6. Supabase client initializes and looks for OAuth params
7. **Supabase finds nothing** (we already cleaned it!)
8. Supabase fires `INITIAL_SESSION null` event
9. User sees login screen

## The Fix

**Stop interfering with Supabase's OAuth handling entirely.**

### Option 1: Remove Manual OAuth Detection (Recommended)

Let Supabase handle everything automatically:

```typescript
useEffect(() => {
  const initAuth = async () => {
    try {
      setIsLoading(true);
      
      // Don't manually detect OAuth - Supabase handles it
      // Just check for existing session
      
      // Check for guest data
      const hasData = guestMigrationService.hasGuestData();
      setHasGuestData(hasData);
      
      // Check if user was in guest mode
      const guestModeFlag = localStorage.getItem(GUEST_MODE_KEY);
      if (guestModeFlag === 'true') {
        setIsGuestMode(true);
        setIsLoading(false);
        return;
      }
      
      // Try to restore session from storage
      const currentSession = await authService.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Load user profile
        const userProfile = await loadProfile(currentSession.user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  initAuth();
}, [loadProfile]);
```

### Option 2: Wait for Supabase to Process First

If we must detect OAuth for UX reasons (showing custom loading), wait for Supabase:

```typescript
if (hasOAuthParams) {
  console.log('OAuth callback detected, waiting for Supabase...');
  // Don't clean URL - let Supabase read it
  // Don't set isLoading(false) - let onAuthStateChange handle it
  return; // Stay in loading state
}
```

## Why This Matters

Supabase's `detectSessionInUrl` feature:
- Runs automatically when client initializes
- Reads OAuth params from URL
- Exchanges code for session
- Stores session in localStorage
- Triggers `onAuthStateChange` event
- Cleans up URL automatically

**We must not interfere with this process.**

## Testing Verification

After fix, console should show:
```
Auth state changed: SIGNED_IN { user: {...}, access_token: "..." }
Loading profile for user: 40776a1f-cddf-4bbf-a7fa-67ac8281619b
Profile loaded successfully: {...}
```

## Related Issues

- Supabase docs: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- PKCE flow: https://supabase.com/docs/guides/auth/server-side/pkce-flow
- detectSessionInUrl: https://supabase.com/docs/reference/javascript/initializing#parameters

## Lessons Learned

1. **Trust the framework** - Supabase handles OAuth automatically
2. **Don't clean URLs prematurely** - OAuth params are needed for exchange
3. **Let events drive state** - Use `onAuthStateChange` as single source of truth
4. **Test the happy path first** - Ensure basic flow works before adding complexity
