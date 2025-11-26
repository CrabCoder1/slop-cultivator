import { test, expect } from '@playwright/test';

/**
 * Unit tests for Map Wave Configuration Service
 * Tests growth curve calculations, validation logic, and type conversion
 */

test.describe('Map Wave Configuration Service - Growth Curves', () => {
  test('should calculate linear growth correctly', async () => {
    const { calculateWaveSpendLimit } = await import('../shared/utils/map-wave-config-service');
    
    const wave1SpendLimit = 100;
    
    // Test linear growth: spend = base * n
    expect(calculateWaveSpendLimit(wave1SpendLimit, 1, 'linear')).toBe(100);  // 100 * 1
    expect(calculateWaveSpendLimit(wave1SpendLimit, 5, 'linear')).toBe(500);  // 100 * 5
    expect(calculateWaveSpendLimit(wave1SpendLimit, 10, 'linear')).toBe(1000); // 100 * 10
    expect(calculateWaveSpendLimit(wave1SpendLimit, 20, 'linear')).toBe(2000); // 100 * 20
  });

  test('should calculate exponential growth correctly', async () => {
    const { calculateWaveSpendLimit } = await import('../shared/utils/map-wave-config-service');
    
    const wave1SpendLimit = 100;
    
    // Test exponential growth: spend = base * (1.2 ^ (n - 1))
    expect(calculateWaveSpendLimit(wave1SpendLimit, 1, 'exponential')).toBe(100);  // 100 * 1.2^0 = 100
    expect(calculateWaveSpendLimit(wave1SpendLimit, 2, 'exponential')).toBe(120);  // 100 * 1.2^1 = 120
    expect(calculateWaveSpendLimit(wave1SpendLimit, 5, 'exponential')).toBe(207);  // 100 * 1.2^4 ≈ 207
    expect(calculateWaveSpendLimit(wave1SpendLimit, 10, 'exponential')).toBe(516); // 100 * 1.2^9 ≈ 516
  });

  test('should calculate logarithmic growth correctly', async () => {
    const { calculateWaveSpendLimit } = await import('../shared/utils/map-wave-config-service');
    
    const wave1SpendLimit = 100;
    
    // Test logarithmic growth: spend = base * (1 + log2(n))
    expect(calculateWaveSpendLimit(wave1SpendLimit, 1, 'logarithmic')).toBe(100);  // 100 * (1 + 0) = 100
    expect(calculateWaveSpendLimit(wave1SpendLimit, 2, 'logarithmic')).toBe(200);  // 100 * (1 + 1) = 200
    expect(calculateWaveSpendLimit(wave1SpendLimit, 4, 'logarithmic')).toBe(300);  // 100 * (1 + 2) = 300
    expect(calculateWaveSpendLimit(wave1SpendLimit, 8, 'logarithmic')).toBe(400);  // 100 * (1 + 3) = 400
  });

  test('should always return wave1SpendLimit for wave 1', async () => {
    const { calculateWaveSpendLimit } = await import('../shared/utils/map-wave-config-service');
    
    // All curve types should return exact base value for wave 1
    expect(calculateWaveSpendLimit(100, 1, 'linear')).toBe(100);
    expect(calculateWaveSpendLimit(100, 1, 'exponential')).toBe(100);
    expect(calculateWaveSpendLimit(100, 1, 'logarithmic')).toBe(100);
    
    expect(calculateWaveSpendLimit(250, 1, 'linear')).toBe(250);
    expect(calculateWaveSpendLimit(250, 1, 'exponential')).toBe(250);
    expect(calculateWaveSpendLimit(250, 1, 'logarithmic')).toBe(250);
  });

  test('should generate wave progression array', async () => {
    const { calculateWaveProgression } = await import('../shared/utils/map-wave-config-service');
    
    const progression = calculateWaveProgression(100, 'linear', 20);
    
    // Verify array length
    expect(progression.length).toBe(20);
    
    // Verify structure
    expect(progression[0]).toHaveProperty('waveNumber');
    expect(progression[0]).toHaveProperty('spendLimit');
    
    // Verify wave numbers are sequential
    expect(progression[0].waveNumber).toBe(1);
    expect(progression[9].waveNumber).toBe(10);
    expect(progression[19].waveNumber).toBe(20);
    
    // Verify spend limits for linear growth
    expect(progression[0].spendLimit).toBe(100);
    expect(progression[4].spendLimit).toBe(500);
    expect(progression[9].spendLimit).toBe(1000);
  });

  test('should generate custom length wave progression', async () => {
    const { calculateWaveProgression } = await import('../shared/utils/map-wave-config-service');
    
    const progression10 = calculateWaveProgression(100, 'linear', 10);
    const progression30 = calculateWaveProgression(100, 'linear', 30);
    
    expect(progression10.length).toBe(10);
    expect(progression30.length).toBe(30);
  });
});

