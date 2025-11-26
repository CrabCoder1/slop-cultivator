/**
 * Cultivator Generator - Random cultivator generation for game start
 * 
 * Generates random cultivators with varied Person Types, skills, and items
 * to provide gameplay variety at the start of each game session.
 * 
 * Now supports composition system: Species + Dao + Title
 */

import type { PersonType, EntityInstance } from '../types/person-types';
import type { Species, Dao, Title } from '../types/composition-types';
import { SKILLS, type Skill } from '../../game/utils/skills';
import { ITEMS, type Item } from '../../game/utils/items';
import { composeCultivatorStats } from './cultivator-composition-service';

/**
 * Configuration for cultivator generation
 */
export interface CultivatorGenerationConfig {
  minSkills: number; // Minimum skills per cultivator
  maxSkills: number; // Maximum skills per cultivator
  minItems: number; // Minimum items per cultivator
  maxItems: number; // Maximum items per cultivator
  ensureVariety: boolean; // Whether to avoid duplicate combinations
}

/**
 * Default generation configuration
 */
export const DEFAULT_GENERATION_CONFIG: CultivatorGenerationConfig = {
  minSkills: 1,
  maxSkills: 3,
  minItems: 0,
  maxItems: 2,
  ensureVariety: true,
};

/**
 * Tracks used combinations to ensure variety
 */
interface UsedCombination {
  personTypeId: string;
  skillIds: string[];
  itemIds: string[];
}

/**
 * Generate random cultivators for game start
 * 
 * @param personTypes - Available Person Types with defender_config
 * @param count - Number of cultivators to generate
 * @param config - Generation configuration (optional)
 * @returns Array of EntityInstance objects configured as defenders
 */
export function generateRandomCultivators(
  personTypes: PersonType[],
  count: number,
  config: CultivatorGenerationConfig = DEFAULT_GENERATION_CONFIG
): EntityInstance[] {
  // Filter to only defender-capable Person Types
  const defenderTypes = personTypes.filter(pt => pt.defenderConfig !== undefined);
  
  if (defenderTypes.length === 0) {
    throw new Error('No defender-capable Person Types available for generation');
  }

  const cultivators: EntityInstance[] = [];
  const usedCombinations: UsedCombination[] = [];

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    let cultivator: EntityInstance | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      // Randomly select a Person Type
      const personType = selectRandomPersonType(defenderTypes);
      
      // Randomly assign skills
      const skills = selectRandomSkills(
        personType,
        config.minSkills,
        config.maxSkills
      );
      
      // Randomly assign items
      const items = selectRandomItems(
        personType,
        config.minItems,
        config.maxItems
      );

      // Check if this combination is unique (if variety is required)
      if (config.ensureVariety && usedCombinations.length > 0) {
        const isDuplicate = usedCombinations.some(combo =>
          combo.personTypeId === personType.id &&
          arraysEqual(combo.skillIds, skills) &&
          arraysEqual(combo.itemIds, items)
        );

        if (isDuplicate && attempts < maxAttempts) {
          continue; // Try again with different combination
        }
      }

      // Create the cultivator
      cultivator = createDefenderInstance(personType, skills, items);
      
      // Track this combination
      usedCombinations.push({
        personTypeId: personType.id,
        skillIds: skills,
        itemIds: items,
      });

      break;
    }

    if (!cultivator) {
      // Fallback: create without variety check
      const personType = selectRandomPersonType(defenderTypes);
      const skills = selectRandomSkills(personType, config.minSkills, config.maxSkills);
      const items = selectRandomItems(personType, config.minItems, config.maxItems);
      cultivator = createDefenderInstance(personType, skills, items);
    }

    cultivators.push(cultivator);
  }

  return cultivators;
}

/**
 * Randomly select a Person Type from available defender types
 */
function selectRandomPersonType(defenderTypes: PersonType[]): PersonType {
  const randomIndex = Math.floor(Math.random() * defenderTypes.length);
  return defenderTypes[randomIndex];
}

/**
 * Randomly select skills compatible with the Person Type
 * 
 * @param personType - The Person Type to select skills for
 * @param minSkills - Minimum number of skills
 * @param maxSkills - Maximum number of skills
 * @returns Array of skill IDs
 */
