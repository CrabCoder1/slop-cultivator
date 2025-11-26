# Apply Composition System Migrations

This guide explains how to apply the composition system migrations to your database.

## Prerequisites

- Supabase project set up
- Supabase credentials configured (either via CLI or MCP tool)
- **CRITICAL**: Create a backup before proceeding

## Migration Files

The composition system migration consists of three files that must be applied in order:

1. **20241118000001_create_composition_system_tables.sql**
   - Creates species, daos, titles, achievements, player_profiles, player_achievements tables
   - Sets up indexes and triggers

2. **20241118000002_update_person_types_for_composition.sql**
   - Adds composition columns to person_types table
   - Creates indexes on new columns

3. **20241118000002_migrate_person_types_to_composition.sql**
   - Populates component tables with data
   - Updates person_types with composition references
   - Validates data integrity

## Option 1: Using Supabase MCP Tool (Recommended)

If you have the Supabase MCP tool configured in Kiro:

```typescript
// Apply migration 1: Create tables
await mcp_supabase_apply_migration({
  name: "create_composition_system_tables",
  query: `<contents of 20241118000001_create_composition_system_tables.sql>`
});

// Apply migration 2: Update person_types
await mcp_supabase_apply_migration({
  name: "update_person_types_for_composition",
  query: `<contents of 20241118000002_update_person_types_for_composition.sql>`
});

// Apply migration 3: Migrate data
await mcp_supabase_apply_migration({
  name: "migrate_person_types_to_composition",
  query: `<contents of 20241118000002_migrate_person_types_to_composition.sql>`
});
```

## Option 2: Using Supabase Dashboard

1. Log in to your Supabase dashboard at https://supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Apply migrations in order:
   - Copy contents of `20241118000001_create_composition_system_tables.sql` and execute
   - Copy contents of `20241118000002_update_person_types_for_composition.sql` and execute
   - Copy contents of `20241118000002_migrate_person_types_to_composition.sql` and execute

## Option 3: Using Supabase CLI

```bash
# Link to your remote project (if not already done)
supabase link --project-ref <your-project-ref>

# Apply all pending migrations
supabase db push

# Or apply specific migrations
supabase migration up 20241118000001_create_composition_system_tables
supabase migration up 20241118000002_update_person_types_for_composition
supabase migration up 20241118000002_migrate_person_types_to_composition
```

## Option 4: Using psql

```bash
# Connect to your database
psql postgresql://postgres:password@your-host:5432/your-database

# Apply migrations in order
\i supabase/migrations/20241118000001_create_composition_system_tables.sql
\i supabase/migrations/20241118000002_update_person_types_for_composition.sql
\i supabase/migrations/20241118000002_migrate_person_types_to_composition.sql
```

## Verification

After applying migrations, run the validation script:

```bash
psql postgresql://postgres:password@your-host:5432/your-database \
  -f supabase/migrations/validate_composition_migration.sql
```

Or use the MCP tool:

```typescript
await mcp_supabase_execute_sql({
  query: `<contents of validate_composition_migration.sql>`
});
```

### Expected Results

You should see:

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

=== COMPOSED STATS VALIDATION ===
✓ All composed stats match original stats

=== SUMMARY STATISTICS ===
Species: 7
Daos: 5
Titles: 9
Person Types: 10 (4 defenders, 6 attackers)
```

### Manual Verification Queries

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('species', 'daos', 'titles', 'achievements', 'player_profiles', 'player_achievements');

-- Check person_types has composition columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'person_types' 
  AND column_name IN ('species_id', 'dao_id', 'title_id', 'equipped_skills', 'equipped_items', 'role');

-- Check all person_types have valid references
SELECT COUNT(*) as total,
       COUNT(species_id) as with_species,
       COUNT(dao_id) as with_dao,
       COUNT(title_id) as with_title
FROM person_types;

-- View composition for all person_types
SELECT 
  pt.key,
  pt.name,
  s.name as species,
  d.name as dao,
  t.name as title,
  pt.role
FROM person_types pt
LEFT JOIN species s ON pt.species_id = s.id
LEFT JOIN daos d ON pt.dao_id = d.id
LEFT JOIN titles t ON pt.title_id = t.id
ORDER BY pt.role, pt.key;
```

## Testing

Before applying to production, test on a staging database:

```bash
# Run the test script
psql postgresql://postgres:password@localhost:54322/test_db \
  -f supabase/migrations/test_migration.sql
```

This will:
1. Show pre-migration state
2. Apply all migrations
3. Show post-migration state
4. Run validation checks
5. Execute test queries

## Rollback

If you need to rollback, see [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) for detailed instructions.

Quick rollback:

```bash
psql postgresql://postgres:password@your-host:5432/your-database \
  -f supabase/migrations/rollback_composition_system.sql
```

## Troubleshooting

### Error: "relation already exists"

Tables may already exist from a previous migration attempt. Either:
- Drop the tables: `DROP TABLE IF EXISTS species, daos, titles CASCADE;`
- Or skip to the next migration

### Error: "column already exists"

The person_types table may already have composition columns. Either:
- Drop the columns: `ALTER TABLE person_types DROP COLUMN IF EXISTS species_id CASCADE;`
- Or skip to the data migration

### Error: "foreign key violation"

Check that all referenced IDs exist:

```sql
-- Find invalid references
SELECT pt.key 
FROM person_types pt 
LEFT JOIN species s ON pt.species_id = s.id 
WHERE pt.species_id IS NOT NULL AND s.id IS NULL;
```

## Next Steps

After successful migration:

1. ✅ Composition system tables created
2. ✅ person_types updated with composition references
3. ✅ Data migrated and validated
4. Update application code to use composition system
5. Test admin tool (Species, Daos, Titles tabs)
6. Test game with composed cultivators
7. Monitor for issues

## Additional Resources

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Comprehensive migration guide
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) - Rollback procedures
- [COMPOSITION_SYSTEM_MIGRATION.md](./COMPOSITION_SYSTEM_MIGRATION.md) - Technical details
- [validate_composition_migration.sql](./validate_composition_migration.sql) - Validation script
- [test_migration.sql](./test_migration.sql) - Test script

