-- ============================================================================
-- COMPOSITION SYSTEM ROLLBACK SCRIPT
-- ============================================================================
-- WARNING: This will delete all composition system data
-- Ensure backups are complete before running this script
--
-- Usage:
--   psql -f rollback_composition_system.sql
--
-- This script will:
-- 1. Remove composition columns from person_types
-- 2. Drop all composition system tables
-- 3. Verify person_types integrity
-- ============================================================================

BEGIN;

-- Display warning and wait
DO $$
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         COMPOSITION SYSTEM ROLLBACK SCRIPT                 ║';
  RAISE NOTICE '╠════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║ WARNING: This will delete all composition system data!    ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║ Ensure you have created backups before proceeding!        ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║ This script will:                                         ║';
  RAISE NOTICE '║ - Remove composition columns from person_types            ║';
  RAISE NOTICE '║ - Drop species, daos, titles tables                       ║';
  RAISE NOTICE '║ - Drop achievements and player profile tables             ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║ Press Ctrl+C to cancel within 5 seconds...                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  PERFORM pg_sleep(5);
  RAISE NOTICE 'Proceeding with rollback...';
END $$;

-- ============================================================================
-- STEP 1: Count records before rollback
-- ============================================================================

DO $$
DECLARE
  pt_count INTEGER;
  species_count INTEGER;
  daos_count INTEGER;
  titles_count INTEGER;
  achievements_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pt_count FROM person_types;
  SELECT COUNT(*) INTO species_count FROM species;
  SELECT COUNT(*) INTO daos_count FROM daos;
  SELECT COUNT(*) INTO titles_count FROM titles;
  SELECT COUNT(*) INTO achievements_count FROM achievements;
  SELECT COUNT(*) INTO profiles_count FROM player_profiles;
  
  RAISE NOTICE '=== RECORDS BEFORE ROLLBACK ===';
  RAISE NOTICE 'person_types: %', pt_count;
  RAISE NOTICE 'species: %', species_count;
  RAISE NOTICE 'daos: %', daos_count;
  RAISE NOTICE 'titles: %', titles_count;
  RAISE NOTICE 'achievements: %', achievements_count;
  RAISE NOTICE 'player_profiles: %', profiles_count;
END $$;

-- ============================================================================
-- STEP 2: Remove foreign key constraints from person_types
-- ============================================================================

RAISE NOTICE 'Removing foreign key constraints...';

ALTER TABLE person_types 
  DROP CONSTRAINT IF EXISTS person_types_species_id_fkey CASCADE;

ALTER TABLE person_types 
  DROP CONSTRAINT IF EXISTS person_types_dao_id_fkey CASCADE;

ALTER TABLE person_types 
  DROP CONSTRAINT IF EXISTS person_types_title_id_fkey CASCADE;

-- ============================================================================
-- STEP 3: Remove composition columns from person_types
-- ============================================================================

RAISE NOTICE 'Removing composition columns from person_types...';

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS species_id CASCADE;

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS dao_id CASCADE;

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS title_id CASCADE;

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS equipped_skills;

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS equipped_items;

ALTER TABLE person_types 
  DROP COLUMN IF EXISTS role;

-- ============================================================================
-- STEP 4: Drop indexes
-- ============================================================================

RAISE NOTICE 'Dropping composition indexes...';

DROP INDEX IF EXISTS idx_person_types_species;
DROP INDEX IF EXISTS idx_person_types_dao;
DROP INDEX IF EXISTS idx_person_types_title;
DROP INDEX IF EXISTS idx_person_types_role;

-- ============================================================================
-- STEP 5: Drop composition system tables
-- ============================================================================

RAISE NOTICE 'Dropping composition system tables...';

-- Drop player achievement data first (has foreign keys)
DROP TABLE IF EXISTS player_achievements CASCADE;

-- Drop player profiles
DROP TABLE IF EXISTS player_profiles CASCADE;

-- Drop achievements
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop composition component tables
DROP TABLE IF EXISTS titles CASCADE;
DROP TABLE IF EXISTS daos CASCADE;
DROP TABLE IF EXISTS species CASCADE;

-- ============================================================================
-- STEP 6: Verify person_types integrity
-- ============================================================================

DO $$
DECLARE
  record_count INTEGER;
  has_base_stats BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFYING PERSON_TYPES INTEGRITY ===';
  
  -- Count records
  SELECT COUNT(*) INTO record_count FROM person_types;
  RAISE NOTICE 'person_types records after rollback: %', record_count;
  
  IF record_count = 0 THEN
    RAISE EXCEPTION 'ROLLBACK FAILED: person_types table is empty!';
  END IF;
  
  -- Check base_stats column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'person_types' 
    AND column_name = 'base_stats'
  ) INTO has_base_stats;
  
  IF NOT has_base_stats THEN
    RAISE EXCEPTION 'ROLLBACK FAILED: base_stats column is missing!';
  END IF;
  
  RAISE NOTICE '✓ person_types table integrity verified';
END $$;

-- ============================================================================
-- STEP 7: Display remaining person_types
-- ============================================================================

RAISE NOTICE '=== REMAINING PERSON_TYPES ===';

SELECT 
  key,
  name,
  base_stats->>'health' as health,
  base_stats->>'damage' as damage,
  base_stats->>'attackSpeed' as attack_speed,
  base_stats->>'range' as range,
  base_stats->>'movementSpeed' as movement_speed,
  CASE 
    WHEN defender_config IS NOT NULL THEN 'defender'
    WHEN attacker_config IS NOT NULL THEN 'attacker'
    ELSE 'unknown'
  END as role
FROM person_types
ORDER BY 
  CASE 
    WHEN defender_config IS NOT NULL THEN 1
    WHEN attacker_config IS NOT NULL THEN 2
    ELSE 3
  END,
  key;

-- ============================================================================
-- STEP 8: Final verification
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== FINAL VERIFICATION ===';
  
  -- Check that composition tables are gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('species', 'daos', 'titles', 'achievements', 'player_profiles', 'player_achievements')
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE WARNING 'Some composition tables still exist!';
  ELSE
    RAISE NOTICE '✓ All composition tables removed';
  END IF;
  
  -- Check that person_types columns are gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'person_types' 
    AND column_name IN ('species_id', 'dao_id', 'title_id', 'equipped_skills', 'equipped_items', 'role')
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE WARNING 'Some composition columns still exist in person_types!';
  ELSE
    RAISE NOTICE '✓ All composition columns removed from person_types';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         ROLLBACK COMPLETED SUCCESSFULLY                    ║';
  RAISE NOTICE '╠════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║ The database has been restored to pre-migration state.    ║';
  RAISE NOTICE '║                                                            ║';
  RAISE NOTICE '║ Next steps:                                                ║';
  RAISE NOTICE '║ 1. Restart application instances                           ║';
  RAISE NOTICE '║ 2. Test core functionality                                 ║';
  RAISE NOTICE '║ 3. Verify data integrity                                   ║';
  RAISE NOTICE '║ 4. Document the rollback                                   ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
END $$;

COMMIT;

