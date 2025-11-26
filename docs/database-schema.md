# Database Schema Documentation

This document describes the database schema for the Cultivator Composition System in Slop Cultivator.

## Overview

The system uses a composition-based architecture with the following tables in Supabase PostgreSQL:

### Core Composition Tables
1. `species` - Biological/racial types with base physical stats
2. `daos` - Cultivation paths with combat characteristics
3. `titles` - Achievement ranks with stat bonuses
4. `person_types` - Cultivator definitions (composed from species, dao, title)

### Achievement System Tables
5. `achievements` - Achievement definitions with conditions and rewards
6. `player_profiles` - Player statistics and unlocked content
7. `player_achievements` - Player achievement progress tracking

### Wave System Tables
8. `wave_configurations` - Wave composition data

## Tables

### species

Stores species definitions with base physical characteristics.

#### Schema

```sql
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  
  base_stats JSONB NOT NULL,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_species_key ON species(key);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| key | TEXT | No | Unique identifier (e.g., 'human', 'demon') |
| name | TEXT | No | Display name |
| emoji | TEXT | No | Visual representation (single emoji) |
| description | TEXT | No | Short description |
| lore | TEXT | Yes | Optional backstory |
| base_stats | JSONB | No | Base physical stats |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structure

**base_stats**
```json
{
  "health": 100,
  "movementSpeed": 1.5
}
```

#### Indexes

- `idx_species_key`: Fast lookups by key

#### Constraints

- `key` must be unique
- `base_stats` must contain `health` and `movementSpeed` (enforced at application level)

---

### daos

Stores dao (cultivation path) definitions with combat characteristics.

#### Schema

```sql
CREATE TABLE daos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  
  combat_stats JSONB NOT NULL,
  compatible_skills JSONB NOT NULL,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daos_key ON daos(key);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| key | TEXT | No | Unique identifier (e.g., 'sword_dao', 'palm_dao') |
| name | TEXT | No | Display name |
| emoji | TEXT | No | Visual representation (single emoji) |
| description | TEXT | No | Short description |
| lore | TEXT | Yes | Optional backstory |
| combat_stats | JSONB | No | Combat characteristics |
| compatible_skills | JSONB | No | Array of compatible skill IDs |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structures

**combat_stats**
```json
{
  "damage": 20,
  "attackSpeed": 1000,
  "range": 50,
  "attackPattern": "melee"
}
```

**compatible_skills** (array)
```json
["skill_id_1", "skill_id_2", "skill_id_3"]
```

#### Indexes

- `idx_daos_key`: Fast lookups by key

#### Constraints

- `key` must be unique
- `attackPattern` must be one of: 'melee', 'ranged', 'aoe' (enforced at application level)

---

### titles

Stores title definitions with stat bonuses and multipliers.

#### Schema

