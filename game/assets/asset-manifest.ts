/**
 * Asset Manifest - Central registry for all game SVG assets
 * 
 * Status legend:
 * - 'ready': SVG exists and is ready to use
 * - 'pending': SVG needs to be created
 * - 'placeholder': Using emoji fallback until SVG is ready
 */

export type AssetStatus = 'ready' | 'pending' | 'placeholder';

export interface AssetEntry {
  path: string;
  name: string;
  status: AssetStatus;
  fallback?: string; // Emoji fallback
}

// ============================================================================
// UI ICONS
// ============================================================================
export const uiIcons: Record<string, AssetEntry> = {
  inventory: {
    path: 'game/assets/icons/ui/inventory.svg',
    name: 'Inventory',
    status: 'ready',
    fallback: '🎒',
  },
  settings: {
    path: 'game/assets/icons/ui/settings.svg',
    name: 'Settings',
    status: 'pending',
    fallback: '⚙️',
  },
  pause: {
    path: 'game/assets/icons/ui/pause.svg',
    name: 'Pause',
    status: 'pending',
    fallback: '⏸️',
  },
  play: {
    path: 'game/assets/icons/ui/play.svg',
    name: 'Play',
    status: 'pending',
    fallback: '▶️',
  },
  fastForward: {
    path: 'game/assets/icons/ui/fast-forward.svg',
    name: 'Fast Forward',
    status: 'pending',
    fallback: '⏩',
  },
  qi: {
    path: 'game/assets/icons/ui/qi.svg',
    name: 'Qi Currency',
    status: 'pending',
    fallback: '✨',
  },
  castle: {
    path: 'game/assets/icons/ui/castle.svg',
    name: 'Castle/Temple',
    status: 'pending',
    fallback: '🏯',
  },
  map: {
    path: 'game/assets/icons/ui/map.svg',
    name: 'Map',
    status: 'pending',
    fallback: '🗺️',
  },
};

// ============================================================================
// WEAPONS
// ============================================================================
export const weaponIcons: Record<string, AssetEntry> = {
  sword: {
    path: 'game/assets/icons/weapons/sword.svg',
    name: 'Jian Sword',
    status: 'ready',
    fallback: '⚔️',
  },
  spear: {
    path: 'game/assets/icons/weapons/spear.svg',
    name: 'Qiang Spear',
    status: 'ready',
    fallback: '🔱',
  },
  bow: {
    path: 'game/assets/icons/weapons/bow.svg',
    name: 'Bow',
    status: 'pending',
    fallback: '🏹',
  },
  staff: {
    path: 'game/assets/icons/weapons/staff.svg',
    name: 'Staff',
    status: 'pending',
    fallback: '🪄',
  },
  dagger: {
    path: 'game/assets/icons/weapons/dagger.svg',
    name: 'Dagger',
    status: 'pending',
    fallback: '🗡️',
  },
};

