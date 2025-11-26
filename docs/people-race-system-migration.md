# People/Race System Migration Guide

## Overview

This document describes the migration from the old hardcoded "Cultivators vs Enemies" system to the new flexible "Person Type" system.

## What Changed

### Before (Old System)
- **Cultivators**: Hardcoded types (sword, palm, arrow, lightning) in `cultivator.ts`
- **Enemies**: Hardcoded types (demon, shadow, beast, etc.) in `enemy-codex.ts`
- **Wave Spawning**: Hardcoded logic in game code
- **Admin Tool**: Separate editors for cultivators and enemies

### After (New System)
- **Person Types**: Unified entity system stored in Supabase
- **Role-Based**: Same Person Type can be defender or attacker based on configuration
- **Wave Configurations**: Data-driven wave composition stored in Supabase
- **Admin Tool**: Single "Cultivators" editor and "Waves" editor

## Architecture Changes

### Data Model

#### Person Type Structure
```typescript
interface PersonType {
  id: string;              // UUID
  key: string;             // Unique key (e.g., 'sword_cultivator')
  name: string;            // Display name
  emoji: string;           // Visual representation
  description: string;
  lore?: string;
  
  baseStats: {
    health: number;
    damage: number;
    attackSpeed: number;
    range: number;
    movementSpeed: number;
  };
  
  defenderConfig?: {      // Optional: for defenders
    deploymentCost: number;
    compatibleSkills: string[];
    compatibleItems: string[];
  };
  
  attackerConfig?: {      // Optional: for attackers
    reward: number;
    spawnWeight: number;
    firstAppearance: number;
    difficulty: string;
  };
}
```

#### Wave Configuration Structure
```typescript
interface WaveConfiguration {
  id: string;
  waveNumber: number;
  spawns: WaveSpawn[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface WaveSpawn {
  personTypeId: string;  // Reference to Person Type
  count: number;
  spawnInterval: number; // ms between spawns
  spawnDelay: number;    // ms before first spawn
}
```

### Database Schema

#### person_types Table
- Stores all Person Type definitions
- JSONB columns for flexible config storage
- Indexed on `key` for fast lookups

#### wave_configurations Table
- Stores wave composition data
- JSONB array for spawn definitions
- Indexed on `wave_number`

See `supabase/migrations/` for full schema definitions.

## Migration Process

### Phase 1: Database Setup ✅
- Created `person_types` and `wave_configurations` tables
- Migrated existing cultivator types to Person Types with `defenderConfig`
- Migrated existing enemy types to Person Types with `attackerConfig`
- Created default wave configurations for waves 1-20

### Phase 2: Service Layer ✅
- Created `person-type-service.ts` for loading Person Types
- Created `wave-config-service.ts` for loading Wave Configurations
- Created `cultivator-generator.ts` for random cultivator generation
- Created adapter functions for backward compatibility

### Phase 3: Game System Refactoring ✅
- Updated `App.tsx` to load from Supabase services
- Refactored entity spawning to use Wave Configurations
- Implemented random cultivator generation at game start
- Maintained backward compatibility with fallback logic

### Phase 4: Admin Tool ✅
- Created "Cultivators" tab with Person Type CRUD operations
- Created "Waves" tab with Wave Configuration editor
- Implemented validation for Person Type references
- Added preview capabilities

### Phase 5: Testing ✅
- Unit tests for all services
- Integration tests for game flow
- End-to-end tests for admin-to-game workflow
- Error handling tests

### Phase 6: Cleanup (In Progress)
- Marked deprecated files with warnings
- Created migration documentation
- Updated README files

## Backward Compatibility

The system maintains backward compatibility through:

1. **Adapter Functions** (`person-type-adapters.ts`)
   - Converts old cultivator format to Person Types
   - Converts old enemy format to Person Types
   - Provides default Person Types when database unavailable

2. **Fallback Logic** (in `App.tsx`)
   - Falls back to old system if Person Type not found
   - Uses `getRandomEnemyType()` and `getEnemyStats()` as fallback
   - Uses `getCultivatorConfig()` for legacy tower types

3. **Deprecated Files Kept**
   - `cultivator.ts` - Still used by adapters and legacy admin components
   - `enemy-codex.ts` - Still used by adapters and enemy codex dialog
   - See `game/utils/DEPRECATED_README.md` for details

## Key Features

### Random Cultivator Generation
- Game generates 4 random cultivators at start
- Randomly selects Person Types with `defenderConfig`
- Randomly assigns compatible skills (1-3 per cultivator)
- Randomly assigns compatible items (0-2 per cultivator)
- Ensures variety by avoiding duplicate combinations

### Data-Driven Wave Spawning
- Wave composition loaded from Supabase
- Falls back to default generation if not configured
- Default: 5 + wave * 2 enemies, weighted random selection
- Respects `firstAppearance` wave numbers

### Flexible Role System
- Same Person Type can be defender or attacker
- Role determined by which config is present
- Enables future game modes (e.g., faction battles)

