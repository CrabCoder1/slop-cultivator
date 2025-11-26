# Authentication System Database Migrations

This document describes the database migrations for the user authentication system in Slop Cultivator.

## Overview

The authentication system uses Supabase Auth with custom database tables for user profiles, achievements, and leaderboard scores. All migrations are designed to be idempotent and can be safely re-run.

## Migration Files

### 20241120000001_setup_authentication_schema.sql

**Purpose**: Initial setup of authentication-related database schema

**What it does**:
1. Creates `profiles` table for user profile data
2. Creates `leaderboard_scores` table for game scores
3. Adds `user_id` column to existing `achievements` table (if it exists)
4. Sets up Row Level Security (RLS) policies for all tables
5. Creates automatic profile creation trigger
6. Adds indexes for performance optimization

**Tables Created**:

#### profiles
- `id` (UUID, PK) - References auth.users(id)
- `username` (TEXT, UNIQUE) - User's chosen username
- `display_name` (TEXT) - User's display name
- `avatar_url` (TEXT) - URL to user's avatar image
- `provider` (TEXT) - OAuth provider ('google', 'discord', 'github', 'steam')
- `provider_id` (TEXT) - Provider-specific user ID
- `created_at` (TIMESTAMPTZ) - Profile creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### leaderboard_scores
- `id` (UUID, PK) - Unique score ID
- `user_id` (UUID, FK) - References auth.users(id), nullable for guest scores
- `anonymous_id` (TEXT) - For guest user scores
- `player_name` (TEXT) - Display name for leaderboard
- `score` (INTEGER) - Game score
- `wave_reached` (INTEGER) - Highest wave reached
- `map_key` (TEXT) - Map identifier
- `created_at` (TIMESTAMPTZ) - Score submission timestamp

**Constraints**:
- Either `user_id` OR `anonymous_id` must be set (not both)
- Cascading deletes: When a user is deleted, their profile is deleted
- Set null on delete: When a user is deleted, their scores remain but user_id is set to null

### 20241123000001_improve_profile_trigger_error_handling.sql

**Purpose**: Improves error handling in the profile creation trigger

**What it does**:
1. Enhances the `handle_new_user()` function with better error handling
2. Adds logging for debugging
3. Handles edge cases in OAuth metadata extraction

## Row Level Security (RLS) Policies

### profiles table

| Policy Name | Operation | Rule |
|------------|-----------|------|
| Profiles are viewable by everyone | SELECT | Always true (public read) |
| Users can create own profile | INSERT | auth.uid() = id |
| Users can update own profile | UPDATE | auth.uid() = id |
| Users can delete own profile | DELETE | auth.uid() = id |

### leaderboard_scores table

| Policy Name | Operation | Rule |
|------------|-----------|------|
| Leaderboard scores are viewable by everyone | SELECT | Always true (public read) |
| Authenticated users can submit scores | INSERT | auth.uid() = user_id |
| Guest users can submit scores | INSERT | user_id IS NULL AND anonymous_id IS NOT NULL |
| Users can update own scores | UPDATE | auth.uid() = user_id |
| Users can delete own scores | DELETE | auth.uid() = user_id |

### achievements table

| Policy Name | Operation | Rule |
|------------|-----------|------|
| Users can view own achievements | SELECT | auth.uid() = user_id |
| Users can insert own achievements | INSERT | auth.uid() = user_id |
| Users can update own achievements | UPDATE | auth.uid() = user_id |

## Triggers

### on_auth_user_created

**Table**: auth.users  
**Timing**: AFTER INSERT  
**Function**: handle_new_user()

**Purpose**: Automatically creates a profile record when a new user signs up via OAuth

**Data Extraction**:
- `username`: From `raw_user_meta_data->>'username'` or falls back to email
- `display_name`: From `raw_user_meta_data->>'full_name'` or `raw_user_meta_data->>'name'`
- `avatar_url`: From `raw_user_meta_data->>'avatar_url'`
- `provider`: From `raw_app_meta_data->>'provider'` (defaults to 'email')
- `provider_id`: From `raw_user_meta_data->>'provider_id'`

### update_profiles_updated_at

**Table**: profiles  
**Timing**: BEFORE UPDATE  
**Function**: update_updated_at_column()

**Purpose**: Automatically updates the `updated_at` timestamp when a profile is modified

## Applying Migrations

### Using Supabase CLI (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --file supabase/migrations/20241120000001_setup_authentication_schema.sql
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the migration SQL
5. Click **Run** to execute

### Using the MCP Tool (if configured)

```typescript
// Apply migration using the Supabase MCP tool
await mcp_supabase_apply_migration({
  name: "setup_authentication_schema",
  query: "-- SQL content here --"
});
```

## Rollback Procedures

If you need to rollback the authentication migrations, use the rollback script:

```bash
# Using Supabase CLI
supabase db push --file supabase/migrations/rollback_authentication_schema.sql
```

