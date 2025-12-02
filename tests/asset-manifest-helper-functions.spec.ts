/**
 * Property-Based Tests for Asset Manifest Helper Functions
 * 
 * Tests Properties 1-5 from the SVG Asset System design document.
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
  getAssetOrFallback,
  getAssetStats,
  getPendingAssets,
  isAssetReady,
  type AssetEntry,
  type AssetStatus,
} from '../game/assets/asset-manifest';

// Helper to get all assets from all categories
function getAllAssets(): AssetEntry[] {
  return [
    ...Object.values(uiIcons),
    ...Object.values(weaponIcons),
    ...Object.values(skillIcons),
    ...Object.values(itemIcons),
    ...Object.values(statIcons),
    ...Object.values(speciesSprites),
    ...Object.values(combatEffects),
    ...Object.values(magicEffects),
    ...Object.values(movementEffects),
    ...Object.values(statusEffects),
    ...Object.values(levelBadges),
  ];
}

// Valid asset statuses
const VALID_STATUSES: AssetStatus[] = ['ready', 'pending', 'placeholder'];

test.describe('Asset Manifest - Property 1: Asset Entry Completeness', () => {
  /**
   * **Feature: svg-asset-system, Property 1: Asset Entry Completeness**
   * **Validates: Requirements 2.1**
   * 
   * For any asset entry in the manifest, the entry SHALL contain all required fields:
   * path (non-empty string), name (non-empty string), status (valid AssetStatus),
   * and fallback (string or undefined).
   */
  
  test('All asset entries have required fields with valid values', () => {
    const allAssets = getAllAssets();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...allAssets),
        (entry) => {
          // path must be a non-empty string
          const hasValidPath = typeof entry.path === 'string' && entry.path.length > 0;
          
          // name must be a non-empty string
          const hasValidName = typeof entry.name === 'string' && entry.name.length > 0;
          
          // status must be a valid AssetStatus
          const hasValidStatus = VALID_STATUSES.includes(entry.status);
          
          // fallback must be string or undefined
          const hasValidFallback = entry.fallback === undefined || typeof entry.fallback === 'string';
          
          if (!hasValidPath) console.log(`Invalid path for entry: ${entry.name}`);
          if (!hasValidName) console.log(`Invalid name for entry with path: ${entry.path}`);
          if (!hasValidStatus) console.log(`Invalid status "${entry.status}" for entry: ${entry.name}`);
          if (!hasValidFallback) console.log(`Invalid fallback for entry: ${entry.name}`);
          
          return hasValidPath && hasValidName && hasValidStatus && hasValidFallback;
        }
      ),
      { numRuns: allAssets.length }
    );
  });
});


test.describe('Asset Manifest - Property 2: Fallback Resolution for Pending Assets', () => {
  /**
   * **Feature: svg-asset-system, Property 2: Fallback Resolution for Pending Assets**
   * **Validates: Requirements 2.2**
   * 
   * For any asset entry with status 'pending', calling getAssetOrFallback SHALL return
   * the fallback emoji string, not the file path.
   */
  
  test('getAssetOrFallback returns fallback for pending assets', () => {
    const allAssets = getAllAssets();
    const pendingAssets = allAssets.filter(a => a.status === 'pending');
    
    if (pendingAssets.length === 0) {
      console.log('No pending assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...pendingAssets),
        (entry) => {
          const result = getAssetOrFallback(entry);
          
          // Result should be the fallback, not the path
          const isNotPath = result !== entry.path;
          
          // Result should be the fallback emoji or default '❓'
          const isFallback = result === entry.fallback || result === '❓';
          
          if (!isNotPath) {
            console.log(`Pending asset "${entry.name}" returned path instead of fallback`);
          }
          if (!isFallback) {
            console.log(`Pending asset "${entry.name}" returned "${result}" instead of fallback "${entry.fallback}"`);
          }
          
          return isNotPath && isFallback;
        }
      ),
      { numRuns: pendingAssets.length }
    );
  });
  
  test('getAssetOrFallback handles missing fallback gracefully', () => {
    // Test with a synthetic asset that has no fallback
    const assetWithNoFallback: AssetEntry = {
      path: 'test/path.svg',
      name: 'Test Asset',
      status: 'pending',
      // No fallback defined
    };
    
    const result = getAssetOrFallback(assetWithNoFallback);
    expect(result).toBe('❓');
  });
});

