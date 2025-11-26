# RCA: OAuth Login Stuck on Loading Screen

**Date:** 2024-11-23  
**Severity:** High  
**Status:** Resolved

## Summary

After implementing OAuth authentication (Google/Discord), users get stuck on an infinite loading screen after successfully authenticating. The issue occurs when the app tries to load the player profile for authenticated users.

## Timeline

1. User clicks "Sign in with Google"
2. OAuth flow completes successfully, user is redirected back with auth code
3. Supabase exchanges code for session (works)
4. Profile trigger creates entry in `profiles` table (works)
5. App.tsx calls `loadPlayerProfile()` to load game data
6. `loadPlayerProfile()` queries `player_profiles` table with `user_id`
7. **FAILURE**: Query fails because `player_profiles` table doesn't have `user_id` column
8. App gets stuck in loading state

## Root Cause

**Missing database schema migration**: The `player_profiles` table was never updated to support authenticated users.

### Current State

Two separate profile tables exist:
- `profiles` table: Stores auth user metadata (username, avatar, provider info)
- `player_profiles` table: Stores game stats (scores, unlocked content, achievements)

The `player_profiles` table only has:
- `id` (UUID primary key)
- `anonymous_id` (TEXT, for guest users)
- `stats` (JSONB)
- `unlocked_species`, `unlocked_daos`, `unlocked_titles` (arrays)

### What's Missing

The `player_profiles` table needs:
1. `user_id` column (UUID, references auth.users)
2. Make `anonymous_id` nullable (currently NOT NULL)
3. Add constraint: either `user_id` OR `anonymous_id` must be set
4. Update RLS policies for authenticated access
5. Create index on `user_id` for performance

## Impact

- **Severity**: High - Blocks all OAuth authentication flows
- **Affected Users**: Any user attempting to sign in with Google or Discord
- **Workaround**: Guest mode still works (uses localStorage)

## Resolution

Create migration to:
1. Add `user_id` column to `player_profiles`
2. Make `anonymous_id` nullable
3. Add check constraint for user_id/anonymous_id
4. Update RLS policies
5. Update `authenticated-player-profile-service.ts` to handle both tables correctly

## Prevention

- **Testing Gap**: Integration tests didn't cover the full OAuth → profile loading flow
- **Schema Review**: Should have verified all tables support both authenticated and guest users
- **Documentation**: Need clearer mapping between auth system and game data tables

## Action Items

- [x] Create migration to fix `player_profiles` schema
- [ ] Update integration tests to cover OAuth → game loading flow
- [ ] Document table relationships in schema documentation
- [ ] Add database schema validation to CI/CD

## Related Files

- `supabase/migrations/20241120000001_setup_authentication_schema.sql` - Original auth migration
- `supabase/migrations/20241118000001_create_composition_system_tables.sql` - Created player_profiles
- `shared/utils/authenticated-player-profile-service.ts` - Profile loading logic
- `game/App.tsx` - Calls loadPlayerProfile() on mount