**Warning**: Rolling back will:
- Drop the `profiles` table and all profile data
- Drop the `leaderboard_scores` table and all scores
- Remove the `user_id` column from `achievements` table
- Remove all RLS policies
- Remove the profile creation trigger

**Before rolling back**:
1. Backup your database
2. Export any data you want to keep
3. Notify users of potential data loss

## Verification

After applying migrations, verify the setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'leaderboard_scores');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'leaderboard_scores', 'achievements');

-- Check if policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Test profile creation (will create a test profile)
-- Note: Only run this if you have a test user
SELECT public.handle_new_user();
```

## Common Issues and Solutions

### Issue: Migration fails with "relation already exists"

**Solution**: The migration is idempotent and uses `IF NOT EXISTS` clauses. This error should not occur, but if it does, check if the table was created outside of migrations.

### Issue: RLS policies prevent data access

**Solution**: 
1. Verify you're authenticated: `SELECT auth.uid();` should return a UUID
2. Check policy definitions match your use case
3. Temporarily disable RLS for debugging: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
4. Re-enable after fixing: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`

### Issue: Profile not created automatically on signup

**Solution**:
1. Check if trigger exists: See verification queries above
2. Check Supabase logs for errors
3. Verify OAuth metadata is being passed correctly
4. Manually create profile if needed:
```sql
INSERT INTO public.profiles (id, username, provider)
VALUES (auth.uid(), 'username', 'google');
```

### Issue: Guest scores not saving

**Solution**:
1. Verify `anonymous_id` is being set
2. Check that `user_id` is NULL for guest scores
3. Verify RLS policy "Guest users can submit scores" exists

## Data Migration

### Migrating Existing Anonymous Data

If you have existing anonymous user data that needs to be migrated:

```sql
-- Example: Migrate anonymous achievements to authenticated user
UPDATE public.achievements
SET user_id = 'user-uuid-here'
WHERE anonymous_id = 'guest-id-here'
  AND user_id IS NULL;

-- Example: Migrate anonymous leaderboard scores
UPDATE public.leaderboard_scores
SET user_id = 'user-uuid-here',
    anonymous_id = NULL
WHERE anonymous_id = 'guest-id-here'
  AND user_id IS NULL;
```

## Performance Considerations

### Indexes

The migration creates the following indexes for optimal query performance:

**profiles**:
- `idx_profiles_username` - For username lookups
- `idx_profiles_provider` - For filtering by OAuth provider

**leaderboard_scores**:
- `idx_leaderboard_scores_user_id` - For user score queries
- `idx_leaderboard_scores_anonymous_id` - For guest score queries
- `idx_leaderboard_scores_score` - For leaderboard ranking (DESC order)
- `idx_leaderboard_scores_map_key` - For map-specific leaderboards

**achievements**:
- `idx_achievements_user_id` - For user achievement queries

### Query Optimization Tips

1. **Leaderboard queries**: Always use the score index
```sql
SELECT * FROM leaderboard_scores 
ORDER BY score DESC 
LIMIT 100;
```

2. **User profile lookups**: Use the username index
```sql
SELECT * FROM profiles 
WHERE username = 'player123';
```

3. **User-specific queries**: Let RLS handle filtering
```sql
-- RLS automatically adds: WHERE user_id = auth.uid()
SELECT * FROM achievements;
```

## Security Considerations

### RLS Best Practices

1. **Always enable RLS** on tables containing user data
2. **Test policies** with different user contexts
3. **Use SECURITY DEFINER** carefully - only for trusted functions
4. **Audit policies regularly** to ensure they match requirements

### Token Security

The authentication system uses Supabase's built-in token management:
- Access tokens expire after 1 hour
- Refresh tokens are used to obtain new access tokens
- Tokens are stored securely in browser storage
- PKCE is used for OAuth flows (handled by Supabase)

### Data Privacy

- User emails are stored in `auth.users` (managed by Supabase)
- Profile data is public (usernames, display names, avatars)
- Achievements are private (only visible to owner)
- Leaderboard scores are public (visible to everyone)

## Monitoring

### Useful Queries for Monitoring

```sql
-- Count users by provider
SELECT provider, COUNT(*) 
FROM profiles 
GROUP BY provider;

-- Recent signups
SELECT created_at, username, provider 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Leaderboard statistics
SELECT 
  COUNT(*) as total_scores,
  COUNT(DISTINCT user_id) as authenticated_users,
  COUNT(DISTINCT anonymous_id) as guest_users
FROM leaderboard_scores;

-- Achievement statistics
SELECT 
  COUNT(*) as total_achievements,
  COUNT(DISTINCT user_id) as users_with_achievements
FROM achievements
WHERE user_id IS NOT NULL;
```

## Support

For issues with migrations:
1. Check Supabase logs in the dashboard
2. Review this documentation
3. Check the main [OAuth Setup Guide](../../docs/oauth-setup-guide.md)
4. Consult [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