```sql
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  
  stat_bonuses JSONB NOT NULL,
  prestige_level INTEGER NOT NULL DEFAULT 1,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_titles_key ON titles(key);
CREATE INDEX idx_titles_prestige ON titles(prestige_level);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| key | TEXT | No | Unique identifier (e.g., 'palm_sage', 'sword_master') |
| name | TEXT | No | Display name |
| emoji | TEXT | No | Visual representation (single emoji) |
| description | TEXT | No | Short description |
| stat_bonuses | JSONB | No | Stat multipliers and flat bonuses |
| prestige_level | INTEGER | No | Prestige level (1-10) for sorting |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structure

**stat_bonuses**
```json
{
  "healthMultiplier": 1.2,
  "damageMultiplier": 1.5,
  "attackSpeedMultiplier": 0.8,
  "rangeBonus": 10,
  "movementSpeedMultiplier": 1.1
}
```

#### Indexes

- `idx_titles_key`: Fast lookups by key
- `idx_titles_prestige`: Fast sorting by prestige level

#### Constraints

- `key` must be unique
- `prestige_level` must be between 1 and 10 (enforced at application level)

---

### achievements

Stores achievement definitions with unlock conditions and rewards.

#### Schema

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  
  conditions JSONB NOT NULL,
  rewards JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_key ON achievements(key);
CREATE INDEX idx_achievements_sort ON achievements(sort_order);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| key | TEXT | No | Unique identifier (e.g., 'wave_10_complete') |
| name | TEXT | No | Display name |
| emoji | TEXT | No | Visual representation (single emoji) |
| description | TEXT | No | Achievement description |
| conditions | JSONB | No | Array of unlock conditions (all must be met) |
| rewards | JSONB | No | Array of rewards granted on unlock |
| sort_order | INTEGER | No | Display order (lower = earlier) |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structures

**conditions** (array)
```json
[
  {
    "type": "wave_complete",
    "targetValue": 10,
    "comparisonOperator": "greater_or_equal",
    "isTrackable": true,
    "progressLabel": "Waves Completed"
  }
]
```

**rewards** (array)
```json
[
  {
    "type": "unlock_species",
    "value": "demon_species_id",
    "displayName": "Unlock Demon Species"
  },
  {
    "type": "grant_qi",
    "value": 1000,
    "displayName": "1000 Qi"
  }
]
```

#### Indexes

- `idx_achievements_key`: Fast lookups by key
- `idx_achievements_sort`: Fast sorting by display order

#### Constraints

- `key` must be unique
- `conditions` array must not be empty (enforced at application level)
- Condition types: 'wave_complete', 'enemy_defeat_count', 'cultivator_deploy_count', 'score_threshold', 'castle_health_preserved', 'win_without_damage'
- Reward types: 'unlock_species', 'unlock_dao', 'unlock_title', 'grant_qi', 'unlock_cosmetic'

---

### player_profiles

Stores player statistics and unlocked content.

#### Schema

```sql
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  
  stats JSONB NOT NULL DEFAULT '{}',
  unlocked_species JSONB NOT NULL DEFAULT '[]',
  unlocked_daos JSONB NOT NULL DEFAULT '[]',
  unlocked_titles JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_profiles_anonymous ON player_profiles(anonymous_id);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| anonymous_id | TEXT | No | Browser-based anonymous identifier |
| stats | JSONB | No | Player statistics |
| unlocked_species | JSONB | No | Array of unlocked species IDs |
| unlocked_daos | JSONB | No | Array of unlocked dao IDs |
| unlocked_titles | JSONB | No | Array of unlocked title IDs |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structures

**stats**
```json
{
  "totalGamesPlayed": 10,
  "highestWave": 15,
  "highestScore": 5000,
  "totalEnemiesDefeated": 450,
  "totalCultivatorsDeployed": 80
}
```

**unlocked_species** (array)
```json
["species_id_1", "species_id_2"]
```

#### Indexes

- `idx_player_profiles_anonymous`: Fast lookups by anonymous ID

#### Constraints

- `anonymous_id` must be unique
- Anonymous ID format: `anon_{timestamp}_{random}` (enforced at application level)

---

### player_achievements

Stores player achievement progress and unlock status.

#### Schema

```sql
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  progress JSONB NOT NULL DEFAULT '{}',
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(player_id, achievement_id)
);

CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX idx_player_achievements_unlocked ON player_achievements(is_unlocked);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| player_id | UUID | No | Foreign key to player_profiles |
| achievement_id | UUID | No | Foreign key to achievements |
| progress | JSONB | No | Progress toward each condition |
| is_unlocked | BOOLEAN | No | Whether achievement is unlocked |
| unlocked_at | TIMESTAMPTZ | Yes | Timestamp when unlocked |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structure

**progress** (object mapping condition index to current value)
```json
{
  "0": 7,
  "1": 45
}
```

#### Indexes

- `idx_player_achievements_player`: Fast lookups by player
- `idx_player_achievements_unlocked`: Fast filtering by unlock status

#### Constraints

- Foreign key to `player_profiles(id)` with CASCADE delete
- Foreign key to `achievements(id)` with CASCADE delete
- Unique constraint on `(player_id, achievement_id)` pair

---

### person_types

Stores cultivator definitions composed from species, dao, and title.

#### Schema

```sql
CREATE TABLE person_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  -- Composition references
  species_id UUID REFERENCES species(id),
  dao_id UUID REFERENCES daos(id),
  title_id UUID REFERENCES titles(id),
  
  -- Equipment
  equipped_skills JSONB DEFAULT '[]',
  equipped_items JSONB DEFAULT '[]',
  
  -- Role
  role TEXT NOT NULL DEFAULT 'defender',
  
  -- Role-specific configs
  defender_config JSONB,
  attacker_config JSONB,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_person_types_key ON person_types(key);
