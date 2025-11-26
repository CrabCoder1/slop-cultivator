// Skill system for cultivators

export type CultivatorType = 'sword' | 'palm' | 'arrow' | 'lightning';

export type SkillType = 'passive' | 'active' | 'aura';

export type StatType = 'damage' | 'attackSpeed' | 'range' | 'health' | 'critChance';

export interface SkillEffect {
  stat: StatType;
  value: number; // Flat bonus (e.g., +50 damage)
  multiplier?: number; // Percentage bonus (e.g., 0.2 = +20%)
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: SkillType;
  compatibleTypes: CultivatorType[]; // Which cultivators can use this
  effects: SkillEffect[];
  cooldown?: number; // For active skills (in milliseconds)
  range?: number; // For aura skills (in pixels)
}

// Skill definitions
export const SKILLS: Record<string, Skill> = {
  // Sword Cultivator Skills
  blade_mastery: {
    id: 'blade_mastery',
    name: 'Blade Mastery',
    description: 'Years of sword training increase damage by 20%',
    icon: '⚔️',
    type: 'passive',
    compatibleTypes: ['sword'],
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.2 }
    ]
  },
  iron_body: {
    id: 'iron_body',
    name: 'Iron Body',
    description: 'Hardened body grants +50 health',
    icon: '🛡️',
    type: 'passive',
    compatibleTypes: ['sword'],
    effects: [
      { stat: 'health', value: 50 }
    ]
  },
  swift_strike: {
    id: 'swift_strike',
    name: 'Swift Strike',
    description: 'Lightning-fast attacks reduce cooldown by 15%',
    icon: '⚡',
    type: 'passive',
    compatibleTypes: ['sword'],
    effects: [
      { stat: 'attackSpeed', value: 0, multiplier: -0.15 } // Negative = faster
    ]
  },
  whirlwind_blade: {
    id: 'whirlwind_blade',
    name: 'Whirlwind Blade',
    description: 'Spinning blade technique increases range by 30',
    icon: '🌪️',
    type: 'passive',
    compatibleTypes: ['sword'],
    effects: [
      { stat: 'range', value: 30 }
    ]
  },

  // Palm Cultivator Skills
  inner_force: {
    id: 'inner_force',
    name: 'Inner Force',
    description: 'Channel inner Qi to increase damage by 30%',
    icon: '💫',
    type: 'passive',
    compatibleTypes: ['palm'],
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.3 }
    ]
  },
  qi_shield: {
    id: 'qi_shield',
    name: 'Qi Shield',
    description: 'Protective Qi barrier grants +100 health',
    icon: '🔰',
    type: 'passive',
    compatibleTypes: ['palm'],
    effects: [
      { stat: 'health', value: 100 }
    ]
  },
  palm_aura: {
    id: 'palm_aura',
    name: 'Palm Aura',
    description: 'Radiating Qi extends attack range by 40',
    icon: '✨',
    type: 'aura',
    compatibleTypes: ['palm'],
    effects: [
      { stat: 'range', value: 40 }
    ],
    range: 100
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    description: 'Deep focus reduces attack cooldown by 20%',
    icon: '🧘',
    type: 'passive',
    compatibleTypes: ['palm'],
    effects: [
      { stat: 'attackSpeed', value: 0, multiplier: -0.2 }
    ]
  },

  // Arrow Cultivator Skills
  eagle_eye: {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'Keen vision extends range by 50',
    icon: '🦅',
    type: 'passive',
    compatibleTypes: ['arrow'],
    effects: [
      { stat: 'range', value: 50 }
    ]
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: 'Quick draw increases attack speed by 25%',
    icon: '🏹',
    type: 'passive',
    compatibleTypes: ['arrow'],
    effects: [
      { stat: 'attackSpeed', value: 0, multiplier: -0.25 }
    ]
  },
  piercing_shot: {
    id: 'piercing_shot',
    name: 'Piercing Shot',
    description: 'Armor-piercing arrows increase damage by 25%',
    icon: '🎯',
    type: 'passive',
    compatibleTypes: ['arrow'],
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.25 }
    ]
  },
  wind_walker: {
    id: 'wind_walker',
    name: 'Wind Walker',
    description: 'Light as the wind, gain +30 health',
    icon: '🍃',
    type: 'passive',
    compatibleTypes: ['arrow'],
    effects: [
      { stat: 'health', value: 30 }
    ]
  },

  // Lightning Cultivator Skills
  storm_fury: {
    id: 'storm_fury',
    name: 'Storm Fury',
    description: 'Harness the storm to increase damage by 40%',
    icon: '⚡',
    type: 'passive',
    compatibleTypes: ['lightning'],
    effects: [
      { stat: 'damage', value: 0, multiplier: 0.4 }
    ]
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'Lightning arcs to nearby enemies, +35 range',
    icon: '🌩️',
    type: 'passive',
    compatibleTypes: ['lightning'],
    effects: [
      { stat: 'range', value: 35 }
    ]
  },
  thunder_aura: {
    id: 'thunder_aura',
    name: 'Thunder Aura',
    description: 'Crackling energy increases attack speed by 30%',
    icon: '⚡',
    type: 'aura',
    compatibleTypes: ['lightning'],
    effects: [
      { stat: 'attackSpeed', value: 0, multiplier: -0.3 }
    ],
    range: 120
  },
  static_charge: {
    id: 'static_charge',
    name: 'Static Charge',
    description: 'Electrical resistance grants +60 health',
    icon: '🔋',
    type: 'passive',
    compatibleTypes: ['lightning'],
    effects: [
      { stat: 'health', value: 60 }
    ]
  },
};

// Helper functions
export function getSkillsForType(type: CultivatorType): Skill[] {
  return Object.values(SKILLS).filter(skill => 
    skill.compatibleTypes.includes(type)
  );
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS[id];
}

export function canEquipSkill(skill: Skill, cultivatorType: CultivatorType): boolean {
  return skill.compatibleTypes.includes(cultivatorType);
}

// Calculate total stat bonuses from equipped skills
export function calculateSkillBonuses(
  equippedSkillIds: string[],
  baseStat: number,
  statType: StatType
): number {
  let flatBonus = 0;
  let multiplierBonus = 0;

  equippedSkillIds.forEach(skillId => {
    const skill = getSkillById(skillId);
    if (!skill) return;

    skill.effects.forEach(effect => {
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
