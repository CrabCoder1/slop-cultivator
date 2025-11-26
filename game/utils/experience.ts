// Experience and leveling system for cultivators

import type { EntityInstance } from '../../shared/types/person-types';

export const MAX_LEVEL = 10;
export const LEVEL_STAT_BONUS = 0.1; // 10% bonus per level

// Calculate XP required for next level
export function getXPForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Calculate total XP required to reach a level
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Get XP reward for killing an enemy (EntityInstance version)
export function getXPRewardForEntity(defeatedEntity: EntityInstance, wave: number): number {
  // If the entity has attacker config with a reward, use that
  // Otherwise fall back to type-based lookup for backward compatibility
  let baseXP = 20; // Default
  
  // Try to get XP from entity's attacker config (if available from Person Type)
  // For now, use type-based lookup as fallback
  const typeXP: Record<string, number> = {
    demon: 20,
    shadow: 15,
    beast: 30,
    wraith: 25,
    golem: 35,
    dragon: 50,
  };
  
  baseXP = typeXP[defeatedEntity.personTypeKey] || 20;
  
  // XP scales with wave (5% per wave)
  const waveMultiplier = 1 + (wave * 0.05);
  
  return Math.floor(baseXP * waveMultiplier);
}

// Get XP reward for killing an enemy (backward compatibility)
export function getXPReward(enemyType: string, wave: number): number {
  const baseXP: Record<string, number> = {
    demon: 20,
    shadow: 15,
    beast: 30,
    wraith: 25,
    golem: 35,
    dragon: 50,
  };
  
  const xp = baseXP[enemyType] || 20;
  
  // XP scales with wave (5% per wave)
  const waveMultiplier = 1 + (wave * 0.05);
  
  return Math.floor(xp * waveMultiplier);
}

// Check if cultivator leveled up and return new level (EntityInstance version)
export function checkLevelUpForEntity(entity: EntityInstance): number {
  if (!entity.defenderState) return 1; // Non-defenders don't level up
  
  const { level, experience } = entity.defenderState;
  
  if (level >= MAX_LEVEL) return level;
  
  const xpNeeded = getXPForLevel(level);
  
  if (experience >= xpNeeded) {
    return level + 1;
  }
  
  return level;
}

// Check if cultivator leveled up and return new level (backward compatibility)
export function checkLevelUp(currentLevel: number, currentXP: number): number {
  if (currentLevel >= MAX_LEVEL) return currentLevel;
  
  const xpNeeded = getXPForLevel(currentLevel);
  
  if (currentXP >= xpNeeded) {
    return currentLevel + 1;
  }
  
  return currentLevel;
}

// Calculate stat with level bonus
export function applyLevelBonus(baseStat: number, level: number): number {
  const levelBonus = (level - 1) * LEVEL_STAT_BONUS;
  return Math.floor(baseStat * (1 + levelBonus));
}

// Get progress percentage to next level
export function getLevelProgress(level: number, currentXP: number): number {
  if (level >= MAX_LEVEL) return 100;
  
  const xpNeeded = getXPForLevel(level);
  return Math.min(100, (currentXP / xpNeeded) * 100);
}

// Get level badge color
export function getLevelBadgeColor(level: number): string {
  if (level >= 10) return '#f97316'; // orange-500 (legendary)
  if (level >= 7) return '#a855f7'; // purple-500 (epic)
  if (level >= 4) return '#3b82f6'; // blue-500 (rare)
  return '#9ca3af'; // gray-400 (common)
}

// Get level badge emoji
export function getLevelBadgeEmoji(level: number): string {
  if (level >= 10) return '👑'; // Max level
  if (level >= 7) return '⭐'; // High level
  if (level >= 4) return '✨'; // Mid level
  return '🌟'; // Low level
}
