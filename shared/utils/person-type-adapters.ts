import type { PersonType } from '../types/person-types';
import { CultivatorTypes, type CultivatorType } from '../../game/utils/cultivator';
import { ENEMY_CODEX, type EnemyType } from '../../game/utils/enemy-codex';
import { getSkillsForType } from '../../game/utils/skills';
import { getAllItems } from '../../game/utils/items';

/**
 * Adapter functions for backward compatibility
 * Converts old cultivator and enemy formats to Person Type format
 */

/**
 * Convert old cultivator format to Person Type
 */
export function convertCultivatorToPersonType(
  key: keyof typeof CultivatorTypes,
  gridSize: number = 30
): PersonType {
  const cultivator = CultivatorTypes[key];
  
  // Get compatible skills for this cultivator type
  const compatibleSkills = getSkillsForType(key as CultivatorType).map(skill => skill.id);
  
  // All items are compatible with all cultivators for now
  const compatibleItems = getAllItems().map(item => item.id);
  
  return {
    id: `cultivator_${key}`, // Temporary ID for fallback
    key: `${key}_cultivator`,
    name: cultivator.name,
    emoji: cultivator.emoji,
    description: cultivator.description,
    lore: undefined,
    baseStats: {
      health: cultivator.maxHealth,
      damage: cultivator.damage,
      attackSpeed: cultivator.attackSpeed,
      range: cultivator.getRangeInPixels(gridSize),
      movementSpeed: 1.0, // Default movement speed
    },
    defenderConfig: {
      deploymentCost: cultivator.cost,
      compatibleSkills,
      compatibleItems,
    },
    attackerConfig: undefined,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert old enemy format to Person Type
 */
export function convertEnemyToPersonType(enemyType: EnemyType): PersonType {
  const enemy = ENEMY_CODEX[enemyType];
  
  return {
    id: `enemy_${enemyType}`, // Temporary ID for fallback
    key: `${enemyType}_enemy`,
    name: enemy.name,
    emoji: enemy.emoji,
    description: enemy.description,
    lore: enemy.lore,
    baseStats: {
      health: enemy.baseStats.health,
      damage: 10, // Default damage for enemies
      attackSpeed: 1000, // Default attack speed
      range: 30, // Default melee range
      movementSpeed: enemy.baseStats.speed,
    },
    defenderConfig: undefined,
    attackerConfig: {
      reward: enemy.baseStats.reward,
      spawnWeight: 5, // Default spawn weight
      firstAppearance: enemy.firstAppearance,
      difficulty: enemy.difficulty,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get default Person Types as fallback when database is unavailable
 * Combines converted cultivators and enemies
 */
export function getDefaultPersonTypes(): PersonType[] {
  const cultivatorKeys = Object.keys(CultivatorTypes) as (keyof typeof CultivatorTypes)[];
  const enemyKeys = Object.keys(ENEMY_CODEX) as EnemyType[];
  
  const cultivatorPersonTypes = cultivatorKeys.map(key => 
    convertCultivatorToPersonType(key)
  );
  
  const enemyPersonTypes = enemyKeys.map(key => 
    convertEnemyToPersonType(key)
  );
  
  return [...cultivatorPersonTypes, ...enemyPersonTypes];
}

/**
 * Get default defender Person Types (cultivators only)
 */
export function getDefaultDefenders(): PersonType[] {
  const cultivatorKeys = Object.keys(CultivatorTypes) as (keyof typeof CultivatorTypes)[];
  return cultivatorKeys.map(key => convertCultivatorToPersonType(key));
}

/**
 * Get default attacker Person Types (enemies only)
 */
export function getDefaultAttackers(): PersonType[] {
  const enemyKeys = Object.keys(ENEMY_CODEX) as EnemyType[];
  return enemyKeys.map(key => convertEnemyToPersonType(key));
}
