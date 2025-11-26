-- Verification queries for seed data migration
-- Run these queries after applying the seed migration to verify data integrity

-- ============================================================================
-- PART 1: Count Verification
-- ============================================================================

-- Should return: 4 Defenders, 6 Attackers (10 total)
SELECT 
  CASE 
    WHEN defender_config IS NOT NULL THEN 'Defender'
    WHEN attacker_config IS NOT NULL THEN 'Attacker'
  END as role,
  COUNT(*) as count
FROM person_types
GROUP BY role
ORDER BY role;

-- Should return: 20 wave configurations
SELECT COUNT(*) as total_waves FROM wave_configurations;

-- ============================================================================
-- PART 2: Person Types Verification
-- ============================================================================

-- List all person types with their roles
SELECT 
  key, 
  name, 
  emoji, 
  CASE 
    WHEN defender_config IS NOT NULL THEN 'Defender'
    WHEN attacker_config IS NOT NULL THEN 'Attacker'
  END as role,
  CASE 
    WHEN defender_config IS NOT NULL THEN (defender_config->>'deploymentCost')::INTEGER
    WHEN attacker_config IS NOT NULL THEN (attacker_config->>'reward')::INTEGER
  END as cost_or_reward
FROM person_types
ORDER BY 
  CASE WHEN defender_config IS NOT NULL THEN 1 ELSE 2 END,
  key;

-- Verify defender stats
SELECT 
  name,
  emoji,
  (defender_config->>'deploymentCost')::INTEGER as cost,
  (base_stats->>'health')::INTEGER as health,
  (base_stats->>'damage')::INTEGER as damage,
  (base_stats->>'attackSpeed')::INTEGER as attack_speed,
  (base_stats->>'range')::INTEGER as range
FROM person_types
WHERE defender_config IS NOT NULL
ORDER BY (defender_config->>'deploymentCost')::INTEGER;

-- Verify attacker stats
SELECT 
  name,
  emoji,
  (attacker_config->>'firstAppearance')::INTEGER as first_wave,
  (attacker_config->>'difficulty') as difficulty,
  (base_stats->>'health')::INTEGER as health,
  (base_stats->>'movementSpeed')::NUMERIC as speed,
  (attacker_config->>'reward')::INTEGER as reward
FROM person_types
WHERE attacker_config IS NOT NULL
ORDER BY (attacker_config->>'firstAppearance')::INTEGER, name;

-- ============================================================================
-- PART 3: Wave Configurations Verification
-- ============================================================================

-- Verify wave configurations with enemy counts
SELECT 
  wave_number, 
  jsonb_array_length(spawns) as spawn_groups,
  (SELECT SUM((spawn->>'count')::INTEGER) 
   FROM jsonb_array_elements(spawns) spawn) as total_enemies,
  5 + (wave_number * 2) as expected_enemies
FROM wave_configurations
ORDER BY wave_number;

-- Detailed view of first 5 waves
SELECT 
  w.wave_number,
  p.name as enemy_name,
  p.emoji,
  (spawn->>'count')::INTEGER as count,
  (spawn->>'spawnInterval')::INTEGER as interval_ms,
  (spawn->>'spawnDelay')::INTEGER as delay_ms
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
WHERE w.wave_number <= 5
ORDER BY w.wave_number, p.name;

-- Verify enemy unlock progression
SELECT 
  (attacker_config->>'firstAppearance')::INTEGER as first_wave,
  COUNT(*) as new_enemies_unlocked,
  string_agg(name, ', ' ORDER BY name) as enemy_names
FROM person_types
WHERE attacker_config IS NOT NULL
GROUP BY (attacker_config->>'firstAppearance')::INTEGER
ORDER BY first_wave;

-- ============================================================================
-- PART 4: Data Integrity Checks
-- ============================================================================

-- Check for any person types without base_stats
SELECT key, name FROM person_types WHERE base_stats IS NULL;
-- Expected: 0 rows

-- Check for person types with neither defender nor attacker config
SELECT key, name FROM person_types 
WHERE defender_config IS NULL AND attacker_config IS NULL;
-- Expected: 0 rows

-- Check for person types with both defender and attacker config
SELECT key, name FROM person_types 
WHERE defender_config IS NOT NULL AND attacker_config IS NOT NULL;
-- Expected: 0 rows (for now, though this is technically allowed)

-- Check for wave configurations with invalid person type references
SELECT w.wave_number, spawn->>'personTypeId' as invalid_id
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
WHERE NOT EXISTS (
  SELECT 1 FROM person_types WHERE id::TEXT = spawn->>'personTypeId'
);
-- Expected: 0 rows

-- Check for waves with zero or negative enemy counts
SELECT w.wave_number, spawn->>'personTypeId', spawn->>'count'
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
WHERE (spawn->>'count')::INTEGER <= 0;
-- Expected: 0 rows

-- ============================================================================
-- PART 5: Sample Data Display
-- ============================================================================

-- Display Wave 1 composition
SELECT 
  'Wave 1 Composition' as info,
  p.name,
  p.emoji,
  (spawn->>'count')::INTEGER as count,
  (SELECT SUM((s->>'count')::INTEGER) 
   FROM jsonb_array_elements(w.spawns) s) as total
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
WHERE w.wave_number = 1;

-- Display Wave 10 composition (when golems unlock)
SELECT 
  'Wave 10 Composition' as info,
  p.name,
  p.emoji,
  (spawn->>'count')::INTEGER as count,
  (SELECT SUM((s->>'count')::INTEGER) 
   FROM jsonb_array_elements(w.spawns) s) as total
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
WHERE w.wave_number = 10;

-- Display Wave 20 composition (all enemies)
SELECT 
  'Wave 20 Composition' as info,
  p.name,
  p.emoji,
  (spawn->>'count')::INTEGER as count,
  (SELECT SUM((s->>'count')::INTEGER) 
   FROM jsonb_array_elements(w.spawns) s) as total
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
WHERE w.wave_number = 20;

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 
  'Summary' as section,
  (SELECT COUNT(*) FROM person_types WHERE defender_config IS NOT NULL) as defenders,
  (SELECT COUNT(*) FROM person_types WHERE attacker_config IS NOT NULL) as attackers,
  (SELECT COUNT(*) FROM wave_configurations) as waves,
  (SELECT COUNT(*) FROM person_types) as total_person_types;
