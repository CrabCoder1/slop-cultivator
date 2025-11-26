-- Migration: Extract composition data from person_types and populate Species, Daos, Titles
-- This migration analyzes existing person_types and creates the component records

-- ============================================================================
-- STEP 1: Extract and create Species records
-- ============================================================================
-- Species are identified by the biological/entity type (human, demon, beast, etc.)
-- We'll extract unique species based on patterns in the data

INSERT INTO species (id, key, name, emoji, description, lore, base_stats, version, created_at, updated_at)
VALUES
  -- Human species (cultivators)
  (
    gen_random_uuid(),
    'human',
    'Human',
    '👤',
    'Mortal beings capable of cultivation',
    'Humans possess the unique ability to cultivate their inner energy and transcend mortal limitations. Through dedication and training, they can achieve extraordinary power.',
    jsonb_build_object(
      'health', 100,
      'movementSpeed', 0
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Demon species
  (
    gen_random_uuid(),
    'demon',
    'Demon',
    '👹',
    'Fierce beings from the underworld',
    'These demons emerged from the rifts between realms, drawn by sacred energy. Their crimson skin burns with hellfire.',
    jsonb_build_object(
      'health', 60,
      'movementSpeed', 1
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Shadow species
  (
    gen_random_uuid(),
    'shadow',
    'Shadow',
    '👤',
    'Swift creatures of darkness',
    'Born from the absence of light, these entities move like smoke through the battlefield.',
    jsonb_build_object(
      'health', 40,
      'movementSpeed', 1.5
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Beast species
  (
    gen_random_uuid(),
    'beast',
    'Beast',
    '🐺',
    'Massive creatures with high durability',
    'Corrupted by dark magic, these once-noble creatures now serve as living battering rams.',
    jsonb_build_object(
      'health', 100,
      'movementSpeed', 0.7
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Spirit species
  (
    gen_random_uuid(),
    'spirit',
    'Spirit',
    '👻',
    'Ethereal beings that phase through reality',
    'The restless spirits of fallen warriors, bound to serve the darkness.',
    jsonb_build_object(
      'health', 80,
      'movementSpeed', 1.2
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Golem species
  (
    gen_random_uuid(),
    'golem',
    'Golem',
    '🗿',
    'Towering constructs of stone',
    'Ancient guardians twisted by corruption, these stone titans were once protectors of sacred sites.',
    jsonb_build_object(
      'health', 200,
      'movementSpeed', 0.5
    ),
    1,
    NOW(),
    NOW()
  ),
  -- Dragon species
  (
    gen_random_uuid(),
    'dragon',
    'Dragon',
    '🐉',
    'Legendary beasts of immense power',
    'Once revered as celestial beings, these dragons fell to corruption and now serve the forces of darkness.',
    jsonb_build_object(
      'health', 300,
      'movementSpeed', 0.8
    ),
    1,
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 2: Extract and create Dao records
-- ============================================================================
-- Daos represent cultivation paths/combat styles (sword, palm, arrow, lightning)

INSERT INTO daos (id, key, name, emoji, description, lore, combat_stats, compatible_skills, version, created_at, updated_at)
VALUES
  -- Sword Dao
  (
    gen_random_uuid(),
    'sword_dao',
    'Sword Dao',
    '⚔️',
    'Masters of close-range combat with fast strikes',
    'Disciples of the ancient sword arts have honed their blade techniques through decades of rigorous training.',
    jsonb_build_object(
      'damage', 20,
      'attackSpeed', 1000,
      'range', 45,
      'attackPattern', 'melee'
    ),
    '[]'::jsonb,
    1,
    NOW(),
    NOW()
  ),
  -- Palm Dao
  (
    gen_random_uuid(),
    'palm_dao',
    'Palm Dao',
    '🖐️',
    'Balanced fighters with good range and speed',
    'Masters of the Heavenly Palm technique channel their inner energy through their hands.',
    jsonb_build_object(
      'damage', 15,
      'attackSpeed', 800,
      'range', 60,
      'attackPattern', 'ranged'
    ),
    '[]'::jsonb,
    1,
    NOW(),
    NOW()
  ),
  -- Arrow Dao
  (
    gen_random_uuid(),
    'arrow_dao',
    'Arrow Dao',
    '🏹',
    'Long-range specialists with powerful shots',
    'Enlightened archers who have transcended mortal limitations can strike targets from impossible distances.',
    jsonb_build_object(
      'damage', 25,
      'attackSpeed', 1500,
      'range', 90,
      'attackPattern', 'ranged'
    ),
    '[]'::jsonb,
    1,
    NOW(),
    NOW()
  ),
  -- Lightning Dao
  (
    gen_random_uuid(),
    'lightning_dao',
    'Lightning Dao',
    '⚡',
    'Devastating damage with slower attacks',
    'Legendary cultivators who have mastered the Heavenly Lightning technique call down divine thunder.',
    jsonb_build_object(
      'damage', 40,
      'attackSpeed', 2000,
      'range', 75,
      'attackPattern', 'ranged'
    ),
    '[]'::jsonb,
    1,
    NOW(),
    NOW()
  ),
  -- Claw Dao (for beasts/demons without specific weapon)
  (
    gen_random_uuid(),
    'claw_dao',
    'Claw Dao',
    '🦅',
    'Natural weapons and primal combat',
    'Those who fight with tooth and claw, relying on raw physical power and instinct.',
    jsonb_build_object(
      'damage', 0,
      'attackSpeed', 0,
      'range', 0,
      'attackPattern', 'melee'
    ),
    '[]'::jsonb,
    1,
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 3: Extract and create Title records
-- ============================================================================
-- Titles represent rank/mastery levels (cultivator, master, sage, lord)

INSERT INTO titles (id, key, name, emoji, description, stat_bonuses, prestige_level, version, created_at, updated_at)
VALUES
  -- Cultivator (entry level)
  (
    gen_random_uuid(),
    'cultivator',
    'Cultivator',
    '🌱',
    'A practitioner beginning their journey',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    1,
    1,
    NOW(),
    NOW()
  ),
  -- Master (intermediate level)
  (
    gen_random_uuid(),
    'master',
    'Master',
    '⭐',
    'An experienced practitioner with refined skills',
    jsonb_build_object(
      'healthMultiplier', 1.5,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    5,
    1,
    NOW(),
    NOW()
  ),
  -- Sage (advanced level)
  (
    gen_random_uuid(),
    'sage',
    'Sage',
    '🔮',
    'A wise practitioner who has achieved enlightenment',
    jsonb_build_object(
      'healthMultiplier', 0.8,
      'damageMultiplier', 1.67,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    7,
    1,
    NOW(),
    NOW()
  ),
  -- Lord (master level)
  (
    gen_random_uuid(),
    'lord',
    'Lord',
    '👑',
    'A legendary practitioner of supreme power',
    jsonb_build_object(
      'healthMultiplier', 2.0,
      'damageMultiplier', 2.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    10,
    1,
    NOW(),
    NOW()
  ),
  -- Common (for basic enemies)
  (
    gen_random_uuid(),
    'common',
    'Common',
    '⚪',
    'An ordinary entity',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    1,
    1,
    NOW(),
    NOW()
  ),
  -- Dire (for stronger enemies)
  (
    gen_random_uuid(),
    'dire',
    'Dire',
    '🔴',
    'A more dangerous variant',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    3,
    1,
    NOW(),
    NOW()
  ),
  -- Spectral (for spirit enemies)
  (
    gen_random_uuid(),
    'spectral',
    'Spectral',
    '✨',
    'An ethereal manifestation',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    4,
    1,
    NOW(),
    NOW()
  ),
  -- Stone (for golem enemies)
  (
    gen_random_uuid(),
    'stone',
    'Stone',
    '🪨',
    'A hardened construct',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    6,
    1,
    NOW(),
    NOW()
  ),
  -- Corrupted (for corrupted enemies)
  (
    gen_random_uuid(),
    'corrupted',
    'Corrupted',
    '💀',
    'A being twisted by dark forces',
    jsonb_build_object(
      'healthMultiplier', 1.0,
      'damageMultiplier', 1.0,
      'attackSpeedMultiplier', 1.0,
      'rangeBonus', 0,
      'movementSpeedMultiplier', 1.0
    ),
    8,
    1,
    NOW(),
    NOW()
  );

-- ============================================================================
-- STEP 4: Update person_types with composition references
-- ============================================================================
-- Map each person_type to appropriate species, dao, and title

-- Sword Cultivator -> Human + Sword Dao + Cultivator
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'human'),
  dao_id = (SELECT id FROM daos WHERE key = 'sword_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'cultivator'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'defender'
WHERE key = 'sword_cultivator';

-- Palm Master -> Human + Palm Dao + Master
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'human'),
  dao_id = (SELECT id FROM daos WHERE key = 'palm_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'master'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'defender'
WHERE key = 'palm_master';

-- Arrow Sage -> Human + Arrow Dao + Sage
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'human'),
  dao_id = (SELECT id FROM daos WHERE key = 'arrow_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'sage'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'defender'
WHERE key = 'arrow_sage';

-- Lightning Lord -> Human + Lightning Dao + Lord
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'human'),
  dao_id = (SELECT id FROM daos WHERE key = 'lightning_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'lord'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'defender'
WHERE key = 'lightning_lord';

-- Crimson Demon -> Demon + Claw Dao + Common
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'demon'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'common'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'crimson_demon';

-- Shadow Wraith -> Shadow + Claw Dao + Common
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'shadow'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'common'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'shadow_wraith';

-- Dire Beast -> Beast + Claw Dao + Dire
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'beast'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'dire'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'dire_beast';

-- Spectral Wraith -> Spirit + Claw Dao + Spectral
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'spirit'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'spectral'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'spectral_wraith';

-- Stone Golem -> Golem + Claw Dao + Stone
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'golem'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'stone'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'stone_golem';

-- Corrupted Dragon -> Dragon + Claw Dao + Corrupted
UPDATE person_types
SET 
  species_id = (SELECT id FROM species WHERE key = 'dragon'),
  dao_id = (SELECT id FROM daos WHERE key = 'claw_dao'),
  title_id = (SELECT id FROM titles WHERE key = 'corrupted'),
  equipped_skills = '[]'::jsonb,
  equipped_items = '[]'::jsonb,
  role = 'attacker'
WHERE key = 'corrupted_dragon';

-- ============================================================================
-- STEP 5: Verify data integrity
-- ============================================================================
-- Check that all person_types have valid references

DO $$
DECLARE
  missing_refs INTEGER;
BEGIN
  -- Count person_types with NULL references
  SELECT COUNT(*) INTO missing_refs
  FROM person_types
  WHERE species_id IS NULL OR dao_id IS NULL OR title_id IS NULL;
  
  IF missing_refs > 0 THEN
    RAISE EXCEPTION 'Migration failed: % person_types have NULL composition references', missing_refs;
  END IF;
  
  -- Verify foreign key integrity
  PERFORM 1
  FROM person_types pt
  LEFT JOIN species s ON pt.species_id = s.id
  LEFT JOIN daos d ON pt.dao_id = d.id
  LEFT JOIN titles t ON pt.title_id = t.id
  WHERE s.id IS NULL OR d.id IS NULL OR t.id IS NULL;
  
  IF FOUND THEN
    RAISE EXCEPTION 'Migration failed: Invalid foreign key references detected';
  END IF;
  
  RAISE NOTICE 'Migration successful: All person_types have valid composition references';
END $$;
