/**
 * @deprecated This file is deprecated and kept only for backward compatibility.
 * Use the new Person Type system instead:
 * - shared/types/person-types.ts for type definitions
 * - shared/utils/person-type-service.ts for loading Person Types
 * - shared/utils/person-type-adapters.ts for converting old format to new
 * 
 * See game/utils/DEPRECATED_README.md for migration details.
 */

// Cultivator class - Object-Oriented tower defense unit
export class CultivatorType {
  name: string;
  cost: number;
  rangeInTiles: number;
  damage: number;
  attackSpeed: number;
  emoji: string;
  maxHealth: number;
  description: string;

  constructor(
    name: string,
    cost: number,
    rangeInTiles: number,
    damage: number,
    attackSpeed: number,
    emoji: string,
    maxHealth: number,
    description: string
  ) {
    this.name = name;
    this.cost = cost;
    this.rangeInTiles = rangeInTiles;
    this.damage = damage;
    this.attackSpeed = attackSpeed;
    this.emoji = emoji;
    this.maxHealth = maxHealth;
    this.description = description;
  }

  // Convert tile range to pixel range (30px per tile)
  getRangeInPixels(gridSize: number = 30): number {
    return this.rangeInTiles * gridSize;
  }

  // Calculate DPS (Damage Per Second)
  getDPS(): number {
    return (this.damage * 1000) / this.attackSpeed;
  }

  // Calculate attacks per second
  getAttacksPerSecond(): number {
    return 1000 / this.attackSpeed;
  }

  // Format range for display (e.g., "1.5" or "3")
  getDisplayRange(): string {
    return this.rangeInTiles % 1 === 0 
      ? this.rangeInTiles.toString() 
      : this.rangeInTiles.toFixed(1);
  }
}

// Cultivator type registry
export const CultivatorTypes = {
  sword: new CultivatorType(
    'Sword Cultivator',
    50,      // cost
    1.5,     // range in tiles
    20,      // damage
    1000,    // attack speed (ms)
    '⚔️',    // emoji
    100,     // max health
    'Masters of close-range combat with fast strikes'
  ),
  
  palm: new CultivatorType(
    'Palm Master',
    75,      // cost
    2,       // range in tiles
    15,      // damage
    800,     // attack speed (ms)
    '🖐️',   // emoji
    150,     // max health
    'Balanced fighters with good range and speed'
  ),
  
  arrow: new CultivatorType(
    'Arrow Sage',
    100,     // cost
    3,       // range in tiles
    25,      // damage
    1500,    // attack speed (ms)
    '🏹',    // emoji
    80,      // max health
    'Long-range specialists with powerful shots'
  ),
  
  lightning: new CultivatorType(
    'Lightning Lord',
    150,     // cost
    2.5,     // range in tiles
    40,      // damage
    2000,    // attack speed (ms)
    '⚡',    // emoji
    200,     // max health
    'Devastating damage with slower attacks'
  ),
} as const;

// Helper to convert old TOWER_TYPES format to new format for backward compatibility
export function getCultivatorConfig(type: keyof typeof CultivatorTypes, gridSize: number = 30) {
  const cultivator = CultivatorTypes[type];
  return {
    name: cultivator.name,
    cost: cultivator.cost,
    range: cultivator.getRangeInPixels(gridSize),
    damage: cultivator.damage,
    attackSpeed: cultivator.attackSpeed,
    emoji: cultivator.emoji,
    health: cultivator.maxHealth,
    rangeInTiles: cultivator.rangeInTiles,
    description: cultivator.description,
  };
}
