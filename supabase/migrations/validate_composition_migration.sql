-- Validation script for composition system migration
-- This script checks data integrity after migration

-- ============================================================================
-- VALIDATION 1: Check all person_types have valid composition references
-- ============================================================================

DO $$
DECLARE
  missing_species INTEGER;
  missing_daos INTEGER;
  missing_titles INTEGER;
  total_person_types INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_person_types FROM person_types;
  
  -- Count person_types with NULL species_id
  SELECT COUNT(*) INTO missing_species
  FROM person_types
  WHERE species_id IS NULL;
  
  -- Count person_types with NULL dao_id
  SELECT COUNT(*) INTO missing_daos
  FROM person_types
  WHERE dao_id IS NULL;
  
  -- Count person_types with NULL title_id
  SELECT COUNT(*) INTO missing_titles
  FROM person_types
  WHERE title_id IS NULL;
  
  RAISE NOTICE '=== COMPOSITION REFERENCE VALIDATION ===';
  RAISE NOTICE 'Total person_types: %', total_person_types;
  RAISE NOTICE 'Missing species_id: %', missing_species;
  RAISE NOTICE 'Missing dao_id: %', missing_daos;
  RAISE NOTICE 'Missing title_id: %', missing_titles;
  
  IF missing_species > 0 OR missing_daos > 0 OR missing_titles > 0 THEN
    RAISE WARNING 'Some person_types have NULL composition references!';
  ELSE
    RAISE NOTICE '✓ All person_types have valid composition references';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION 2: Check foreign key integrity
-- ============================================================================

DO $$
DECLARE
  invalid_species INTEGER;
  invalid_daos INTEGER;
  invalid_titles INTEGER;
BEGIN
  -- Check for invalid species references
  SELECT COUNT(*) INTO invalid_species
  FROM person_types pt
  LEFT JOIN species s ON pt.species_id = s.id
  WHERE pt.species_id IS NOT NULL AND s.id IS NULL;
  
  -- Check for invalid dao references
  SELECT COUNT(*) INTO invalid_daos
  FROM person_types pt
  LEFT JOIN daos d ON pt.dao_id = d.id
  WHERE pt.dao_id IS NOT NULL AND d.id IS NULL;
  
  -- Check for invalid title references
  SELECT COUNT(*) INTO invalid_titles
  FROM person_types pt
  LEFT JOIN titles t ON pt.title_id = t.id
  WHERE pt.title_id IS NOT NULL AND t.id IS NULL;
  
  RAISE NOTICE '=== FOREIGN KEY INTEGRITY VALIDATION ===';
  RAISE NOTICE 'Invalid species references: %', invalid_species;
  RAISE NOTICE 'Invalid dao references: %', invalid_daos;
  RAISE NOTICE 'Invalid title references: %', invalid_titles;
  
  IF invalid_species > 0 OR invalid_daos > 0 OR invalid_titles > 0 THEN
    RAISE WARNING 'Some person_types have invalid foreign key references!';
  ELSE
    RAISE NOTICE '✓ All foreign key references are valid';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION 3: Check for orphaned records
-- ============================================================================

DO $$
DECLARE
  unused_species INTEGER;
  unused_daos INTEGER;
  unused_titles INTEGER;
BEGIN
  -- Count species not used by any person_type
  SELECT COUNT(*) INTO unused_species
  FROM species s
  LEFT JOIN person_types pt ON s.id = pt.species_id
  WHERE pt.id IS NULL;
  
  -- Count daos not used by any person_type
  SELECT COUNT(*) INTO unused_daos
  FROM daos d
  LEFT JOIN person_types pt ON d.id = pt.dao_id
  WHERE pt.id IS NULL;
  
  -- Count titles not used by any person_type
  SELECT COUNT(*) INTO unused_titles
  FROM titles t
  LEFT JOIN person_types pt ON t.id = pt.title_id
  WHERE pt.id IS NULL;
  
  RAISE NOTICE '=== ORPHANED RECORDS CHECK ===';
  RAISE NOTICE 'Unused species: %', unused_species;
  RAISE NOTICE 'Unused daos: %', unused_daos;
  RAISE NOTICE 'Unused titles: %', unused_titles;
  
  IF unused_species > 0 OR unused_daos > 0 OR unused_titles > 0 THEN
    RAISE NOTICE 'Note: Some component records are not currently used (this is OK for future content)';
  ELSE
    RAISE NOTICE '✓ All component records are in use';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION 4: Verify composed stats match original stats
-- ============================================================================

DO $$
DECLARE
  stat_mismatch_count INTEGER := 0;
  rec RECORD;
  original_health NUMERIC;
  original_damage NUMERIC;
  original_attack_speed NUMERIC;
  original_range NUMERIC;
  original_movement_speed NUMERIC;
  composed_health NUMERIC;
  composed_damage NUMERIC;
  composed_attack_speed NUMERIC;
  composed_range NUMERIC;
  composed_movement_speed NUMERIC;
  health_multiplier NUMERIC;
  damage_multiplier NUMERIC;
  attack_speed_multiplier NUMERIC;
  range_bonus NUMERIC;
  movement_speed_multiplier NUMERIC;
