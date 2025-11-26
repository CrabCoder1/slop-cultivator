# Composition System Migration Guide

## Overview

This guide provides step-by-step instructions for applying the composition system migration to your database. The migration transforms the monolithic person_types structure into a flexible composition model with separate Species, Daos, and Titles tables.

## Prerequisites

Before starting the migration:

1. **Backup your database** - This is CRITICAL
2. **Test on staging environment** first
3. **Schedule maintenance window** - Expect 5-10 minutes downtime
4. **Notify users** of the maintenance
5. **Have rollback plan ready** (see ROLLBACK_PLAN.md)

## Migration Files

The migration consists of three SQL files that must be applied in order:

1. **20241118000001_create_composition_system_tables.sql**
   - Creates species, daos, titles, achievements, player_profiles, player_achievements tables
   - Sets up indexes and triggers
   - ~200 lines

2. **20241118000002_update_person_types_for_composition.sql**
   - Adds composition columns to person_types (species_id, dao_id, title_id, etc.)
   - Creates indexes on new columns
   - ~40 lines

3. **20241118000002_migrate_person_types_to_composition.sql**
   - Populates component tables with data extracted from person_types
   - Updates person_types records with references to new components
   - Validates data integrity
   - ~400 lines

## Step-by-Step Migration Process

### Step 1: Create Backup

**Using Supabase CLI:**

```bash
# Full database backup
supabase db dump -f backup_before_composition_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_before_composition_migration_*.sql
```

**Using psql:**

```bash
# Backup entire database
pg_dump -h your-host -U postgres -d your-database > backup.sql

# Or backup specific tables
pg_dump -h your-host -U postgres -d your-database -t person_types > person_types_backup.sql
```

**Using Supabase Dashboard:**

1. Go to Database → Backups
2. Create manual backup
3. Wait for completion
4. Download backup file

### Step 2: Test Migration on Staging

**Create test database:**

```bash
# Using Supabase CLI
supabase db reset --db-url postgresql://postgres:password@localhost:54322/test_db

# Apply base migrations
supabase db push --db-url postgresql://postgres:password@localhost:54322/test_db
```

**Run test script:**

```bash
cd supabase/migrations
psql postgresql://postgres:password@localhost:54322/test_db -f test_migration.sql
```

**Review test results:**

- Check for any errors or warnings
- Verify all validation checks pass
- Review composed stats match original stats
- Confirm foreign key integrity

### Step 3: Apply Migration to Production

**Option A: Using Supabase CLI (Recommended)**

```bash
# Apply migrations in order
supabase db push

# Or apply specific migrations
supabase migration up 20241118000001_create_composition_system_tables
supabase migration up 20241118000002_update_person_types_for_composition
supabase migration up 20241118000002_migrate_person_types_to_composition
```

**Option B: Using psql**

```bash
# Connect to production database
psql postgresql://postgres:password@your-host:5432/your-database

# Apply migrations in order
\i 20241118000001_create_composition_system_tables.sql
\i 20241118000002_update_person_types_for_composition.sql
\i 20241118000002_migrate_person_types_to_composition.sql
```

**Option C: Using Supabase Dashboard**

1. Go to SQL Editor
2. Copy contents of first migration file
3. Execute
4. Repeat for remaining migration files

### Step 4: Validate Migration

Run the validation script:

```bash
psql postgresql://postgres:password@your-host:5432/your-database -f validate_composition_migration.sql
```

**Check for:**

- ✓ All person_types have valid composition references
- ✓ All foreign key references are valid
- ✓ No orphaned records (or acceptable orphans for future content)
- ✓ Composed stats match original stats
- ✓ All tables created successfully

**Expected output:**

```
=== COMPOSITION REFERENCE VALIDATION ===
Total person_types: 10
Missing species_id: 0
Missing dao_id: 0
Missing title_id: 0
✓ All person_types have valid composition references

=== FOREIGN KEY INTEGRITY VALIDATION ===
Invalid species references: 0
Invalid dao references: 0
Invalid title references: 0
✓ All foreign key references are valid

=== ORPHANED RECORDS CHECK ===
Unused species: 0
Unused daos: 1
Unused titles: 0
Note: Some component records are not currently used (this is OK for future content)

=== COMPOSED STATS VALIDATION ===
✓ All composed stats match original stats

=== SUMMARY STATISTICS ===
Species: 7
Daos: 5
Titles: 9
Person Types: 10 (4 defenders, 6 attackers)
```

### Step 5: Verify Application Functionality

**Test the following:**

1. **Admin Tool**
   - Open admin tool at http://localhost:5177
   - Navigate to Species tab - verify species load
   - Navigate to Daos tab - verify daos load
   - Navigate to Titles tab - verify titles load
   - Navigate to Achievements tab - verify achievements load
   - Try creating a new species/dao/title
   - Try editing existing records

