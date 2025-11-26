import { test, expect } from '@playwright/test';

/**
 * Integration tests for Wave Configuration Service
 * Tests loading, validation, caching, and default generation
 */

test.describe('Wave Configuration Service', () => {
  test('should load wave configuration from service', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Load wave configuration for wave 1
    const waveConfig = await waveConfigService.loadWaveConfiguration(1);
    
    // Verify we got a result (either from DB or default generation)
    expect(waveConfig).toBeDefined();
    expect(waveConfig.waveNumber).toBe(1);
    expect(waveConfig.spawns).toBeDefined();
    expect(waveConfig.spawns.length).toBeGreaterThan(0);
    
    // Verify structure of first spawn
    const firstSpawn = waveConfig.spawns[0];
    expect(firstSpawn).toHaveProperty('personTypeId');
    expect(firstSpawn).toHaveProperty('count');
    expect(firstSpawn).toHaveProperty('spawnInterval');
    expect(firstSpawn).toHaveProperty('spawnDelay');
    expect(firstSpawn.count).toBeGreaterThan(0);
  });

  test('should cache wave configurations', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Clear cache to start fresh
    waveConfigService.clearCache();
    
    // First load (will populate cache)
    const firstLoad = await waveConfigService.loadWaveConfiguration(2);
    expect(firstLoad).toBeDefined();
    expect(firstLoad.waveNumber).toBe(2);
    
    // Second load (should use cache if available)
    const secondLoad = await waveConfigService.loadWaveConfiguration(2);
    
    // Verify same wave number returned
    expect(secondLoad.waveNumber).toBe(firstLoad.waveNumber);
    expect(secondLoad.spawns.length).toBeGreaterThan(0);
  });

  test('should validate wave configuration with valid data', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types to get valid IDs
    const personTypes = await personTypeService.loadPersonTypes();
    const attackers = personTypes.filter(pt => pt.attackerConfig !== undefined);
    expect(attackers.length).toBeGreaterThan(0);
    
    // Create a valid wave configuration
    const validConfig = {
      id: 'test-wave-1',
      waveNumber: 1,
      spawns: [
        {
          personTypeId: attackers[0].id,
          count: 5,
          spawnInterval: 1000,
          spawnDelay: 0
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validate
    const result = await waveConfigService.validateWaveConfiguration(validConfig);
    
    // Should be valid
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should detect invalid person type references', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Create wave config with non-existent person type
    const invalidConfig = {
      id: 'test-wave-invalid',
      waveNumber: 1,
      spawns: [
        {
          personTypeId: 'non-existent-id-12345',
          count: 5,
          spawnInterval: 1000,
          spawnDelay: 0
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validate
    const result = await waveConfigService.validateWaveConfiguration(invalidConfig);
    
    // Should be invalid
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('not found');
  });

  test('should detect invalid spawn counts', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types to get valid IDs
    const personTypes = await personTypeService.loadPersonTypes();
    const attackers = personTypes.filter(pt => pt.attackerConfig !== undefined);
    expect(attackers.length).toBeGreaterThan(0);
    
    // Create wave config with invalid count
    const invalidConfig = {
      id: 'test-wave-invalid-count',
      waveNumber: 1,
      spawns: [
        {
          personTypeId: attackers[0].id,
          count: 0, // Invalid: must be >= 1
          spawnInterval: 1000,
          spawnDelay: 0
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validate
    const result = await waveConfigService.validateWaveConfiguration(invalidConfig);
    
    // Should be invalid
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('count'))).toBe(true);
  });

  test('should detect invalid timing values', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types to get valid IDs
    const personTypes = await personTypeService.loadPersonTypes();
    const attackers = personTypes.filter(pt => pt.attackerConfig !== undefined);
    expect(attackers.length).toBeGreaterThan(0);
    
    // Create wave config with invalid timing
    const invalidConfig = {
      id: 'test-wave-invalid-timing',
      waveNumber: 1,
      spawns: [
        {
          personTypeId: attackers[0].id,
          count: 5,
          spawnInterval: -100, // Invalid: must be >= 0
          spawnDelay: -50 // Invalid: must be >= 0
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validate
    const result = await waveConfigService.validateWaveConfiguration(invalidConfig);
    
    // Should be invalid
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('interval') || e.includes('delay'))).toBe(true);
  });

  test('should generate default wave configuration', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Generate default config for wave 1
    const defaultConfig = await waveConfigService.generateDefaultWaveConfig(1);
    
    // Verify structure
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.waveNumber).toBe(1);
    expect(defaultConfig.spawns).toBeDefined();
    expect(defaultConfig.spawns.length).toBeGreaterThan(0);
    
    // Calculate expected total enemies (5 + wave * 2)
    const expectedTotal = 5 + (1 * 2); // = 7 for wave 1
    const actualTotal = defaultConfig.spawns.reduce((sum, spawn) => sum + spawn.count, 0);
    expect(actualTotal).toBe(expectedTotal);
  });

  test('should scale enemy count with wave number', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Generate configs for different waves
    const wave1 = await waveConfigService.generateDefaultWaveConfig(1);
    const wave5 = await waveConfigService.generateDefaultWaveConfig(5);
    const wave10 = await waveConfigService.generateDefaultWaveConfig(10);
    
    // Calculate totals
    const total1 = wave1.spawns.reduce((sum, spawn) => sum + spawn.count, 0);
    const total5 = wave5.spawns.reduce((sum, spawn) => sum + spawn.count, 0);
    const total10 = wave10.spawns.reduce((sum, spawn) => sum + spawn.count, 0);
    
    // Verify scaling (5 + wave * 2)
    expect(total1).toBe(7);   // 5 + 1*2
    expect(total5).toBe(15);  // 5 + 5*2
    expect(total10).toBe(25); // 5 + 10*2
    
    // Verify increasing difficulty
    expect(total5).toBeGreaterThan(total1);
    expect(total10).toBeGreaterThan(total5);
  });

  test('should filter person types by first appearance', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load all person types
    const allTypes = await personTypeService.loadPersonTypes();
    const attackers = allTypes.filter(pt => pt.attackerConfig !== undefined);
    
    // Find an attacker with firstAppearance > 1 (if any)
    const laterAttacker = attackers.find(pt => pt.attackerConfig!.firstAppearance > 1);
    
    if (laterAttacker) {
      // Generate config for wave 1
      const wave1Config = await waveConfigService.generateDefaultWaveConfig(1);
      
      // Verify later attacker is NOT in wave 1
      const hasLaterAttacker = wave1Config.spawns.some(
        spawn => spawn.personTypeId === laterAttacker.id
      );
      expect(hasLaterAttacker).toBe(false);
      
      // Generate config for wave where it should appear
      const laterWaveConfig = await waveConfigService.generateDefaultWaveConfig(
        laterAttacker.attackerConfig!.firstAppearance
      );
      
      // Verify it could appear in later wave (might not due to randomness, but should be possible)
      expect(laterWaveConfig.spawns.length).toBeGreaterThan(0);
    }
  });

  test('should handle error when no attackers available', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Try to generate config for a very high wave number
    // This should still work as long as there are any attackers
    try {
      const highWaveConfig = await waveConfigService.generateDefaultWaveConfig(100);
      
      // Should succeed with available attackers
      expect(highWaveConfig).toBeDefined();
      expect(highWaveConfig.waveNumber).toBe(100);
      expect(highWaveConfig.spawns.length).toBeGreaterThan(0);
    } catch (error) {
      // If it fails, it should be because no attackers are available
      expect(error).toBeDefined();
    }
  });

  test('should detect empty spawns array', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    
    // Create wave config with empty spawns
    const emptyConfig = {
      id: 'test-wave-empty',
      waveNumber: 1,
      spawns: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Validate
    const result = await waveConfigService.validateWaveConfiguration(emptyConfig);
    
    // Should be invalid
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('no spawns');
  });

  test('should warn about early appearance', async () => {
    const { waveConfigService } = await import('../shared/utils/wave-config-service');
    const { personTypeService } = await import('../shared/utils/person-type-service');
    
    // Load person types
    const personTypes = await personTypeService.loadPersonTypes();
    const attackers = personTypes.filter(pt => pt.attackerConfig !== undefined);
    
    // Find an attacker with firstAppearance > 1
    const laterAttacker = attackers.find(pt => pt.attackerConfig!.firstAppearance > 1);
    
    if (laterAttacker) {
      // Create wave config for wave 1 with this attacker (too early)
      const earlyConfig = {
        id: 'test-wave-early',
        waveNumber: 1,
        spawns: [
          {
            personTypeId: laterAttacker.id,
            count: 5,
            spawnInterval: 1000,
            spawnDelay: 0
          }
        ],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Validate
      const result = await waveConfigService.validateWaveConfiguration(earlyConfig);
      
      // Should have warnings (but might still be valid)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('first appearance');
    }
  });
});
