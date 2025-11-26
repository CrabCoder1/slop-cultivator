import { supabase } from '../../game/utils/supabase/client';
import type { 
  WaveConfiguration, 
  WaveConfigurationRow, 
  WaveSpawn,
  WaveConfigValidationResult,
  PersonType
} from '../types/person-types';
import { waveConfigFromRow } from '../types/person-types';
import { personTypeService } from './person-type-service';

/**
 * Wave Configuration Service for Supabase operations
 * Handles loading, caching, and validation of Wave Configurations
 */

class WaveConfigService {
  private cache: Map<number, WaveConfiguration> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load Wave Configuration for a specific wave number
   * Uses caching to avoid repeated database calls
   * Falls back to default wave generation if not found or on error
   */
  async loadWaveConfiguration(waveNumber: number): Promise<WaveConfiguration> {
    // Check cache first
    if (this.isCacheValid() && this.cache.has(waveNumber)) {
      return this.cache.get(waveNumber)!;
    }

    try {
      const { data, error } = await supabase
        .from('wave_configurations')
        .select('*')
        .eq('wave_number', waveNumber)
        .single();

      if (error) {
        // Not found is expected for waves without custom configs
        if (error.code === 'PGRST116') {
          console.log(`No custom configuration for wave ${waveNumber}, using default generation`);
          return this.generateDefaultWaveConfig(waveNumber);
        }
        throw error;
      }

      if (!data) {
        console.log(`No configuration found for wave ${waveNumber}, using default generation`);
        return this.generateDefaultWaveConfig(waveNumber);
      }

      const waveConfig = waveConfigFromRow(data as WaveConfigurationRow);
      
      // Validate the configuration
      const validation = await this.validateWaveConfiguration(waveConfig);
      if (!validation.isValid) {
        console.error(`Wave ${waveNumber} configuration is invalid:`, validation.errors);
        console.warn('Falling back to default wave generation');
        return this.generateDefaultWaveConfig(waveNumber);
      }

      if (validation.warnings.length > 0) {
        console.warn(`Wave ${waveNumber} configuration warnings:`, validation.warnings);
      }

      // Cache the validated configuration
      this.cache.set(waveNumber, waveConfig);
      this.cacheTimestamp = Date.now();

      return waveConfig;
    } catch (error) {
      console.error(`Error loading wave configuration for wave ${waveNumber}:`, error);
      console.warn('Falling back to default wave generation');
      return this.generateDefaultWaveConfig(waveNumber);
    }
  }

  /**
   * Validate a Wave Configuration
   * Checks that all referenced Person Types exist and have attacker configs
   * Validates spawn counts and timing values
   */
  async validateWaveConfiguration(config: WaveConfiguration): Promise<WaveConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate wave number
    if (config.waveNumber < 1) {
      errors.push(`Invalid wave number: ${config.waveNumber} (must be >= 1)`);
    }

    // Validate spawns array
    if (!config.spawns || config.spawns.length === 0) {
      errors.push('Wave configuration has no spawns defined');
      return { isValid: false, errors, warnings };
    }

    // Load all person types for validation
    const personTypes = await personTypeService.loadPersonTypes();
    const personTypeMap = new Map<string, PersonType>();
    personTypes.forEach(pt => personTypeMap.set(pt.id, pt));

    // Validate each spawn
    for (let i = 0; i < config.spawns.length; i++) {
      const spawn = config.spawns[i];

      // Check if person type exists
      const personType = personTypeMap.get(spawn.personTypeId);
      if (!personType) {
        errors.push(`Spawn ${i}: Person Type ID "${spawn.personTypeId}" not found`);
        continue;
      }

      // Check if person type has attacker config
      if (!personType.attackerConfig) {
        errors.push(`Spawn ${i}: Person Type "${personType.name}" (${personType.key}) does not have attacker configuration`);
      }

      // Check if person type should appear in this wave
      if (personType.attackerConfig && personType.attackerConfig.firstAppearance > config.waveNumber) {
        warnings.push(
          `Spawn ${i}: Person Type "${personType.name}" first appearance is wave ${personType.attackerConfig.firstAppearance}, ` +
          `but it's configured for wave ${config.waveNumber}`
        );
      }

      // Validate spawn count
      if (spawn.count < 1) {
        errors.push(`Spawn ${i}: Invalid count ${spawn.count} (must be >= 1)`);
      }

      // Validate timing
      if (spawn.spawnInterval < 0) {
        errors.push(`Spawn ${i}: Invalid spawn interval ${spawn.spawnInterval} (must be >= 0)`);
      }

      if (spawn.spawnDelay < 0) {
        errors.push(`Spawn ${i}: Invalid spawn delay ${spawn.spawnDelay} (must be >= 0)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate default wave configuration based on wave number
   * Uses existing spawn logic: 5 + wave * 2 enemies, random selection
   * Filters Person Types by firstAppearance wave number
   */
  async generateDefaultWaveConfig(waveNumber: number): Promise<WaveConfiguration> {
    // Load all person types
    const personTypes = await personTypeService.loadPersonTypes();
    
    // Filter to attackers that should appear by this wave
    const availableAttackers = personTypes.filter(pt => 
      pt.attackerConfig && 
      pt.attackerConfig.firstAppearance <= waveNumber
    );

    if (availableAttackers.length === 0) {
      console.error(`No attackers available for wave ${waveNumber}`);
      throw new Error(`Cannot generate wave ${waveNumber}: no attackers available`);
    }

    // Calculate total enemies for this wave (5 + wave * 2)
    const totalEnemies = 5 + (waveNumber * 2);

    // Create weighted pool based on spawn weights
    const weightedPool: PersonType[] = [];
    availableAttackers.forEach(pt => {
      const weight = pt.attackerConfig!.spawnWeight;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(pt);
      }
    });

    // Randomly select person types for spawns
    const spawns: WaveSpawn[] = [];
    const spawnCounts = new Map<string, number>();

    for (let i = 0; i < totalEnemies; i++) {
      const randomIndex = Math.floor(Math.random() * weightedPool.length);
      const selectedType = weightedPool[randomIndex];
      
      const currentCount = spawnCounts.get(selectedType.id) || 0;
      spawnCounts.set(selectedType.id, currentCount + 1);
    }

    // Convert counts to spawn definitions
    spawnCounts.forEach((count, personTypeId) => {
      spawns.push({
        personTypeId,
        count,
        spawnInterval: 1000, // 1 second between spawns
        spawnDelay: 0 // No delay
      });
    });

    // Create wave configuration
    const config: WaveConfiguration = {
      id: `default-wave-${waveNumber}`,
      waveNumber,
      spawns,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return config;
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (this.cache.size === 0) {
      return false;
    }
    
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }
}

// Export singleton instance
export const waveConfigService = new WaveConfigService();
