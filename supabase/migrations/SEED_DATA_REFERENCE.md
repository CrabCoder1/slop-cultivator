# Seed Data Reference

This document provides a reference for the data seeded by migration `20241117000003_seed_person_types_and_waves.sql`.

## Person Types

### Defenders (Cultivators)

#### Sword Cultivator
```json
{
  "key": "sword_cultivator",
  "name": "Sword Cultivator",
  "emoji": "⚔️",
  "description": "Masters of close-range combat with fast strikes",
  "base_stats": {
    "health": 100,
    "damage": 20,
    "attackSpeed": 1000,
    "range": 45,
    "movementSpeed": 0
  },
  "defender_config": {
    "deploymentCost": 50,
    "compatibleSkills": [],
    "compatibleItems": []
  }
}
```

#### Palm Master
```json
{
  "key": "palm_master",
  "name": "Palm Master",
  "emoji": "🖐️",
  "description": "Balanced fighters with good range and speed",
  "base_stats": {
    "health": 150,
    "damage": 15,
    "attackSpeed": 800,
    "range": 60,
    "movementSpeed": 0
  },
  "defender_config": {
    "deploymentCost": 75,
    "compatibleSkills": [],
    "compatibleItems": []
  }
}
```

#### Arrow Sage
```json
{
  "key": "arrow_sage",
  "name": "Arrow Sage",
  "emoji": "🏹",
  "description": "Long-range specialists with powerful shots",
  "base_stats": {
    "health": 80,
    "damage": 25,
    "attackSpeed": 1500,
    "range": 90,
    "movementSpeed": 0
  },
  "defender_config": {
    "deploymentCost": 100,
    "compatibleSkills": [],
    "compatibleItems": []
  }
}
```

#### Lightning Lord
```json
{
  "key": "lightning_lord",
  "name": "Lightning Lord",
  "emoji": "⚡",
  "description": "Devastating damage with slower attacks",
  "base_stats": {
    "health": 200,
    "damage": 40,
    "attackSpeed": 2000,
    "range": 75,
    "movementSpeed": 0
  },
  "defender_config": {
    "deploymentCost": 150,
    "compatibleSkills": [],
    "compatibleItems": []
  }
}
```

### Attackers (Enemies)

#### Crimson Demon
```json
{
  "key": "crimson_demon",
  "name": "Crimson Demon",
  "emoji": "👹",
  "description": "A fierce demon from the underworld with balanced stats",
  "base_stats": {
    "health": 60,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 1.0
  },
  "attacker_config": {
    "reward": 20,
    "spawnWeight": 5,
    "firstAppearance": 1,
    "difficulty": "common"
  }
}
```

#### Shadow Wraith
```json
{
  "key": "shadow_wraith",
  "name": "Shadow Wraith",
  "emoji": "👤",
  "description": "A swift but fragile creature of darkness",
  "base_stats": {
    "health": 40,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 1.5
  },
  "attacker_config": {
    "reward": 15,
    "spawnWeight": 5,
    "firstAppearance": 1,
    "difficulty": "common"
  }
}
```

#### Dire Beast
```json
{
  "key": "dire_beast",
  "name": "Dire Beast",
  "emoji": "🐺",
  "description": "A massive beast with high health but slow movement",
  "base_stats": {
    "health": 100,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 0.7
  },
  "attacker_config": {
    "reward": 30,
    "spawnWeight": 4,
    "firstAppearance": 1,
    "difficulty": "uncommon"
  }
}
```

#### Spectral Wraith
```json
{
  "key": "spectral_wraith",
  "name": "Spectral Wraith",
  "emoji": "👻",
  "description": "An ethereal spirit that phases through defenses",
  "base_stats": {
    "health": 80,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 1.2
  },
  "attacker_config": {
    "reward": 35,
    "spawnWeight": 3,
    "firstAppearance": 5,
    "difficulty": "rare"
  }
}
```

#### Stone Golem
```json
{
  "key": "stone_golem",
  "name": "Stone Golem",
  "emoji": "🗿",
  "description": "A towering construct of stone with immense durability",
  "base_stats": {
    "health": 200,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 0.5
  },
  "attacker_config": {
    "reward": 50,
    "spawnWeight": 2,
    "firstAppearance": 10,
    "difficulty": "elite"
  }
}
```

#### Corrupted Dragon
```json
{
  "key": "corrupted_dragon",
  "name": "Corrupted Dragon",
  "emoji": "🐉",
  "description": "A legendary beast of immense power",
  "base_stats": {
    "health": 300,
    "damage": 0,
    "attackSpeed": 0,
    "range": 0,
    "movementSpeed": 0.8
  },
  "attacker_config": {
    "reward": 100,
    "spawnWeight": 1,
    "firstAppearance": 15,
    "difficulty": "boss"
  }
}
```