CREATE INDEX idx_person_types_species ON person_types(species_id);
CREATE INDEX idx_person_types_dao ON person_types(dao_id);
CREATE INDEX idx_person_types_title ON person_types(title_id);
CREATE INDEX idx_person_types_role ON person_types(role);
CREATE INDEX idx_person_types_attacker ON person_types((attacker_config->>'firstAppearance'));
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| key | TEXT | No | Unique identifier (e.g., 'sword_cultivator') |
| name | TEXT | No | Display name |
| species_id | UUID | Yes | Foreign key to species table |
| dao_id | UUID | Yes | Foreign key to daos table |
| title_id | UUID | Yes | Foreign key to titles table |
| equipped_skills | JSONB | No | Array of equipped skill IDs (max 3) |
| equipped_items | JSONB | No | Array of equipped item IDs (max 3) |
| role | TEXT | No | 'defender' or 'attacker' |
| defender_config | JSONB | Yes | Defender-specific configuration |
| attacker_config | JSONB | Yes | Attacker-specific configuration |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structures

**equipped_skills** (array)
```json
["skill_id_1", "skill_id_2", "skill_id_3"]
```

**equipped_items** (array)
```json
["item_id_1", "item_id_2"]
```

**defender_config** (optional)
```json
{
  "deploymentCost": 50,
  "compatibleSkills": ["skill1", "skill2", "skill3"],
  "compatibleItems": ["item1", "item2", "item3"]
}
```

**attacker_config** (optional)
```json
{
  "reward": 20,
  "spawnWeight": 5,
  "firstAppearance": 1,
  "difficulty": "common"
}
```

#### Indexes

- `idx_person_types_key`: Fast lookups by key
- `idx_person_types_species`: Fast filtering by species
- `idx_person_types_dao`: Fast filtering by dao
- `idx_person_types_title`: Fast filtering by title
- `idx_person_types_role`: Fast filtering by role
- `idx_person_types_attacker`: Fast filtering by first appearance wave

#### Constraints

- `key` must be unique
- Foreign key to `species(id)`
- Foreign key to `daos(id)`
- Foreign key to `titles(id)`
- `role` must be 'defender' or 'attacker' (enforced at application level)
- At least one of `defender_config` or `attacker_config` should be present (enforced at application level)
- Skills must be compatible with dao (enforced at application level)

---

### wave_configurations

Stores wave composition data defining which enemies spawn in each wave.

#### Schema

```sql
CREATE TABLE wave_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wave_number INTEGER NOT NULL UNIQUE,
  
  spawns JSONB NOT NULL,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wave_configurations_wave_number ON wave_configurations(wave_number);
```

#### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key, auto-generated |
| wave_number | INTEGER | No | Wave number (unique) |
| spawns | JSONB | No | Array of spawn definitions |
| version | INTEGER | No | Schema version for migrations |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |

#### JSONB Structure

**spawns** (array)
```json
[
  {
    "personTypeId": "uuid-of-person-type",
    "count": 10,
    "spawnInterval": 1000,
    "spawnDelay": 0
  },
  {
    "personTypeId": "uuid-of-another-person-type",
    "count": 5,
    "spawnInterval": 1500,
    "spawnDelay": 5000
  }
]
```

#### Indexes

- `idx_wave_configurations_wave_number`: Fast lookups by wave number

#### Constraints

- `wave_number` must be unique
- `spawns` array must not be empty (enforced at application level)
- Person Type IDs in spawns should reference valid person_types (enforced at application level)

## Relationships

### Entity Relationship Diagram

