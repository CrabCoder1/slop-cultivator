-- Migration: Improve Profile Creation Trigger Error Handling
-- Description: Enhances the handle_new_user() trigger function to handle failures gracefully
-- Date: 2024-11-23
-- Requirements: 1.3, 1.5

-- ============================================================================
-- Improved trigger function with error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
DECLARE
  v_username TEXT;
  v_display_name TEXT;
  v_avatar_url TEXT;
  v_provider TEXT;
  v_provider_id TEXT;
BEGIN
  -- Extract user data from OAuth metadata with fallbacks
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.email,
    'user_' || substring(NEW.id::text from 1 for 8)
  );
  
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    v_username
  );
  
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );
  
  v_provider_id := COALESCE(
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'sub'
  );

  -- Attempt to insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      display_name,
      avatar_url,
      provider,
      provider_id
    )
    VALUES (
      NEW.id,
      v_username,
      v_display_name,
      v_avatar_url,
      v_provider,
      v_provider_id
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created successfully for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Handle duplicate username by appending user ID
      RAISE WARNING 'Username % already exists, using fallback for user %', v_username, NEW.id;
      
      INSERT INTO public.profiles (
        id,
        username,
        display_name,
        avatar_url,
        provider,
        provider_id
      )
      VALUES (
        NEW.id,
        'user_' || substring(NEW.id::text from 1 for 8),
        v_display_name,
        v_avatar_url,
        v_provider,
        v_provider_id
      );
      
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: % %', NEW.id, SQLERRM, SQLSTATE;
      
      -- Attempt minimal profile creation as last resort
      BEGIN
        INSERT INTO public.profiles (id, username, provider)
        VALUES (NEW.id, 'user_' || substring(NEW.id::text from 1 for 8), v_provider);
      EXCEPTION
        WHEN OTHERS THEN
          -- If even minimal profile creation fails, log but continue
          -- This ensures user authentication succeeds even if profile creation fails
          RAISE WARNING 'Critical: Could not create any profile for user %', NEW.id;
      END;
  END;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up with graceful error handling';

-- ============================================================================
-- Verify trigger exists and is properly configured
-- ============================================================================

DO $
BEGIN
  -- Check if trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Create trigger if it doesn't exist
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✓ Trigger on_auth_user_created created';
  ELSE
    RAISE NOTICE '✓ Trigger on_auth_user_created already exists';
  END IF;
END $;

-- ============================================================================
-- Migration Complete
-- ============================================================================

RAISE NOTICE 'Profile creation trigger improved with error handling';