## Wave Configurations

### Wave Progression

| Wave Range | Available Enemies | Total Enemy Types |
|------------|------------------|-------------------|
| 1-4 | Demon, Shadow, Beast | 3 |
| 5-9 | + Spectral Wraith | 4 |
| 10-14 | + Stone Golem | 5 |
| 15-20 | + Corrupted Dragon | 6 |

### Enemy Count Formula

```
Total Enemies = 5 + (wave_number * 2)
```

Examples:
- Wave 1: 7 enemies
- Wave 5: 15 enemies
- Wave 10: 25 enemies
- Wave 20: 45 enemies

### Spawn Configuration

All waves use:
- **Spawn Interval**: 1000ms (1 second between enemy spawns)
- **Spawn Delay**: 0ms (enemies start spawning immediately)

### Distribution by Wave

#### Waves 1-4
- Crimson Demons: 2 + wave_number
- Shadow Wraiths: 2 + wave_number
- Dire Beasts: 1 + wave_number

#### Waves 5-9
- Crimson Demons: 2 + wave_number
- Shadow Wraiths: 2 + wave_number
- Dire Beasts: 1 + wave_number
- Spectral Wraiths: wave_number - 3

#### Waves 10-14
- Crimson Demons: 2 + wave_number
- Shadow Wraiths: 2 + wave_number
- Dire Beasts: 1 + wave_number
- Spectral Wraiths: wave_number - 3
- Stone Golems: wave_number - 8

#### Waves 15-20
- Crimson Demons: 2 + wave_number
- Shadow Wraiths: 2 + wave_number
- Dire Beasts: 1 + wave_number
- Spectral Wraiths: wave_number - 3
- Stone Golems: wave_number - 8
- Corrupted Dragons: wave_number - 13

## Data Mapping

### From cultivator.ts

| Old Field | New Field | Location |
|-----------|-----------|----------|
| `name` | `name` | person_types.name |
| `cost` | `deploymentCost` | defender_config.deploymentCost |
| `rangeInTiles * 30` | `range` | base_stats.range |
| `damage` | `damage` | base_stats.damage |
| `attackSpeed` | `attackSpeed` | base_stats.attackSpeed |
| `emoji` | `emoji` | person_types.emoji |
| `maxHealth` | `health` | base_stats.health |
| `description` | `description` | person_types.description |

### From enemy-codex.ts

| Old Field | New Field | Location |
|-----------|-----------|----------|
| `name` | `name` | person_types.name |
| `emoji` | `emoji` | person_types.emoji |
| `description` | `description` | person_types.description |
| `lore` | `lore` | person_types.lore |
| `baseStats.health` | `health` | base_stats.health |
| `baseStats.speed` | `movementSpeed` | base_stats.movementSpeed |
| `baseStats.reward` | `reward` | attacker_config.reward |
| `difficulty` | `difficulty` | attacker_config.difficulty |
| `firstAppearance` | `firstAppearance` | attacker_config.firstAppearance |

## Verification Queries

### Count Person Types by Role
```sql
SELECT 
  CASE 
    WHEN defender_config IS NOT NULL THEN 'Defender'
    WHEN attacker_config IS NOT NULL THEN 'Attacker'
  END as role,
  COUNT(*) as count
FROM person_types
GROUP BY role;
```

Expected: 4 Defenders, 6 Attackers

### List All Person Types
```sql
SELECT key, name, emoji, 
       CASE 
         WHEN defender_config IS NOT NULL THEN 'Defender'
         WHEN attacker_config IS NOT NULL THEN 'Attacker'
       END as role
FROM person_types
ORDER BY 
  CASE WHEN defender_config IS NOT NULL THEN 1 ELSE 2 END,
  key;
```

### Verify Wave Configurations
```sql
SELECT wave_number, 
       jsonb_array_length(spawns) as spawn_groups,
       (SELECT SUM((spawn->>'count')::INTEGER) 
        FROM jsonb_array_elements(spawns) spawn) as total_enemies
FROM wave_configurations
ORDER BY wave_number;
```

### View Wave 1 Details
```sql
SELECT w.wave_number,
       p.name as enemy_name,
       p.emoji,
       spawn->>'count' as count,
       spawn->>'spawnInterval' as interval_ms
FROM wave_configurations w,
     jsonb_array_elements(w.spawns) spawn
LEFT JOIN person_types p ON p.id::TEXT = spawn->>'personTypeId'
WHERE w.wave_number = 1
ORDER BY p.name;
```

### Check Enemy Unlock Progression
```sql
SELECT 
  (attacker_config->>'firstAppearance')::INTEGER as first_wave,
  name,
  emoji,
  attacker_config->>'difficulty' as difficulty
FROM person_types
WHERE attacker_config IS NOT NULL
ORDER BY first_wave, name;
```