```
┌──────────────┐
│   species    │
│              │
│ id (PK)      │
│ key          │
│ name         │
│ base_stats   │
└──────┬───────┘
       │
       │ 1:N
       │
       ↓
┌──────────────┐       ┌──────────────┐
│     daos     │       │   titles     │
│              │       │              │
│ id (PK)      │       │ id (PK)      │
│ key          │       │ key          │
│ name         │       │ name         │
│ combat_stats │       │ stat_bonuses │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │ 1:N                  │ 1:N
       │                      │
       ↓                      ↓
┌──────────────────────────────────────┐
│          person_types                │
│                                      │
│ id (PK)                              │
│ species_id (FK) ──→ species.id      │
│ dao_id (FK) ──→ daos.id             │
│ title_id (FK) ──→ titles.id         │
│ equipped_skills                      │
│ equipped_items                       │
│ role                                 │
└──────┬───────────────────────────────┘
       │
       │ 1:N (via JSONB)
       │
       ↓
┌──────────────────────┐
│ wave_configurations  │
│                      │
│ id (PK)              │
│ wave_number          │
│ spawns[]             │
│   .personTypeId      │
└──────────────────────┘

┌──────────────────┐
│  achievements    │
│                  │
│ id (PK)          │
│ key              │
│ conditions       │
│ rewards          │
└────────┬─────────┘
         │
         │ 1:N
         │
         ↓
┌──────────────────────────────┐
│    player_achievements       │
│                              │
│ id (PK)                      │
│ player_id (FK) ──┐           │
│ achievement_id (FK) ──→ achievements.id
│ progress                     │
│ is_unlocked                  │
└──────────────────────────────┘
         ↑
         │ N:1
         │
┌────────┴─────────┐
│ player_profiles  │
│                  │
│ id (PK)          │
│ anonymous_id     │
│ stats            │
│ unlocked_*       │
└──────────────────┘
```

### Foreign Key Relationships

- `person_types.species_id` → `species.id`
- `person_types.dao_id` → `daos.id`
- `person_types.title_id` → `titles.id`
- `player_achievements.player_id` → `player_profiles.id` (CASCADE DELETE)
- `player_achievements.achievement_id` → `achievements.id` (CASCADE DELETE)
- `wave_configurations.spawns[].personTypeId` → `person_types.id` (JSONB, not enforced)

### Composition Relationships

A `person_types` record is **composed** of:
- 1 Species (defines base physical stats)
- 1 Dao (defines combat style)
- 1 Title (provides stat bonuses)
- 0-3 Skills (equipped abilities)
- 0-3 Items (equipped equipment)

Final cultivator stats = Species base stats + Dao combat stats + Title bonuses

## Data Types

### Species Base Stats

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| health | number | 50-500 | Base hit points |
| movementSpeed | number | 0.5-3.0 | Base pixels per frame |

### Dao Combat Stats

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| damage | number | 5-100 | Base damage per attack |
| attackSpeed | number | 500-5000 | Milliseconds between attacks |
| range | number | 30-300 | Attack range in pixels |
| attackPattern | string | enum | 'melee', 'ranged', 'aoe' |

### Title Stat Bonuses

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| healthMultiplier | number | 0.5-3.0 | Health multiplier (1.2 = +20%) |
| damageMultiplier | number | 0.5-3.0 | Damage multiplier (1.5 = +50%) |
| attackSpeedMultiplier | number | 0.3-2.0 | Attack speed multiplier (0.8 = 20% faster) |
| rangeBonus | number | -50 to 100 | Flat range bonus in pixels |
| movementSpeedMultiplier | number | 0.5-2.0 | Movement speed multiplier |

### Achievement Condition Types

| Type | Description | Target Value |
|------|-------------|--------------|
| wave_complete | Wave number reached | Wave number (1-999) |
| enemy_defeat_count | Total enemies defeated | Count (1-10000) |
| cultivator_deploy_count | Total cultivators deployed | Count (1-1000) |
| score_threshold | Score reached | Score value |
| castle_health_preserved | Castle health % remaining | Percentage (0-100) |
| win_without_damage | Win with full castle health | 1 (boolean) |

### Achievement Reward Types

