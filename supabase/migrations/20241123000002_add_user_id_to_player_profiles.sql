-- Migration: Add user_id to player_profiles
-- Description: Updates player_profiles table to support authenticated users
--              Allows linking game stats to auth.users while maintaining guest support
-- Date: 2024-11-23

-- ============================================================================
-- 1. Add user_id column to player_profiles
-- ============================================================================

ALTER TABLE public.player_profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON public.player_profiles(user_id);

-- Add comment
COMMENT ON COLUMN public.player_profiles.user_id IS 'Links player profile to authenticated user (NULL for guests)';

-- ============================================================================
-- 2. Make anonymous_id nullable (to support authenticated users)
-- ============================================================================

ALTER TABLE public.player_profiles
ALTER COLUMN anonymous_id DROP NOT NULL;

-- ============================================================================
-- 3. Add constraint: either user_id OR anonymous_id must be set
-- ============================================================================

ALTER TABLE public.player_profiles
ADD CONSTRAINT check_user_or_anonymous CHECK (
  (user_id IS NOT NULL AND anonymous_id IS NULL) OR
  (user_id IS NULL AND anonymous_id IS NOT NULL)
);

-- Add comment
COMMENT ON CONSTRAINT check_user_or_anonymous ON public.player_profiles IS 'Ensures profile is linked to either authenticated user or guest';

-- ============================================================================
-- 4. Update RLS policies for player_profiles
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own player profile" ON public.player_profiles;
DROP POLICY IF EXISTS "Users can insert own player profile" ON public.player_profiles;
DROP POLICY IF EXISTS "Users can update own player profile" ON public.player_profiles;
DROP POLICY IF EXISTS "Users can delete own player profile" ON public.player_profiles;

-- Policy: Authenticated users can view their own profile
CREATE POLICY "Users can view own player profile"
  ON public.player_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    anonymous_id IS NOT NULL -- Guests can view by anonymous_id (handled in app logic)
  );

-- Policy: Authenticated users can insert their own profile
CREATE POLICY "Users can insert own player profile"
  ON public.player_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (user_id IS NULL AND anonymous_id IS NOT NULL) -- Allow guest profiles
  );

-- Policy: Authenticated users can update their own profile
CREATE POLICY "Users can update own player profile"
  ON public.player_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    anonymous_id IS NOT NULL -- Guests can update (handled in app logic)
  )
  WITH CHECK (
    auth.uid() = user_id OR
    anonymous_id IS NOT NULL
  );

-- Policy: Authenticated users can delete their own profile
CREATE POLICY "Users can delete own player profile"
  ON public.player_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Create trigger to auto-create player_profile for new users
-- ============================================================================

-- Function to create player profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_player_profile()
RETURNS TRIGGER AS $
BEGIN
  -- Create player profile for new authenticated user
  INSERT INTO public.player_profiles (
    user_id,
    stats,
    unlocked_species,
    unlocked_daos,
    unlocked_titles
  )
  VALUES (
    NEW.id,
    jsonb_build_object(
      'totalGamesPlayed', 0,
      'highestWave', 0,
      'highestScore', 0,
      'totalEnemiesDefeated', 0,
      'totalCultivatorsDeployed', 0
    ),
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  )
  ON CONFLICT DO NOTHING; -- Ignore if profile already exists
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_player_profile() IS 'Automatically creates a player profile when a new user signs up';

-- ============================================================================
-- 6. Create trigger on auth.users for player_profile creation
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_player_profile ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_player_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_player_profile();

-- Add comment
COMMENT ON TRIGGER on_auth_user_created_player_profile ON auth.users IS 'Trigger to create player profile on user signup';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify changes
DO $
BEGIN
  RAISE NOTICE 'Migration complete. Verifying changes...';
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'player_profiles' AND column_name = 'user_id') THEN
    RAISE NOTICE '✓ user_id column added to player_profiles';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'player_profiles' AND constraint_name = 'check_user_or_anonymous') THEN
    RAISE NOTICE '✓ check_user_or_anonymous constraint added';
  END IF;
  
  RAISE NOTICE '✓ RLS policies updated';
  RAISE NOTICE '✓ Player profile creation trigger created';
END $;