test.describe('Asset Manifest - Property 3: Path Resolution for Ready Assets', () => {
  /**
   * **Feature: svg-asset-system, Property 3: Path Resolution for Ready Assets**
   * **Validates: Requirements 2.3**
   * 
   * For any asset entry with status 'ready', calling getAssetOrFallback SHALL return
   * the file path string, not the fallback emoji.
   */
  
  test('getAssetOrFallback returns path for ready assets', () => {
    const allAssets = getAllAssets();
    const readyAssets = allAssets.filter(a => a.status === 'ready');
    
    if (readyAssets.length === 0) {
      console.log('No ready assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...readyAssets),
        (entry) => {
          const result = getAssetOrFallback(entry);
          
          // Result should be the path, not the fallback
          const isPath = result === entry.path;
          
          if (!isPath) {
            console.log(`Ready asset "${entry.name}" returned "${result}" instead of path "${entry.path}"`);
          }
          
          return isPath;
        }
      ),
      { numRuns: readyAssets.length }
    );
  });
  
  test('isAssetReady returns true for ready assets', () => {
    const allAssets = getAllAssets();
    const readyAssets = allAssets.filter(a => a.status === 'ready');
    
    if (readyAssets.length === 0) {
      console.log('No ready assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...readyAssets),
        (entry) => {
          return isAssetReady(entry) === true;
        }
      ),
      { numRuns: readyAssets.length }
    );
  });
  
  test('isAssetReady returns false for non-ready assets', () => {
    const allAssets = getAllAssets();
    const nonReadyAssets = allAssets.filter(a => a.status !== 'ready');
    
    if (nonReadyAssets.length === 0) {
      console.log('No non-ready assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonReadyAssets),
        (entry) => {
          return isAssetReady(entry) === false;
        }
      ),
      { numRuns: nonReadyAssets.length }
    );
  });
});


test.describe('Asset Manifest - Property 4: Asset Stats Consistency', () => {
  /**
   * **Feature: svg-asset-system, Property 4: Asset Stats Consistency**
   * **Validates: Requirements 2.4, 7.2**
   * 
   * For any state of the asset manifest, getAssetStats() SHALL return values where
   * ready + pending equals total, and these counts match the actual number of entries
   * in the manifest.
   */
  
  test('getAssetStats returns consistent counts', () => {
    const stats = getAssetStats();
    const allAssets = getAllAssets();
    
    // ready + pending should equal total
    expect(stats.ready + stats.pending).toBe(stats.total);
    
    // total should match actual asset count
    expect(stats.total).toBe(allAssets.length);
    
    // ready count should match actual ready assets
    const actualReady = allAssets.filter(a => a.status === 'ready').length;
    expect(stats.ready).toBe(actualReady);
    
    // pending count should match actual non-ready assets
    const actualPending = allAssets.filter(a => a.status !== 'ready').length;
    expect(stats.pending).toBe(actualPending);
  });
  
  test('Stats counts are non-negative', () => {
    const stats = getAssetStats();
    
    expect(stats.ready).toBeGreaterThanOrEqual(0);
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });
  
  test('Stats total is positive (manifest is not empty)', () => {
    const stats = getAssetStats();
    expect(stats.total).toBeGreaterThan(0);
  });
});

