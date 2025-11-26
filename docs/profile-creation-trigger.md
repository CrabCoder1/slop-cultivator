# Profile Creation Trigger Documentation

## Overview

The profile creation trigger automatically creates a user profile in the `public.profiles` table whenever a new user is created in `auth.users`. This ensures that every authenticated user has a corresponding profile record.

## Implementation

### Trigger Function: `handle_new_user()`

**Location:** `supabase/migrations/20241123000001_improve_profile_trigger_error_handling.sql`

**Purpose:** Automatically extract user data from OAuth metadata and create a profile record.

### Data Extraction

The trigger extracts the following data from OAuth providers:

| Field | Source | Fallback |
|-------|--------|----------|
| `username` | `raw_user_meta_data->>'username'` | `email` or `user_{id}` |
| `display_name` | `raw_user_meta_data->>'full_name'` | `name` or `username` |
| `avatar_url` | `raw_user_meta_data->>'avatar_url'` | `picture` or `null` |
| `provider` | `raw_app_meta_data->>'provider'` | `'email'` |
| `provider_id` | `raw_user_meta_data->>'provider_id'` | `sub` or `null` |

### Error Handling

The trigger implements graceful error handling:

1. **Unique Violation (Duplicate Username)**
   - If the username already exists, it falls back to `user_{first_8_chars_of_id}`
   - Retries profile creation with the fallback username

2. **Other Errors**
   - Logs a warning but doesn't fail user authentication
   - Attempts minimal profile creation with just `id`, `username`, and `provider`
   - If even minimal creation fails, logs critical warning but allows user creation to succeed

3. **Logging**
   - Success: `NOTICE` level log
   - Recoverable errors: `WARNING` level log
   - Critical errors: `WARNING` level log with "Critical:" prefix

### Trigger Configuration

**Trigger Name:** `on_auth_user_created`

**Timing:** `AFTER INSERT` on `auth.users`

**Scope:** `FOR EACH ROW`

**Function:** `public.handle_new_user()`

## OAuth Provider Metadata

Different OAuth providers send different metadata fields:

### Google OAuth
```json
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "sub": "1234567890"
}
```

### Discord OAuth
```json
{
  "username": "johndoe",
  "avatar": "a1b2c3d4e5f6",
  "discriminator": "1234",
  "id": "1234567890"
}
```

### GitHub OAuth
```json
{
  "login": "johndoe",
  "name": "John Doe",
  "avatar_url": "https://avatars.githubusercontent.com/...",
  "id": 1234567
}
```

### Steam OAuth
```json
{
  "steamid": "76561198012345678",
  "personaname": "JohnDoe",
  "avatarfull": "https://steamcdn-a.akamaihd.net/..."
}
```

## Testing

### Manual Testing

To test the trigger manually:

```sql
-- Insert a test user (requires admin access)
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  '{"name": "Test User", "avatar_url": "https://example.com/avatar.jpg"}'::jsonb,
  '{"provider": "google"}'::jsonb
);

-- Verify profile was created
SELECT * FROM public.profiles WHERE email = 'test@example.com';
```

### Integration Testing

The trigger is tested as part of the authentication flow:

1. User signs in with OAuth provider
2. Supabase creates user in `auth.users`
3. Trigger automatically creates profile in `public.profiles`
4. Application loads profile using `ProfileService.getProfile()`

## Troubleshooting

### Profile Not Created

**Symptoms:** User authenticated but no profile exists

**Possible Causes:**
1. Trigger not enabled
2. RLS policies blocking insert
3. Database connection issues

**Resolution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Manually create profile if needed
INSERT INTO public.profiles (id, username, provider)
VALUES ('{user_id}', 'user_{user_id}', 'google');
```

### Duplicate Username Errors

**Symptoms:** Warning logs about username conflicts

**Cause:** Multiple users with same username from different providers

**Resolution:** The trigger automatically handles this by using `user_{id}` as fallback

### Missing Metadata

**Symptoms:** Profile created with null fields

**Cause:** OAuth provider didn't send expected metadata

**Resolution:** The trigger uses fallback values. Users can update their profile later using `ProfileService.updateProfile()`

## Migration

To apply the improved trigger:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# Copy contents of 20241123000001_improve_profile_trigger_error_handling.sql
# Paste into SQL Editor and run
```

## Requirements Validation

This implementation satisfies:

- **Requirement 1.3:** Profile creation from OAuth data (Google, Discord, GitHub)
- **Requirement 1.5:** Profile creation from Steam authentication
- **Graceful Error Handling:** Trigger doesn't fail user authentication even if profile creation fails

## Related Files

- Migration: `supabase/migrations/20241123000001_improve_profile_trigger_error_handling.sql`
- Original Migration: `supabase/migrations/20241120000001_setup_authentication_schema.sql`
- Profile Service: `shared/utils/profile-service.ts`
- Auth Service: `shared/utils/auth-service.ts`
