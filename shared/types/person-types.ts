/**
 * Person Type System - Type Definitions
 * 
 * These types match the Supabase database schema for person_types and wave_configurations tables.
 * See: supabase/migrations/20241117000001_create_person_types_table.sql
 */

/**
 * Base stats applicable to all Person Types (both defenders and attackers)
 */
export interface BaseStats {
  health: number;
  damage: number;
  attackSpeed: number; // milliseconds between attacks
  range: number; // in pixels
  movementSpeed: number; // pixels per frame
}

/**
 * Configuration specific to defender-capable Person Types
 */
export interface DefenderConfig {
  deploymentCost: number; // Qi cost to deploy
  compatibleSkills: string[]; // Skill IDs this type can learn
  compatibleItems: string[]; // Item IDs this type can equip
}

/**
 * Configuration specific to attacker-capable Person Types
 */
export interface AttackerConfig {
  reward: number; // Qi reward for defeating
  spawnWeight: number; // Relative probability in wave (1-10)
  firstAppearance: number; // Wave number when first available
  difficulty: 'common' | 'uncommon' | 'rare' | 'elite' | 'boss';
}

/**
 * Person Type definition (matches database schema)
 */
export interface PersonType {
  id: string; // UUID from database
  key: string; // Unique identifier (e.g., 'sword_cultivator', 'crimson_demon')
  name: string; // Display name
  emoji: string; // Visual representation
  description: string; // Short description
  lore?: string; // Optional backstory
  
  baseStats: BaseStats; // Core combat stats
  defenderConfig?: DefenderConfig; // Defender-specific attributes (optional)
  attackerConfig?: AttackerConfig; // Attacker-specific attributes (optional)
  
  // Composition system references (optional)
  speciesId?: string; // Reference to species table
  daoId?: string; // Reference to daos table
  titleId?: string; // Reference to titles table
  
  version: number; // Schema version for migrations
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Database row format (snake_case from Supabase)
 */
export interface PersonTypeRow {
  id: string;
  key: string;
  name: string;
  emoji: string;
  description: string;
  lore: string | null;
  base_stats: BaseStats;
  defender_config: DefenderConfig | null;
  attacker_config: AttackerConfig | null;
  species_id?: string | null; // Composition system
  dao_id?: string | null; // Composition system
  title_id?: string | null; // Composition system
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wave spawn definition
 */
export interface WaveSpawn {
  personTypeId: string; // UUID reference to person_types.id
  count: number; // How many to spawn
  spawnInterval: number; // Milliseconds between spawns
  spawnDelay: number; // Delay before first spawn (milliseconds)
}

/**
 * Wave configuration definition (matches database schema)
 */
export interface WaveConfiguration {
  id: string; // UUID from database
  waveNumber: number; // Which wave this applies to
  spawns: WaveSpawn[]; // List of spawn groups
  version: number; // Schema version for migrations
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Database row format (snake_case from Supabase)
 */
export interface WaveConfigurationRow {
  id: string;
  wave_number: number;
  spawns: WaveSpawn[];
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to convert database row to PersonType
 */
export function personTypeFromRow(row: PersonTypeRow): PersonType {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    lore: row.lore || undefined,
    baseStats: row.base_stats,
    defenderConfig: row.defender_config || undefined,
    attackerConfig: row.attacker_config || undefined,
    speciesId: row.species_id || undefined,
    daoId: row.dao_id || undefined,
    titleId: row.title_id || undefined,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Helper function to convert PersonType to database row format
 */
export function personTypeToRow(personType: Omit<PersonType, 'id' | 'createdAt' | 'updatedAt'>): Omit<PersonTypeRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    key: personType.key,
    name: personType.name,
    emoji: personType.emoji,
    description: personType.description,
    lore: personType.lore || null,
    base_stats: personType.baseStats,
    defender_config: personType.defenderConfig || null,
    attacker_config: personType.attackerConfig || null,
    version: personType.version,
  };
}

/**
 * Helper function to convert database row to WaveConfiguration
 */
export function waveConfigFromRow(row: WaveConfigurationRow): WaveConfiguration {
  return {
    id: row.id,
    waveNumber: row.wave_number,
    spawns: row.spawns,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Helper function to convert WaveConfiguration to database row format
 */
export function waveConfigToRow(config: Omit<WaveConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Omit<WaveConfigurationRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    wave_number: config.waveNumber,
    spawns: config.spawns,
    version: config.version,
  };
}

/**
 * Validation result for wave configurations
 */
export interface WaveConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation error types
 */
export type WaveConfigValidationError = 
  | 'MISSING_PERSON_TYPE'
  | 'INVALID_SPAWN_COUNT'
  | 'INVALID_TIMING'
  | 'EMPTY_SPAWNS'
  | 'INVALID_WAVE_NUMBER';

/**
 * Detailed validation error
 */
export interface WaveConfigValidationDetail {
  type: WaveConfigValidationError;
  message: string;
  spawnIndex?: number;
  personTypeId?: string;
}

/**
 * Person Type role in the game
 */
export type PersonTypeRole = 'defender' | 'attacker';

/**
 * Defender-specific runtime state
 */
export interface DefenderState {
  level: number; // 1-10
  experience: number;
  kills: number;
  equippedSkills: string[]; // Skill IDs (max 3)
  inventory: string[]; // Item IDs (max 3)
}

/**
 * Attacker-specific runtime state
 */
export interface AttackerState {
  isAttackingCastle: boolean;
  isAttackingTower: boolean;
  targetTowerId: string | null;
  lastCastleAttack: number;
  lastTowerAttack: number;
  attackBounceProgress: number;
}

/**
 * Entity Instance - Runtime representation of a Person Type in the game
 */
export interface EntityInstance {
  id: string; // Unique runtime ID
  personTypeId?: string; // Reference to Person Type (UUID) - optional for composition system
  personTypeKey: string; // Reference to Person Type key for quick lookup
  role: PersonTypeRole; // Current role in game
  
  // Position and movement
  x: number;
  y: number;
  path?: { x: number; y: number }[]; // For attackers
  currentPathIndex?: number;
  
  // Combat state
  health: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  range: number;
  lastAttack: number;
  movementSpeed: number;
  
  // Visual
  emoji: string;
  name: string;
  
  // Role-specific runtime state
  defenderState?: DefenderState;
  attackerState?: AttackerState;
  
  // Composition system references (optional, used when entity is created via composition)
  compositionRefs?: {
    speciesId: string;
    daoId: string;
    titleId: string;
  };
}