test.describe('Asset Manifest - Property 5: Pending Assets Filter Accuracy', () => {
  /**
   * **Feature: svg-asset-system, Property 5: Pending Assets Filter Accuracy**
   * **Validates: Requirements 7.1**
   * 
   * For any call to getPendingAssets(), all returned entries SHALL have status 'pending',
   * and no asset with status 'pending' in the manifest SHALL be missing from the result.
   */
  
  test('getPendingAssets returns only pending assets', () => {
    const pendingAssets = getPendingAssets();
    
    if (pendingAssets.length === 0) {
      console.log('No pending assets returned');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...pendingAssets),
        (entry) => {
          const isPending = entry.status === 'pending';
          
          if (!isPending) {
            console.log(`getPendingAssets returned non-pending asset: ${entry.name} (status: ${entry.status})`);
          }
          
          return isPending;
        }
      ),
      { numRuns: pendingAssets.length }
    );
  });
  
  test('getPendingAssets includes all pending assets from manifest', () => {
    const allAssets = getAllAssets();
    const pendingFromManifest = allAssets.filter(a => a.status === 'pending');
    const pendingFromFunction = getPendingAssets();
    
    // Count should match
    expect(pendingFromFunction.length).toBe(pendingFromManifest.length);
    
    // Every pending asset from manifest should be in the result
    for (const asset of pendingFromManifest) {
      const found = pendingFromFunction.some(
        a => a.path === asset.path && a.name === asset.name
      );
      expect(found).toBe(true);
    }
  });
  
  test('getPendingAssets count matches stats pending count', () => {
    const pendingAssets = getPendingAssets();
    const stats = getAssetStats();
    
    expect(pendingAssets.length).toBe(stats.pending);
  });
});


