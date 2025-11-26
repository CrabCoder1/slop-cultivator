-- Seed person_types and wave_configurations with existing game data
-- This migration converts existing cultivator and enemy types to the new Person Type system

-- ============================================================================
-- PART 1: Seed Cultivator Types (Defenders)
-- ============================================================================

-- Sword Cultivator
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'sword_cultivator',
  'Sword Cultivator',
  '⚔️',
  'Masters of close-range combat with fast strikes',
  'Disciples of the ancient sword arts, these cultivators have honed their blade techniques through decades of rigorous training. Their swift strikes can cut down enemies before they realize the danger.',
  jsonb_build_object(
    'health', 100,
    'damage', 20,
    'attackSpeed', 1000,
    'range', 45,
    'movementSpeed', 0
  ),
  jsonb_build_object(
    'deploymentCost', 50,
    'compatibleSkills', jsonb_build_array(),
    'compatibleItems', jsonb_build_array()
  ),
  NULL,
  1
);

-- Palm Master
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'palm_master',
  'Palm Master',
  '🖐️',
  'Balanced fighters with good range and speed',
  'Masters of the Heavenly Palm technique, these cultivators channel their inner energy through their hands. Their balanced approach makes them versatile defenders capable of adapting to any threat.',
  jsonb_build_object(
    'health', 150,
    'damage', 15,
    'attackSpeed', 800,
    'range', 60,
    'movementSpeed', 0
  ),
  jsonb_build_object(
    'deploymentCost', 75,
    'compatibleSkills', jsonb_build_array(),
    'compatibleItems', jsonb_build_array()
  ),
  NULL,
  1
);

-- Arrow Sage
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'arrow_sage',
  'Arrow Sage',
  '🏹',
  'Long-range specialists with powerful shots',
  'Enlightened archers who have transcended mortal limitations, these sages can strike targets from impossible distances. Each arrow they loose carries the weight of their cultivation, piercing through even the toughest defenses.',
  jsonb_build_object(
    'health', 80,
    'damage', 25,
    'attackSpeed', 1500,
    'range', 90,
    'movementSpeed', 0
  ),
  jsonb_build_object(
    'deploymentCost', 100,
    'compatibleSkills', jsonb_build_array(),
    'compatibleItems', jsonb_build_array()
  ),
  NULL,
  1
);

-- Lightning Lord
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'lightning_lord',
  'Lightning Lord',
  '⚡',
  'Devastating damage with slower attacks',
  'Legendary cultivators who have mastered the Heavenly Lightning technique. Their attacks call down divine thunder, obliterating enemies with overwhelming power. Few can withstand even a single strike from these lords of the storm.',
  jsonb_build_object(
    'health', 200,
    'damage', 40,
    'attackSpeed', 2000,
    'range', 75,
    'movementSpeed', 0
  ),
  jsonb_build_object(
    'deploymentCost', 150,
    'compatibleSkills', jsonb_build_array(),
    'compatibleItems', jsonb_build_array()
  ),
  NULL,
  1
);

-- ============================================================================
-- PART 2: Seed Enemy Types (Attackers)
-- ============================================================================

-- Crimson Demon
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'crimson_demon',
  'Crimson Demon',
  '👹',
  'A fierce demon from the underworld with balanced stats',
  'These demons emerged from the rifts between realms, drawn by the sacred energy of the temple. Their crimson skin burns with hellfire, and they seek to corrupt all that is pure.',
  jsonb_build_object(
    'health', 60,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 1.0
  ),
  NULL,
  jsonb_build_object(
    'reward', 20,
    'spawnWeight', 5,
    'firstAppearance', 1,
    'difficulty', 'common'
  ),
  1
);

-- Shadow Wraith
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'shadow_wraith',
  'Shadow Wraith',
  '👤',
  'A swift but fragile creature of darkness',
  'Born from the absence of light, these wraiths move like smoke through the battlefield. They are the scouts of the dark forces, testing the temple''s defenses with their speed.',
  jsonb_build_object(
    'health', 40,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 1.5
  ),
  NULL,
  jsonb_build_object(
    'reward', 15,
    'spawnWeight', 5,
    'firstAppearance', 1,
    'difficulty', 'common'
  ),
  1
);

