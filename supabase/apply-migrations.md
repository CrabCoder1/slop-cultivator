# Apply Migrations Guide

This guide explains how to apply the database migrations for the People/Race system.

## Prerequisites

- Supabase project set up
- Supabase credentials configured (either via CLI or MCP tool)

## Option 1: Using Supabase MCP Tool (Recommended)

If you have the Supabase MCP tool configured in Kiro, you can apply migrations directly:

1. Ensure your Supabase MCP server is connected
2. Use the `mcp_supabase_apply_migration` tool to apply each migration in order

The migrations will be applied automatically with proper naming and versioning.

## Option 2: Using Supabase Dashboard

1. Log in to your Supabase dashboard at https://supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Create a new query
5. Apply migrations in order:
   - Copy the contents of `20241117000001_create_person_types_table.sql` and execute
   - Copy the contents of `20241117000002_create_wave_configurations_table.sql` and execute
   - Copy the contents of `20241117000003_seed_person_types_and_waves.sql` and execute

## Option 3: Using Supabase CLI

If you have the Supabase CLI installed locally:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

## Verification

After applying migrations, verify the tables were created and seeded:

```sql
-- Check person_types table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'person_types';

-- Check wave_configurations table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wave_configurations';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('person_types', 'wave_configurations');

-- Verify seeded data counts
SELECT 
  (SELECT COUNT(*) FROM person_types WHERE defender_config IS NOT NULL) as defenders,
  (SELECT COUNT(*) FROM person_types WHERE attacker_config IS NOT NULL) as attackers,
  (SELECT COUNT(*) FROM wave_configurations) as waves;
-- Expected: 4 defenders, 6 attackers, 20 waves
```

For comprehensive verification, run the queries in `verify_seed_data.sql`.

## Troubleshooting

### Error: "relation already exists"

If you see this error, the tables may already exist. You can either:
- Drop the existing tables and reapply migrations
- Skip to the next migration

### Error: "function update_updated_at_column already exists"

This is safe to ignore if you're reapplying migrations. The function is shared across tables.

### Error: "permission denied"

Ensure your database user has sufficient permissions to create tables, indexes, and functions.

## Next Steps

After successfully applying migrations:

1. ✅ Task 1: Database schema created
2. ✅ Task 2: Database seeded with cultivator and enemy data
3. Proceed to Task 3: Create Person Type service layer
4. Update game code to use the new Person Type system

## Migration Files

1. **20241117000001_create_person_types_table.sql** - Creates person_types table
2. **20241117000002_create_wave_configurations_table.sql** - Creates wave_configurations table
3. **20241117000003_seed_person_types_and_waves.sql** - Seeds initial data (4 cultivators, 6 enemies, 20 waves)

## Reference Documentation

- **MIGRATION_SUMMARY.md** - Overview of all migrations and schema
- **SEED_DATA_REFERENCE.md** - Complete reference of seeded data
- **verify_seed_data.sql** - Comprehensive verification queries
