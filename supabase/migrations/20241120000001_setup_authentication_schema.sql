-- Migration: Setup Authentication Schema
-- Description: Creates profiles table, leaderboard_scores table, adds user_id columns, 
--              creates RLS policies, and sets up automatic profile creation trigger
-- Date: 2024-11-20

-- ============================================================================
-- 1. Create profiles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  provider TEXT, -- 'google', 'discord', 'github', 'steam'
  provider_id TEXT, -- Provider-specific user ID
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(provider);

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';

-- ============================================================================
-- 2. Create leaderboard_scores table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT, -- For guest users
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave_reached INTEGER NOT NULL,
  map_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure either user_id or anonymous_id is set
  CONSTRAINT check_user_or_anonymous CHECK (
    (user_id IS NOT NULL AND anonymous_id IS NULL) OR
    (user_id IS NULL AND anonymous_id IS NOT NULL)
  )
);

-- Add indexes for leaderboard_scores
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_user_id ON public.leaderboard_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_anonymous_id ON public.leaderboard_scores(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_score ON public.leaderboard_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_map_key ON public.leaderboard_scores(map_key);

-- Add comment
COMMENT ON TABLE public.leaderboard_scores IS 'Leaderboard scores for authenticated and guest users';

-- ============================================================================
-- 3. Add user_id column to achievements table (if not exists)
-- ============================================================================

-- Check if achievements table exists and add user_id if needed
DO $$ 
BEGIN
  -- Add user_id column to achievements if it doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'user_id') THEN
      ALTER TABLE public.achievements ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 4. Create RLS policies for profiles
-- ============================================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read all profiles (for displaying usernames on leaderboard)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- 5. Create RLS policies for leaderboard_scores
-- ============================================================================

-- Enable RLS on leaderboard_scores
ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read leaderboard scores
CREATE POLICY "Leaderboard scores are viewable by everyone"
  ON public.leaderboard_scores
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own scores
CREATE POLICY "Authenticated users can submit scores"
  ON public.leaderboard_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Guest users can insert scores with anonymous_id
CREATE POLICY "Guest users can submit scores"
  ON public.leaderboard_scores
  FOR INSERT
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- Policy: Users can update their own scores
CREATE POLICY "Users can update own scores"
  ON public.leaderboard_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own scores
CREATE POLICY "Users can delete own scores"
  ON public.leaderboard_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Update RLS policies for achievements (if table exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    -- Enable RLS on achievements
    ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Users can update own achievements" ON public.achievements;
    
    -- Policy: Users can view their own achievements
    EXECUTE 'CREATE POLICY "Users can view own achievements"
      ON public.achievements
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    -- Policy: Users can insert their own achievements
    EXECUTE 'CREATE POLICY "Users can insert own achievements"
      ON public.achievements
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    -- Policy: Users can update their own achievements
    EXECUTE 'CREATE POLICY "Users can update own achievements"
      ON public.achievements
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- ============================================================================
-- 7. Create trigger function for automatic profile creation
-- ============================================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, provider, provider_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';

-- ============================================================================
-- 8. Create trigger on auth.users
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create profile on user signup';

-- ============================================================================
-- 9. Create function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates the updated_at column to current timestamp';

-- ============================================================================
-- 10. Create triggers for updated_at on profiles
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Verifying tables...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE '✓ profiles table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leaderboard_scores') THEN
    RAISE NOTICE '✓ leaderboard_scores table created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'achievements' AND column_name = 'user_id') THEN
    RAISE NOTICE '✓ user_id column added to achievements';
  END IF;
  
  RAISE NOTICE '✓ RLS policies created';
  RAISE NOTICE '✓ Profile creation trigger created';
END $$;
