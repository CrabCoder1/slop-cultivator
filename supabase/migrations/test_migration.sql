-- ============================================================================
-- COMPOSITION SYSTEM MIGRATION TEST SCRIPT
-- ============================================================================
-- This script tests the composition system migration on a test database
-- Run this before applying to production
--
-- Usage:
--   1. Create a test database
--   2. Apply base migrations (person_types, wave_configurations, seed data)
--   3. Run this script to test composition migration
--   4. Verify results
--   5. Test rollback
-- ============================================================================

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║     COMPOSITION SYSTEM MIGRATION TEST                      ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- ============================================================================
-- PRE-MIGRATION STATE
-- ============================================================================

\echo '=== PRE-MIGRATION STATE ==='
\echo ''

-- Count existing person_types
SELECT 
  'person_types count' as metric,
  COUNT(*)::TEXT as value
FROM person_types;

-- Show person_types structure
\echo ''
\echo 'person_types columns:'
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'person_types'
ORDER BY ordinal_position;

-- Show sample person_types
\echo ''
\echo 'Sample person_types:'
SELECT 
  key,
  name,
  base_stats->>'health' as health,
  base_stats->>'damage' as damage
FROM person_types
LIMIT 3;

\echo ''
\echo 'Press Enter to continue with migration...'
\prompt

-- ============================================================================
-- APPLY COMPOSITION SYSTEM MIGRATIONS
-- ============================================================================

\echo ''
\echo '=== APPLYING MIGRATIONS ==='
\echo ''

-- Migration 1: Create composition system tables
\echo 'Applying: 20241118000001_create_composition_system_tables.sql'
\i 20241118000001_create_composition_system_tables.sql

-- Migration 2: Update person_types for composition
\echo 'Applying: 20241118000002_update_person_types_for_composition.sql'
\i 20241118000002_update_person_types_for_composition.sql

-- Migration 3: Migrate data to composition system
\echo 'Applying: 20241118000002_migrate_person_types_to_composition.sql'
\i 20241118000002_migrate_person_types_to_composition.sql

\echo ''
\echo '✓ Migrations applied'
\echo ''

-- ============================================================================
-- POST-MIGRATION STATE
-- ============================================================================

\echo '=== POST-MIGRATION STATE ==='
\echo ''

-- Count records in new tables
SELECT 
  'species' as table_name,
  COUNT(*)::TEXT as record_count
FROM species
UNION ALL
SELECT 
  'daos' as table_name,
  COUNT(*)::TEXT as record_count
FROM daos
UNION ALL
SELECT 
  'titles' as table_name,
  COUNT(*)::TEXT as record_count
FROM titles
UNION ALL
SELECT 
  'achievements' as table_name,
  COUNT(*)::TEXT as record_count
FROM achievements
UNION ALL
SELECT 
  'player_profiles' as table_name,
  COUNT(*)::TEXT as record_count
FROM player_profiles
UNION ALL
SELECT 
  'player_achievements' as table_name,
  COUNT(*)::TEXT as record_count
FROM player_achievements;

-- Show updated person_types structure
\echo ''
\echo 'Updated person_types columns:'
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'person_types'
ORDER BY ordinal_position;

-- ============================================================================
-- RUN VALIDATION
-- ============================================================================

\echo ''
\echo '=== RUNNING VALIDATION ==='
\echo ''

\i validate_composition_migration.sql

-- ============================================================================
-- TEST QUERIES
-- ============================================================================

\echo ''
\echo '=== TEST QUERIES ==='
\echo ''

-- Test 1: Join person_types with composition components
\echo 'Test 1: Person types with composition'
SELECT 
  pt.key,
  pt.name,
  s.name as species,
  d.name as dao,
  t.name as title,
  pt.role
FROM person_types pt
JOIN species s ON pt.species_id = s.id
JOIN daos d ON pt.dao_id = d.id
JOIN titles t ON pt.title_id = t.id
ORDER BY pt.role, pt.key
LIMIT 5;

-- Test 2: Calculate composed stats
\echo ''
\echo 'Test 2: Composed stats calculation'
SELECT 
  pt.name,
  (s.base_stats->>'health')::NUMERIC * COALESCE((t.stat_bonuses->>'healthMultiplier')::NUMERIC, 1.0) as composed_health,
  (d.combat_stats->>'damage')::NUMERIC * COALESCE((t.stat_bonuses->>'damageMultiplier')::NUMERIC, 1.0) as composed_damage,
  (pt.base_stats->>'health')::NUMERIC as original_health,
  (pt.base_stats->>'damage')::NUMERIC as original_damage
FROM person_types pt
JOIN species s ON pt.species_id = s.id
JOIN daos d ON pt.dao_id = d.id
JOIN titles t ON pt.title_id = t.id
WHERE pt.role = 'defender'
LIMIT 3;

-- Test 3: Check foreign key constraints
\echo ''
\echo 'Test 3: Foreign key constraints'
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'person_types'
  AND kcu.column_name IN ('species_id', 'dao_id', 'title_id');

-- Test 4: Check indexes
\echo ''
\echo 'Test 4: Indexes on person_types'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'person_types'
  AND indexname LIKE '%species%' 
   OR indexname LIKE '%dao%' 
   OR indexname LIKE '%title%'
   OR indexname LIKE '%role%';

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║         MIGRATION TEST COMPLETED                           ║'
\echo '╠════════════════════════════════════════════════════════════╣'
\echo '║ Review the output above for any errors or warnings.       ║'
\echo '║                                                            ║'
\echo '║ Next steps:                                                ║'
\echo '║ 1. Review validation results                               ║'
\echo '║ 2. Test rollback procedure                                 ║'
\echo '║ 3. If successful, apply to production                      ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