2. **Game Application**
   - Start game at http://localhost:5173
   - Verify cultivators load correctly
   - Deploy cultivators - verify stats are correct
   - Start wave - verify combat works
   - Check for console errors

3. **Database Queries**
   ```sql
   -- Test composition query
   SELECT 
     pt.name,
     s.name as species,
     d.name as dao,
     t.name as title
   FROM person_types pt
   JOIN species s ON pt.species_id = s.id
   JOIN daos d ON pt.dao_id = d.id
   JOIN titles t ON pt.title_id = t.id
   LIMIT 5;
   ```

### Step 6: Monitor for Issues

**For the first 24 hours after migration:**

- Monitor application logs for errors
- Check database performance metrics
- Watch for user-reported issues
- Monitor error tracking (Sentry, etc.)
- Check database connection pool usage

**Key metrics to watch:**

- Query performance (should be similar or better)
- Error rates (should not increase)
- Response times (should be similar)
- Database CPU/memory usage

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Cause:** Tables already exist from previous migration attempt

**Solution:**
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('species', 'daos', 'titles');

-- If they exist, either:
-- 1. Drop them and re-run migration
DROP TABLE IF EXISTS species, daos, titles CASCADE;

-- 2. Or skip to data migration step
```

### Issue: Foreign key constraint violation

**Cause:** person_types references don't match component IDs

**Solution:**
```sql
-- Find person_types with invalid references
SELECT pt.key, pt.name
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
WHERE pt.species_id IS NOT NULL AND s.id IS NULL;

-- Fix by updating references or setting to NULL
UPDATE person_types SET species_id = NULL WHERE species_id NOT IN (SELECT id FROM species);
```

### Issue: Composed stats don't match original stats

**Cause:** Title multipliers or component stats are incorrect

**Solution:**
```sql
-- Find mismatches
SELECT 
  pt.name,
  pt.base_stats->>'health' as original_health,
  (s.base_stats->>'health')::NUMERIC * COALESCE((t.stat_bonuses->>'healthMultiplier')::NUMERIC, 1.0) as composed_health
FROM person_types pt
JOIN species s ON pt.species_id = s.id
JOIN titles t ON pt.title_id = t.id
WHERE ABS((pt.base_stats->>'health')::NUMERIC - 
          (s.base_stats->>'health')::NUMERIC * COALESCE((t.stat_bonuses->>'healthMultiplier')::NUMERIC, 1.0)) > 0.01;

-- Adjust component stats or title multipliers as needed
```

### Issue: Application can't find composition data

**Cause:** Application code not updated to use composition system

**Solution:**
- Ensure you've deployed the latest application code
- Check that composition-data-service.ts is being used
- Verify environment variables are correct
- Clear application cache

## Rollback Procedure

If you need to rollback the migration, see [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) for detailed instructions.

**Quick rollback:**

```bash
# Run rollback script
psql postgresql://postgres:password@your-host:5432/your-database -f rollback_composition_system.sql

# Restore from backup if needed
psql postgresql://postgres:password@your-host:5432/your-database < backup.sql
```

## Backward Compatibility

The migration maintains backward compatibility during the transition period:

### Data Structure Compatibility

**Old Structure (still supported):**
```typescript
// person_types with inline stats
{
  id: "uuid",
  key: "sword_cultivator",
  name: "Sword Cultivator",
  base_stats: {
    health: 120,
    damage: 30,
    attackSpeed: 800,
    range: 60,
    movementSpeed: 1.5
  }
}
```

**New Structure (preferred):**
```typescript
// person_types with composition references
{
  id: "uuid",
  key: "sword_cultivator",
  name: "Sword Cultivator",
  species_id: "human_species_uuid",
  dao_id: "sword_dao_uuid",
  title_id: "sword_master_uuid",
  equipped_skills: ["skill1", "skill2"],
  equipped_items: ["item1"]
}
```

### Application Code Compatibility

The application supports both structures:

```typescript
// Old code (still works)
const health = personType.base_stats.health;

