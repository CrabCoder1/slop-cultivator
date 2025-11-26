# Authentication System Setup

This document provides instructions for setting up the authentication system database schema.

## Overview

The authentication system adds user authentication capabilities to Slop Cultivator, including:

- User profiles linked to Supabase Auth
- OAuth provider support (Google, Discord, GitHub, Steam)
- Leaderboard scores for authenticated and guest users
- User-specific achievements
- Automatic profile creation on signup
- Row Level Security (RLS) policies for data protection

## Migration File

**File**: `20241120000001_setup_authentication_schema.sql`

This migration creates:

1. **profiles table** - User profile data linked to auth.users
2. **leaderboard_scores table** - Leaderboard entries for authenticated and guest users
3. **user_id column** - Added to achievements table (if exists)
4. **RLS policies** - Security policies for all authentication-related tables
5. **Database trigger** - Automatic profile creation when users sign up
6. **Updated_at triggers** - Automatic timestamp updates

## Prerequisites

Before applying this migration:

1. ✅ Supabase project is set up
2. ✅ Database connection is configured
3. ✅ You have admin access to the database
4. ⚠️ **Backup your database** (especially if you have existing data)

## Applying the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd /path/to/castle-defense

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `20241120000001_setup_authentication_schema.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Check for success messages in the output

### Option 3: Using psql

```bash
# Connect to your database
psql -h db.your-project-ref.supabase.co -U postgres -d postgres

# Run the migration
\i supabase/migrations/20241120000001_setup_authentication_schema.sql

# Exit
\q
```

## Verification

After applying the migration, verify everything is set up correctly:

### 1. Check Tables Exist

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'leaderboard_scores');
```

Expected result: Both tables should be listed.

### 2. Check Columns

```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if user_id was added to achievements (if table exists)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'achievements'
  AND column_name = 'user_id';
```

### 3. Check RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'leaderboard_scores', 'achievements');

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'leaderboard_scores', 'achievements')
ORDER BY tablename, policyname;
```

### 4. Check Trigger

```sql
-- Check if profile creation trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 5. Test Profile Creation

```sql
-- This should be tested through the application by signing up a new user
-- The trigger will automatically create a profile entry
```

## Database Schema

### profiles

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, references auth.users(id) |
| username | TEXT | Yes | Unique username |
| display_name | TEXT | Yes | Display name |
| avatar_url | TEXT | Yes | Profile picture URL |
| provider | TEXT | Yes | OAuth provider (google, discord, github, steam) |
| provider_id | TEXT | Yes | Provider-specific user ID |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

### leaderboard_scores

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | Yes | References auth.users(id) for authenticated users |
| anonymous_id | TEXT | Yes | Anonymous ID for guest users |
| player_name | TEXT | No | Player display name |
| score | INTEGER | No | Game score |
| wave_reached | INTEGER | No | Highest wave reached |
| map_key | TEXT | Yes | Map identifier |
| created_at | TIMESTAMPTZ | No | Score submission timestamp |

**Constraint**: Either `user_id` OR `anonymous_id` must be set (not both, not neither)

## RLS Policies

### profiles

- ✅ **Public read**: Everyone can view all profiles (for leaderboard display)
- ✅ **User insert**: Users can create their own profile
- ✅ **User update**: Users can only update their own profile
- ✅ **User delete**: Users can only delete their own profile

### leaderboard_scores

- ✅ **Public read**: Everyone can view leaderboard scores
- ✅ **Authenticated insert**: Authenticated users can submit scores with their user_id
- ✅ **Guest insert**: Guest users can submit scores with anonymous_id
- ✅ **User update**: Users can update their own scores
- ✅ **User delete**: Users can delete their own scores

### achievements (if table exists)

- ✅ **User read**: Users can view their own achievements
- ✅ **User insert**: Users can create their own achievements
- ✅ **User update**: Users can update their own achievements

## Automatic Profile Creation

When a user signs up through any OAuth provider:

1. Supabase Auth creates a record in `auth.users`
2. The `on_auth_user_created` trigger fires
3. The `handle_new_user()` function extracts user data from OAuth metadata
4. A profile is automatically created in `public.profiles` with:
   - `id`: User's auth.users ID
   - `username`: From OAuth metadata or email
   - `display_name`: From OAuth metadata (full_name or name)
   - `avatar_url`: From OAuth metadata
   - `provider`: OAuth provider name
   - `provider_id`: Provider-specific user ID

## OAuth Provider Configuration

After applying this migration, you need to configure OAuth providers:

1. **Google OAuth**: See [OAuth Setup Guide](../../docs/oauth-setup-guide.md#google-oauth-setup)
2. **Discord OAuth**: See [OAuth Setup Guide](../../docs/oauth-setup-guide.md#discord-oauth-setup)
3. **GitHub OAuth** (optional): See [OAuth Setup Guide](../../docs/oauth-setup-guide.md#github-oauth-setup-optional---for-future)

## Rollback

If you need to rollback this migration:

```sql
-- WARNING: This will delete all authentication-related data!

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.leaderboard_scores CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove user_id column from achievements (if it exists)
ALTER TABLE public.achievements DROP COLUMN IF EXISTS user_id;
```

⚠️ **Warning**: Rollback will permanently delete all user profiles and leaderboard scores. Only use for development/testing.

## Next Steps

After applying this migration:

1. ✅ Configure OAuth providers in Supabase dashboard
2. ✅ Set up Site URL and Redirect URLs
3. ✅ Implement AuthService in the application
4. ✅ Create authentication UI components
5. ✅ Test authentication flow
6. ✅ Integrate with existing game systems

See the [User Authentication Tasks](../../.kiro/specs/user-authentication/tasks.md) for the complete implementation plan.

## Troubleshooting

### Migration Fails with "relation already exists"

**Problem**: Tables or functions already exist from a previous migration attempt.

**Solution**: Either:
1. Drop the existing objects manually and re-run
2. Modify the migration to use `CREATE TABLE IF NOT EXISTS`
3. Skip this migration if schema is already correct

### Trigger Not Firing

**Problem**: Profiles are not created automatically when users sign up.

**Solution**:
1. Check if trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
2. Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Check Supabase logs for errors
4. Verify auth.users table is accessible

### RLS Policies Too Restrictive

**Problem**: Users can't access their own data.

**Solution**:
1. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
3. Test with `auth.uid()` in SQL editor
4. Check if user is authenticated

### Leaderboard Constraint Violation

**Problem**: Can't insert leaderboard scores due to constraint violation.

**Solution**:
1. Ensure either `user_id` OR `anonymous_id` is set (not both)
2. For authenticated users: set `user_id`, leave `anonymous_id` NULL
3. For guest users: set `anonymous_id`, leave `user_id` NULL

## Support

For issues or questions:

1. Check the [Design Document](../../.kiro/specs/user-authentication/design.md)
2. Review the [Requirements](../../.kiro/specs/user-authentication/requirements.md)
3. Consult [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
4. Check Supabase project logs for errors

## References

- [User Authentication Design](../../.kiro/specs/user-authentication/design.md)
- [User Authentication Requirements](../../.kiro/specs/user-authentication/requirements.md)
- [OAuth Setup Guide](../../docs/oauth-setup-guide.md)
- [Database Schema Documentation](../../docs/database-schema.md)