-- Dire Beast
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'dire_beast',
  'Dire Beast',
  '🐺',
  'A massive beast with high health but slow movement',
  'Corrupted by dark magic, these once-noble creatures now serve as living battering rams. Their thick hide and massive frame make them formidable opponents, though their size slows them down.',
  jsonb_build_object(
    'health', 100,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 0.7
  ),
  NULL,
  jsonb_build_object(
    'reward', 30,
    'spawnWeight', 4,
    'firstAppearance', 1,
    'difficulty', 'uncommon'
  ),
  1
);

-- Spectral Wraith
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'spectral_wraith',
  'Spectral Wraith',
  '👻',
  'An ethereal spirit that phases through defenses',
  'The restless spirits of fallen warriors, bound to serve the darkness. They drift across the battlefield like mist, their ghostly wails chilling the hearts of even the bravest cultivators.',
  jsonb_build_object(
    'health', 80,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 1.2
  ),
  NULL,
  jsonb_build_object(
    'reward', 35,
    'spawnWeight', 3,
    'firstAppearance', 5,
    'difficulty', 'rare'
  ),
  1
);

-- Stone Golem
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'stone_golem',
  'Stone Golem',
  '🗿',
  'A towering construct of stone with immense durability',
  'Ancient guardians twisted by corruption, these stone titans were once protectors of sacred sites. Now they march relentlessly toward the temple, their stone bodies nearly impervious to harm.',
  jsonb_build_object(
    'health', 200,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 0.5
  ),
  NULL,
  jsonb_build_object(
    'reward', 50,
    'spawnWeight', 2,
    'firstAppearance', 10,
    'difficulty', 'elite'
  ),
  1
);

-- Corrupted Dragon
INSERT INTO person_types (
  key,
  name,
  emoji,
  description,
  lore,
  base_stats,
  defender_config,
  attacker_config,
  version
) VALUES (
  'corrupted_dragon',
  'Corrupted Dragon',
  '🐉',
  'A legendary beast of immense power',
  'Once revered as celestial beings, these dragons fell to corruption and now serve the forces of darkness. Their arrival signals a dire threat, as few cultivators have survived an encounter with their might.',
  jsonb_build_object(
    'health', 300,
    'damage', 0,
    'attackSpeed', 0,
    'range', 0,
    'movementSpeed', 0.8
  ),
  NULL,
  jsonb_build_object(
    'reward', 100,
    'spawnWeight', 1,
    'firstAppearance', 15,
    'difficulty', 'boss'
  ),
  1
);

-- ============================================================================
-- PART 3: Seed Wave Configurations (Waves 1-20)
-- ============================================================================
-- Based on current spawn logic: 5 + wave * 2 enemies, random selection from available types
-- Spawn interval: 1000ms between enemies, no initial delay

-- Helper function to generate wave spawns
-- This creates a realistic distribution based on spawn weights and availability
CREATE OR REPLACE FUNCTION generate_wave_spawns(wave_num INTEGER)
RETURNS JSONB AS $
DECLARE
  total_enemies INTEGER;
  spawns JSONB;
  available_types JSONB;
  spawn_groups JSONB;
BEGIN
  -- Calculate total enemies for this wave
  total_enemies := 5 + (wave_num * 2);
  
  -- Get available enemy types for this wave (based on firstAppearance)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id::TEXT,
      'key', key,
      'weight', (attacker_config->>'spawnWeight')::INTEGER
    )
  ) INTO available_types
  FROM person_types
  WHERE attacker_config IS NOT NULL
    AND (attacker_config->>'firstAppearance')::INTEGER <= wave_num;
  
  -- Create spawn groups with weighted distribution
  -- For simplicity, we'll create one spawn group per enemy type with proportional counts
  SELECT jsonb_agg(
    jsonb_build_object(
      'personTypeId', type_data->>'id',
      'count', GREATEST(1, ROUND(total_enemies * (type_data->>'weight')::NUMERIC / total_weight)::INTEGER),
      'spawnInterval', 1000,
      'spawnDelay', 0
    )
  ) INTO spawn_groups
  FROM (
    SELECT 
      jsonb_array_elements(available_types) AS type_data,
      (SELECT SUM((jsonb_array_elements(available_types)->>'weight')::NUMERIC) FROM generate_series(1,1)) AS total_weight
  ) subquery;
  
  RETURN spawn_groups;
END;
$ LANGUAGE plpgsql;

-- Generate wave configurations for waves 1-20
DO $
DECLARE
  wave_num INTEGER;
  wave_spawns JSONB;
  demon_id UUID;
  shadow_id UUID;
  beast_id UUID;
  wraith_id UUID;
  golem_id UUID;
  dragon_id UUID;