// New code (preferred)
const stats = composeCultivatorStats(species, dao, title);
const health = stats.health;
```

### Transition Period

During the transition period (recommended: 2-4 weeks):

1. **Both structures are supported** - Application can read old and new formats
2. **New content uses composition** - All new person_types use composition system
3. **Old content gradually migrated** - Existing person_types updated to use composition
4. **Fallback logic in place** - If composition data missing, falls back to base_stats

### Deprecation Timeline

**Week 1-2: Soft Launch**
- Composition system available
- Old system still fully supported
- Monitor for issues

**Week 3-4: Migration Phase**
- Encourage use of composition system
- Migrate remaining old person_types
- Update all documentation

**Week 5+: Full Adoption**
- Composition system is primary
- Old base_stats structure deprecated
- Remove fallback code in future release

## Testing Procedures

### Pre-Migration Testing

**1. Unit Tests**

Run existing unit tests to ensure baseline functionality:

```bash
npm test -- cultivator-composition-service.spec.ts
npm test -- player-profile-service.spec.ts
npm test -- achievement-service.spec.ts
```

**2. Integration Tests**

Run integration tests for composition system:

```bash
npm test -- admin-composition-workflow.spec.ts
npm test -- cultivator-composition-game.spec.ts
npm test -- achievement-system-integration.spec.ts
```

**3. Database Tests**

Run database validation on test environment:

```bash
psql test_db -f supabase/migrations/test_migration.sql
psql test_db -f supabase/migrations/validate_composition_migration.sql
```

### Post-Migration Testing

**1. Smoke Tests**

Quick tests to verify basic functionality:

```bash
# Test admin tool loads
curl http://localhost:5177 -I

# Test game loads
curl http://localhost:5173 -I

# Test API endpoints
curl http://localhost:5173/api/species
curl http://localhost:5173/api/daos
curl http://localhost:5173/api/titles
```

**2. Functional Tests**

Test key user workflows:

- [ ] Create new species in admin tool
- [ ] Create new dao in admin tool
- [ ] Create new title in admin tool
- [ ] Create new achievement in admin tool
- [ ] Create new person_type using composition
- [ ] Edit existing person_type
- [ ] Delete unused component (should work)
- [ ] Try to delete used component (should fail with warning)
- [ ] Start game and deploy cultivators
- [ ] Complete wave and check achievement unlock
- [ ] Verify player profile persists across sessions

**3. Performance Tests**

Verify performance is acceptable:

```sql
-- Test composition query performance
EXPLAIN ANALYZE
SELECT 
  pt.*,
  s.name as species_name,
  d.name as dao_name,
  t.name as title_name
FROM person_types pt
JOIN species s ON pt.species_id = s.id
JOIN daos d ON pt.dao_id = d.id
JOIN titles t ON pt.title_id = t.id;

-- Should complete in <50ms
```

**4. Load Tests**

Test under realistic load:

```bash
# Simulate 100 concurrent users
ab -n 1000 -c 100 http://localhost:5173/

# Monitor database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database';
```

### Regression Testing

After migration, verify no regressions:

- [ ] All existing cultivators still work
- [ ] Combat calculations are correct
- [ ] Wave spawning works
- [ ] Leaderboard still functions
- [ ] Settings persist
- [ ] Sound effects work
- [ ] No console errors
- [ ] No database errors in logs

### User Acceptance Testing

Have beta users test:

- [ ] Admin tool is intuitive
- [ ] Creating content is easy
- [ ] Game plays smoothly
- [ ] Achievements unlock correctly
- [ ] No data loss
- [ ] Performance is good

## Post-Migration Tasks

After successful migration:

1. **Update documentation**
   - Update database schema docs ✓ (see docs/database-schema.md)
   - Update API documentation
   - Update developer guides ✓ (see docs/composition-system-guide.md)

2. **Clean up**
   - Remove old migration files (if desired)
   - Archive backups
   - Update deployment scripts

3. **Monitor**
   - Continue monitoring for 1 week
   - Collect user feedback
   - Document any issues

4. **Optimize**
   - Review query performance
   - Add additional indexes if needed
   - Update caching strategies

5. **Training**
   - Train content creators on new admin tool
   - Update internal documentation
   - Create video tutorials if needed

## Migration Checklist

Use this checklist to track migration progress:

- [ ] Backup created and verified
- [ ] Migration tested on staging
- [ ] Maintenance window scheduled
- [ ] Users notified
- [ ] Rollback plan reviewed
- [ ] Migration applied to production
- [ ] Validation script executed successfully
- [ ] Admin tool tested
- [ ] Game application tested
- [ ] Database queries tested
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Users notified of completion
- [ ] Documentation updated
- [ ] Migration documented

## Support

If you encounter issues during migration:

1. Check this guide for troubleshooting steps
2. Review validation script output
3. Check application logs
4. Consult ROLLBACK_PLAN.md if needed
5. Contact development team

## Additional Resources

- [COMPOSITION_SYSTEM_MIGRATION.md](./COMPOSITION_SYSTEM_MIGRATION.md) - Technical details
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) - Rollback procedures
- [validate_composition_migration.sql](./validate_composition_migration.sql) - Validation script
- [test_migration.sql](./test_migration.sql) - Test script

