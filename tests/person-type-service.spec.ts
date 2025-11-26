import { test, expect } from '@playwright/test';

/**
 * Integration tests for Person Type Service
 * Tests loading, caching, and adapter functions
 */

test.describe('Person Type Service', () => {
  test('should load person types from service', async () => {
    // Import the service dynamically to test in Node environment
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Verify we got results (either from DB or fallback)
    expect(personTypes).toBeDefined();
    expect(personTypes.length).toBeGreaterThan(0);
    
    // Verify structure of first person type
    const firstType = personTypes[0];
    expect(firstType).toHaveProperty('id');
    expect(firstType).toHaveProperty('key');
    expect(firstType).toHaveProperty('name');
    expect(firstType).toHaveProperty('emoji');
    expect(firstType).toHaveProperty('baseStats');
    expect(firstType.baseStats).toHaveProperty('health');
    expect(firstType.baseStats).toHaveProperty('damage');
    expect(firstType.baseStats).toHaveProperty('attackSpeed');
  });

  test('should cache person types', async () => {
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // First load (will populate cache)
    const firstLoad = await personTypeService.loadPersonTypes();
    expect(firstLoad.length).toBeGreaterThan(0);
    
    // Second load (should use cache if available)
    const secondLoad = await personTypeService.loadPersonTypes();
    
    // Verify same data returned
    expect(secondLoad.length).toBe(firstLoad.length);
    expect(secondLoad.length).toBeGreaterThan(0);
    
    // Verify data structure is consistent
    expect(secondLoad[0]).toHaveProperty('key');
    expect(secondLoad[0]).toHaveProperty('name');
    expect(secondLoad[0]).toHaveProperty('baseStats');
  });

  test('should get person type by key', async () => {
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load all types first
    const allTypes = await personTypeService.loadPersonTypes();
    expect(allTypes.length).toBeGreaterThan(0);
    
    // Get first type's key
    const testKey = allTypes[0].key;
    
    // Fetch by key
    const personType = await personTypeService.getPersonTypeByKey(testKey);
    
    // Verify we got the right one
    expect(personType).toBeDefined();
    expect(personType?.key).toBe(testKey);
  });

  test('should handle fallback to defaults', async () => {
    const { getDefaultPersonTypes } = await import('../shared/utils/person-type-adapters');
    
    // Get default person types
    const defaults = getDefaultPersonTypes();
    
    // Verify we have both cultivators and enemies
    expect(defaults.length).toBeGreaterThan(0);
    
    // Check for cultivators (should have defenderConfig)
    const defenders = defaults.filter(pt => pt.defenderConfig !== undefined);
    expect(defenders.length).toBeGreaterThan(0);
    
    // Check for enemies (should have attackerConfig)
    const attackers = defaults.filter(pt => pt.attackerConfig !== undefined);
    expect(attackers.length).toBeGreaterThan(0);
  });

  test('should convert cultivator to person type', async () => {
    const { convertCultivatorToPersonType } = await import('../shared/utils/person-type-adapters');
    
    // Convert sword cultivator
    const swordPersonType = convertCultivatorToPersonType('sword');
    
    // Verify structure
    expect(swordPersonType.key).toBe('sword_cultivator');
    expect(swordPersonType.name).toBe('Sword Cultivator');
    expect(swordPersonType.emoji).toBe('⚔️');
    expect(swordPersonType.defenderConfig).toBeDefined();
    expect(swordPersonType.defenderConfig?.deploymentCost).toBe(50);
    expect(swordPersonType.attackerConfig).toBeUndefined();
    
    // Verify base stats
    expect(swordPersonType.baseStats.health).toBe(100);
    expect(swordPersonType.baseStats.damage).toBe(20);
  });

  test('should convert enemy to person type', async () => {
    const { convertEnemyToPersonType } = await import('../shared/utils/person-type-adapters');
    
    // Convert demon enemy
    const demonPersonType = convertEnemyToPersonType('demon');
    
    // Verify structure
    expect(demonPersonType.key).toBe('demon_enemy');
    expect(demonPersonType.name).toBe('Crimson Demon');
    expect(demonPersonType.emoji).toBe('👹');
    expect(demonPersonType.attackerConfig).toBeDefined();
    expect(demonPersonType.attackerConfig?.reward).toBe(20);
    expect(demonPersonType.attackerConfig?.firstAppearance).toBe(1);
    expect(demonPersonType.defenderConfig).toBeUndefined();
    
    // Verify base stats
    expect(demonPersonType.baseStats.health).toBe(60);
    expect(demonPersonType.baseStats.movementSpeed).toBe(1.0);
  });
});
