# Admin Tool Supabase Client Usage

**Date:** 2024-12-03  
**Critical:** This document describes mandatory patterns for Supabase client usage in the admin tool.

---

## Executive Summary

**The admin tool MUST use the anon key client, NOT the service role key client.**

Using the service role key in browser environments is:
1. **Blocked by Supabase** - Returns 401 "Forbidden use of secret API key in browser"
2. **A security vulnerability** - Service role keys bypass all RLS policies
3. **Against best practices** - Service role keys should only be used in protected server environments

---

## Correct Pattern

### ✅ DO: Use the Game's Anon Key Client

```typescript
// App: Admin

import { supabase } from '../../game/utils/supabase/client';

export const myAdminService = {
  async loadData() {
    const { data, error } = await supabase
      .from('my_table')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data;
  }
};
```

**Why this works:**
- Uses the public anon key (safe for browser)
- Respects Row Level Security (RLS) policies
- Supabase allows this in browser environments
- Same client used by the game (no conflicts)

---

## Incorrect Pattern

### ❌ DON'T: Use the Service Role Key Client

```typescript
// WRONG - DO NOT DO THIS
import { supabaseAdmin as supabase } from '../utils/supabase-admin-client';

export const myAdminService = {
  async loadData() {
    // This will fail with "Forbidden use of secret API key in browser"
    const { data, error } = await supabase
      .from('my_table')
      .select('*');
  }
};
```

**Why this fails:**
- Service role key is detected by Supabase
- Blocked at API level with 401 error
- Creates security vulnerability
- Causes "Multiple GoTrueClient instances" warning

---

## RLS Policy Requirements

Since the admin tool uses the anon key, **proper RLS policies are critical** for admin operations.

### Admin Tables Requiring RLS Policies

All admin-managed tables need policies that allow authenticated users to perform CRUD operations:

- `species`
- `daos`
- `titles`
- `achievements`
- `profiles`
- `person_types`
- `wave_configurations`
- `maps`
- `tile_types`

### Example RLS Policy

```sql
-- Enable RLS
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read species"
ON species FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert species"
ON species FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update species"
ON species FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete species"
ON species FOR DELETE
TO authenticated
USING (true);
```

**Note:** These policies assume the admin tool is protected by Vercel Authentication or similar. Adjust policies based on your security requirements.

---

## File Structure

### Correct Client Locations

```
game/utils/supabase/client.ts     ← Anon key client (USE THIS)
admin/utils/supabase-admin-client.ts  ← Service role client (DON'T USE)
```

### Services That Use Anon Key

All admin services should import from the game client:

```
admin/services/
├── species-admin-service.ts       ✅ Uses anon key
├── daos-admin-service.ts          ✅ Uses anon key
├── titles-admin-service.ts        ✅ Uses anon key
├── achievements-admin-service.ts  ✅ Uses anon key
└── ...

admin/components/
├── ProfilesEditor.tsx             ✅ Uses anon key
├── ProfileDetails.tsx             ✅ Uses anon key
└── ...

shared/utils/
├── map-service.ts                 ✅ Uses anon key
├── map-wave-config-service.ts     ✅ Uses anon key
└── ...
```

---

## Testing Checklist

When creating or modifying admin services:

### 1. Import Check
- [ ] Imports `supabase` from `../../game/utils/supabase/client`
- [ ] Does NOT import from `../utils/supabase-admin-client`

### 2. Local Testing
- [ ] Admin tool loads without errors
- [ ] Can read data from tables
- [ ] Can create new records
- [ ] Can update existing records
- [ ] Can delete records (if applicable)

### 3. Production Testing (Vercel)
- [ ] No "Forbidden use of secret API key" errors in console
- [ ] No "Multiple GoTrueClient instances" warnings
- [ ] All CRUD operations work
- [ ] No 401 Unauthorized errors

### 4. RLS Policy Verification
- [ ] Table has RLS enabled
- [ ] Policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] Policies allow authenticated users
- [ ] Test with actual authenticated user

---

## Common Issues

### Issue: "Forbidden use of secret API key in browser"

**Cause:** Service using `supabaseAdmin` instead of `supabase`

**Fix:**
```typescript
// Change this:
import { supabaseAdmin as supabase } from '../utils/supabase-admin-client';

// To this:
import { supabase } from '../../game/utils/supabase/client';
```

### Issue: "Multiple GoTrueClient instances detected"

**Cause:** Both game client and admin client being loaded

**Fix:** Ensure all admin code uses the game's client, not the admin client

### Issue: 401 Unauthorized on specific tables

**Cause:** Missing or incorrect RLS policies

**Fix:** Add proper RLS policies for authenticated users (see example above)

---

## Environment Variables

### Required for Admin Tool (Vercel)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### NOT Required for Admin Tool

```bash
# DO NOT SET THIS IN VERCEL
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

The service role key should only exist in local `.env.local` files for development purposes, and should **never** be deployed to Vercel or any browser-accessible environment.

---

## Historical Context

### Why This Changed

**Before:** Admin services used `supabaseAdmin` with service role key
**Problem:** Supabase started blocking service role keys in browser environments
**Solution:** Switch all admin services to use anon key with proper RLS policies

**Root Cause Analysis:** See `docs/admin-supabase-client-rca.md` for detailed investigation

### When This Was Fixed

- **Issue Discovered:** 2024-12-03
- **Root Cause Identified:** Service role key blocked by Supabase security
- **Fix Applied:** Switched all admin services to anon key
- **Branch:** `fix/vercel-admin-build-config`

---

## References

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Client API Keys](https://supabase.com/docs/guides/api/api-keys)
- Project RCA: `docs/admin-supabase-client-rca.md`
- Admin README: `admin/README.md`

---

## Enforcement

**This pattern is mandatory for all admin tool code.**

When reviewing PRs that touch admin services:
1. Verify correct client import
2. Check for RLS policies on new tables
3. Test in deployed environment
4. Confirm no service role key usage
