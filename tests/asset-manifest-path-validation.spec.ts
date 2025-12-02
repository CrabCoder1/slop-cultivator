/**
 * Property-Based Tests for Asset Manifest Path Validation
 * 
 * **Feature: svg-asset-system, Property 6: Directory Path Format Validation**
 * **Validates: Requirements 4.1-4.6**
 */
import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';
import {
  uiIcons,
  weaponIcons,
  skillIcons,
  itemIcons,
  statIcons,
  speciesSprites,
  combatEffects,
  magicEffects,
  movementEffects,
  statusEffects,
  levelBadges,
  type AssetEntry,
} from '../game/assets/asset-manifest';

// Define expected path patterns for each category
const PATH_PATTERNS = {
  uiIcons: /^game\/assets\/icons\/ui\/[\w-]+\.svg$/,
  weaponIcons: /^game\/assets\/icons\/weapons\/[\w-]+\.svg$/,
  skillIcons: /^game\/assets\/icons\/skills\/[\w-]+\.svg$/,
  itemIcons: /^game\/assets\/icons\/items\/[\w-]+\.svg$/,
  statIcons: /^game\/assets\/icons\/stats\/[\w-]+\.svg$/,
  levelBadges: /^game\/assets\/icons\/badges\/[\w-]+\.svg$/,
  speciesSprites: /^game\/assets\/sprites\/species\/[\w-]+\.svg$/,
  combatEffects: /^game\/assets\/effects\/combat\/[\w-]+\.svg$/,
  magicEffects: /^game\/assets\/effects\/magic\/[\w-]+\.svg$/,
  movementEffects: /^game\/assets\/effects\/movement\/[\w-]+\.svg$/,
  statusEffects: /^game\/assets\/effects\/status\/[\w-]+\.svg$/,
};

// Helper to get all entries from a category
function getCategoryEntries(category: Record<string, AssetEntry>): [string, AssetEntry][] {
  return Object.entries(category);
}

test.describe('Asset Manifest - Property 6: Directory Path Format Validation', () => {
  /**
   * **Feature: svg-asset-system, Property 6: Directory Path Format Validation**
   * **Validates: Requirements 4.1-4.6**
   * 
   * For any asset entry in the manifest, the path SHALL match the expected 
   * directory pattern for its category.
   */
  
  test('UI icons paths match expected pattern (game/assets/icons/ui/)', () => {
    // Property: For all UI icon entries, path matches UI icon pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(uiIcons)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.uiIcons.test(entry.path);
          if (!matches) {
            console.log(`UI icon "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(uiIcons).length }
    );
  });

  test('Weapon icons paths match expected pattern (game/assets/icons/weapons/)', () => {
    // Property: For all weapon icon entries, path matches weapon icon pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(weaponIcons)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.weaponIcons.test(entry.path);
          if (!matches) {
            console.log(`Weapon icon "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(weaponIcons).length }
    );
  });

  test('Skill icons paths match expected pattern (game/assets/icons/skills/)', () => {
    // Property: For all skill icon entries, path matches skill icon pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(skillIcons)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.skillIcons.test(entry.path);
          if (!matches) {
            console.log(`Skill icon "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(skillIcons).length }
    );
  });

  test('Item icons paths match expected pattern (game/assets/icons/items/)', () => {
    // Property: For all item icon entries, path matches item icon pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(itemIcons)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.itemIcons.test(entry.path);
          if (!matches) {
            console.log(`Item icon "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(itemIcons).length }
    );
  });

  test('Stat icons paths match expected pattern (game/assets/icons/stats/)', () => {
    // Property: For all stat icon entries, path matches stat icon pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(statIcons)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.statIcons.test(entry.path);
          if (!matches) {
            console.log(`Stat icon "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(statIcons).length }
    );
  });

  test('Level badges paths match expected pattern (game/assets/icons/badges/)', () => {
    // Property: For all level badge entries, path matches badge pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(levelBadges)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.levelBadges.test(entry.path);
          if (!matches) {
            console.log(`Level badge "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(levelBadges).length }
    );
  });

  test('Species sprites paths match expected pattern (game/assets/sprites/species/)', () => {
    // Property: For all species sprite entries, path matches species pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(speciesSprites)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.speciesSprites.test(entry.path);
          if (!matches) {
            console.log(`Species sprite "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(speciesSprites).length }
    );
  });

  test('Combat effects paths match expected pattern (game/assets/effects/combat/)', () => {
    // Property: For all combat effect entries, path matches combat effect pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(combatEffects)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.combatEffects.test(entry.path);
          if (!matches) {
            console.log(`Combat effect "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(combatEffects).length }
    );
  });

  test('Magic effects paths match expected pattern (game/assets/effects/magic/)', () => {
    // Property: For all magic effect entries, path matches magic effect pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(magicEffects)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.magicEffects.test(entry.path);
          if (!matches) {
            console.log(`Magic effect "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(magicEffects).length }
    );
  });

  test('Movement effects paths match expected pattern (game/assets/effects/movement/)', () => {
    // Property: For all movement effect entries, path matches movement effect pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(movementEffects)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.movementEffects.test(entry.path);
          if (!matches) {
            console.log(`Movement effect "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(movementEffects).length }
    );
  });

  test('Status effects paths match expected pattern (game/assets/effects/status/)', () => {
    // Property: For all status effect entries, path matches status effect pattern
    fc.assert(
      fc.property(
        fc.constantFrom(...getCategoryEntries(statusEffects)),
        ([key, entry]) => {
          const matches = PATH_PATTERNS.statusEffects.test(entry.path);
          if (!matches) {
            console.log(`Status effect "${key}" has invalid path: ${entry.path}`);
          }
          return matches;
        }
      ),
      { numRuns: Object.keys(statusEffects).length }
    );
  });

  test('All asset paths end with .svg extension', () => {
    // Property: For all assets across all categories, path ends with .svg
    const allCategories = [
      uiIcons,
      weaponIcons,
      skillIcons,
      itemIcons,
      statIcons,
      speciesSprites,
      combatEffects,
      magicEffects,
      movementEffects,
      statusEffects,
      levelBadges,
    ];

    const allEntries: [string, AssetEntry][] = allCategories.flatMap(cat => 
      Object.entries(cat)
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...allEntries),
        ([key, entry]) => {
          const endsWithSvg = entry.path.endsWith('.svg');
          if (!endsWithSvg) {
            console.log(`Asset "${key}" path does not end with .svg: ${entry.path}`);
          }
          return endsWithSvg;
        }
      ),
      { numRuns: allEntries.length }
    );
  });

  test('All asset paths start with game/assets/', () => {
    // Property: For all assets, path starts with the correct base directory
    const allCategories = [
      uiIcons,
      weaponIcons,
      skillIcons,
      itemIcons,
      statIcons,
      speciesSprites,
      combatEffects,
      magicEffects,
      movementEffects,
      statusEffects,
      levelBadges,
    ];

    const allEntries: [string, AssetEntry][] = allCategories.flatMap(cat => 
      Object.entries(cat)
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...allEntries),
        ([key, entry]) => {
          const startsCorrectly = entry.path.startsWith('game/assets/');
          if (!startsCorrectly) {
            console.log(`Asset "${key}" path does not start with game/assets/: ${entry.path}`);
          }
          return startsCorrectly;
        }
      ),
      { numRuns: allEntries.length }
    );
  });
});
