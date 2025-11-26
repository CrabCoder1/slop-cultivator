# Deprecated Files

This directory contains files that have been superseded by the new Person Type system but are kept for reference and backward compatibility.

## Deprecated Files

### cultivator.ts
**Status**: Deprecated - Use Person Type system instead  
**Replacement**: `shared/utils/person-type-service.ts` and `shared/types/person-types.ts`  
**Still Used By**:
- `shared/utils/person-type-adapters.ts` - For converting old format to new Person Types
- `admin/components/CultivatorEditor.tsx` - Legacy admin component (should be replaced with PeopleEditor)
- `admin/components/SkillEditor.tsx` - References CultivatorType enum

**Migration Path**: 
- All game logic now uses `PersonType` and `EntityInstance` interfaces
- The adapter functions in `person-type-adapters.ts` convert old cultivator types to Person Types
- Admin tool should use the new "People" tab instead of the old Cultivator editor

### enemy-codex.ts
**Status**: Deprecated - Use Person Type system instead  
**Replacement**: `shared/utils/person-type-service.ts` and `shared/types/person-types.ts`  
**Still Used By**:
- `shared/utils/person-type-adapters.ts` - For converting old format to new Person Types
- `game/components/enemy-codex-dialog.tsx` - Legacy UI component
- `game/components/game-board.tsx` - For enemy tooltips (should use PersonType data)
- `admin/components/EnemyEditor.tsx` - Legacy admin component (should be replaced with PeopleEditor)

**Migration Path**:
- All enemy spawning now uses Wave Configurations and Person Types
- The adapter functions in `person-type-adapters.ts` convert old enemy types to Person Types
- Enemy codex dialog should be updated to use Person Type data
- Admin tool should use the new "People" tab instead of the old Enemy editor

### cultivator-builds.ts
**Status**: Deprecated - Build system needs refactoring for Person Types  
**Replacement**: TBD - Build system should work with Person Type keys instead of hardcoded cultivator types  
**Still Used By**:
- `game/App.tsx` - For saving/loading preferred skill builds

**Migration Path**:
- Build system should be refactored to use Person Type keys (e.g., 'sword_cultivator') instead of old type strings
- LocalStorage format should be updated to support dynamic Person Types
- Consider moving build persistence to Supabase for cross-device sync

## Removal Timeline

These files should be removed once:
1. All admin components are updated to use the new People/Waves tabs
2. Enemy codex dialog is refactored to use Person Type data
3. Build system is refactored for Person Types
4. All references in game-board.tsx are updated to use Person Type data

## Testing Before Removal

Before removing these files, ensure:
- [ ] All integration tests pass
- [ ] Game flow works without fallback to old types
- [ ] Admin tool fully functional with new tabs
- [ ] No console errors about missing types
- [ ] Build system works with new Person Type keys