// ============================================================================
// SKILLS
// ============================================================================
export const skillIcons: Record<string, AssetEntry> = {
  // Sword skills
  bladeMastery: {
    path: 'game/assets/icons/skills/blade-mastery.svg',
    name: 'Blade Mastery',
    status: 'pending',
    fallback: '⚔️',
  },
  ironBody: {
    path: 'game/assets/icons/skills/iron-body.svg',
    name: 'Iron Body',
    status: 'pending',
    fallback: '🛡️',
  },
  swiftStrike: {
    path: 'game/assets/icons/skills/swift-strike.svg',
    name: 'Swift Strike',
    status: 'pending',
    fallback: '⚡',
  },
  whirlwindBlade: {
    path: 'game/assets/icons/skills/whirlwind-blade.svg',
    name: 'Whirlwind Blade',
    status: 'pending',
    fallback: '🌪️',
  },
  // Palm skills
  innerForce: {
    path: 'game/assets/icons/skills/inner-force.svg',
    name: 'Inner Force',
    status: 'pending',
    fallback: '💫',
  },
  qiShield: {
    path: 'game/assets/icons/skills/qi-shield.svg',
    name: 'Qi Shield',
    status: 'pending',
    fallback: '🔰',
  },
  palmAura: {
    path: 'game/assets/icons/skills/palm-aura.svg',
    name: 'Palm Aura',
    status: 'pending',
    fallback: '✨',
  },
  meditation: {
    path: 'game/assets/icons/skills/meditation.svg',
    name: 'Meditation',
    status: 'pending',
    fallback: '🧘',
  },
  // Arrow skills
  eagleEye: {
    path: 'game/assets/icons/skills/eagle-eye.svg',
    name: 'Eagle Eye',
    status: 'pending',
    fallback: '🦅',
  },
  rapidFire: {
    path: 'game/assets/icons/skills/rapid-fire.svg',
    name: 'Rapid Fire',
    status: 'pending',
    fallback: '🏹',
  },
  piercingShot: {
    path: 'game/assets/icons/skills/piercing-shot.svg',
    name: 'Piercing Shot',
    status: 'pending',
    fallback: '🎯',
  },
  windWalker: {
    path: 'game/assets/icons/skills/wind-walker.svg',
    name: 'Wind Walker',
    status: 'pending',
    fallback: '🍃',
  },
  // Lightning skills
  stormFury: {
    path: 'game/assets/icons/skills/storm-fury.svg',
    name: 'Storm Fury',
    status: 'pending',
    fallback: '⚡',
  },
  chainLightning: {
    path: 'game/assets/icons/skills/chain-lightning.svg',
    name: 'Chain Lightning',
    status: 'pending',
    fallback: '🌩️',
  },
  thunderAura: {
    path: 'game/assets/icons/skills/thunder-aura.svg',
    name: 'Thunder Aura',
    status: 'pending',
    fallback: '⚡',
  },
  staticCharge: {
    path: 'game/assets/icons/skills/static-charge.svg',
    name: 'Static Charge',
    status: 'pending',
    fallback: '🔋',
  },
};

// ============================================================================
// ITEMS
// ============================================================================
export const itemIcons: Record<string, AssetEntry> = {
  // Common
  jadeRing: {
    path: 'game/assets/icons/items/jade-ring.svg',
    name: 'Jade Ring',
    status: 'pending',
    fallback: '💍',
  },
  silkSash: {
    path: 'game/assets/icons/items/silk-sash.svg',
    name: 'Silk Sash',
    status: 'pending',
    fallback: '🎀',
  },
  ironBracers: {
    path: 'game/assets/icons/items/iron-bracers.svg',
    name: 'Iron Bracers',
    status: 'pending',
    fallback: '🔗',
  },
  woodenCharm: {
    path: 'game/assets/icons/items/wooden-charm.svg',
    name: 'Wooden Charm',
    status: 'pending',
    fallback: '🪵',
  },
  // Rare
  dragonFang: {
    path: 'game/assets/icons/items/dragon-fang.svg',
    name: 'Dragon Fang',
    status: 'pending',
    fallback: '🦷',
  },
  phoenixFeather: {
    path: 'game/assets/icons/items/phoenix-feather.svg',
    name: 'Phoenix Feather',
    status: 'pending',
    fallback: '🪶',
  },
  tigerClaw: {
    path: 'game/assets/icons/items/tiger-claw.svg',
    name: 'Tiger Claw',
    status: 'pending',
    fallback: '🐅',
  },
  spiritArmor: {
    path: 'game/assets/icons/items/spirit-armor.svg',
    name: 'Spirit Armor',
    status: 'pending',
    fallback: '👻',
  },
  // Epic
  celestialOrb: {
    path: 'game/assets/icons/items/celestial-orb.svg',
    name: 'Celestial Orb',
    status: 'pending',
    fallback: '🔮',
  },
  demonSlayerBlade: {
    path: 'game/assets/icons/items/demon-slayer-blade.svg',
    name: 'Demon Slayer Blade',
    status: 'pending',
    fallback: '🗡️',
  },
  immortalRobes: {
    path: 'game/assets/icons/items/immortal-robes.svg',
    name: 'Immortal Robes',
    status: 'pending',
    fallback: '👘',
  },
  // Legendary
  heavensMandate: {
    path: 'game/assets/icons/items/heavens-mandate.svg',
    name: "Heaven's Mandate",
    status: 'pending',
    fallback: '👑',
  },
  voidBreaker: {
    path: 'game/assets/icons/items/void-breaker.svg',
    name: 'Void Breaker',
    status: 'pending',
    fallback: '⚔️',
  },
};