function selectRandomSkills(
  personType: PersonType,
  minSkills: number,
  maxSkills: number
): string[] {
  if (!personType.defenderConfig) {
    return [];
  }

  const compatibleSkills = personType.defenderConfig.compatibleSkills;
  
  if (compatibleSkills.length === 0) {
    return [];
  }

  // Determine how many skills to assign
  const skillCount = Math.floor(
    Math.random() * (maxSkills - minSkills + 1)
  ) + minSkills;

  // Cap at available skills
  const actualCount = Math.min(skillCount, compatibleSkills.length);

  // Randomly select skills without duplicates
  const shuffled = [...compatibleSkills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
}

/**
 * Randomly select items compatible with the Person Type
 * 
 * @param personType - The Person Type to select items for
 * @param minItems - Minimum number of items
 * @param maxItems - Maximum number of items
 * @returns Array of item IDs
 */
function selectRandomItems(
  personType: PersonType,
  minItems: number,
  maxItems: number
): string[] {
  if (!personType.defenderConfig) {
    return [];
  }

  const compatibleItems = personType.defenderConfig.compatibleItems;
  
  if (compatibleItems.length === 0) {
    return [];
  }

  // Determine how many items to assign
  const itemCount = Math.floor(
    Math.random() * (maxItems - minItems + 1)
  ) + minItems;

  // Cap at available items
  const actualCount = Math.min(itemCount, compatibleItems.length);

  // Randomly select items without duplicates
  const shuffled = [...compatibleItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
}

/**
 * Create a defender EntityInstance from a Person Type with skills and items
 * 
 * @param personType - The Person Type template
 * @param skillIds - Array of skill IDs to equip
 * @param itemIds - Array of item IDs to equip
 * @returns EntityInstance configured as a defender
 */
export function createDefenderInstance(
  personType: PersonType,
  skillIds: string[],
  itemIds: string[]
): EntityInstance {
  if (!personType.defenderConfig) {
    throw new Error(`Person Type "${personType.key}" does not have defender configuration`);
  }

  // Generate unique runtime ID
  const id = `defender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate stats with skill and item bonuses
  const stats = calculateDefenderStats(personType, skillIds, itemIds);

  return {
    id,
    personTypeId: personType.id,
    personTypeKey: personType.key,
    role: 'defender',
    
    // Position (will be set when deployed)
    x: 0,
    y: 0,
    
    // Combat state
    health: stats.health,
    maxHealth: stats.health,
    damage: stats.damage,
    attackSpeed: stats.attackSpeed,
    range: stats.range,
    movementSpeed: stats.movementSpeed,
    lastAttack: 0,
    
    // Visual
    emoji: personType.emoji,
    name: personType.name,
    
    // Defender-specific state
    defenderState: {
      level: 1,
      experience: 0,
      kills: 0,
      equippedSkills: skillIds,
      inventory: itemIds,
    },
  };
}

/**
 * Create an attacker EntityInstance from a Person Type
 * 
 * @param personType - The Person Type template
 * @param position - Initial spawn position
 * @returns EntityInstance configured as an attacker
 */
export function createAttackerInstance(
  personType: PersonType,
  position: { x: number; y: number }
): EntityInstance {
  if (!personType.attackerConfig) {
    throw new Error(`Person Type "${personType.key}" does not have attacker configuration`);
  }

  // Generate unique runtime ID
  const id = `attacker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    personTypeId: personType.id,
    personTypeKey: personType.key,
    role: 'attacker',
    
    // Position
    x: position.x,
    y: position.y,
    
    // Combat state (use base stats directly)
    health: personType.baseStats.health,
    maxHealth: personType.baseStats.health,
    damage: personType.baseStats.damage,
    attackSpeed: personType.baseStats.attackSpeed,
    range: personType.baseStats.range,
    movementSpeed: personType.baseStats.movementSpeed,
    lastAttack: 0,
    
    // Visual
    emoji: personType.emoji,
    name: personType.name,
    
    // Attacker-specific state
    attackerState: {
      isAttackingCastle: false,
      isAttackingTower: false,
      targetTowerId: null,
      lastCastleAttack: 0,
      lastTowerAttack: 0,
      attackBounceProgress: 0,
    },
  };
}

/**
 * Calculate defender stats with skill and item bonuses applied
 */
function calculateDefenderStats(
  personType: PersonType,
  skillIds: string[],
  itemIds: string[]
): {
  health: number;
  damage: number;
  attackSpeed: number;
  range: number;
  movementSpeed: number;
} {
  let health = personType.baseStats.health;
  let damage = personType.baseStats.damage;
  let attackSpeed = personType.baseStats.attackSpeed;
  let range = personType.baseStats.range;
  let movementSpeed = personType.baseStats.movementSpeed;

  // Apply skill bonuses
  skillIds.forEach(skillId => {
    const skill = SKILLS[skillId];
    if (!skill) return;

    skill.effects.forEach(effect => {
      switch (effect.stat) {
        case 'health':
          health += effect.value;
          if (effect.multiplier) health *= (1 + effect.multiplier);
          break;
        case 'damage':
          damage += effect.value;
          if (effect.multiplier) damage *= (1 + effect.multiplier);
          break;
        case 'attackSpeed':
          attackSpeed += effect.value;
          if (effect.multiplier) attackSpeed *= (1 + effect.multiplier);
          break;
        case 'range':
          range += effect.value;
          if (effect.multiplier) range *= (1 + effect.multiplier);
          break;
      }
    });
  });

  // Apply item bonuses
  itemIds.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;

    item.effects.forEach(effect => {
      switch (effect.stat) {
        case 'health':
          health += effect.value;
          if (effect.multiplier) health *= (1 + effect.multiplier);
          break;
        case 'damage':
          damage += effect.value;
          if (effect.multiplier) damage *= (1 + effect.multiplier);
          break;
        case 'attackSpeed':
          attackSpeed += effect.value;
          if (effect.multiplier) attackSpeed *= (1 + effect.multiplier);
          break;
        case 'range':
          range += effect.value;
          if (effect.multiplier) range *= (1 + effect.multiplier);
          break;
      }
    });
  });

  return {
    health: Math.round(health),
    damage: Math.round(damage),
    attackSpeed: Math.round(attackSpeed),
    range: Math.round(range),
    movementSpeed,
  };
}

