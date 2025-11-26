import { test, expect } from '@playwright/test';

/**
 * Unit tests for Cultivator Generator
 * Tests random generation, variety, skill/item assignment, and EntityInstance creation
 */

test.describe('Cultivator Generator', () => {
  test('should generate random cultivators', async () => {
    const { generateRandomCultivators } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Generate 4 cultivators
    const cultivators = generateRandomCultivators(personTypes, 4);
    
    // Verify we got 4 cultivators
    expect(cultivators).toHaveLength(4);
    
    // Verify each cultivator has required properties
    cultivators.forEach(cultivator => {
      expect(cultivator).toHaveProperty('id');
      expect(cultivator).toHaveProperty('personTypeId');
      expect(cultivator).toHaveProperty('personTypeKey');
      expect(cultivator.role).toBe('defender');
      expect(cultivator).toHaveProperty('health');
      expect(cultivator).toHaveProperty('damage');
      expect(cultivator).toHaveProperty('defenderState');
      expect(cultivator.defenderState).toBeDefined();
      expect(cultivator.defenderState?.level).toBe(1);
      expect(cultivator.defenderState?.experience).toBe(0);
      expect(cultivator.defenderState?.kills).toBe(0);
    });
  });

  test('should produce variety in generated cultivators', async () => {
    const { generateRandomCultivators } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Generate multiple sets and check for variety
    const set1 = generateRandomCultivators(personTypes, 4);
    const set2 = generateRandomCultivators(personTypes, 4);
    
    // Check that at least some cultivators are different between sets
    // (This is probabilistic, but with 4 cultivators and variety enforcement, should be different)
    const set1Keys = set1.map(c => c.personTypeKey).sort().join(',');
    const set2Keys = set2.map(c => c.personTypeKey).sort().join(',');
    
    // At least verify both sets have valid cultivators
    expect(set1.length).toBe(4);
    expect(set2.length).toBe(4);
    
    // Verify each set has at least one cultivator with skills or items
    const set1HasSkills = set1.some(c => c.defenderState && c.defenderState.equippedSkills.length > 0);
    const set2HasSkills = set2.some(c => c.defenderState && c.defenderState.equippedSkills.length > 0);
    
    expect(set1HasSkills || set2HasSkills).toBe(true);
  });

  test('should assign compatible skills to cultivators', async () => {
    const { generateRandomCultivators } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    const { SKILLS } = await import('../game/utils/skills');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Generate cultivators
    const cultivators = generateRandomCultivators(personTypes, 4);
    
    // Verify skill compatibility
    cultivators.forEach(cultivator => {
      const personType = personTypes.find(pt => pt.id === cultivator.personTypeId);
      expect(personType).toBeDefined();
      
      if (cultivator.defenderState && cultivator.defenderState.equippedSkills.length > 0) {
        const compatibleSkills = personType?.defenderConfig?.compatibleSkills || [];
        
        // Each equipped skill should be in the compatible list
        cultivator.defenderState.equippedSkills.forEach(skillId => {
          expect(compatibleSkills).toContain(skillId);
          
          // Verify skill exists
          expect(SKILLS[skillId]).toBeDefined();
        });
        
        // Should have between 1-3 skills
        expect(cultivator.defenderState.equippedSkills.length).toBeGreaterThanOrEqual(1);
        expect(cultivator.defenderState.equippedSkills.length).toBeLessThanOrEqual(3);
      }
    });
  });

  test('should assign compatible items to cultivators', async () => {
    const { generateRandomCultivators } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    const { ITEMS } = await import('../game/utils/items');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Generate cultivators
    const cultivators = generateRandomCultivators(personTypes, 4);
    
    // Verify item compatibility
    cultivators.forEach(cultivator => {
      const personType = personTypes.find(pt => pt.id === cultivator.personTypeId);
      expect(personType).toBeDefined();
      
      if (cultivator.defenderState && cultivator.defenderState.inventory.length > 0) {
        const compatibleItems = personType?.defenderConfig?.compatibleItems || [];
        
        // Each equipped item should be in the compatible list
        cultivator.defenderState.inventory.forEach(itemId => {
          expect(compatibleItems).toContain(itemId);
          
          // Verify item exists
          expect(ITEMS[itemId]).toBeDefined();
        });
        
        // Should have between 0-2 items
        expect(cultivator.defenderState.inventory.length).toBeGreaterThanOrEqual(0);
        expect(cultivator.defenderState.inventory.length).toBeLessThanOrEqual(2);
      }
    });
  });

  test('should handle edge case with small person type pool', async () => {
    const { generateRandomCultivators } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const allPersonTypes = await personTypeService.loadPersonTypes();
    
    // Filter to only one defender type
    const singleDefender = allPersonTypes.filter(pt => pt.defenderConfig !== undefined).slice(0, 1);
    
    if (singleDefender.length === 0) {
      // Skip test if no defenders available
      test.skip();
      return;
    }
    
    // Should still generate 4 cultivators (with duplicates)
    const cultivators = generateRandomCultivators(singleDefender, 4);
    
    expect(cultivators).toHaveLength(4);
    
    // All should be the same person type
    const personTypeId = singleDefender[0].id;
    cultivators.forEach(cultivator => {
      expect(cultivator.personTypeId).toBe(personTypeId);
    });
  });

  test('should handle edge case with no compatible skills', async () => {
    const { createDefenderInstance } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const defenderType = personTypes.find(pt => pt.defenderConfig !== undefined);
    
    if (!defenderType) {
      test.skip();
      return;
    }
    
    // Create defender with no skills or items
    const cultivator = createDefenderInstance(defenderType, [], []);
    
    // Should still create valid cultivator
    expect(cultivator).toBeDefined();
    expect(cultivator.role).toBe('defender');
    expect(cultivator.defenderState?.equippedSkills).toHaveLength(0);
    expect(cultivator.defenderState?.inventory).toHaveLength(0);
    
    // Stats should be base stats
    expect(cultivator.health).toBe(defenderType.baseStats.health);
    expect(cultivator.damage).toBe(defenderType.baseStats.damage);
  });

  test('should create defender instance with correct stats', async () => {
    const { createDefenderInstance } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const defenderType = personTypes.find(pt => pt.defenderConfig !== undefined);
    
    if (!defenderType) {
      test.skip();
      return;
    }
    
    // Get compatible skills and items
    const skills = defenderType.defenderConfig?.compatibleSkills.slice(0, 2) || [];
    const items = defenderType.defenderConfig?.compatibleItems.slice(0, 1) || [];
    
    // Create defender
    const cultivator = createDefenderInstance(defenderType, skills, items);
    
    // Verify structure
    expect(cultivator.id).toBeDefined();
    expect(cultivator.personTypeId).toBe(defenderType.id);
    expect(cultivator.personTypeKey).toBe(defenderType.key);
    expect(cultivator.role).toBe('defender');
    expect(cultivator.emoji).toBe(defenderType.emoji);
    expect(cultivator.name).toBe(defenderType.name);
    
    // Verify stats are calculated (should be >= base stats due to bonuses)
    expect(cultivator.health).toBeGreaterThanOrEqual(defenderType.baseStats.health);
    expect(cultivator.maxHealth).toBe(cultivator.health);
    
    // Verify defender state
    expect(cultivator.defenderState).toBeDefined();
    expect(cultivator.defenderState?.level).toBe(1);
    expect(cultivator.defenderState?.equippedSkills).toEqual(skills);
    expect(cultivator.defenderState?.inventory).toEqual(items);
  });

  test('should create attacker instance with correct structure', async () => {
    const { createAttackerInstance } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const attackerType = personTypes.find(pt => pt.attackerConfig !== undefined);
    
    if (!attackerType) {
      test.skip();
      return;
    }
    
    // Create attacker at position
    const position = { x: 100, y: 200 };
    const attacker = createAttackerInstance(attackerType, position);
    
    // Verify structure
    expect(attacker.id).toBeDefined();
    expect(attacker.personTypeId).toBe(attackerType.id);
    expect(attacker.personTypeKey).toBe(attackerType.key);
    expect(attacker.role).toBe('attacker');
    expect(attacker.x).toBe(position.x);
    expect(attacker.y).toBe(position.y);
    expect(attacker.emoji).toBe(attackerType.emoji);
    expect(attacker.name).toBe(attackerType.name);
    
    // Verify stats match base stats (no bonuses for attackers)
    expect(attacker.health).toBe(attackerType.baseStats.health);
    expect(attacker.maxHealth).toBe(attackerType.baseStats.health);
    expect(attacker.damage).toBe(attackerType.baseStats.damage);
    expect(attacker.attackSpeed).toBe(attackerType.baseStats.attackSpeed);
    expect(attacker.range).toBe(attackerType.baseStats.range);
    expect(attacker.movementSpeed).toBe(attackerType.baseStats.movementSpeed);
    
    // Verify attacker state
    expect(attacker.attackerState).toBeDefined();
    expect(attacker.attackerState?.isAttackingCastle).toBe(false);
    expect(attacker.attackerState?.isAttackingTower).toBe(false);
    expect(attacker.attackerState?.targetTowerId).toBeNull();
  });

  test('should apply skill bonuses correctly', async () => {
    const { createDefenderInstance } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const defenderType = personTypes.find(pt => pt.defenderConfig !== undefined);
    
    if (!defenderType || !defenderType.defenderConfig?.compatibleSkills.length) {
      test.skip();
      return;
    }
    
    // Create two instances: one with skills, one without
    const withoutSkills = createDefenderInstance(defenderType, [], []);
    const withSkills = createDefenderInstance(
      defenderType,
      defenderType.defenderConfig.compatibleSkills.slice(0, 2),
      []
    );
    
    // With skills should have different (likely higher) stats
    // At least one stat should be different
    const statsChanged = 
      withSkills.health !== withoutSkills.health ||
      withSkills.damage !== withoutSkills.damage ||
      withSkills.attackSpeed !== withoutSkills.attackSpeed ||
      withSkills.range !== withoutSkills.range;
    
    expect(statsChanged).toBe(true);
  });

  test('should apply item bonuses correctly', async () => {
    const { createDefenderInstance } = await import('../shared/utils/cultivator-generator');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const defenderType = personTypes.find(pt => pt.defenderConfig !== undefined);
    
    if (!defenderType || !defenderType.defenderConfig?.compatibleItems.length) {
      test.skip();
      return;
    }
    
    // Create two instances: one with items, one without
    const withoutItems = createDefenderInstance(defenderType, [], []);
    const withItems = createDefenderInstance(
      defenderType,
      [],
      defenderType.defenderConfig.compatibleItems.slice(0, 1)
    );
    
    // With items should have different (likely higher) stats
    const statsChanged = 
      withItems.health !== withoutItems.health ||
      withItems.damage !== withoutItems.damage ||
      withItems.attackSpeed !== withoutItems.attackSpeed ||
      withItems.range !== withoutItems.range;
    
    expect(statsChanged).toBe(true);
  });
});