| Type | Description | Value |
|------|-------------|-------|
| unlock_species | Unlock a species | Species ID (UUID) |
| unlock_dao | Unlock a dao | Dao ID (UUID) |
| unlock_title | Unlock a title | Title ID (UUID) |
| grant_qi | Grant Qi currency | Amount (1-10000) |
| unlock_cosmetic | Unlock cosmetic item | Cosmetic ID |

### Defender Config

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| deploymentCost | number | 1-500 | Qi cost to deploy |
| compatibleSkills | string[] | - | Array of skill IDs |
| compatibleItems | string[] | - | Array of item IDs |

### Attacker Config

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| reward | number | 1-500 | Qi reward for defeat |
| spawnWeight | number | 1-10 | Relative spawn probability |
| firstAppearance | number | 1-999 | First wave number |
| difficulty | string | enum | 'common', 'uncommon', 'rare', 'elite', 'boss' |

### Wave Spawn

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| personTypeId | string | UUID | Reference to person_types.id |
| count | number | 1-100 | Number to spawn |
| spawnInterval | number | 0-10000 | Milliseconds between spawns |
| spawnDelay | number | 0-30000 | Delay before first spawn |

## Migrations

Migrations are stored in `supabase/migrations/` directory.

### Composition System Migration Files

1. `20241118000001_create_species_table.sql`
   - Creates species table
   - Adds indexes
   - Sets up RLS policies

2. `20241118000002_create_daos_table.sql`
   - Creates daos table
   - Adds indexes
   - Sets up RLS policies

3. `20241118000003_create_titles_table.sql`
   - Creates titles table
   - Adds indexes
   - Sets up RLS policies

4. `20241118000004_create_achievements_table.sql`
   - Creates achievements table
   - Adds indexes
   - Sets up RLS policies

5. `20241118000005_create_player_profiles_table.sql`
   - Creates player_profiles table
   - Adds indexes
   - Sets up RLS policies

6. `20241118000006_create_player_achievements_table.sql`
   - Creates player_achievements table
   - Adds indexes
   - Adds foreign key constraints
   - Sets up RLS policies

7. `20241118000007_update_person_types_for_composition.sql`
   - Adds composition columns to person_types
   - Adds foreign key constraints
   - Adds indexes

8. `20241118000008_migrate_person_types_to_composition.sql`
   - Extracts species data from person_types
   - Extracts dao data from person_types
   - Extracts title data from person_types
   - Updates person_types with composition references

9. `20241118000009_seed_initial_achievements.sql`
   - Seeds initial achievement definitions
   - Creates starter achievements

### Applying Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# Copy SQL from migration files and execute in order
```

See `supabase/migrations/APPLY_COMPOSITION_MIGRATIONS.md` for detailed instructions.

### Rollback

If needed, rollback migrations are available:

```bash
# Execute rollback script
psql -h your-db-host -U postgres -d postgres < supabase/migrations/rollback_composition_system.sql
```

See `supabase/migrations/ROLLBACK_PLAN.md` for detailed rollback instructions.

## Queries

### Common Queries

**Get all Species**
```sql
SELECT * FROM species ORDER BY key;
```

**Get all Daos**
```sql
SELECT * FROM daos ORDER BY key;
```

**Get all Titles sorted by prestige**
```sql
SELECT * FROM titles ORDER BY prestige_level DESC, name;
```

**Get all Achievements sorted by display order**
```sql
SELECT * FROM achievements ORDER BY sort_order, name;
```

**Get Person Type with full composition**
```sql
SELECT 
  pt.*,
  s.name as species_name,
  s.emoji as species_emoji,
  s.base_stats as species_base_stats,
  d.name as dao_name,
  d.emoji as dao_emoji,
  d.combat_stats as dao_combat_stats,
  t.name as title_name,
  t.emoji as title_emoji,
  t.stat_bonuses as title_stat_bonuses
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
WHERE pt.key = 'sword_cultivator';
```

**Get all defenders with composition**
```sql
SELECT 
  pt.key,
  pt.name,
  s.name as species,
  d.name as dao,
  t.name as title
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
WHERE pt.role = 'defender'
ORDER BY pt.key;
```

**Get all attackers with composition**
```sql
SELECT 
  pt.key,
  pt.name,
  s.name as species,
  d.name as dao,
  t.name as title,
  (pt.attacker_config->>'firstAppearance')::int as first_wave
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
WHERE pt.role = 'attacker'
ORDER BY first_wave, pt.key;
```

**Get player profile with unlocked content**
```sql
SELECT 
  pp.*,
  (
    SELECT json_agg(s.name)
    FROM species s
    WHERE s.id::text = ANY(
      SELECT jsonb_array_elements_text(pp.unlocked_species)
    )
  ) as unlocked_species_names
