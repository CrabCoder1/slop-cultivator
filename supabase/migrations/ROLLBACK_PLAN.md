# Composition System Migration Rollback Plan

## Overview

This document provides step-by-step instructions for rolling back the composition system migration if issues are encountered. The rollback process will restore the database to its pre-migration state.

## Prerequisites

Before performing a rollback:

1. **Create a backup** of the current database state
2. **Document the issue** that requires rollback
3. **Notify all users** that a rollback is in progress
4. **Stop all application instances** to prevent data corruption

## Rollback Steps

### Step 1: Create Backup (CRITICAL)

Before any rollback operations, create a complete backup:

```sql
-- Export person_types table
COPY person_types TO '/tmp/person_types_backup.csv' WITH CSV HEADER;

-- Export composition tables
COPY species TO '/tmp/species_backup.csv' WITH CSV HEADER;
COPY daos TO '/tmp/daos_backup.csv' WITH CSV HEADER;
COPY titles TO '/tmp/titles_backup.csv' WITH CSV HEADER;
COPY achievements TO '/tmp/achievements_backup.csv' WITH CSV HEADER;
COPY player_profiles TO '/tmp/player_profiles_backup.csv' WITH CSV HEADER;
COPY player_achievements TO '/tmp/player_achievements_backup.csv' WITH CSV HEADER;
```

Or use Supabase CLI:

```bash
# Backup entire database
supabase db dump -f backup_before_rollback.sql

# Or backup specific tables
supabase db dump --table person_types -f person_types_backup.sql
supabase db dump --table species -f species_backup.sql
supabase db dump --table daos -f daos_backup.sql
supabase db dump --table titles -f titles_backup.sql
```

### Step 2: Remove Composition Columns from person_types

```sql
-- Remove composition columns (this will not affect base_stats)
ALTER TABLE person_types 
  DROP COLUMN IF EXISTS species_id CASCADE,
  DROP COLUMN IF EXISTS dao_id CASCADE,
  DROP COLUMN IF EXISTS title_id CASCADE,
  DROP COLUMN IF EXISTS equipped_skills,
  DROP COLUMN IF EXISTS equipped_items,
  DROP COLUMN IF EXISTS role;

-- Drop indexes
DROP INDEX IF EXISTS idx_person_types_species;
DROP INDEX IF EXISTS idx_person_types_dao;
DROP INDEX IF EXISTS idx_person_types_title;
DROP INDEX IF EXISTS idx_person_types_role;
```

### Step 3: Drop Composition System Tables

**WARNING**: This will permanently delete all composition data. Ensure backups are complete before proceeding.

```sql
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
```

### Step 4: Verify person_types Integrity

```sql
-- Check that person_types table still has all required columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'person_types'
ORDER BY ordinal_position;

-- Verify all person_types records are intact
SELECT COUNT(*) as total_records FROM person_types;

-- Check that base_stats are still present
SELECT 
  key,
  name,
  base_stats
FROM person_types
LIMIT 5;
```

### Step 5: Verify Application Functionality

After rollback:

1. **Restart application** instances
2. **Test core functionality**:
   - Load person types in admin tool
   - Start a game session
   - Deploy cultivators
   - Verify combat works correctly
3. **Check for errors** in application logs
4. **Verify data integrity** in admin tool

### Step 6: Document Rollback

Create a rollback report documenting:

- Date and time of rollback
- Reason for rollback
- Issues encountered during migration
- Data loss (if any)
- Steps taken to resolve
- Lessons learned

## Rollback Script

For convenience, here's a complete rollback script:

```sql
-- ============================================================================
-- COMPOSITION SYSTEM ROLLBACK SCRIPT
-- ============================================================================
-- WARNING: This will delete all composition system data
-- Ensure backups are complete before running

BEGIN;

-- Step 1: Verify backup exists
DO $$
BEGIN
  RAISE NOTICE 'Starting rollback process...';
  RAISE NOTICE 'Ensure you have created backups before proceeding!';
  RAISE NOTICE 'Press Ctrl+C to cancel within 5 seconds...';
  PERFORM pg_sleep(5);
END $$;

-- Step 2: Remove foreign key constraints from person_types
ALTER TABLE person_types 
  DROP CONSTRAINT IF EXISTS person_types_species_id_fkey,
  DROP CONSTRAINT IF EXISTS person_types_dao_id_fkey,
  DROP CONSTRAINT IF EXISTS person_types_title_id_fkey;

-- Step 3: Drop composition columns
ALTER TABLE person_types 
  DROP COLUMN IF EXISTS species_id,
  DROP COLUMN IF EXISTS dao_id,
  DROP COLUMN IF EXISTS title_id,
  DROP COLUMN IF EXISTS equipped_skills,
  DROP COLUMN IF EXISTS equipped_items,
  DROP COLUMN IF EXISTS role;

-- Step 4: Drop indexes
DROP INDEX IF EXISTS idx_person_types_species;
DROP INDEX IF EXISTS idx_person_types_dao;
DROP INDEX IF EXISTS idx_person_types_title;
DROP INDEX IF EXISTS idx_person_types_role;

-- Step 5: Drop composition tables
DROP TABLE IF EXISTS player_achievements CASCADE;
DROP TABLE IF EXISTS player_profiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS titles CASCADE;
DROP TABLE IF EXISTS daos CASCADE;
DROP TABLE IF EXISTS species CASCADE;

-- Step 6: Verify person_types integrity
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM person_types;
  RAISE NOTICE 'person_types records after rollback: %', record_count;
  
  IF record_count = 0 THEN
    RAISE EXCEPTION 'ROLLBACK FAILED: person_types table is empty!';
  END IF;
  
  RAISE NOTICE 'Rollback completed successfully';
END $$;

COMMIT;

-- Step 7: Display remaining person_types
SELECT 
  key,
  name,
  base_stats->>'health' as health,
  base_stats->>'damage' as damage,
  CASE 
    WHEN defender_config IS NOT NULL THEN 'defender'
    WHEN attacker_config IS NOT NULL THEN 'attacker'
    ELSE 'unknown'
  END as role
FROM person_types
ORDER BY key;
```

## Testing Rollback Procedure

To test the rollback procedure without affecting production:

1. **Create a test database** with the same schema
2. **Apply all migrations** to the test database
3. **Run the rollback script** on the test database
4. **Verify the rollback** was successful
5. **Document any issues** encountered

### Test Rollback Command

```bash
# Create test database
supabase db reset --db-url postgresql://postgres:password@localhost:54322/postgres

# Apply migrations
supabase db push

# Test rollback
psql postgresql://postgres:password@localhost:54322/postgres -f rollback_script.sql

# Verify
psql postgresql://postgres:password@localhost:54322/postgres -c "SELECT * FROM person_types LIMIT 5;"
```

## Recovery from Failed Rollback

If the rollback fails:

1. **Stop immediately** - Do not continue with partial rollback
2. **Restore from backup**:
   ```bash
   supabase db reset
   psql -f backup_before_rollback.sql
   ```
3. **Verify data integrity** after restore
4. **Investigate the failure** before attempting rollback again

## Prevention Measures

To avoid needing rollbacks in the future:

1. **Test migrations thoroughly** on staging environment
2. **Use database transactions** for all migration operations
3. **Create automated backups** before migrations
4. **Implement gradual rollout** with feature flags
5. **Monitor application metrics** after migration
6. **Have rollback plan ready** before starting migration

## Contact Information

If you encounter issues during rollback:

- Check application logs for errors
- Review Supabase dashboard for database health
- Consult the migration documentation
- Contact the development team

## Rollback Checklist

- [ ] Backup created and verified
- [ ] Application instances stopped
- [ ] Users notified of maintenance
- [ ] Rollback script reviewed
- [ ] Test rollback performed on staging
- [ ] Rollback executed on production
- [ ] Data integrity verified
- [ ] Application restarted
- [ ] Functionality tested
- [ ] Users notified of completion
- [ ] Rollback documented