/**
 * Helper function to compare arrays for equality
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

/**
 * Generate random cultivators using the composition system (Species + Dao + Title)
 * 
 * @param species - Available species
 * @param daos - Available daos
 * @param titles - Available titles
 * @param count - Number of cultivators to generate
 * @returns Array of EntityInstance objects configured as defenders
 */
export function generateRandomCultivatorsWithComposition(
  species: Species[],
  daos: Dao[],
  titles: Title[],
  count: number
): EntityInstance[] {
  if (species.length === 0 || daos.length === 0 || titles.length === 0) {
    throw new Error('Cannot generate cultivators: need at least one species, dao, and title');
  }

  const cultivators: EntityInstance[] = [];
  const usedCombinations = new Set<string>();

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    const maxAttempts = 50;
    let cultivator: EntityInstance | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      // Randomly select Species, Dao, and Title
      const selectedSpecies = species[Math.floor(Math.random() * species.length)];
      const selectedDao = daos[Math.floor(Math.random() * daos.length)];
      const selectedTitle = titles[Math.floor(Math.random() * titles.length)];

      // Create combination key for variety checking
      const combinationKey = `${selectedSpecies.id}_${selectedDao.id}_${selectedTitle.id}`;

      // Check if this combination is unique
      if (usedCombinations.has(combinationKey) && attempts < maxAttempts) {
        continue; // Try again with different combination
      }

      // Compose stats using composition service
      const composedStats = composeCultivatorStats(selectedSpecies, selectedDao, selectedTitle);

      // Randomly select skills compatible with the dao
      const skillIds = selectRandomSkillsForDao(selectedDao, 1, 3);

      // Randomly select items (0-2 items)
      const itemIds = selectRandomItemIds(0, 2);

      // Create the cultivator
      cultivator = createDefenderInstanceFromComposition(
        selectedSpecies,
        selectedDao,
        selectedTitle,
        composedStats,
        skillIds,
        itemIds
      );

      // Track this combination
      usedCombinations.add(combinationKey);
      break;
    }

    if (!cultivator) {
      // Fallback: create without variety check
      const selectedSpecies = species[Math.floor(Math.random() * species.length)];
      const selectedDao = daos[Math.floor(Math.random() * daos.length)];
      const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
      const composedStats = composeCultivatorStats(selectedSpecies, selectedDao, selectedTitle);
      const skillIds = selectRandomSkillsForDao(selectedDao, 1, 3);
      const itemIds = selectRandomItemIds(0, 2);
      
      cultivator = createDefenderInstanceFromComposition(
        selectedSpecies,
        selectedDao,
        selectedTitle,
        composedStats,
        skillIds,
        itemIds
      );
    }

    cultivators.push(cultivator);
  }

  return cultivators;
}

/**
 * Select random skills compatible with a dao
 */
function selectRandomSkillsForDao(
  dao: Dao,
  minSkills: number,
  maxSkills: number
): string[] {
  const compatibleSkills = dao.compatibleSkills;

  if (compatibleSkills.length === 0) {
    return [];
  }

  // Determine how many skills to assign
  const skillCount = Math.floor(
    Math.random() * (maxSkills - minSkills + 1)
  ) + minSkills;

  // Cap at available skills
  const actualCount = Math.min(skillCount, compatibleSkills.length);

  // Randomly select skills without duplicates
  const shuffled = [...compatibleSkills].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
}

