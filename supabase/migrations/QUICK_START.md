# Composition System Migration - Quick Start

## TL;DR

Apply three migrations in order, validate, done.

## Prerequisites

- [ ] Backup created
- [ ] Tested on staging
- [ ] Maintenance window scheduled

## Apply Migrations

### Option 1: Supabase MCP Tool (Fastest)

```typescript
// In Kiro, use the Supabase MCP tool
await mcp_supabase_apply_migration({
  name: "create_composition_system_tables",
  query: `<paste contents of 20241118000001_create_composition_system_tables.sql>`
});

await mcp_supabase_apply_migration({
  name: "update_person_types_for_composition",
  query: `<paste contents of 20241118000002_update_person_types_for_composition.sql>`
});

await mcp_supabase_apply_migration({
  name: "migrate_person_types_to_composition",
  query: `<paste contents of 20241118000002_migrate_person_types_to_composition.sql>`
});
```

### Option 2: Supabase CLI

```bash
supabase db push
```

### Option 3: psql

```bash
cd supabase/migrations
psql $DATABASE_URL -f 20241118000001_create_composition_system_tables.sql
psql $DATABASE_URL -f 20241118000002_update_person_types_for_composition.sql
psql $DATABASE_URL -f 20241118000002_migrate_person_types_to_composition.sql
```

## Validate

```bash
psql $DATABASE_URL -f validate_composition_migration.sql
```

**Look for:**
- ✓ All person_types have valid composition references
- ✓ All foreign key references are valid
- ✓ All composed stats match original stats

## Verify

```sql
-- Quick check
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

## Rollback (if needed)

```bash
psql $DATABASE_URL -f rollback_composition_system.sql
```

## Full Documentation

- **MIGRATION_GUIDE.md** - Complete step-by-step guide
- **APPLY_COMPOSITION_MIGRATIONS.md** - Application methods
- **ROLLBACK_PLAN.md** - Rollback procedures
- **TASK_18_SUMMARY.md** - Implementation summary

## Support

If issues occur:
1. Check validation output
2. Review MIGRATION_GUIDE.md troubleshooting section
3. Run rollback if needed
4. Restore from backup if rollback fails

