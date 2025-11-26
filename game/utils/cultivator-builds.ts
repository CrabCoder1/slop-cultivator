/**
 * @deprecated This file is deprecated and needs refactoring for the Person Type system.
 * Current implementation uses hardcoded cultivator types ('sword', 'palm', 'arrow', 'lightning').
 * Should be refactored to:
 * - Use Person Type keys instead of hardcoded types
 * - Support dynamic Person Types loaded from database
 * - Consider moving to Supabase for cross-device persistence
 * 
 * See game/utils/DEPRECATED_README.md for migration details.
 */

// Cultivator build persistence system
// Saves and loads preferred skill/item setups per cultivator type

import type { Tower } from '../App';

export type CultivatorType = 'sword' | 'palm' | 'arrow' | 'lightning';

export interface CultivatorBuild {
  type: CultivatorType;
  preferredSkills: string[]; // Skill IDs to auto-equip
  lastUsed: number; // Timestamp
}

const STORAGE_KEY = 'cultivator_builds';

// Get all saved builds
export function getSavedBuilds(): Record<CultivatorType, CultivatorBuild> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultBuilds();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading cultivator builds:', error);
    return getDefaultBuilds();
  }
}

// Get default builds (empty)
function getDefaultBuilds(): Record<CultivatorType, CultivatorBuild> {
  return {
    sword: { type: 'sword', preferredSkills: [], lastUsed: 0 },
    palm: { type: 'palm', preferredSkills: [], lastUsed: 0 },
    arrow: { type: 'arrow', preferredSkills: [], lastUsed: 0 },
    lightning: { type: 'lightning', preferredSkills: [], lastUsed: 0 },
  };
}

// Save a build for a specific cultivator type
export function saveBuild(type: CultivatorType, skills: string[]): void {
  try {
    const builds = getSavedBuilds();
    builds[type] = {
      type,
      preferredSkills: skills.slice(0, 3), // Max 3 skills
      lastUsed: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (error) {
    console.error('Error saving cultivator build:', error);
  }
}

// Get preferred skills for a cultivator type
export function getPreferredSkills(type: CultivatorType): string[] {
  const builds = getSavedBuilds();
  return builds[type]?.preferredSkills || [];
}

// Apply saved build to a newly placed tower
export function applyBuildToTower(tower: Tower): Tower {
  try {
    const preferredSkills = getPreferredSkills(tower.type);
    
    // Only apply if there are saved skills and tower has no skills yet
    if (preferredSkills.length > 0 && tower.equippedSkills.length === 0) {
      return {
        ...tower,
        equippedSkills: preferredSkills,
      };
    }
    
    return tower;
  } catch (error) {
    console.error('Error applying build to tower:', error);
    return tower;
  }
}

// Update build when skills change (auto-save)
export function updateBuildFromTower(tower: Tower): void {
  if (tower.equippedSkills.length > 0) {
    saveBuild(tower.type, tower.equippedSkills);
  }
}

// Clear all saved builds
export function clearAllBuilds(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cultivator builds:', error);
  }
}

// Get build statistics
export interface BuildStats {
  totalBuilds: number;
  mostRecentType: CultivatorType | null;
  buildsByType: Record<CultivatorType, number>;
}

export function getBuildStats(): BuildStats {
  const builds = getSavedBuilds();
  let mostRecentType: CultivatorType | null = null;
  let mostRecentTime = 0;
  
  const buildsByType: Record<CultivatorType, number> = {
    sword: 0,
    palm: 0,
    arrow: 0,
    lightning: 0,
  };
  
  let totalBuilds = 0;
  
  Object.entries(builds).forEach(([type, build]) => {
    if (build.preferredSkills.length > 0) {
      totalBuilds++;
      buildsByType[type as CultivatorType] = build.preferredSkills.length;
      
      if (build.lastUsed > mostRecentTime) {
        mostRecentTime = build.lastUsed;
        mostRecentType = type as CultivatorType;
      }
    }
  });
  
  return {
    totalBuilds,
    mostRecentType,
    buildsByType,
  };
}