test.describe('Asset Manifest - Property 9: Asset Inventory Counts', () => {
  /**
   * **Feature: svg-asset-system, Property 9: Asset Inventory Counts**
   * **Validates: Requirements 8.1-8.12**
   * 
   * For any category in the manifest, the number of entries SHALL match the specified count:
   * UI: 8, Weapons: 5, Skills: 16, Items: 13, Stats: 5, Species: 6,
   * Combat: 4, Magic: 4, Movement: 4, Status: 4, Badges: 4, Total: 73
   */
  
  // Expected counts from Requirements 8.1-8.12
  const EXPECTED_COUNTS = {
    uiIcons: 8,        // Req 8.2: inventory, settings, pause, play, fast-forward, qi, castle, map
    weaponIcons: 5,    // Req 8.3: sword, spear, bow, staff, dagger
    skillIcons: 16,    // Req 8.4: 4 per cultivator type (sword, palm, arrow, lightning)
    itemIcons: 13,     // Req 8.5: 4 common, 4 rare, 3 epic, 2 legendary
    statIcons: 5,      // Req 8.6: health, damage, attack speed, range, crit chance
    speciesSprites: 6, // Req 8.7: human, spirit, beast, golem, dragon, demon
    combatEffects: 4,  // Req 8.8: slash, thrust, impact, arrow trail
    magicEffects: 4,   // Req 8.9: lightning bolt, fire burst, qi aura, spirit wave
    movementEffects: 4,// Req 8.10: jump dust, dash trail, landing impact, speed lines
    statusEffects: 4,  // Req 8.11: heal glow, shield bubble, poison drip, stun stars
    levelBadges: 4,    // Req 8.12: novice, intermediate, advanced, master
    total: 73,         // Req 8.1: exactly 73 total assets
  };
  
  test('UI icons count matches requirement (8 icons)', () => {
    const count = Object.keys(uiIcons).length;
    expect(count).toBe(EXPECTED_COUNTS.uiIcons);
  });
  
  test('Weapon icons count matches requirement (5 icons)', () => {
    const count = Object.keys(weaponIcons).length;
    expect(count).toBe(EXPECTED_COUNTS.weaponIcons);
  });
  
  test('Skill icons count matches requirement (16 icons, 4 per type)', () => {
    const count = Object.keys(skillIcons).length;
    expect(count).toBe(EXPECTED_COUNTS.skillIcons);
    
    // Verify 4 skills per cultivator type
    const swordSkills = ['bladeMastery', 'ironBody', 'swiftStrike', 'whirlwindBlade'];
    const palmSkills = ['innerForce', 'qiShield', 'palmAura', 'meditation'];
    const arrowSkills = ['eagleEye', 'rapidFire', 'piercingShot', 'windWalker'];
    const lightningSkills = ['stormFury', 'chainLightning', 'thunderAura', 'staticCharge'];
    
    for (const skill of swordSkills) {
      expect(skillIcons[skill]).toBeDefined();
    }
    for (const skill of palmSkills) {
      expect(skillIcons[skill]).toBeDefined();
    }
    for (const skill of arrowSkills) {
      expect(skillIcons[skill]).toBeDefined();
    }
    for (const skill of lightningSkills) {
      expect(skillIcons[skill]).toBeDefined();
    }
  });
  
  test('Item icons count matches requirement (13 icons)', () => {
    const count = Object.keys(itemIcons).length;
    expect(count).toBe(EXPECTED_COUNTS.itemIcons);
    
    // Verify item distribution: 4 common, 4 rare, 3 epic, 2 legendary
    const commonItems = ['jadeRing', 'silkSash', 'ironBracers', 'woodenCharm'];
    const rareItems = ['dragonFang', 'phoenixFeather', 'tigerClaw', 'spiritArmor'];
    const epicItems = ['celestialOrb', 'demonSlayerBlade', 'immortalRobes'];
    const legendaryItems = ['heavensMandate', 'voidBreaker'];
    
    for (const item of commonItems) {
      expect(itemIcons[item]).toBeDefined();
    }
    for (const item of rareItems) {
      expect(itemIcons[item]).toBeDefined();
    }
    for (const item of epicItems) {
      expect(itemIcons[item]).toBeDefined();
    }
    for (const item of legendaryItems) {
      expect(itemIcons[item]).toBeDefined();
    }
  });
  
  test('Stat icons count matches requirement (5 icons)', () => {
    const count = Object.keys(statIcons).length;
    expect(count).toBe(EXPECTED_COUNTS.statIcons);
    
    // Verify specific stats
    const expectedStats = ['health', 'damage', 'attackSpeed', 'range', 'critChance'];
    for (const stat of expectedStats) {
      expect(statIcons[stat]).toBeDefined();
    }
  });
  
  test('Species sprites count matches requirement (6 sprites)', () => {
    const count = Object.keys(speciesSprites).length;
    expect(count).toBe(EXPECTED_COUNTS.speciesSprites);
    
    // Verify specific species
    const expectedSpecies = ['human', 'spirit', 'beast', 'golem', 'dragon', 'demon'];
    for (const species of expectedSpecies) {
      expect(speciesSprites[species]).toBeDefined();
    }
  });
  
  test('Combat effects count matches requirement (4 effects)', () => {
    const count = Object.keys(combatEffects).length;
    expect(count).toBe(EXPECTED_COUNTS.combatEffects);
    
    // Verify specific effects
    const expectedEffects = ['slash', 'thrust', 'impact', 'arrowTrail'];
    for (const effect of expectedEffects) {
      expect(combatEffects[effect]).toBeDefined();
    }
  });
  
  test('Magic effects count matches requirement (4 effects)', () => {
    const count = Object.keys(magicEffects).length;
    expect(count).toBe(EXPECTED_COUNTS.magicEffects);
    
    // Verify specific effects
    const expectedEffects = ['lightningBolt', 'fireBurst', 'qiAura', 'spiritWave'];
    for (const effect of expectedEffects) {
      expect(magicEffects[effect]).toBeDefined();
    }
  });
  
  test('Movement effects count matches requirement (4 effects)', () => {
    const count = Object.keys(movementEffects).length;
    expect(count).toBe(EXPECTED_COUNTS.movementEffects);
    
    // Verify specific effects
    const expectedEffects = ['jumpDust', 'dashTrail', 'landingImpact', 'speedLines'];
    for (const effect of expectedEffects) {
      expect(movementEffects[effect]).toBeDefined();
    }
  });
  
  test('Status effects count matches requirement (4 effects)', () => {
    const count = Object.keys(statusEffects).length;
    expect(count).toBe(EXPECTED_COUNTS.statusEffects);
    
    // Verify specific effects
    const expectedEffects = ['healGlow', 'shieldBubble', 'poisonDrip', 'stunStars'];
    for (const effect of expectedEffects) {
      expect(statusEffects[effect]).toBeDefined();
    }
  });
  
  test('Level badges count matches requirement (4 badges)', () => {
    const count = Object.keys(levelBadges).length;
    expect(count).toBe(EXPECTED_COUNTS.levelBadges);
    
    // Verify specific badges
    const expectedBadges = ['novice', 'intermediate', 'advanced', 'master'];
    for (const badge of expectedBadges) {
      expect(levelBadges[badge]).toBeDefined();
    }
  });
  
  test('Total asset count matches requirement (exactly 73)', () => {
    const allAssets = getAllAssets();
    expect(allAssets.length).toBe(EXPECTED_COUNTS.total);
    
    // Also verify via getAssetStats
    const stats = getAssetStats();
    expect(stats.total).toBe(EXPECTED_COUNTS.total);
  });
  
  test('Property: All category counts sum to total', () => {
    // Property-based verification that individual counts sum correctly
    const categoryCounts = [
      Object.keys(uiIcons).length,
      Object.keys(weaponIcons).length,
      Object.keys(skillIcons).length,
      Object.keys(itemIcons).length,
      Object.keys(statIcons).length,
      Object.keys(speciesSprites).length,
      Object.keys(combatEffects).length,
      Object.keys(magicEffects).length,
      Object.keys(movementEffects).length,
      Object.keys(statusEffects).length,
      Object.keys(levelBadges).length,
    ];
    
    const sumOfCategories = categoryCounts.reduce((sum, count) => sum + count, 0);
    const allAssets = getAllAssets();
    
    expect(sumOfCategories).toBe(allAssets.length);
    expect(sumOfCategories).toBe(EXPECTED_COUNTS.total);
  });
  
  test('Property: Each category has expected count using fast-check', () => {
    // Use fast-check to verify category counts match expectations
    const categoryData = [
      { name: 'uiIcons', actual: Object.keys(uiIcons).length, expected: EXPECTED_COUNTS.uiIcons },
      { name: 'weaponIcons', actual: Object.keys(weaponIcons).length, expected: EXPECTED_COUNTS.weaponIcons },
      { name: 'skillIcons', actual: Object.keys(skillIcons).length, expected: EXPECTED_COUNTS.skillIcons },
      { name: 'itemIcons', actual: Object.keys(itemIcons).length, expected: EXPECTED_COUNTS.itemIcons },
      { name: 'statIcons', actual: Object.keys(statIcons).length, expected: EXPECTED_COUNTS.statIcons },
      { name: 'speciesSprites', actual: Object.keys(speciesSprites).length, expected: EXPECTED_COUNTS.speciesSprites },
      { name: 'combatEffects', actual: Object.keys(combatEffects).length, expected: EXPECTED_COUNTS.combatEffects },
      { name: 'magicEffects', actual: Object.keys(magicEffects).length, expected: EXPECTED_COUNTS.magicEffects },
      { name: 'movementEffects', actual: Object.keys(movementEffects).length, expected: EXPECTED_COUNTS.movementEffects },
      { name: 'statusEffects', actual: Object.keys(statusEffects).length, expected: EXPECTED_COUNTS.statusEffects },
      { name: 'levelBadges', actual: Object.keys(levelBadges).length, expected: EXPECTED_COUNTS.levelBadges },
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...categoryData),
        (category) => {
          const matches = category.actual === category.expected;
          if (!matches) {
            console.log(`Category "${category.name}" has ${category.actual} items, expected ${category.expected}`);
          }
          return matches;
        }
      ),
      { numRuns: categoryData.length }
    );
  });
});
