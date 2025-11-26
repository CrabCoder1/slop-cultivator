// Composition System Type Definitions
// This file defines the core types for the cultivator composition system

/**
 * Species Definition
 * Represents the biological or species type of an entity (e.g., "Human", "Demon", "Beast")
 * Defines base physical characteristics
 */
export interface Species {
  id: string; // UUID
  key: string; // Unique identifier (e.g., 'human', 'demon')
  name: string; // Display name
  emoji: string; // Visual representation
  description: string; // Short description
  lore?: string; // Optional backstory
  
  // Base physical stats
  baseStats: {
    health: number; // Base HP
    movementSpeed: number; // Pixels per frame
  };
  
  // Metadata
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dao Definition
 * Represents a cultivation path or martial discipline (e.g., "Sword Dao", "Palm Dao")
 * Defines combat style and abilities
 */
export interface Dao {
  id: string; // UUID
  key: string; // Unique identifier (e.g., 'sword_dao', 'palm_dao')
  name: string; // Display name (e.g., "Sword Dao")
  emoji: string; // Visual representation
  description: string; // Short description
  lore?: string; // Optional backstory
  
  // Combat stats
  combatStats: {
    damage: number; // Base damage
    attackSpeed: number; // Milliseconds between attacks
    range: number; // Attack range in pixels
    attackPattern: 'melee' | 'ranged' | 'aoe'; // Attack type
  };
  
  // Compatible skills for this dao
  compatibleSkills: string[]; // Skill IDs
  
  // Metadata
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Title Definition
 * Represents an achievement or rank designation (e.g., "Palm Sage", "Sword Cultivator")
 * Provides stat bonuses
 */
export interface Title {
  id: string; // UUID
  key: string; // Unique identifier (e.g., 'palm_sage', 'sword_cultivator')
  name: string; // Display name (e.g., "Palm Sage")
  emoji: string; // Visual representation
  description: string; // Short description
  
  // Stat bonuses (multipliers and flat bonuses)
  statBonuses: {
    healthMultiplier?: number; // e.g., 1.2 = +20% health
    damageMultiplier?: number; // e.g., 1.5 = +50% damage
    attackSpeedMultiplier?: number; // e.g., 0.8 = 20% faster attacks
    rangeBonus?: number; // Flat bonus to range in pixels
    movementSpeedMultiplier?: number; // e.g., 1.1 = +10% movement
  };
  
  // Prestige level (for UI sorting/display)
  prestigeLevel: number; // 1-10
  
  // Metadata
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Achievement Condition
 * Defines a requirement that must be met to unlock an achievement
 */
export interface AchievementCondition {
  type: 'wave_complete' | 'cultivator_deploy_count' | 'enemy_defeat_count' | 
        'score_threshold' | 'castle_health_preserved' | 'win_without_damage';
  targetValue: number; // The value that must be reached
  comparisonOperator: 'equals' | 'greater_than' | 'less_than' | 'greater_or_equal';
  
  // For progress tracking
  isTrackable: boolean; // Can we show progress?
  progressLabel?: string; // e.g., "Enemies Defeated"
}

/**
 * Achievement Reward
 * Defines benefits granted when an achievement is unlocked
 */
export interface AchievementReward {
  type: 'unlock_species' | 'unlock_dao' | 'unlock_title' | 'grant_qi' | 'unlock_cosmetic';
  value: string | number; // ID for unlocks, amount for currency
  displayName: string; // For UI display
}

/**
 * Achievement Definition
 * Represents a goal or milestone that players can unlock
 */
export interface Achievement {
  id: string; // UUID
  key: string; // Unique identifier (e.g., 'wave_10_complete')
  name: string; // Display name (e.g., "Wave Master")
  emoji: string; // Visual representation
  description: string; // What the player accomplished
  
  // Unlock conditions (all must be met)
  conditions: AchievementCondition[];
  
  // Rewards granted on unlock
  rewards: AchievementReward[];
  
  // Display order
  sortOrder: number;
  
  // Metadata
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Player Profile
 * Persistent record of player data including statistics and unlocked content
 */
export interface PlayerProfile {
  id: string; // UUID
  anonymousId: string; // Browser-based ID for anonymous players
  
  // Statistics
  stats: {
    totalGamesPlayed: number;
    highestWave: number;
    highestScore: number;
    totalEnemiesDefeated: number;
    totalCultivatorsDeployed: number;
  };
  
  // Unlocked content
  unlockedSpecies: string[]; // Species IDs
  unlockedDaos: string[]; // Dao IDs
  unlockedTitles: string[]; // Title IDs
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Player Achievement
 * Tracks individual achievement progress and unlock status for a player
 */
export interface PlayerAchievement {
  id: string; // UUID
  playerId: string; // Player profile ID
  achievementId: string; // Achievement ID
  
  // Progress tracking
  progress: Record<string, number>; // condition index -> current value
  isUnlocked: boolean;
  unlockedAt?: string; // ISO timestamp
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Composed Cultivator Stats
 * Final calculated stats after combining Species + Dao + Title
 */
export interface ComposedCultivatorStats {
  health: number;
  damage: number;
  attackSpeed: number;
  range: number;
  movementSpeed: number;
  emoji: string;
  displayName: string;
}