FROM player_profiles pp
WHERE pp.anonymous_id = 'anon_123456';
```

**Get player achievements with progress**
```sql
SELECT 
  a.name,
  a.emoji,
  a.description,
  pa.is_unlocked,
  pa.progress,
  pa.unlocked_at
FROM player_achievements pa
JOIN achievements a ON pa.achievement_id = a.id
WHERE pa.player_id = 'player_uuid'
ORDER BY a.sort_order;
```

**Get wave configuration**
```sql
SELECT * FROM wave_configurations WHERE wave_number = 5;
```

**Get all configured waves**
```sql
SELECT wave_number, 
       jsonb_array_length(spawns) as spawn_groups,
       created_at 
FROM wave_configurations 
ORDER BY wave_number;
```

### Admin Queries

**Count composition components**
```sql
SELECT 
  (SELECT COUNT(*) FROM species) as species_count,
  (SELECT COUNT(*) FROM daos) as daos_count,
  (SELECT COUNT(*) FROM titles) as titles_count,
  (SELECT COUNT(*) FROM achievements) as achievements_count,
  (SELECT COUNT(*) FROM person_types WHERE role = 'defender') as defenders_count,
  (SELECT COUNT(*) FROM person_types WHERE role = 'attacker') as attackers_count;
```

**Find Person Types using a specific Species**
```sql
SELECT pt.key, pt.name
FROM person_types pt
WHERE pt.species_id = 'species_uuid';
```

**Find Person Types using a specific Dao**
```sql
SELECT pt.key, pt.name
FROM person_types pt
WHERE pt.dao_id = 'dao_uuid';
```

**Find Person Types using a specific Title**
```sql
SELECT pt.key, pt.name
FROM person_types pt
WHERE pt.title_id = 'title_uuid';
```

**Get achievement unlock statistics**
```sql
SELECT 
  a.name,
  COUNT(pa.id) as total_players,
  COUNT(pa.id) FILTER (WHERE pa.is_unlocked) as unlocked_count,
  ROUND(
    100.0 * COUNT(pa.id) FILTER (WHERE pa.is_unlocked) / NULLIF(COUNT(pa.id), 0),
    2
  ) as unlock_percentage
FROM achievements a
LEFT JOIN player_achievements pa ON a.id = pa.achievement_id
GROUP BY a.id, a.name
ORDER BY unlock_percentage DESC;
```

**List waves with enemy counts**
```sql
SELECT 
  wave_number,
  (
    SELECT SUM((spawn->>'count')::int)
    FROM jsonb_array_elements(spawns) as spawn
  ) as total_enemies
FROM wave_configurations
ORDER BY wave_number;
```

**Find Person Types not used in any wave**
```sql
SELECT pt.key, pt.name
FROM person_types pt
WHERE pt.role = 'attacker'
  AND NOT EXISTS (
    SELECT 1 
    FROM wave_configurations wc,
         jsonb_array_elements(wc.spawns) as spawn
    WHERE spawn->>'personTypeId' = pt.id::text
  );
```

**Get most popular species/dao/title combinations**
```sql
SELECT 
  s.name as species,
  d.name as dao,
  t.name as title,
  COUNT(pt.id) as usage_count
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
GROUP BY s.name, d.name, t.name
ORDER BY usage_count DESC
LIMIT 10;
```

## Row Level Security (RLS)

### Composition Tables Policies

All composition tables (species, daos, titles, achievements) use the same policy pattern:

```sql
-- Allow read access to all users (anonymous and authenticated)
CREATE POLICY "Allow public read access"
ON species FOR SELECT
USING (true);