// ============================================================================
// STATS
// ============================================================================
export const statIcons: Record<string, AssetEntry> = {
  health: {
    path: 'game/assets/icons/stats/health.svg',
    name: 'Health',
    status: 'pending',
    fallback: '❤️',
  },
  damage: {
    path: 'game/assets/icons/stats/damage.svg',
    name: 'Damage',
    status: 'pending',
    fallback: '⚔️',
  },
  attackSpeed: {
    path: 'game/assets/icons/stats/attack-speed.svg',
    name: 'Attack Speed',
    status: 'pending',
    fallback: '⚡',
  },
  range: {
    path: 'game/assets/icons/stats/range.svg',
    name: 'Range',
    status: 'pending',
    fallback: '🎯',
  },
  critChance: {
    path: 'game/assets/icons/stats/crit-chance.svg',
    name: 'Critical Chance',
    status: 'pending',
    fallback: '💥',
  },
};

// ============================================================================
// SPECIES (Cultivator/Enemy base appearances)
// ============================================================================
export const speciesSprites: Record<string, AssetEntry> = {
  human: {
    path: 'game/assets/sprites/species/human.svg',
    name: 'Human',
    status: 'pending',
    fallback: '👤',
  },
  spirit: {
    path: 'game/assets/sprites/species/spirit.svg',
    name: 'Spirit',
    status: 'pending',
    fallback: '👻',
  },
  beast: {
    path: 'game/assets/sprites/species/beast.svg',
    name: 'Beast',
    status: 'pending',
    fallback: '🐺',
  },
  golem: {
    path: 'game/assets/sprites/species/golem.svg',
    name: 'Golem',
    status: 'pending',
    fallback: '🗿',
  },
  dragon: {
    path: 'game/assets/sprites/species/dragon.svg',
    name: 'Dragon',
    status: 'pending',
    fallback: '🐉',
  },
  demon: {
    path: 'game/assets/sprites/species/demon.svg',
    name: 'Demon',
    status: 'pending',
    fallback: '👹',
  },
};

// ============================================================================
// COMBAT EFFECTS
// ============================================================================
export const combatEffects: Record<string, AssetEntry> = {
  slash: {
    path: 'game/assets/effects/combat/slash.svg',
    name: 'Slash',
    status: 'pending',
    fallback: '⚔️',
  },
  thrust: {
    path: 'game/assets/effects/combat/thrust.svg',
    name: 'Thrust',
    status: 'pending',
    fallback: '🔱',
  },
  impact: {
    path: 'game/assets/effects/combat/impact.svg',
    name: 'Impact',
    status: 'pending',
    fallback: '💥',
  },
  arrowTrail: {
    path: 'game/assets/effects/combat/arrow-trail.svg',
    name: 'Arrow Trail',
    status: 'pending',
    fallback: '➡️',
  },
};

// ============================================================================
// MAGIC EFFECTS
// ============================================================================
export const magicEffects: Record<string, AssetEntry> = {
  lightningBolt: {
    path: 'game/assets/effects/magic/lightning-bolt.svg',
    name: 'Lightning Bolt',
    status: 'pending',
    fallback: '⚡',
  },
  fireBurst: {
    path: 'game/assets/effects/magic/fire-burst.svg',
    name: 'Fire Burst',
    status: 'pending',
    fallback: '🔥',
  },
  qiAura: {
    path: 'game/assets/effects/magic/qi-aura.svg',
    name: 'Qi Aura',
    status: 'pending',
    fallback: '✨',
  },
  spiritWave: {
    path: 'game/assets/effects/magic/spirit-wave.svg',
    name: 'Spirit Wave',
    status: 'pending',
    fallback: '💨',
  },
};