BEGIN
  -- Get person type IDs for reference
  SELECT id INTO demon_id FROM person_types WHERE key = 'crimson_demon';
  SELECT id INTO shadow_id FROM person_types WHERE key = 'shadow_wraith';
  SELECT id INTO beast_id FROM person_types WHERE key = 'dire_beast';
  SELECT id INTO wraith_id FROM person_types WHERE key = 'spectral_wraith';
  SELECT id INTO golem_id FROM person_types WHERE key = 'stone_golem';
  SELECT id INTO dragon_id FROM person_types WHERE key = 'corrupted_dragon';
  
  -- Waves 1-4: Demons, Shadows, Beasts only
  FOR wave_num IN 1..4 LOOP
    wave_spawns := jsonb_build_array(
      jsonb_build_object(
        'personTypeId', demon_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', shadow_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', beast_id::TEXT,
        'count', 1 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      )
    );
    
    INSERT INTO wave_configurations (wave_number, spawns, version)
    VALUES (wave_num, wave_spawns, 1);
  END LOOP;
  
  -- Waves 5-9: Add Spectral Wraiths
  FOR wave_num IN 5..9 LOOP
    wave_spawns := jsonb_build_array(
      jsonb_build_object(
        'personTypeId', demon_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', shadow_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', beast_id::TEXT,
        'count', 1 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', wraith_id::TEXT,
        'count', wave_num - 3,
        'spawnInterval', 1000,
        'spawnDelay', 0
      )
    );
    
    INSERT INTO wave_configurations (wave_number, spawns, version)
    VALUES (wave_num, wave_spawns, 1);
  END LOOP;
  
  -- Waves 10-14: Add Stone Golems
  FOR wave_num IN 10..14 LOOP
    wave_spawns := jsonb_build_array(
      jsonb_build_object(
        'personTypeId', demon_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', shadow_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', beast_id::TEXT,
        'count', 1 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', wraith_id::TEXT,
        'count', wave_num - 3,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', golem_id::TEXT,
        'count', wave_num - 8,
        'spawnInterval', 1000,
        'spawnDelay', 0
      )
    );
    
    INSERT INTO wave_configurations (wave_number, spawns, version)
    VALUES (wave_num, wave_spawns, 1);
  END LOOP;
  
  -- Waves 15-20: Add Corrupted Dragons
  FOR wave_num IN 15..20 LOOP
    wave_spawns := jsonb_build_array(
      jsonb_build_object(
        'personTypeId', demon_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', shadow_id::TEXT,
        'count', 2 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', beast_id::TEXT,
        'count', 1 + wave_num,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', wraith_id::TEXT,
        'count', wave_num - 3,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', golem_id::TEXT,
        'count', wave_num - 8,
        'spawnInterval', 1000,
        'spawnDelay', 0
      ),
      jsonb_build_object(
        'personTypeId', dragon_id::TEXT,
        'count', wave_num - 13,
        'spawnInterval', 1000,
        'spawnDelay', 0
      )
    );
    
    INSERT INTO wave_configurations (wave_number, spawns, version)
    VALUES (wave_num, wave_spawns, 1);
  END LOOP;
END;
$;

-- Drop the temporary helper function
DROP FUNCTION IF EXISTS generate_wave_spawns(INTEGER);

-- ============================================================================
-- Verification Queries (commented out - uncomment to verify data)
-- ============================================================================

-- Verify person types were created
-- SELECT key, name, emoji, 
--        CASE 
--          WHEN defender_config IS NOT NULL THEN 'Defender'
--          WHEN attacker_config IS NOT NULL THEN 'Attacker'
--        END as role
-- FROM person_types
-- ORDER BY 
--   CASE WHEN defender_config IS NOT NULL THEN 1 ELSE 2 END,
--   key;

-- Verify wave configurations were created
-- SELECT wave_number, 
--        jsonb_array_length(spawns) as spawn_groups,
--        (SELECT SUM((spawn->>'count')::INTEGER) 
--         FROM jsonb_array_elements(spawns) spawn) as total_enemies
-- FROM wave_configurations
-- ORDER BY wave_number;

-- Verify wave 1 details
-- SELECT w.wave_number,
--        spawn->>'personTypeId' as person_type_id,
--        p.name as enemy_name,
--        spawn->>'count' as count
-- FROM wave_configurations w,
--      jsonb_array_elements(w.spawns) spawn
-- LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
-- WHERE w.wave_number = 1;
