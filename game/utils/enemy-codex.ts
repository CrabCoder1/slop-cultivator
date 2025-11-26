/**
 * @deprecated This file is deprecated and kept only for backward compatibility.
 * Use the new Person Type system instead:
 * - shared/types/person-types.ts for type definitions
 * - shared/utils/person-type-service.ts for loading Person Types
 * - shared/utils/wave-config-service.ts for wave configurations
 * - shared/utils/person-type-adapters.ts for converting old format to new
 * 
 * See game/utils/DEPRECATED_README.md for migration details.
 */

// Enemy Codex - Complete enemy database with stats and lore

export type EnemyType = 'demon' | 'shadow' | 'beast' | 'wraith' | 'golem' | 'dragon';

export interface EnemyCodexEntry {
  id: EnemyType;
  name: string;
  emoji: string;
  description: string;
  lore: string;
  baseStats: {
    health: number;
    speed: number;
    reward: number; // Qi reward
    damage: number; // Damage per attack
  };
  difficulty: 'common' | 'uncommon' | 'rare' | 'elite' | 'boss';
  firstAppearance: number; // Wave number
}

export const ENEMY_CODEX: Record<EnemyType, EnemyCodexEntry> = {
  demon: {
    id: 'demon',
    name: 'Crimson Demon',
    emoji: '👹',
    description: 'A fierce demon from the underworld with balanced stats',
    lore: 'These demons emerged from the rifts between realms, drawn by the sacred energy of the temple. Their crimson skin burns with hellfire, and they seek to corrupt all that is pure.',
    baseStats: {
      health: 60,
      speed: 1.0,
      reward: 20,
      damage: 5,
    },
    difficulty: 'common',
    firstAppearance: 1,
  },
  
  shadow: {
    id: 'shadow',
    name: 'Shadow Wraith',
    emoji: '👤',
    description: 'A swift but fragile creature of darkness',
    lore: 'Born from the absence of light, these wraiths move like smoke through the battlefield. They are the scouts of the dark forces, testing the temple\'s defenses with their speed.',
    baseStats: {
      health: 40,
      speed: 1.5,
      reward: 15,
      damage: 3,
    },
    difficulty: 'common',
    firstAppearance: 1,
  },
  
  beast: {
    id: 'beast',
    name: 'Dire Beast',
    emoji: '🐺',
    description: 'A massive beast with high health but slow movement',
    lore: 'Corrupted by dark magic, these once-noble creatures now serve as living battering rams. Their thick hide and massive frame make them formidable opponents, though their size slows them down.',
    baseStats: {
      health: 100,
      speed: 0.7,
      reward: 30,
      damage: 8,
    },
    difficulty: 'uncommon',
    firstAppearance: 1,
  },
  
  wraith: {
    id: 'wraith',
    name: 'Spectral Wraith',
    emoji: '👻',
    description: 'An ethereal spirit that phases through defenses',
    lore: 'The restless spirits of fallen warriors, bound to serve the darkness. They drift across the battlefield like mist, their ghostly wails chilling the hearts of even the bravest cultivators.',
    baseStats: {
      health: 80,
      speed: 1.2,
      reward: 35,
      damage: 6,
    },
    difficulty: 'rare',
    firstAppearance: 5,
  },
  
  golem: {
    id: 'golem',
    name: 'Stone Golem',
    emoji: '🗿',
    description: 'A towering construct of stone with immense durability',
    lore: 'Ancient guardians twisted by corruption, these stone titans were once protectors of sacred sites. Now they march relentlessly toward the temple, their stone bodies nearly impervious to harm.',
    baseStats: {
      health: 200,
      speed: 0.5,
      reward: 50,
      damage: 12,
    },
    difficulty: 'elite',
    firstAppearance: 10,
  },
  
  dragon: {
    id: 'dragon',
    name: 'Corrupted Dragon',
    emoji: '🐉',
    description: 'A legendary beast of immense power',
    lore: 'Once revered as celestial beings, these dragons fell to corruption and now serve the forces of darkness. Their arrival signals a dire threat, as few cultivators have survived an encounter with their might.',
    baseStats: {
      health: 300,
      speed: 0.8,
      reward: 100,
      damage: 20,
    },
    difficulty: 'boss',
    firstAppearance: 15,
  },
};

// Difficulty colors for UI
export const DIFFICULTY_COLORS: Record<EnemyCodexEntry['difficulty'], string> = {
  common: '#9ca3af', // gray
  uncommon: '#22c55e', // green
  rare: '#3b82f6', // blue
  elite: '#a855f7', // purple
  boss: '#ef4444', // red
};

// Get enemy config with wave scaling
export function getEnemyStats(enemyType: EnemyType, wave: number): {
  health: number;
  speed: number;
  reward: number;
  damage: number;
} {
  const entry = ENEMY_CODEX[enemyType];
  
  // Safety check - fallback to demon if entry not found
  if (!entry) {
    console.error(`Enemy type "${enemyType}" not found in codex, using demon as fallback`);
    return getEnemyStats('demon', wave);
  }
  
  const healthMultiplier = 1 + (wave - 1) * 0.3; // 30% more health per wave
  
  return {
    health: entry.baseStats.health * healthMultiplier,
    speed: entry.baseStats.speed,
    reward: entry.baseStats.reward,
    damage: entry.baseStats.damage,
  };
}

// Get enemies available for a given wave
export function getAvailableEnemies(wave: number): EnemyType[] {
  return Object.values(ENEMY_CODEX)
    .filter(entry => entry.firstAppearance <= wave)
    .map(entry => entry.id);
}

// Get random enemy type for wave
export function getRandomEnemyType(wave: number): EnemyType {
  const available = getAvailableEnemies(wave);
  
  // Fallback to wave 1 enemies if no enemies available (e.g., wave 0)
  if (available.length === 0) {
    return getRandomEnemyType(1);
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

// Get all enemy types
export function getAllEnemyTypes(): EnemyType[] {
  return Object.keys(ENEMY_CODEX) as EnemyType[];
}

// Get enemy entry
export function getEnemyEntry(type: EnemyType): EnemyCodexEntry {
  return ENEMY_CODEX[type];
}

// Check if enemy is unlocked (encountered)
export function isEnemyUnlocked(type: EnemyType, highestWave: number): boolean {
  return ENEMY_CODEX[type].firstAppearance <= highestWave;
}
