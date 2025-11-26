# People/Race System Migrations

This directory contains database migrations for the People/Race system refactor.

## Quick Start

Apply migrations in order:

1. `20241117000001_create_person_types_table.sql` - Creates person_types table
2. `20241117000002_create_wave_configurations_table.sql` - Creates wave_configurations table  
3. `20241117000003_seed_person_types_and_waves.sql` - Seeds initial game data

See **apply-migrations.md** for detailed instructions.

## What Gets Created

### Tables

- **person_types** - Stores all combat entity definitions (defenders and attackers)
- **wave_configurations** - Stores wave composition data for enemy spawning

### Seeded Data

- **4 Cultivator Types** (Defenders): Sword, Palm, Arrow, Lightning
- **6 Enemy Types** (Attackers): Demon, Shadow, Beast, Wraith, Golem, Dragon
- **20 Wave Configurations** with progressive difficulty

### Features

- Automatic timestamp updates via triggers
- Referential integrity validation for wave spawns
- Schema versioning for future migrations
- Performance indexes for fast lookups

## Documentation

- **MIGRATION_SUMMARY.md** - Complete overview of schema and requirements
- **SEED_DATA_REFERENCE.md** - Detailed reference of all seeded data
- **apply-migrations.md** - Step-by-step migration guide
- **verify_seed_data.sql** - Verification queries to check data integrity

## Verification

After applying migrations, run:

```sql
-- Quick check
SELECT 
  (SELECT COUNT(*) FROM person_types WHERE defender_config IS NOT NULL) as defenders,
  (SELECT COUNT(*) FROM person_types WHERE attacker_config IS NOT NULL) as attackers,
  (SELECT COUNT(*) FROM wave_configurations) as waves;
```

Expected: 4 defenders, 6 attackers, 20 waves

For comprehensive verification, run all queries in `verify_seed_data.sql`.

## Data Structure

### Person Type (Defender Example)
```json
{
  "key": "sword_cultivator",
  "name": "Sword Cultivator",
  "emoji": "⚔️",
  "base_stats": { "health": 100, "damage": 20, ... },
  "defender_config": { "deploymentCost": 50, ... }
}
```

### Person Type (Attacker Example)
```json
{
  "key": "crimson_demon",
  "name": "Crimson Demon",
  "emoji": "👹",
  "base_stats": { "health": 60, "movementSpeed": 1.0, ... },
  "attacker_config": { "reward": 20, "firstAppearance": 1, ... }
}
```

### Wave Configuration
```json
{
  "wave_number": 1,
  "spawns": [
    { "personTypeId": "uuid", "count": 3, "spawnInterval": 1000, "spawnDelay": 0 }
  ]
}
```

## Next Steps

1. ✅ Create database schema (Task 1)
2. ✅ Seed initial data (Task 2)
3. ⏭️ Create Person Type service layer (Task 3)
4. ⏭️ Implement game integration

## Rollback

To rollback all migrations:

```sql
DROP TABLE IF EXISTS wave_configurations CASCADE;
DROP TABLE IF EXISTS person_types CASCADE;
DROP FUNCTION IF EXISTS validate_wave_spawns() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

⚠️ **Warning**: This will delete all data. Only use for development/testing.