-- Allow insert/update/delete for admin users only
CREATE POLICY "Allow admin write access"
ON species FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

Apply the same pattern to: `daos`, `titles`, `achievements`

### person_types Policies

```sql
-- Allow read access to all users
CREATE POLICY "Allow public read access to person_types"
ON person_types FOR SELECT
USING (true);

-- Allow insert/update/delete for admin users only
CREATE POLICY "Allow admin write access to person_types"
ON person_types FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### player_profiles Policies

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON player_profiles FOR SELECT
USING (anonymous_id = current_setting('app.anonymous_id', true));

-- Allow users to insert their own profile
CREATE POLICY "Users can create own profile"
ON player_profiles FOR INSERT
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON player_profiles FOR UPDATE
USING (anonymous_id = current_setting('app.anonymous_id', true));
```

### player_achievements Policies

```sql
-- Allow users to read their own achievements
CREATE POLICY "Users can read own achievements"
ON player_achievements FOR SELECT
USING (
  player_id IN (
    SELECT id FROM player_profiles 
    WHERE anonymous_id = current_setting('app.anonymous_id', true)
  )
);

-- Allow users to insert their own achievements
CREATE POLICY "Users can create own achievements"
ON player_achievements FOR INSERT
WITH CHECK (
  player_id IN (
    SELECT id FROM player_profiles 
    WHERE anonymous_id = current_setting('app.anonymous_id', true)
  )
);

-- Allow users to update their own achievements
CREATE POLICY "Users can update own achievements"
ON player_achievements FOR UPDATE
USING (
  player_id IN (
    SELECT id FROM player_profiles 
    WHERE anonymous_id = current_setting('app.anonymous_id', true)
  )
);
```

### wave_configurations Policies

```sql
-- Allow read access to all users
CREATE POLICY "Allow public read access to wave_configurations"
ON wave_configurations FOR SELECT
USING (true);

-- Allow insert/update/delete for admin users only
CREATE POLICY "Allow admin write access to wave_configurations"
ON wave_configurations FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

Note: Adjust policies based on your authentication setup. The `app.anonymous_id` setting should be set by the application before queries.

## Backup and Restore

### Backup

```bash
# Export all composition tables
supabase db dump --table species > species_backup.sql
supabase db dump --table daos > daos_backup.sql
supabase db dump --table titles > titles_backup.sql
supabase db dump --table achievements > achievements_backup.sql
supabase db dump --table person_types > person_types_backup.sql
supabase db dump --table player_profiles > player_profiles_backup.sql
supabase db dump --table player_achievements > player_achievements_backup.sql
supabase db dump --table wave_configurations > wave_configurations_backup.sql

# Or export entire database
supabase db dump > full_backup.sql
```

### Restore

```bash
# Restore individual tables
psql -h your-db-host -U postgres -d postgres < species_backup.sql
psql -h your-db-host -U postgres -d postgres < daos_backup.sql
# ... etc