/**
 * Select random item IDs from available items
 */
function selectRandomItemIds(minItems: number, maxItems: number): string[] {
  const allItemIds = Object.keys(ITEMS);

  if (allItemIds.length === 0) {
    return [];
  }

  // Determine how many items to assign
  const itemCount = Math.floor(
    Math.random() * (maxItems - minItems + 1)
  ) + minItems;

  // Cap at available items
  const actualCount = Math.min(itemCount, allItemIds.length);

  // Randomly select items without duplicates
  const shuffled = [...allItemIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
}

/**
 * Create a defender EntityInstance from composition (Species + Dao + Title)
 */
function createDefenderInstanceFromComposition(
  species: Species,
  dao: Dao,
  title: Title,
  composedStats: {
    health: number;
    damage: number;
    attackSpeed: number;
    range: number;
    movementSpeed: number;
    emoji: string;
    displayName: string;
  },
  skillIds: string[],
  itemIds: string[]
): EntityInstance {
  // Generate unique runtime ID
  const id = `defender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Apply skill and item bonuses to composed stats
  const finalStats = applySkillAndItemBonuses(composedStats, skillIds, itemIds);

  return {
    id,
    personTypeId: undefined, // No person type when using composition
    personTypeKey: `${species.key}_${dao.key}_${title.key}`,
    role: 'defender',

    // Position (will be set when deployed)
    x: 0,
    y: 0,

    // Combat state
    health: finalStats.health,
    maxHealth: finalStats.health,
    damage: finalStats.damage,
    attackSpeed: finalStats.attackSpeed,
    range: finalStats.range,
    movementSpeed: finalStats.movementSpeed,
    lastAttack: 0,

    // Visual
    emoji: composedStats.emoji,
    name: composedStats.displayName,

    // Defender-specific state
    defenderState: {
      level: 1,
      experience: 0,
      kills: 0,
      equippedSkills: skillIds,
      inventory: itemIds,
    },

    // Store composition references for future use
    compositionRefs: {
      speciesId: species.id,
      daoId: dao.id,
      titleId: title.id,
    },
  };
}

/**
 * Apply skill and item bonuses to composed stats
 */
function applySkillAndItemBonuses(
  baseStats: {
    health: number;
    damage: number;
    attackSpeed: number;
    range: number;
    movementSpeed: number;
  },
  skillIds: string[],
  itemIds: string[]
): {
  health: number;
  damage: number;
  attackSpeed: number;
  range: number;
  movementSpeed: number;
} {
  let health = baseStats.health;
  let damage = baseStats.damage;
  let attackSpeed = baseStats.attackSpeed;
  let range = baseStats.range;
  let movementSpeed = baseStats.movementSpeed;

  // Apply skill bonuses
  skillIds.forEach(skillId => {
    const skill = SKILLS[skillId];
    if (!skill) return;

    skill.effects.forEach(effect => {
      switch (effect.stat) {
        case 'health':
          health += effect.value;
          if (effect.multiplier) health *= (1 + effect.multiplier);
          break;
        case 'damage':
          damage += effect.value;
          if (effect.multiplier) damage *= (1 + effect.multiplier);
          break;
        case 'attackSpeed':
          attackSpeed += effect.value;
          if (effect.multiplier) attackSpeed *= (1 + effect.multiplier);
          break;
        case 'range':
          range += effect.value;
          if (effect.multiplier) range *= (1 + effect.multiplier);
          break;
      }
    });
  });

  // Apply item bonuses
  itemIds.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;

    item.effects.forEach(effect => {
      switch (effect.stat) {
        case 'health':
          health += effect.value;
          if (effect.multiplier) health *= (1 + effect.multiplier);
          break;
        case 'damage':
          damage += effect.value;
          if (effect.multiplier) damage *= (1 + effect.multiplier);
          break;
        case 'attackSpeed':
          attackSpeed += effect.value;
          if (effect.multiplier) attackSpeed *= (1 + effect.multiplier);
          break;
        case 'range':
          range += effect.value;
          if (effect.multiplier) range *= (1 + effect.multiplier);
          break;
      }
    });
  });

  return {
    health: Math.round(health),
    damage: Math.round(damage),
    attackSpeed: Math.round(attackSpeed),
    range: Math.round(range),
    movementSpeed,
  };
}