test.describe('Map Wave Configuration Service - Validation', () => {
  test('should validate correct configuration', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const validConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 10,
      growthCurveType: 'linear' as const,
      allowedEnemyIds: ['enemy-1', 'enemy-2'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(validConfig);
    
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should reject spend limit below minimum', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 5, // Below minimum of 10
      enemiesPerWave: 10,
      growthCurveType: 'linear' as const,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('at least 10'))).toBe(true);
  });

  test('should reject spend limit above maximum', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 15000, // Above maximum of 10000
      enemiesPerWave: 10,
      growthCurveType: 'linear' as const,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('cannot exceed 10,000'))).toBe(true);
  });

  test('should reject enemies per wave below minimum', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 0, // Below minimum of 1
      growthCurveType: 'linear' as const,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('at least 1'))).toBe(true);
  });

  test('should reject enemies per wave above maximum', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 150, // Above maximum of 100
      growthCurveType: 'linear' as const,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('cannot exceed 100'))).toBe(true);
  });

  test('should reject empty enemy allowlist', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 10,
      growthCurveType: 'linear' as const,
      allowedEnemyIds: [], // Empty array
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.toLowerCase().includes('enemy'))).toBe(true);
  });

  test('should reject invalid growth curve type', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 10,
      growthCurveType: 'invalid-curve' as any,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Invalid growth curve type'))).toBe(true);
  });

  test('should accept all valid growth curve types', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const baseConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 100,
      enemiesPerWave: 10,
      allowedEnemyIds: ['enemy-1'],
      version: 1,
    };
    
    const linearResult = mapWaveConfigService.validateMapWaveConfig({
      ...baseConfig,
      growthCurveType: 'linear' as const,
    });
    expect(linearResult.isValid).toBe(true);
    
    const exponentialResult = mapWaveConfigService.validateMapWaveConfig({
      ...baseConfig,
      growthCurveType: 'exponential' as const,
    });
    expect(exponentialResult.isValid).toBe(true);
    
    const logarithmicResult = mapWaveConfigService.validateMapWaveConfig({
      ...baseConfig,
      growthCurveType: 'logarithmic' as const,
    });
    expect(logarithmicResult.isValid).toBe(true);
  });

  test('should collect multiple validation errors', async () => {
    const { mapWaveConfigService } = await import('../shared/utils/map-wave-config-service');
    
    const invalidConfig = {
      mapId: 'test-map-id',
      wave1SpendLimit: 5, // Too low
      enemiesPerWave: 0, // Too low
      growthCurveType: 'linear' as const,
      allowedEnemyIds: [], // Empty
      version: 1,
    };
    
    const result = mapWaveConfigService.validateMapWaveConfig(invalidConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(3); // Three errors
  });
});

