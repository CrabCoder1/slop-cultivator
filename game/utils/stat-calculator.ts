// Stat calculator - combines base stats, level bonuses, skills, and items

import { calculateSkillBonuses } from './skills';
import { calculateItemBonuses } from './items';
import { applyLevelBonus } from './experience';
import type { Tower } from '../App';
import type { EntityInstance } from '../../shared/types/person-types';

export interface CalculatedStats {
  damage: number;
  attackSpeed: number;
  range: number;
  health: number;
  maxHealth: number;
}

// Calculate final stats for an EntityInstance (defender) with all bonuses applied
export function calculateEntityStats(entity: EntityInstance): CalculatedStats {
  if (!entity.defenderState) {
    // For non-defenders, return current stats as-is
    return {
      damage: entity.damage,
      attackSpeed: entity.attackSpeed,
      range: entity.range,
      health: entity.health,
      maxHealth: entity.maxHealth,
    };
  }

  const { level, equippedSkills, inventory } = entity.defenderState;
  
  // Base stats come from the entity's current stats (which are initialized from Person Type)
  const baseStats = {
    damage: entity.damage,
    attackSpeed: entity.attackSpeed,
    range: entity.range,
    health: entity.maxHealth,
  };
  
  // Step 1: Apply level bonuses to base stats
  const levelBoostedDamage = applyLevelBonus(baseStats.damage, level);
  const levelBoostedAttackSpeed = applyLevelBonus(baseStats.attackSpeed, level);
  const levelBoostedRange = applyLevelBonus(baseStats.range, level);
  const levelBoostedHealth = applyLevelBonus(baseStats.health, level);
  
  // Step 2: Apply skill bonuses
  const damageWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedDamage, 'damage');
  const attackSpeedWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedAttackSpeed, 'attackSpeed');
  const rangeWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedRange, 'range');
  const healthWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedHealth, 'health');
  
  // Step 3: Apply item bonuses
  const finalDamage = Math.floor(calculateItemBonuses(inventory, damageWithSkills, 'damage'));
  const finalAttackSpeed = Math.floor(calculateItemBonuses(inventory, attackSpeedWithSkills, 'attackSpeed'));
  const finalRange = Math.floor(calculateItemBonuses(inventory, rangeWithSkills, 'range'));
  const finalHealth = Math.floor(calculateItemBonuses(inventory, healthWithSkills, 'health'));
  
  return {
    damage: finalDamage,
    attackSpeed: finalAttackSpeed,
    range: finalRange,
    health: finalHealth,
    maxHealth: finalHealth,
  };
}

// Calculate final stats for a tower with all bonuses applied
// Backward compatibility wrapper for Tower interface
export function calculateTowerStats(tower: Tower): CalculatedStats {
  const { baseStats, level, equippedSkills, inventory } = tower;
  
  // Step 1: Apply level bonuses to base stats
  const levelBoostedDamage = applyLevelBonus(baseStats.damage, level);
  const levelBoostedAttackSpeed = applyLevelBonus(baseStats.attackSpeed, level);
  const levelBoostedRange = applyLevelBonus(baseStats.range, level);
  const levelBoostedHealth = applyLevelBonus(baseStats.health, level);
  
  // Step 2: Apply skill bonuses
  const damageWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedDamage, 'damage');
  const attackSpeedWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedAttackSpeed, 'attackSpeed');
  const rangeWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedRange, 'range');
  const healthWithSkills = calculateSkillBonuses(equippedSkills, levelBoostedHealth, 'health');
  
  // Step 3: Apply item bonuses
  const finalDamage = Math.floor(calculateItemBonuses(inventory, damageWithSkills, 'damage'));
  const finalAttackSpeed = Math.floor(calculateItemBonuses(inventory, attackSpeedWithSkills, 'attackSpeed'));
  const finalRange = Math.floor(calculateItemBonuses(inventory, rangeWithSkills, 'range'));
  const finalHealth = Math.floor(calculateItemBonuses(inventory, healthWithSkills, 'health'));
  
  return {
    damage: finalDamage,
    attackSpeed: finalAttackSpeed,
    range: finalRange,
    health: finalHealth,
    maxHealth: finalHealth,
  };
}

// Get stat difference for preview (e.g., when hovering over an item/skill)
export function getStatDifference(
  currentStats: CalculatedStats,
  newStats: CalculatedStats
): Partial<Record<keyof CalculatedStats, number>> {
  return {
    damage: newStats.damage - currentStats.damage,
    attackSpeed: newStats.attackSpeed - currentStats.attackSpeed,
    range: newStats.range - currentStats.range,
    health: newStats.health - currentStats.health,
    maxHealth: newStats.maxHealth - currentStats.maxHealth,
  };
}

// Format stat change for display (e.g., "+50" or "-20")
export function formatStatChange(value: number): string {
  if (value === 0) return '±0';
  return value > 0 ? `+${value}` : `${value}`;
}

// Get stat change color class
export function getStatChangeColor(value: number): string {
  if (value === 0) return 'text-gray-400';
  return value > 0 ? 'text-green-400' : 'text-red-400';
}
