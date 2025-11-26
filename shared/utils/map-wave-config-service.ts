/**
 * Map Wave Configuration Service
 * Handles CRUD operations and calculations for map-specific wave configurations
 */

import { supabase } from '../../game/utils/supabase/client';
import type { 
  MapWaveConfig, 
  MapWaveConfigRow,
  GrowthCurveType,
  WaveSpendCalculation 
} from '../types/map-wave-config';
import { 
  mapWaveConfigFromRow, 
  mapWaveConfigToRow 
} from '../types/map-wave-config';

/**
 * Get wave configuration for a specific map
 */
export async function getMapWaveConfig(
  mapId: string
): Promise<MapWaveConfig | null> {
  const { data, error } = await supabase
    .from('map_wave_configs')
    .select('*')
    .eq('map_id', mapId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load map wave config: ${error.message}`);
  }

  return data ? mapWaveConfigFromRow(data as MapWaveConfigRow) : null;
}

/**
 * Create or update wave configuration for a map
 */
export async function upsertMapWaveConfig(
  config: Omit<MapWaveConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MapWaveConfig> {
  // Validate before saving
  const validation = validateMapWaveConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  const row = mapWaveConfigToRow(config);

  const { data, error } = await supabase
    .from('map_wave_configs')
    .upsert(row, { onConflict: 'map_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save map wave config: ${error.message}`);
  }

  return mapWaveConfigFromRow(data as MapWaveConfigRow);
}

/**
 * Delete wave configuration for a map
 */
export async function deleteMapWaveConfig(mapId: string): Promise<void> {
  const { error } = await supabase
    .from('map_wave_configs')
    .delete()
    .eq('map_id', mapId);

  if (error) {
    throw new Error(`Failed to delete map wave config: ${error.message}`);
  }
}

/**
 * Calculate spend limit for a specific wave using growth curve
 */
export function calculateWaveSpendLimit(
  wave1SpendLimit: number,
  waveNumber: number,
  growthCurveType: GrowthCurveType
): number {
  if (waveNumber === 1) {
    return wave1SpendLimit;
  }

  const n = waveNumber;
  const base = wave1SpendLimit;

  switch (growthCurveType) {
    case 'linear':
      // Linear: spend = base * n
      return Math.round(base * n);

    case 'exponential':
      // Exponential: spend = base * (1.2 ^ (n - 1))
      return Math.round(base * Math.pow(1.2, n - 1));

    case 'logarithmic':
      // Logarithmic: spend = base * (1 + log2(n))
      return Math.round(base * (1 + Math.log2(n)));

    default:
      return base * n; // Fallback to linear
  }
}

/**
 * Calculate spend limits for multiple waves (for graph display)
 */
export function calculateWaveProgression(
  wave1SpendLimit: number,
  growthCurveType: GrowthCurveType,
  maxWaves: number = 20
): WaveSpendCalculation[] {
  const progression: WaveSpendCalculation[] = [];

  for (let wave = 1; wave <= maxWaves; wave++) {
    progression.push({
      waveNumber: wave,
      spendLimit: calculateWaveSpendLimit(
        wave1SpendLimit, 
        wave, 
        growthCurveType
      ),
    });
  }

  return progression;
}

/**
 * Validate map wave configuration
 */
export function validateMapWaveConfig(
  config: Omit<MapWaveConfig, 'id' | 'createdAt' | 'updatedAt'>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.wave1SpendLimit < 10) {
    errors.push('Wave 1 spend limit must be at least 10');
  }

  if (config.wave1SpendLimit > 10000) {
    errors.push('Wave 1 spend limit cannot exceed 10,000');
  }

  if (config.enemiesPerWave < 1) {
    errors.push('Enemies per wave must be at least 1');
  }

  if (config.enemiesPerWave > 100) {
    errors.push('Enemies per wave cannot exceed 100');
  }

  if (config.allowedEnemyIds.length === 0) {
    errors.push('At least one enemy type must be selected');
  }

  const validCurves: GrowthCurveType[] = ['linear', 'exponential', 'logarithmic'];
  if (!validCurves.includes(config.growthCurveType)) {
    errors.push(`Invalid growth curve type: ${config.growthCurveType}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const mapWaveConfigService = {
  getMapWaveConfig,
  upsertMapWaveConfig,
  deleteMapWaveConfig,
  calculateWaveSpendLimit,
  calculateWaveProgression,
  validateMapWaveConfig,
};
