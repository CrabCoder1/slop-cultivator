import { test, expect } from '@playwright/test';
import type { Species, Dao, Title } from '../shared/types/composition-types';

/**
 * Unit tests for Cultivator Composition Service
 * Tests stat calculation, validation, and skill compatibility
 */

test.describe('Cultivator Composition Service', () => {
  // Test data
  const mockSpecies: Species = {
    id: 'species-1',
    key: 'human',
    name: 'Human',
    emoji: '👤',
    description: 'A human cultivator',
    baseStats: {
      health: 100,
      movementSpeed: 1.5
    },
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockDao: Dao = {
    id: 'dao-1',
    key: 'sword_dao',
    name: 'Sword Dao',
    emoji: '⚔️',
    description: 'The way of the sword',
    combatStats: {
      damage: 20,
      attackSpeed: 1000,
      range: 50,
      attackPattern: 'melee'
    },
    compatibleSkills: ['skill-1', 'skill-2', 'skill-3'],
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockTitle: Title = {
    id: 'title-1',
    key: 'sword_master',
    name: 'Sword Master',
    emoji: '🗡️',
    description: 'Master of the sword',
    statBonuses: {
      healthMultiplier: 1.2,
      damageMultiplier: 1.5,
      attackSpeedMultiplier: 0.8,
      rangeBonus: 10,
      movementSpeedMultiplier: 1.1
    },
    prestigeLevel: 5,
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  test('should compose cultivator stats correctly', async () => {
    const { composeCultivatorStats } = await import('../shared/utils/cultivator-composition-service');
    
    const result = composeCultivatorStats(mockSpecies, mockDao, mockTitle);
    
    // Verify health calculation: 100 * 1.2 = 120
    expect(result.health).toBe(120);
    
    // Verify damage calculation: 20 * 1.5 = 30
    expect(result.damage).toBe(30);
    
    // Verify attack speed calculation: 1000 * 0.8 = 800
    expect(result.attackSpeed).toBe(800);
    
    // Verify range calculation: 50 + 10 = 60
    expect(result.range).toBe(60);
    
    // Verify movement speed calculation: 1.5 * 1.1 = 1.65
    expect(result.movementSpeed).toBe(1.65);
    
    // Verify display name format
    expect(result.displayName).toBe('Sword Master (Human)');
    
    // Verify emoji uses species emoji
    expect(result.emoji).toBe('👤');
  });

  test('should handle title with no multipliers', async () => {
    const { composeCultivatorStats } = await import('../shared/utils/cultivator-composition-service');
    
    const titleNoBonus: Title = {
      ...mockTitle,
      statBonuses: {}
    };
    
    const result = composeCultivatorStats(mockSpecies, mockDao, titleNoBonus);
    
    // Stats should match base values without multipliers
    expect(result.health).toBe(100);
    expect(result.damage).toBe(20);
    expect(result.attackSpeed).toBe(1000);
    expect(result.range).toBe(50);
    expect(result.movementSpeed).toBe(1.5);
  });

  test('should handle title with partial multipliers', async () => {
    const { composeCultivatorStats } = await import('../shared/utils/cultivator-composition-service');
    
    const titlePartial: Title = {
      ...mockTitle,
      statBonuses: {
        healthMultiplier: 2.0,
        damageMultiplier: 1.5
        // No other multipliers
      }
    };
    
    const result = composeCultivatorStats(mockSpecies, mockDao, titlePartial);
    
    // Only health and damage should be multiplied
    expect(result.health).toBe(200); // 100 * 2.0
    expect(result.damage).toBe(30); // 20 * 1.5
    expect(result.attackSpeed).toBe(1000); // No multiplier
    expect(result.range).toBe(50); // No bonus
    expect(result.movementSpeed).toBe(1.5); // No multiplier
  });

  test('should validate composition with all components', async () => {
    const { validateComposition } = await import('../shared/utils/cultivator-composition-service');
    
    // Should not throw with all components present
    expect(() => {
      validateComposition(mockSpecies, mockDao, mockTitle);
    }).not.toThrow();
  });

  test('should throw error when species is missing', async () => {
    const { validateComposition, CompositionValidationError } = await import('../shared/utils/cultivator-composition-service');
    
    expect(() => {
      validateComposition(null, mockDao, mockTitle);
    }).toThrow(CompositionValidationError);
    
    try {
      validateComposition(null, mockDao, mockTitle);
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionValidationError);
      expect((error as Error).message).toContain('Species');
    }
  });

  test('should throw error when dao is missing', async () => {
    const { validateComposition, CompositionValidationError } = await import('../shared/utils/cultivator-composition-service');
    
    expect(() => {
      validateComposition(mockSpecies, null, mockTitle);
    }).toThrow(CompositionValidationError);
    
    try {
      validateComposition(mockSpecies, null, mockTitle);
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionValidationError);
      expect((error as Error).message).toContain('Dao');
    }
  });

  test('should throw error when title is missing', async () => {
    const { validateComposition, CompositionValidationError } = await import('../shared/utils/cultivator-composition-service');
    
    expect(() => {
      validateComposition(mockSpecies, mockDao, null);
    }).toThrow(CompositionValidationError);
    
    try {
      validateComposition(mockSpecies, mockDao, null);
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionValidationError);
      expect((error as Error).message).toContain('Title');
    }
  });

  test('should throw error when multiple components are missing', async () => {
    const { validateComposition, CompositionValidationError } = await import('../shared/utils/cultivator-composition-service');
    
    expect(() => {
      validateComposition(null, null, mockTitle);
    }).toThrow(CompositionValidationError);
    
    try {
      validateComposition(null, null, mockTitle);
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionValidationError);
      expect((error as Error).message).toContain('Species');
      expect((error as Error).message).toContain('Dao');
    }
  });

  test('should validate compatible skills', async () => {
    const { validateSkillCompatibility } = await import('../shared/utils/cultivator-composition-service');
    
    const equippedSkills = ['skill-1', 'skill-2'];
    const result = validateSkillCompatibility(mockDao, equippedSkills);
    
    expect(result.isValid).toBe(true);
    expect(result.incompatibleSkills).toHaveLength(0);
  });

  test('should detect incompatible skills', async () => {
    const { validateSkillCompatibility } = await import('../shared/utils/cultivator-composition-service');
    
    const equippedSkills = ['skill-1', 'skill-99', 'skill-100'];
    const result = validateSkillCompatibility(mockDao, equippedSkills);
    
    expect(result.isValid).toBe(false);
    expect(result.incompatibleSkills).toHaveLength(2);
    expect(result.incompatibleSkills).toContain('skill-99');
    expect(result.incompatibleSkills).toContain('skill-100');
  });

  test('should handle empty skill list', async () => {
    const { validateSkillCompatibility } = await import('../shared/utils/cultivator-composition-service');
    
    const result = validateSkillCompatibility(mockDao, []);
    
    expect(result.isValid).toBe(true);
    expect(result.incompatibleSkills).toHaveLength(0);
  });

  test('should handle all incompatible skills', async () => {
    const { validateSkillCompatibility } = await import('../shared/utils/cultivator-composition-service');
    
    const equippedSkills = ['invalid-1', 'invalid-2', 'invalid-3'];
    const result = validateSkillCompatibility(mockDao, equippedSkills);
    
    expect(result.isValid).toBe(false);
    expect(result.incompatibleSkills).toHaveLength(3);
  });

  test('should round stats appropriately', async () => {
    const { composeCultivatorStats } = await import('../shared/utils/cultivator-composition-service');
    
    const speciesDecimal: Species = {
      ...mockSpecies,
      baseStats: {
        health: 105.7,
        movementSpeed: 1.567
      }
    };
    
    const titleDecimal: Title = {
      ...mockTitle,
      statBonuses: {
        healthMultiplier: 1.33,
        movementSpeedMultiplier: 1.11
      }
    };
    
    const result = composeCultivatorStats(speciesDecimal, mockDao, titleDecimal);
    
    // Health should be rounded to integer
    expect(Number.isInteger(result.health)).toBe(true);
    
    // Movement speed should be rounded to 2 decimals
    expect(result.movementSpeed).toBe(1.74); // 1.567 * 1.11 = 1.73937 -> 1.74
  });
});