## Usage Guide

### For Game Designers

#### Creating a New Person Type
1. Open Admin Tool (port 5177)
2. Navigate to "Cultivators" tab
3. Click "Create New Person Type"
4. Fill in basic info (name, emoji, description, lore)
5. Set base stats (health, damage, attack speed, range, movement speed)
6. Choose role:
   - **Defender**: Set deployment cost, compatible skills/items
   - **Attacker**: Set reward, spawn weight, first appearance, difficulty
7. Save to Supabase

#### Configuring a Wave
1. Open Admin Tool
2. Navigate to "Waves" tab
3. Select wave number
4. Add spawn groups:
   - Select Person Type (attackers only)
   - Set spawn count
   - Set spawn interval and delay
5. Preview total composition
6. Save to Supabase

### For Developers

#### Loading Person Types
```typescript
import { personTypeService } from '../shared/utils/person-type-service';

// Load all Person Types
const personTypes = await personTypeService.loadPersonTypes();

// Get specific Person Type by key
const swordCultivator = await personTypeService.getPersonTypeByKey('sword_cultivator');

// Get by ID
const personType = await personTypeService.getPersonTypeById(id);
```

#### Loading Wave Configurations
```typescript
import { waveConfigService } from '../shared/utils/wave-config-service';

// Load wave configuration (falls back to default if not found)
const waveConfig = await waveConfigService.loadWaveConfiguration(waveNumber);

// Validate wave configuration
const validation = await waveConfigService.validateWaveConfiguration(waveConfig);
```

#### Generating Random Cultivators
```typescript
import { generateRandomCultivators } from '../shared/utils/cultivator-generator';
import { personTypeService } from '../shared/utils/person-type-service';

// Load Person Types
const personTypes = await personTypeService.loadPersonTypes();

// Generate 4 random cultivators
const cultivators = generateRandomCultivators(personTypes, 4);
```

#### Creating Entity Instances
```typescript
import { createDefenderInstance, createAttackerInstance } from '../shared/utils/cultivator-generator';

// Create defender
const defender = createDefenderInstance(personType, ['skill1', 'skill2'], ['item1']);

// Create attacker
const attacker = createAttackerInstance(personType, { x: 100, y: 200 });
```

## Error Handling

### Database Connection Failures
- Services automatically fall back to default Person Types
- Error logged to console
- Game continues with hardcoded defaults

### Schema Version Mismatches
- Version field checked on load
- Warning logged if mismatch detected
- Automatic migration attempted for known versions

### Invalid Wave Configurations
- Validation checks Person Type references
- Invalid spawns skipped
- Falls back to default wave generation if all spawns invalid

## Testing

### Unit Tests
- `tests/person-type-service.spec.ts` - Person Type loading and caching
- `tests/wave-config-service.spec.ts` - Wave Config loading and validation
- `tests/cultivator-generator.spec.ts` - Random generation and variety

### Integration Tests
- `tests/game-flow-integration.spec.ts` - Complete game flow with random cultivators
- `tests/admin-to-game-flow.spec.ts` - Admin changes reflected in game
- `tests/error-handling-integration.spec.ts` - Fallback behavior

## Future Enhancements

1. **Faction System**: Add faction field for team-based gameplay
2. **Dynamic Roles**: Allow Person Types to switch roles mid-game
3. **Procedural Generation**: Generate Person Types algorithmically
4. **Mod Support**: Community-created Person Types
5. **Build System Refactoring**: Update cultivator-builds.ts for Person Types
6. **Cross-Device Sync**: Move build persistence to Supabase

## Troubleshooting

### Game not loading Person Types
1. Check Supabase connection in browser console
2. Verify migrations applied: `supabase/migrations/README.md`
3. Check for errors in `person-type-service.ts` logs
4. Game should fall back to defaults automatically

### Wave spawning incorrect enemies
1. Check wave configuration in Admin Tool
2. Verify Person Type references are valid
3. Check `wave-config-service.ts` validation logs
4. Falls back to default generation if invalid

### Admin Tool not saving changes
1. Check Supabase connection
2. Verify admin service imports correct client
3. Check browser console for errors
4. Verify table permissions in Supabase

### Random cultivators not varied
1. Check Person Type pool size (need multiple defender types)
2. Verify compatible skills/items configured
3. Check generation config in `cultivator-generator.ts`
4. Review generation logs for variety warnings

## References

- **Requirements**: `.kiro/specs/people-race-system/requirements.md`
- **Design**: `.kiro/specs/people-race-system/design.md`
- **Tasks**: `.kiro/specs/people-race-system/tasks.md`
- **Migrations**: `supabase/migrations/`
- **Deprecated Files**: `game/utils/DEPRECATED_README.md`

## Support

For questions or issues:
1. Check this migration guide
2. Review spec documents in `.kiro/specs/people-race-system/`
3. Check test files for usage examples
4. Review Supabase migration files for schema details
