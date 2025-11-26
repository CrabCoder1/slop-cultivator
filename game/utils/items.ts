// Item system for cultivators

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'accessory';
export type ItemStatType = 'damage' | 'attackSpeed' | 'range' | 'health';

export interface ItemEffect {
  stat: ItemStatType;
  value: number; // Flat bonus
  multiplier?: number; // Percentage bonus
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  type: ItemType;
  effects: ItemEffect[];
  dropRate: number; // Base drop rate (0-1)
}

// Item definitions
export const ITEMS: Record<string, Item> = {
  // Common Items (30% drop rate)
  jade_ring: {
    id: 'jade_ring',
    name: 'Jade Ring',
    description: 'A simple ring carved from jade',
    icon: '💍',
    rarity: 'common',
    type: 'accessory',
    effects: [
      { stat: 'damage', value: 10 }
    ],
    dropRate: 0.3
  },
  silk_sash: {
    id: 'silk_sash',
    name: 'Silk Sash',
    description: 'Lightweight protective cloth',
    icon: '🎀',
    rarity: 'common',
    type: 'armor',
    effects: [
      { stat: 'health', value: 20 }
    ],
    dropRate: 0.3
  },
  iron_bracers: {
    id: 'iron_bracers',
    name: 'Iron Bracers',
    description: 'Sturdy wrist guards that improve speed',
    icon: '🔗',
    rarity: 'common',
    type: 'armor',
    effects: [
      { stat: 'attackSpeed', value: 0, multiplier: -0.05 }
    ],
    dropRate: 0.3
  },
  wooden_charm: {
    id: 'wooden_charm',
    name: 'Wooden Charm',
    description: 'A blessed charm for protection',
    icon: '🪵',
    rarity: 'common',
    type: 'accessory',
    effects: [
      { stat: 'health', value: 15 }
    ],
    dropRate: 0.3
  },

  // Rare Items (15% drop rate)
  dragon_fang: {
    id: 'dragon_fang',
    name: 'Dragon Fang',
    description: 'A tooth from an ancient dragon',
    icon: '🦷',
    rarity: 'rare',
    type: 'weapon',
    effects: [
      { stat: 'damage', value: 25 }
    ],
    dropRate: 0.15
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    description: 'A feather that extends your reach',
    icon: '🪶',
    rarity: 'rare',
    type: 'accessory',
    effects: [
      { stat: 'range', value: 50 }
    ],
    dropRate: 0.15
  },
  tiger_claw: {
    id: 'tiger_claw',
    name: 'Tiger Claw',
    description: 'Gauntlets that enhance striking power',
    icon: '🐅',
    rarity: 'rare',
    type: 'weapon',
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.15 }
    ],
    dropRate: 0.15
  },
  spirit_armor: {
    id: 'spirit_armor',
    name: 'Spirit Armor',
    description: 'Ethereal protection from the spirit realm',
    icon: '👻',
    rarity: 'rare',
    type: 'armor',
    effects: [
      { stat: 'health', value: 50 }
    ],
    dropRate: 0.15
  },

  // Epic Items (5% drop rate)
  celestial_orb: {
    id: 'celestial_orb',
    name: 'Celestial Orb',
    description: 'A mystical orb containing cosmic power',
    icon: '🔮',
    rarity: 'epic',
    type: 'accessory',
    effects: [
      { stat: 'damage', value: 50 },
      { stat: 'range', value: 30 }
    ],
    dropRate: 0.05
  },
  demon_slayer_blade: {
    id: 'demon_slayer_blade',
    name: 'Demon Slayer Blade',
    description: 'Forged to vanquish demons',
    icon: '🗡️',
    rarity: 'epic',
    type: 'weapon',
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.4 }
    ],
    dropRate: 0.05
  },
  immortal_robes: {
    id: 'immortal_robes',
    name: 'Immortal Robes',
    description: 'Robes worn by ancient immortals',
    icon: '👘',
    rarity: 'epic',
    type: 'armor',
    effects: [
      { stat: 'health', value: 100 },
      { stat: 'attackSpeed', value: 0, multiplier: -0.1 }
    ],
    dropRate: 0.05
  },

  // Legendary Items (1% drop rate)
  heavens_mandate: {
    id: 'heavens_mandate',
    name: "Heaven's Mandate",
    description: 'The ultimate treasure, blessed by the heavens',
    icon: '👑',
    rarity: 'legendary',
    type: 'accessory',
    effects: [
      { stat: 'damage', value: 100 },
      { stat: 'range', value: 100 },
      { stat: 'attackSpeed', value: 0, multiplier: -0.5 }
    ],
    dropRate: 0.01
  },
  void_breaker: {
    id: 'void_breaker',
    name: 'Void Breaker',
    description: 'A weapon that tears through reality itself',
    icon: '⚔️',
    rarity: 'legendary',
    type: 'weapon',
    effects: [
      { stat: 'damage', value: 0, multiplier: 1.0 }, // Double damage!
      { stat: 'range', value: 50 }
    ],
    dropRate: 0.01
  },
};

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af', // gray-400
  rare: '#3b82f6', // blue-500
  epic: '#a855f7', // purple-500
  legendary: '#f97316', // orange-500
};