// ============================================================================
// MOVEMENT EFFECTS
// ============================================================================
export const movementEffects: Record<string, AssetEntry> = {
  jumpDust: {
    path: 'game/assets/effects/movement/jump-dust.svg',
    name: 'Jump Dust',
    status: 'pending',
    fallback: '💨',
  },
  dashTrail: {
    path: 'game/assets/effects/movement/dash-trail.svg',
    name: 'Dash Trail',
    status: 'pending',
    fallback: '💨',
  },
  landingImpact: {
    path: 'game/assets/effects/movement/landing-impact.svg',
    name: 'Landing Impact',
    status: 'pending',
    fallback: '💥',
  },
  speedLines: {
    path: 'game/assets/effects/movement/speed-lines.svg',
    name: 'Speed Lines',
    status: 'pending',
    fallback: '〰️',
  },
};

// ============================================================================
// STATUS EFFECTS
// ============================================================================
export const statusEffects: Record<string, AssetEntry> = {
  healGlow: {
    path: 'game/assets/effects/status/heal-glow.svg',
    name: 'Heal Glow',
    status: 'pending',
    fallback: '💚',
  },
  shieldBubble: {
    path: 'game/assets/effects/status/shield-bubble.svg',
    name: 'Shield Bubble',
    status: 'pending',
    fallback: '🛡️',
  },
  poisonDrip: {
    path: 'game/assets/effects/status/poison-drip.svg',
    name: 'Poison Drip',
    status: 'pending',
    fallback: '☠️',
  },
  stunStars: {
    path: 'game/assets/effects/status/stun-stars.svg',
    name: 'Stun Stars',
    status: 'pending',
    fallback: '⭐',
  },
};

// ============================================================================
// LEVEL BADGES
// ============================================================================
export const levelBadges: Record<string, AssetEntry> = {
  novice: {
    path: 'game/assets/icons/badges/novice.svg',
    name: 'Novice (1-3)',
    status: 'pending',
    fallback: '🌱',
  },
  intermediate: {
    path: 'game/assets/icons/badges/intermediate.svg',
    name: 'Intermediate (4-6)',
    status: 'pending',
    fallback: '🌿',
  },
  advanced: {
    path: 'game/assets/icons/badges/advanced.svg',
    name: 'Advanced (7-9)',
    status: 'pending',
    fallback: '⭐',
  },
  master: {
    path: 'game/assets/icons/badges/master.svg',
    name: 'Master (10)',
    status: 'pending',
    fallback: '👑',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get asset path or fallback emoji
 */
export function getAssetOrFallback(asset: AssetEntry): string {
  return asset.status === 'ready' ? asset.path : asset.fallback || '❓';
}

/**
 * Check if asset is ready to use
 */
export function isAssetReady(asset: AssetEntry): boolean {
  return asset.status === 'ready';
}

/**
 * Get all pending assets across all categories
 */
export function getPendingAssets(): AssetEntry[] {
  const allAssets = [
    ...Object.values(uiIcons),
    ...Object.values(weaponIcons),
    ...Object.values(skillIcons),
    ...Object.values(itemIcons),
    ...Object.values(statIcons),
    ...Object.values(speciesSprites),
    ...Object.values(combatEffects),
    ...Object.values(magicEffects),
    ...Object.values(movementEffects),
    ...Object.values(statusEffects),
    ...Object.values(levelBadges),
  ];
  return allAssets.filter(a => a.status === 'pending');
}

/**
 * Get asset completion stats
 */
export function getAssetStats(): { ready: number; pending: number; total: number } {
  const allAssets = [
    ...Object.values(uiIcons),
    ...Object.values(weaponIcons),
    ...Object.values(skillIcons),
    ...Object.values(itemIcons),
    ...Object.values(statIcons),
    ...Object.values(speciesSprites),
    ...Object.values(combatEffects),
    ...Object.values(magicEffects),
    ...Object.values(movementEffects),
    ...Object.values(statusEffects),
    ...Object.values(levelBadges),
  ];
  const ready = allAssets.filter(a => a.status === 'ready').length;
  return {
    ready,
    pending: allAssets.length - ready,
    total: allAssets.length,
  };
}