BEGIN
  RAISE NOTICE '=== COMPOSED STATS VALIDATION ===';
  
  FOR rec IN 
    SELECT 
      pt.key,
      pt.name,
      pt.base_stats,
      s.base_stats as species_stats,
      d.combat_stats as dao_stats,
      t.stat_bonuses as title_bonuses
    FROM person_types pt
    JOIN species s ON pt.species_id = s.id
    JOIN daos d ON pt.dao_id = d.id
    JOIN titles t ON pt.title_id = t.id
  LOOP
    -- Extract original stats
    original_health := (rec.base_stats->>'health')::NUMERIC;
    original_damage := (rec.base_stats->>'damage')::NUMERIC;
    original_attack_speed := (rec.base_stats->>'attackSpeed')::NUMERIC;
    original_range := (rec.base_stats->>'range')::NUMERIC;
    original_movement_speed := (rec.base_stats->>'movementSpeed')::NUMERIC;
    
    -- Extract component stats
    composed_health := (rec.species_stats->>'health')::NUMERIC;
    composed_movement_speed := (rec.species_stats->>'movementSpeed')::NUMERIC;
    composed_damage := (rec.dao_stats->>'damage')::NUMERIC;
    composed_attack_speed := (rec.dao_stats->>'attackSpeed')::NUMERIC;
    composed_range := (rec.dao_stats->>'range')::NUMERIC;
    
    -- Extract title bonuses (with defaults)
    health_multiplier := COALESCE((rec.title_bonuses->>'healthMultiplier')::NUMERIC, 1.0);
    damage_multiplier := COALESCE((rec.title_bonuses->>'damageMultiplier')::NUMERIC, 1.0);
    attack_speed_multiplier := COALESCE((rec.title_bonuses->>'attackSpeedMultiplier')::NUMERIC, 1.0);
    range_bonus := COALESCE((rec.title_bonuses->>'rangeBonus')::NUMERIC, 0);
    movement_speed_multiplier := COALESCE((rec.title_bonuses->>'movementSpeedMultiplier')::NUMERIC, 1.0);
    
    -- Apply title bonuses
    composed_health := composed_health * health_multiplier;
    composed_damage := composed_damage * damage_multiplier;
    composed_attack_speed := composed_attack_speed * attack_speed_multiplier;
    composed_range := composed_range + range_bonus;
    composed_movement_speed := composed_movement_speed * movement_speed_multiplier;
    
    -- Compare stats (allowing for small floating point differences)
    IF ABS(original_health - composed_health) > 0.01 OR
       ABS(original_damage - composed_damage) > 0.01 OR
       ABS(original_attack_speed - composed_attack_speed) > 0.01 OR
       ABS(original_range - composed_range) > 0.01 OR
       ABS(original_movement_speed - composed_movement_speed) > 0.01 THEN
      
      stat_mismatch_count := stat_mismatch_count + 1;
      RAISE NOTICE 'Stat mismatch for %:', rec.name;
      RAISE NOTICE '  Original: H=%, D=%, AS=%, R=%, MS=%', 
        original_health, original_damage, original_attack_speed, original_range, original_movement_speed;
      RAISE NOTICE '  Composed: H=%, D=%, AS=%, R=%, MS=%', 
        composed_health, composed_damage, composed_attack_speed, composed_range, composed_movement_speed;
    END IF;
  END LOOP;
  
  IF stat_mismatch_count > 0 THEN
    RAISE WARNING '% person_types have stat mismatches between original and composed values', stat_mismatch_count;
  ELSE
    RAISE NOTICE '✓ All composed stats match original stats';
  END IF;
END $$;

-- ============================================================================
-- VALIDATION 5: Display summary statistics
-- ============================================================================

DO $$
DECLARE
  species_count INTEGER;
  daos_count INTEGER;
  titles_count INTEGER;
  person_types_count INTEGER;
  defenders_count INTEGER;
  attackers_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO species_count FROM species;
  SELECT COUNT(*) INTO daos_count FROM daos;
  SELECT COUNT(*) INTO titles_count FROM titles;
  SELECT COUNT(*) INTO person_types_count FROM person_types;
  SELECT COUNT(*) INTO defenders_count FROM person_types WHERE role = 'defender';
  SELECT COUNT(*) INTO attackers_count FROM person_types WHERE role = 'attacker';
  
  RAISE NOTICE '=== SUMMARY STATISTICS ===';
  RAISE NOTICE 'Species: %', species_count;
  RAISE NOTICE 'Daos: %', daos_count;
  RAISE NOTICE 'Titles: %', titles_count;
  RAISE NOTICE 'Person Types: % (% defenders, % attackers)', 
    person_types_count, defenders_count, attackers_count;
END $$;

-- ============================================================================
-- VALIDATION 6: List all person_types with their composition
-- ============================================================================

SELECT 
  pt.key,
  pt.name,
  pt.role,
  s.name as species,
  d.name as dao,
  t.name as title,
  CASE 
    WHEN pt.species_id IS NULL THEN '❌ Missing species'
    WHEN pt.dao_id IS NULL THEN '❌ Missing dao'
    WHEN pt.title_id IS NULL THEN '❌ Missing title'
    ELSE '✓ Complete'
  END as status
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
ORDER BY pt.role, pt.key;