// Rarity glow colors for dropped items
export const RARITY_GLOW: Record<ItemRarity, string> = {
  common: 'rgba(156, 163, 175, 0.5)',
  rare: 'rgba(59, 130, 246, 0.7)',
  epic: 'rgba(168, 85, 247, 0.8)',
  legendary: 'rgba(249, 115, 22, 0.9)',
};

// Helper functions
export function getItemById(id: string): Item | undefined {
  return ITEMS[id];
}

export function getAllItems(): Item[] {
  return Object.values(ITEMS);
}

export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return Object.values(ITEMS).filter(item => item.rarity === rarity);
}

export function getItemsByType(type: ItemType): Item[] {
  return Object.values(ITEMS).filter(item => item.type === type);
}

// Roll for item drop based on enemy type and wave
export function rollItemDrop(enemyType: string, wave: number): Item | null {
  const allItems = getAllItems();
  
  // Base drop chance increases with wave (5% + 1% per wave, max 25%)
  const baseDropChance = Math.min(0.05 + (wave * 0.01), 0.25);
  
  // Enemy type multipliers
  const enemyMultiplier: Record<string, number> = {
    demon: 1.2,
    shadow: 1.0,
    beast: 1.5,
  };
  
  const multiplier = enemyMultiplier[enemyType] || 1.0;
  const finalDropChance = baseDropChance * multiplier;
  
  // Roll for drop
  if (Math.random() > finalDropChance) {
    return null; // No drop
  }
  
  // Weighted random selection based on item rarity and drop rates
  const totalWeight = allItems.reduce((sum, item) => sum + item.dropRate, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of allItems) {
    random -= item.dropRate;
    if (random <= 0) {
      return item;
    }
  }
  
  // Fallback to first item (shouldn't happen)
  return allItems[0];
}

// Calculate total stat bonuses from equipped items
export function calculateItemBonuses(
  equippedItemIds: string[],
  baseStat: number,
  statType: ItemStatType
): number {
  let flatBonus = 0;
  let multiplierBonus = 0;

  equippedItemIds.forEach(itemId => {
    const item = getItemById(itemId);
    if (!item) return;

    item.effects.forEach(effect => {
      if (effect.stat === statType) {
        flatBonus += effect.value;
        if (effect.multiplier) {
          multiplierBonus += effect.multiplier;
        }
      }
    });
  });

  // Apply flat bonus first, then multiplier
  return (baseStat + flatBonus) * (1 + multiplierBonus);
}

// Get item slot type (for inventory management)
export function getItemSlot(item: Item): 'weapon' | 'armor' | 'accessory' {
  return item.type;
}

// Check if item can be equipped in a slot
export function canEquipInSlot(item: Item, slot: ItemType): boolean {
  return item.type === slot;
}
