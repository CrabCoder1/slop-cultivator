// Map Wave Configuration Types
// Defines types for map-specific wave configuration system

/**
 * Growth curve types for wave difficulty progression
 */
export type GrowthCurveType = 'linear' | 'exponential' | 'logarithmic';

/**
 * Map wave configuration (application format with camelCase)
 */
export interface MapWaveConfig {
  id: string;
  mapId: string;
  wave1SpendLimit: number;
  enemiesPerWave: number;
  growthCurveType: GrowthCurveType;
  allowedEnemyIds: string[]; // PersonType IDs with attacker configs
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map wave configuration database row (snake_case format)
 */
export interface MapWaveConfigRow {
  id: string;
  map_id: string;
  wave1_spend_limit: number;
  enemies_per_wave: number;
  growth_curve_type: string;
  allowed_enemy_ids: any; // JSONB
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wave spend calculation result
 */
export interface WaveSpendCalculation {
  waveNumber: number;
  spendLimit: number;
}

/**
 * Convert database row to application format
 */
export function mapWaveConfigFromRow(row: MapWaveConfigRow): MapWaveConfig {
  return {
    id: row.id,
    mapId: row.map_id,
    wave1SpendLimit: row.wave1_spend_limit,
    enemiesPerWave: row.enemies_per_wave,
    growthCurveType: row.growth_curve_type as GrowthCurveType,
    allowedEnemyIds: Array.isArray(row.allowed_enemy_ids) 
      ? row.allowed_enemy_ids 
      : [],
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert application format to database row format
 */
export function mapWaveConfigToRow(
  config: Omit<MapWaveConfig, 'id' | 'createdAt' | 'updatedAt'>
): Omit<MapWaveConfigRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    map_id: config.mapId,
    wave1_spend_limit: config.wave1SpendLimit,
    enemies_per_wave: config.enemiesPerWave,
    growth_curve_type: config.growthCurveType,
    allowed_enemy_ids: config.allowedEnemyIds,
    version: config.version,
  };
}
