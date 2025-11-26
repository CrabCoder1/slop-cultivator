// Achievement Evaluation Service
// Handles achievement condition checking, progress tracking, and reward distribution

import type { 
  Achievement, 
  AchievementCondition, 
  AchievementReward,
  PlayerAchievement,
  PlayerProfile
} from '../types/composition-types';

/**
 * Game State Interface
 * Represents the current state of the game for achievement evaluation
 */
export interface GameState {
  currentWave: number;
  score: number;
  castleHealth: number;
  maxCastleHealth: number;
  totalEnemiesDefeated: number;
  cultivatorsDeployed: number;
  damageTaken: number; // For win_without_damage condition
}

/**
 * Achievement Evaluation Result
 * Contains newly unlocked achievements and updated progress
 */
export interface AchievementEvaluationResult {
  newlyUnlocked: Achievement[];
  updatedProgress: Map<string, PlayerAchievement>;
}

/**
 * Extract the current value for a condition type from game state
 */
export function getConditionValue(
  conditionType: AchievementCondition['type'],
  gameState: GameState
): number {
  switch (conditionType) {
    case 'wave_complete':
      return gameState.currentWave;
    
    case 'enemy_defeat_count':
      return gameState.totalEnemiesDefeated;
    
    case 'score_threshold':
      return gameState.score;
    
    case 'castle_health_preserved':
      // Return as percentage (0-1)
      return gameState.castleHealth / gameState.maxCastleHealth;
    
    case 'cultivator_deploy_count':
      return gameState.cultivatorsDeployed;
    
    case 'win_without_damage':
      // Return 1 if no damage taken, 0 otherwise
      return gameState.damageTaken === 0 ? 1 : 0;
    
    default:
      console.warn(`Unknown condition type: ${conditionType}`);
      return 0;
  }
}

/**
 * Compare two values using the specified operator
 */
export function compareValues(
  currentValue: number,
  targetValue: number,
  operator: AchievementCondition['comparisonOperator']
): boolean {
  switch (operator) {
    case 'equals':
      return currentValue === targetValue;
    
    case 'greater_than':
      return currentValue > targetValue;
    
    case 'less_than':
      return currentValue < targetValue;
    
    case 'greater_or_equal':
      return currentValue >= targetValue;
    
    default:
      console.warn(`Unknown comparison operator: ${operator}`);
      return false;
  }
}

/**
 * Evaluate all achievements and return newly unlocked ones with updated progress
 */
export function evaluateAchievements(
  achievements: Achievement[],
  playerAchievements: PlayerAchievement[],
  gameState: GameState
): AchievementEvaluationResult {
  const newlyUnlocked: Achievement[] = [];
  const updatedProgress = new Map<string, PlayerAchievement>();
  
  for (const achievement of achievements) {
    // Find the player's progress for this achievement
    const playerAchievement = playerAchievements.find(
      pa => pa.achievementId === achievement.id
    );
    
    // Skip if already unlocked
    if (playerAchievement?.isUnlocked) {
      continue;
    }
    
    // Skip if no player achievement record exists (shouldn't happen in normal flow)
    if (!playerAchievement) {
      console.warn(`No player achievement record found for achievement: ${achievement.key}`);
      continue;
    }
    
    // Evaluate all conditions
    let allConditionsMet = true;
    const updatedProgressValues: Record<string, number> = { ...playerAchievement.progress };
    
    for (let i = 0; i < achievement.conditions.length; i++) {
      const condition = achievement.conditions[i];
      const currentValue = getConditionValue(condition.type, gameState);
      const targetValue = condition.targetValue;
      
      // Update progress for trackable conditions
      if (condition.isTrackable) {
        updatedProgressValues[i.toString()] = currentValue;
      }
      
      // Check if this condition is met
      const conditionMet = compareValues(currentValue, targetValue, condition.comparisonOperator);
      
      if (!conditionMet) {
        allConditionsMet = false;
      }
    }
    
    // Update the player achievement with new progress
    const updatedPlayerAchievement: PlayerAchievement = {
      ...playerAchievement,
      progress: updatedProgressValues
    };
    
    // If all conditions are met, unlock the achievement
    if (allConditionsMet) {
      updatedPlayerAchievement.isUnlocked = true;
      updatedPlayerAchievement.unlockedAt = new Date().toISOString();
      newlyUnlocked.push(achievement);
    }
    
    // Add to updated progress map
    updatedProgress.set(achievement.id, updatedPlayerAchievement);
  }
  
  return { newlyUnlocked, updatedProgress };
}

/**
 * Grant rewards from an achievement to the player profile
 */
export function grantRewards(
  rewards: AchievementReward[],
  playerProfile: PlayerProfile
): PlayerProfile {
  const updatedProfile = { ...playerProfile };
  
  for (const reward of rewards) {
    switch (reward.type) {
      case 'unlock_species':
        if (typeof reward.value === 'string') {
          if (!updatedProfile.unlockedSpecies.includes(reward.value)) {
            updatedProfile.unlockedSpecies = [...updatedProfile.unlockedSpecies, reward.value];
          }
        }
        break;
      
      case 'unlock_dao':
        if (typeof reward.value === 'string') {
          if (!updatedProfile.unlockedDaos.includes(reward.value)) {
            updatedProfile.unlockedDaos = [...updatedProfile.unlockedDaos, reward.value];
          }
        }
        break;
      
      case 'unlock_title':
        if (typeof reward.value === 'string') {
          if (!updatedProfile.unlockedTitles.includes(reward.value)) {
            updatedProfile.unlockedTitles = [...updatedProfile.unlockedTitles, reward.value];
          }
        }
        break;
      
      case 'grant_qi':
        // Note: Qi currency is not currently tracked in PlayerProfile
        // This would need to be added to the profile stats or handled separately
        // For now, we'll log it
        console.log(`Granted ${reward.value} Qi to player`);
        break;
      
      case 'unlock_cosmetic':
        // Note: Cosmetics are not currently tracked in PlayerProfile
        // This would need to be added as a new field
        // For now, we'll log it
        console.log(`Unlocked cosmetic: ${reward.value}`);
        break;
      
      default:
        console.warn(`Unknown reward type: ${(reward as AchievementReward).type}`);
    }
  }
  
  return updatedProfile;
}