# Or restore entire database
psql -h your-db-host -U postgres -d postgres < full_backup.sql
```

### Backup Strategy

Recommended backup schedule:
- **Daily**: Automated full database backup
- **Before migrations**: Manual backup of affected tables
- **Before major changes**: Full database snapshot
- **Player data**: Hourly incremental backups of player_profiles and player_achievements

## Performance Considerations

### Indexing
- `key` indexes on all composition tables enable fast lookups
- Foreign key indexes on person_types enable fast joins
- `wave_number` index enables fast wave config lookups
- `anonymous_id` index enables fast player profile lookups
- `player_id` and `achievement_id` indexes enable fast achievement queries
- JSONB indexes on `firstAppearance` for attacker filtering

### Caching Strategy
- **Composition Data**: Cache species, daos, titles for 5 minutes (rarely changes)
- **Achievements**: Cache achievement definitions for 5 minutes
- **Person Types**: Cache for 5 minutes with composition data pre-joined
- **Wave Configurations**: Cache for 5 minutes
- **Player Profiles**: Cache for current session only (frequently updated)
- **Player Achievements**: Cache for current session, invalidate on unlock

### Query Optimization
- Use indexes for filtering and joins
- Pre-join composition data when loading person_types
- Batch achievement progress updates (update every 5 seconds, not every frame)
- Use JSONB operators efficiently
- Consider materialized views for complex analytics queries
- Limit result sets with pagination

### Database Connection Pooling
- Use connection pooling for concurrent requests
- Recommended pool size: 10-20 connections
- Set appropriate timeout values
- Monitor connection usage

### Monitoring
Key metrics to track:
- Query execution time (target: <100ms for reads, <500ms for writes)
- Cache hit rate (target: >90%)
- Database connection count
- Table sizes and growth rate
- Index usage statistics

## Maintenance

### Regular Tasks

**Update statistics (run weekly)**
```sql
ANALYZE species;
ANALYZE daos;
ANALYZE titles;
ANALYZE achievements;
ANALYZE person_types;
ANALYZE player_profiles;
ANALYZE player_achievements;
ANALYZE wave_configurations;
```

**Check table sizes**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE tablename IN (
  'species', 'daos', 'titles', 'achievements',
  'person_types', 'player_profiles', 'player_achievements',
  'wave_configurations'
)
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Vacuum tables (run monthly or when needed)**
```sql
VACUUM ANALYZE species;
VACUUM ANALYZE daos;
VACUUM ANALYZE titles;
VACUUM ANALYZE achievements;
VACUUM ANALYZE person_types;
VACUUM ANALYZE player_profiles;
VACUUM ANALYZE player_achievements;
VACUUM ANALYZE wave_configurations;
```

**Check index usage**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'species', 'daos', 'titles', 'achievements',
    'person_types', 'player_profiles', 'player_achievements'
  )
ORDER BY idx_scan DESC;
```

**Archive old player data (optional, run quarterly)**
```sql
-- Archive inactive players (no activity in 6 months)
-- Move to archive table or delete based on retention policy
DELETE FROM player_profiles
WHERE updated_at < NOW() - INTERVAL '6 months'
  AND id NOT IN (
    SELECT DISTINCT player_id 
    FROM player_achievements 
    WHERE updated_at > NOW() - INTERVAL '6 months'
  );
```

## Troubleshooting

### Common Issues

**Composition component not found**
- Check if species/dao/title key is correct
- Verify record exists in database
- Check RLS policies
- Verify foreign key references are valid

**Person Type missing composition data**
- Check if species_id, dao_id, title_id are set
- Verify foreign key constraints
- Check if referenced records exist
- Use validation query to find orphaned records:
```sql
SELECT pt.key, pt.name
FROM person_types pt
WHERE pt.species_id IS NULL 
   OR pt.dao_id IS NULL 
   OR pt.title_id IS NULL;
```

**Achievement not unlocking**
- Verify all conditions are met (AND logic)
- Check condition types and comparison operators
- Verify game state values are correct
- Check if achievement is already unlocked
- Review achievement evaluation logs

**Player profile not persisting**
- Check anonymous_id in localStorage
- Verify Supabase connection
- Check RLS policies
- Verify `app.anonymous_id` setting is set correctly
- Check browser console for errors

**Stat calculation incorrect**
- Verify species base stats
- Check dao combat stats
- Confirm title multipliers
- Use composition service to debug
- Check for null/undefined values

**Performance slow**
- Check if indexes exist: `\di` in psql
- Analyze query plans: `EXPLAIN ANALYZE <query>`
- Check cache hit rates
- Verify connection pooling is configured
- Check table statistics are up to date
- Monitor slow query log

**Foreign key constraint violation**
- Verify referenced record exists before insert/update
- Check cascade delete behavior
- Use transactions for multi-table operations
- Validate IDs before saving

## References

- [Composition System Developer Guide](composition-system-guide.md)
- [Migration Guide](../supabase/migrations/MIGRATION_GUIDE.md)
- [Rollback Plan](../supabase/migrations/ROLLBACK_PLAN.md)
- [Creating Person Types Guide](guide-creating-person-types.md)
- [Configuring Waves Guide](guide-configuring-waves.md)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