test.describe('Map Wave Configuration Service - Type Conversion', () => {
  test('should convert database row to application format', async () => {
    const { mapWaveConfigFromRow } = await import('../shared/types/map-wave-config');
    
    const row = {
      id: 'test-id',
      map_id: 'map-123',
      wave1_spend_limit: 100,
      enemies_per_wave: 10,
      growth_curve_type: 'linear',
      allowed_enemy_ids: ['enemy-1', 'enemy-2'],
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    const config = mapWaveConfigFromRow(row);
    
    expect(config.id).toBe('test-id');
    expect(config.mapId).toBe('map-123');
    expect(config.wave1SpendLimit).toBe(100);
    expect(config.enemiesPerWave).toBe(10);
    expect(config.growthCurveType).toBe('linear');
    expect(config.allowedEnemyIds).toEqual(['enemy-1', 'enemy-2']);
    expect(config.version).toBe(1);
    expect(config.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(config.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  test('should handle empty allowed_enemy_ids array', async () => {
    const { mapWaveConfigFromRow } = await import('../shared/types/map-wave-config');
    
    const row = {
      id: 'test-id',
      map_id: 'map-123',
      wave1_spend_limit: 100,
      enemies_per_wave: 10,
      growth_curve_type: 'linear',
      allowed_enemy_ids: [],
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    const config = mapWaveConfigFromRow(row);
    
    expect(config.allowedEnemyIds).toEqual([]);
  });

  test('should handle non-array allowed_enemy_ids', async () => {
    const { mapWaveConfigFromRow } = await import('../shared/types/map-wave-config');
    
    const row = {
      id: 'test-id',
      map_id: 'map-123',
      wave1_spend_limit: 100,
      enemies_per_wave: 10,
      growth_curve_type: 'linear',
      allowed_enemy_ids: null, // Non-array value
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    const config = mapWaveConfigFromRow(row);
    
    expect(config.allowedEnemyIds).toEqual([]);
  });

  test('should convert application format to database row', async () => {
    const { mapWaveConfigToRow } = await import('../shared/types/map-wave-config');
    
    const config = {
      mapId: 'map-123',
      wave1SpendLimit: 100,
      enemiesPerWave: 10,
      growthCurveType: 'exponential' as const,
      allowedEnemyIds: ['enemy-1', 'enemy-2', 'enemy-3'],
      version: 1,
    };
    
    const row = mapWaveConfigToRow(config);
    
    expect(row.map_id).toBe('map-123');
    expect(row.wave1_spend_limit).toBe(100);
    expect(row.enemies_per_wave).toBe(10);
    expect(row.growth_curve_type).toBe('exponential');
    expect(row.allowed_enemy_ids).toEqual(['enemy-1', 'enemy-2', 'enemy-3']);
    expect(row.version).toBe(1);
  });

  test('should perform round-trip conversion', async () => {
    const { mapWaveConfigFromRow, mapWaveConfigToRow } = await import('../shared/types/map-wave-config');
    
    const originalRow = {
      id: 'test-id',
      map_id: 'map-456',
      wave1_spend_limit: 250,
      enemies_per_wave: 15,
      growth_curve_type: 'logarithmic',
      allowed_enemy_ids: ['enemy-a', 'enemy-b'],
      version: 2,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    };
    
    // Convert to application format
    const config = mapWaveConfigFromRow(originalRow);
    
    // Convert back to row format
    const newRow = mapWaveConfigToRow(config);
    
    // Verify data integrity (excluding id, created_at, updated_at)
    expect(newRow.map_id).toBe(originalRow.map_id);
    expect(newRow.wave1_spend_limit).toBe(originalRow.wave1_spend_limit);
    expect(newRow.enemies_per_wave).toBe(originalRow.enemies_per_wave);
    expect(newRow.growth_curve_type).toBe(originalRow.growth_curve_type);
    expect(newRow.allowed_enemy_ids).toEqual(originalRow.allowed_enemy_ids);
    expect(newRow.version).toBe(originalRow.version);
  });
});
