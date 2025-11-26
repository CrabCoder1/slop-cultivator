// Cultivator Composition Service
// Combines Species + Dao + Title to calculate final cultivator stats

import type { 
  Species, 
  Dao, 
  Title, 
  ComposedCultivatorStats 
} from '../types/composition-types';

/**
 * Composes final cultivator stats by combining Species, Dao, and Title
 * 
 * Calculation order:
 * 1. Start with species base stats (health, movement speed)
 * 2. Add dao combat stats (damage, attack speed, range)
 * 3. Apply title multipliers and bonuses
 * 
 * @param species - The species providing base physical stats
 * @param dao - The dao providing combat stats
 * @param title - The title providing stat bonuses
 * @returns Final composed stats ready for entity creation
 */
export function composeCultivatorStats(
  species: Species,
  dao: Dao,
  title: Title
): ComposedCultivatorStats {
  // Start with species base stats
  let health = species.baseStats.health;
  let movementSpeed = species.baseStats.movementSpeed;
  
  // Get dao combat stats
  let damage = dao.combatStats.damage;
  let attackSpeed = dao.combatStats.attackSpeed;
  let range = dao.combatStats.range;
  
  // Apply title multipliers
  if (title.statBonuses.healthMultiplier) {
    health *= title.statBonuses.healthMultiplier;
  }
  
  if (title.statBonuses.damageMultiplier) {
    damage *= title.statBonuses.damageMultiplier;
  }
  
  if (title.statBonuses.attackSpeedMultiplier) {
    attackSpeed *= title.statBonuses.attackSpeedMultiplier;
  }
  
  if (title.statBonuses.movementSpeedMultiplier) {
    movementSpeed *= title.statBonuses.movementSpeedMultiplier;
  }
  
  // Apply flat bonuses
  if (title.statBonuses.rangeBonus) {
    range += title.statBonuses.rangeBonus;
  }
  
  // Generate display name: "Title (Species)"
  const displayName = `${title.name} (${species.name})`;
  
  // Use species emoji as primary visual
  const emoji = species.emoji;
  
  return {
    health: Math.round(health),
    damage: Math.round(damage),
    attackSpeed: Math.round(attackSpeed),
    range: Math.round(range),
    movementSpeed: Math.round(movementSpeed * 100) / 100, // Round to 2 decimals
    emoji,
    displayName
  };
}

/**
 * Validation error for composition issues
 */
export class CompositionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompositionValidationError';
  }
}

/**
 * Validates that a composition has all required components
 * 
 * @param species - The species component (can be null/undefined)
 * @param dao - The dao component (can be null/undefined)
 * @param title - The title component (can be null/undefined)
 * @throws CompositionValidationError if any component is missing
 */
export function validateComposition(
  species: Species | null | undefined,
  dao: Dao | null | undefined,
  title: Title | null | undefined
): void {
  const missing: string[] = [];
  
  if (!species) {
    missing.push('Species');
  }
  
  if (!dao) {
    missing.push('Dao');
  }
  
  if (!title) {
    missing.push('Title');
  }
  
  if (missing.length > 0) {
    throw new CompositionValidationError(
      `Invalid composition: Missing required components: ${missing.join(', ')}`
    );
  }
}

/**
 * Validates that equipped skills are compatible with the dao
 * 
 * @param dao - The dao with compatible skills list
 * @param equippedSkills - Array of skill IDs to validate
 * @returns Object with isValid flag and array of incompatible skill IDs
 */
export function validateSkillCompatibility(
  dao: Dao,
  equippedSkills: string[]
): { isValid: boolean; incompatibleSkills: string[] } {
  const incompatibleSkills: string[] = [];
  
  for (const skillId of equippedSkills) {
    if (!dao.compatibleSkills.includes(skillId)) {
      incompatibleSkills.push(skillId);
    }
  }
  
  return {
    isValid: incompatibleSkills.length === 0,
    incompatibleSkills
  };
}
