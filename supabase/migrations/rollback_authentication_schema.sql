-- Rollback Migration: Authentication Schema
-- Description: Rolls back all authentication-related database changes
-- WARNING: This will delete all user profiles, leaderboard scores, and remove user associations from achievements
-- Date: 2024-11-20

-- ============================================================================
-- IMPORTANT: BACKUP YOUR DATA BEFORE RUNNING THIS ROLLBACK
-- ============================================================================

-- This rollback script will:
-- 1. Drop the profiles table (and all profile data)
-- 2. Drop the leaderboard_scores table (and all scores)
-- 3. Remove user_id column from achievements table
-- 4. Remove all RLS policies
-- 5. Remove the profile creation trigger and function
-- 6. Remove the updated_at trigger and function

-- ============================================================================
-- 1. Drop triggers
-- ============================================================================

-- Drop profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop updated_at trigger on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- ============================================================================
-- 2. Drop functions
-- ============================================================================

-- Drop profile creation function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop updated_at function (only if not used by other tables)
-- Note: Comment this out if other tables use this function
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ============================================================================
-- 3. Drop RLS policies for profiles
-- ============================================================================

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- ============================================================================
-- 4. Drop RLS policies for leaderboard_scores
-- ============================================================================

DROP POLICY IF EXISTS "Leaderboard scores are viewable by everyone" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "Authenticated users can submit scores" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "Guest users can submit scores" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "Users can update own scores" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "Users can delete own scores" ON public.leaderboard_scores;

-- ============================================================================
-- 5. Drop RLS policies for achievements (if they exist)
-- ============================================================================

DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can update own achievements" ON public.achievements;
    
    -- Disable RLS on achievements
    ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
  END IF;
END $;

-- ============================================================================
-- 6. Drop tables
-- ============================================================================

-- Drop profiles table (cascades to foreign key references)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop leaderboard_scores table
DROP TABLE IF EXISTS public.leaderboard_scores CASCADE;

-- ============================================================================
-- 7. Remove user_id column from achievements (if it exists)
-- ============================================================================

DO $ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'user_id') THEN
      -- Drop index first
      DROP INDEX IF EXISTS public.idx_achievements_user_id;
      
      -- Drop column
      ALTER TABLE public.achievements DROP COLUMN IF EXISTS user_id;
      
      RAISE NOTICE '✓ Removed user_id column from achievements table';
    END IF;
  END IF;
END $;

-- ============================================================================
-- Rollback Complete
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Authentication schema rollback complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The following changes have been rolled back:';
  RAISE NOTICE '✓ Dropped profiles table';
  RAISE NOTICE '✓ Dropped leaderboard_scores table';
  RAISE NOTICE '✓ Removed user_id from achievements table';
  RAISE NOTICE '✓ Removed all RLS policies';
  RAISE NOTICE '✓ Removed profile creation trigger';
  RAISE NOTICE '✓ Removed trigger functions';
  RAISE NOTICE '';
  RAISE NOTICE 'WARNING: All user profile data and leaderboard scores have been deleted';
  RAISE NOTICE '';
END $;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Uncomment these to verify the rollback was successful:

-- Check that tables are dropped
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('profiles', 'leaderboard_scores');
-- Expected: No rows returned

-- Check that user_id column is removed from achievements
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'achievements' 
--   AND column_name = 'user_id';
-- Expected: No rows returned

-- Check that triggers are removed
-- SELECT trigger_name 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'auth' 
--   AND trigger_name = 'on_auth_user_created';
-- Expected: No rows returned

-- Check that functions are removed
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_name IN ('handle_new_user', 'update_updated_at_column');
-- Expected: No rows returned (or only update_updated_at_column if used elsewhere)
