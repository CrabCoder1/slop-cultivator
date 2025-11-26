# Composition System Migration

## Overview

This document describes the database migration for the cultivator composition system, which refactors the monolithic person_types structure into a flexible composition model.

## Migration File

**File**: `20241118000001_create_composition_system_tables.sql`

## Tables Created

### 1. species
Stores species definitions (biological/species types)

**Columns**:
- `id` (UUID, PK) - Primary key
- `key` (TEXT, UNIQUE) - Unique identifier (e.g., 'human', 'demon')
- `name` (TEXT) - Display name
- `emoji` (TEXT) - Visual representation
- `description` (TEXT) - Short description
- `lore` (TEXT, nullable) - Optional backstory
- `base_stats` (JSONB) - Base physical stats: `{ health, movementSpeed }`
- `version` (INTEGER) - Schema version
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes**:
- `idx_species_key` on `key` column

### 2. daos
Stores dao definitions (cultivation paths/martial disciplines)

**Columns**:
- `id` (UUID, PK) - Primary key
- `key` (TEXT, UNIQUE) - Unique identifier (e.g., 'sword_dao', 'palm_dao')
- `name` (TEXT) - Display name
- `emoji` (TEXT) - Visual representation
- `description` (TEXT) - Short description
- `lore` (TEXT, nullable) - Optional backstory
- `combat_stats` (JSONB) - Combat stats: `{ damage, attackSpeed, range, attackPattern }`
- `compatible_skills` (JSONB) - Array of compatible skill IDs
- `version` (INTEGER) - Schema version
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes**:
- `idx_daos_key` on `key` column

### 3. titles
Stores title definitions (achievement ranks with stat bonuses)

**Columns**:
- `id` (UUID, PK) - Primary key
- `key` (TEXT, UNIQUE) - Unique identifier (e.g., 'palm_sage', 'sword_cultivator')
- `name` (TEXT) - Display name
- `emoji` (TEXT) - Visual representation
- `description` (TEXT) - Short description
- `stat_bonuses` (JSONB) - Stat bonuses: `{ healthMultiplier, damageMultiplier, attackSpeedMultiplier, rangeBonus, movementSpeedMultiplier }`
- `prestige_level` (INTEGER) - Prestige level for UI sorting (1-10)
- `version` (INTEGER) - Schema version
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes**:
- `idx_titles_key` on `key` column
- `idx_titles_prestige` on `prestige_level` column

### 4. achievements
Stores achievement definitions with unlock conditions and rewards

**Columns**:
- `id` (UUID, PK) - Primary key
- `key` (TEXT, UNIQUE) - Unique identifier (e.g., 'wave_10_complete')
- `name` (TEXT) - Display name
- `emoji` (TEXT) - Visual representation
- `description` (TEXT) - Achievement description
- `conditions` (JSONB) - Array of condition objects: `[{ type, targetValue, comparisonOperator, isTrackable, progressLabel }]`
- `rewards` (JSONB) - Array of reward objects: `[{ type, value, displayName }]`
- `sort_order` (INTEGER) - Display order for UI
- `version` (INTEGER) - Schema version
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes**:
- `idx_achievements_key` on `key` column
- `idx_achievements_sort` on `sort_order` column

### 5. player_profiles
Stores player profile data for anonymous players

**Columns**:
- `id` (UUID, PK) - Primary key
- `anonymous_id` (TEXT, UNIQUE) - Browser-based anonymous identifier
- `stats` (JSONB) - Player statistics: `{ totalGamesPlayed, highestWave, highestScore, totalEnemiesDefeated, totalCultivatorsDeployed }`
- `unlocked_species` (JSONB) - Array of unlocked species IDs
- `unlocked_daos` (JSONB) - Array of unlocked dao IDs
- `unlocked_titles` (JSONB) - Array of unlocked title IDs
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes**:
- `idx_player_profiles_anonymous` on `anonymous_id` column

### 6. player_achievements
Stores player achievement progress and unlock status

**Columns**:
- `id` (UUID, PK) - Primary key
- `player_id` (UUID, FK) - References `player_profiles(id)` with CASCADE delete
- `achievement_id` (UUID, FK) - References `achievements(id)` with CASCADE delete
- `progress` (JSONB) - Progress tracking: `{ "0": currentValue, "1": currentValue, ... }`
- `is_unlocked` (BOOLEAN) - Whether achievement is unlocked
- `unlocked_at` (TIMESTAMPTZ, nullable) - Unlock timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Constraints**:
- UNIQUE constraint on `(player_id, achievement_id)`

**Indexes**:
- `idx_player_achievements_player` on `player_id` column
- `idx_player_achievements_unlocked` on `is_unlocked` column

## Triggers

All tables have automatic `updated_at` timestamp triggers using the existing `update_updated_at_column()` function:

- `update_species_updated_at`
- `update_daos_updated_at`
- `update_titles_updated_at`
- `update_achievements_updated_at`
- `update_player_profiles_updated_at`
- `update_player_achievements_updated_at`

## Next Steps

1. Apply this migration to the database
2. Create migration to update `person_types` table with composition references
3. Create data migration to populate component tables from existing person_types
4. Implement TypeScript interfaces matching these schemas
5. Build admin UI for managing these entities

## Requirements Satisfied

This migration satisfies the following requirements from the spec:
- **5.1**: Database schema for Species definitions
- **5.2**: Database schema for Dao definitions
- **5.3**: Database schema for Title definitions
- **12.1**: Database schema for Player Profiles
- **12.2**: Database schema for Player Achievements

All required indexes for performance optimization have been added as specified in the task details.
