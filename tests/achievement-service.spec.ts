import { test, expect } from '@playwright/test';
import {
  getConditionValue,
  compareValues,
  evaluateAchievements,
  grantRewards,
  type GameState
} from '../shared/utils/achievement-service';
import type {
  Achievement,
  AchievementCondition,
  PlayerAchievement,
  PlayerProfile
} from '../shared/types/composition-types';

test.describe('Achievement Service - Condition Value Extraction', () => {
  const mockGameState: GameState = {
    currentWave: 10,
    score: 5000,
    castleHealth: 800,
    maxCastleHealth: 1000,
    totalEnemiesDefeated: 50,
    cultivatorsDeployed: 5,
    damageTaken: 0
  };

  test('should extract wave_complete value', () => {
    const value = getConditionValue('wave_complete', mockGameState);
    expect(value).toBe(10);
  });

  test('should extract enemy_defeat_count value', () => {
    const value = getConditionValue('enemy_defeat_count', mockGameState);
    expect(value).toBe(50);
  });

  test('should extract score_threshold value', () => {
    const value = getConditionValue('score_threshold', mockGameState);
    expect(value).toBe(5000);
  });

  test('should extract castle_health_preserved as percentage', () => {
    const value = getConditionValue('castle_health_preserved', mockGameState);
    expect(value).toBe(0.8); // 800/1000
  });

  test('should extract cultivator_deploy_count value', () => {
    const value = getConditionValue('cultivator_deploy_count', mockGameState);
    expect(value).toBe(5);
  });

  test('should extract win_without_damage value', () => {
    const value = getConditionValue('win_without_damage', mockGameState);
    expect(value).toBe(1); // No damage taken
  });

  test('should return 0 for win_without_damage when damage taken', () => {
    const stateWithDamage = { ...mockGameState, damageTaken: 100 };
    const value = getConditionValue('win_without_damage', stateWithDamage);
    expect(value).toBe(0);
  });
});

test.describe('Achievement Service - Value Comparison', () => {
  test('should compare with equals operator', () => {
    expect(compareValues(10, 10, 'equals')).toBe(true);
    expect(compareValues(10, 5, 'equals')).toBe(false);
  });

  test('should compare with greater_than operator', () => {
    expect(compareValues(15, 10, 'greater_than')).toBe(true);
    expect(compareValues(10, 10, 'greater_than')).toBe(false);
    expect(compareValues(5, 10, 'greater_than')).toBe(false);
  });

  test('should compare with less_than operator', () => {
    expect(compareValues(5, 10, 'less_than')).toBe(true);
    expect(compareValues(10, 10, 'less_than')).toBe(false);
    expect(compareValues(15, 10, 'less_than')).toBe(false);
  });

  test('should compare with greater_or_equal operator', () => {
    expect(compareValues(15, 10, 'greater_or_equal')).toBe(true);
    expect(compareValues(10, 10, 'greater_or_equal')).toBe(true);
    expect(compareValues(5, 10, 'greater_or_equal')).toBe(false);
  });
});

test.describe('Achievement Service - Achievement Evaluation', () => {
  const mockAchievement: Achievement = {
    id: 'ach-1',
    key: 'wave_10',
    name: 'Wave Master',
    emoji: '🌊',
    description: 'Complete wave 10',
    conditions: [
      {
        type: 'wave_complete',
        targetValue: 10,
        comparisonOperator: 'greater_or_equal',
        isTrackable: true,
        progressLabel: 'Waves Completed'
      }
    ],
    rewards: [
      {
        type: 'unlock_species',
        value: 'species-1',
        displayName: 'Unlock Dragon Species'
      }
    ],
    sortOrder: 1,
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPlayerAchievement: PlayerAchievement = {
    id: 'pa-1',
    playerId: 'player-1',
    achievementId: 'ach-1',
    progress: { '0': 5 },
    isUnlocked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockGameState: GameState = {
    currentWave: 10,
    score: 5000,
    castleHealth: 1000,
    maxCastleHealth: 1000,
    totalEnemiesDefeated: 50,
    cultivatorsDeployed: 5,
    damageTaken: 0
  };

  test('should unlock achievement when condition is met', () => {
    const result = evaluateAchievements(
      [mockAchievement],
      [mockPlayerAchievement],
      mockGameState
    );

    expect(result.newlyUnlocked).toHaveLength(1);
    expect(result.newlyUnlocked[0].id).toBe('ach-1');
    
    const updatedProgress = result.updatedProgress.get('ach-1');
    expect(updatedProgress?.isUnlocked).toBe(true);
    expect(updatedProgress?.unlockedAt).toBeDefined();
  });

  test('should not unlock achievement when condition is not met', () => {
    const gameStateNotMet = { ...mockGameState, currentWave: 5 };
    
    const result = evaluateAchievements(
      [mockAchievement],
      [mockPlayerAchievement],
      gameStateNotMet
    );

    expect(result.newlyUnlocked).toHaveLength(0);
    
    const updatedProgress = result.updatedProgress.get('ach-1');
    expect(updatedProgress?.isUnlocked).toBe(false);
  });

  test('should track progress for trackable conditions', () => {
    const gameStateInProgress = { ...mockGameState, currentWave: 7 };
    
    const result = evaluateAchievements(
      [mockAchievement],
      [mockPlayerAchievement],
      gameStateInProgress
    );

    const updatedProgress = result.updatedProgress.get('ach-1');
    expect(updatedProgress?.progress['0']).toBe(7);
  });

  test('should skip already unlocked achievements', () => {
    const unlockedPlayerAchievement: PlayerAchievement = {
      ...mockPlayerAchievement,
      isUnlocked: true,
      unlockedAt: '2024-01-01T00:00:00Z'
    };

    const result = evaluateAchievements(
      [mockAchievement],
      [unlockedPlayerAchievement],
      mockGameState
    );

    expect(result.newlyUnlocked).toHaveLength(0);
    expect(result.updatedProgress.size).toBe(0);
  });
});

test.describe('Achievement Service - Multi-Condition Achievements', () => {
  const multiConditionAchievement: Achievement = {
    id: 'ach-multi',
    key: 'perfect_wave_10',
    name: 'Perfect Wave 10',
    emoji: '⭐',
    description: 'Complete wave 10 without taking damage',
    conditions: [
      {
        type: 'wave_complete',
        targetValue: 10,
        comparisonOperator: 'greater_or_equal',
        isTrackable: true,
        progressLabel: 'Waves Completed'
      },
      {
        type: 'win_without_damage',
        targetValue: 1,
        comparisonOperator: 'equals',
        isTrackable: false
      }
    ],
    rewards: [
      {
        type: 'unlock_title',
        value: 'title-1',
        displayName: 'Unlock Perfect Master Title'
      }
    ],
    sortOrder: 2,
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPlayerAchievement: PlayerAchievement = {
    id: 'pa-multi',
    playerId: 'player-1',
    achievementId: 'ach-multi',
    progress: {},
    isUnlocked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  test('should unlock when all conditions are met', () => {
    const gameState: GameState = {
      currentWave: 10,
      score: 5000,
      castleHealth: 1000,
      maxCastleHealth: 1000,
      totalEnemiesDefeated: 50,
      cultivatorsDeployed: 5,
      damageTaken: 0
    };

    const result = evaluateAchievements(
      [multiConditionAchievement],
      [mockPlayerAchievement],
      gameState
    );

    expect(result.newlyUnlocked).toHaveLength(1);
    expect(result.newlyUnlocked[0].id).toBe('ach-multi');
  });

  test('should not unlock when only some conditions are met', () => {
    const gameState: GameState = {
      currentWave: 10,
      score: 5000,
      castleHealth: 800,
      maxCastleHealth: 1000,
      totalEnemiesDefeated: 50,
      cultivatorsDeployed: 5,
      damageTaken: 200 // Damage taken, so win_without_damage fails
    };

    const result = evaluateAchievements(
      [multiConditionAchievement],
      [mockPlayerAchievement],
      gameState
    );

    expect(result.newlyUnlocked).toHaveLength(0);
  });

  test('should track progress for each trackable condition', () => {
    const gameState: GameState = {
      currentWave: 7,
      score: 3000,
      castleHealth: 1000,
      maxCastleHealth: 1000,
      totalEnemiesDefeated: 30,
      cultivatorsDeployed: 3,
      damageTaken: 0
    };

    const result = evaluateAchievements(
      [multiConditionAchievement],
      [mockPlayerAchievement],
      gameState
    );

    const updatedProgress = result.updatedProgress.get('ach-multi');
    expect(updatedProgress?.progress['0']).toBe(7); // First condition is trackable
    expect(updatedProgress?.progress['1']).toBeUndefined(); // Second condition is not trackable
  });
});

test.describe('Achievement Service - Reward Distribution', () => {
  const mockPlayerProfile: PlayerProfile = {
    id: 'player-1',
    anonymousId: 'anon-123',
    stats: {
      totalGamesPlayed: 10,
      highestWave: 8,
      highestScore: 4000,
      totalEnemiesDefeated: 100,
      totalCultivatorsDeployed: 20
    },
    unlockedSpecies: ['species-default'],
    unlockedDaos: ['dao-default'],
    unlockedTitles: ['title-default'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  test('should unlock species reward', () => {
    const rewards = [
      {
        type: 'unlock_species' as const,
        value: 'species-dragon',
        displayName: 'Dragon Species'
      }
    ];

    const updatedProfile = grantRewards(rewards, mockPlayerProfile);
    
    expect(updatedProfile.unlockedSpecies).toContain('species-dragon');
    expect(updatedProfile.unlockedSpecies).toHaveLength(2);
  });

  test('should unlock dao reward', () => {
    const rewards = [
      {
        type: 'unlock_dao' as const,
        value: 'dao-lightning',
        displayName: 'Lightning Dao'
      }
    ];

    const updatedProfile = grantRewards(rewards, mockPlayerProfile);
    
    expect(updatedProfile.unlockedDaos).toContain('dao-lightning');
    expect(updatedProfile.unlockedDaos).toHaveLength(2);
  });

  test('should unlock title reward', () => {
    const rewards = [
      {
        type: 'unlock_title' as const,
        value: 'title-master',
        displayName: 'Master Title'
      }
    ];

    const updatedProfile = grantRewards(rewards, mockPlayerProfile);
    
    expect(updatedProfile.unlockedTitles).toContain('title-master');
    expect(updatedProfile.unlockedTitles).toHaveLength(2);
  });

  test('should not duplicate unlocked content', () => {
    const rewards = [
      {
        type: 'unlock_species' as const,
        value: 'species-default', // Already unlocked
        displayName: 'Default Species'
      }
    ];

    const updatedProfile = grantRewards(rewards, mockPlayerProfile);
    
    expect(updatedProfile.unlockedSpecies).toHaveLength(1);
    expect(updatedProfile.unlockedSpecies.filter(s => s === 'species-default')).toHaveLength(1);
  });

  test('should handle multiple rewards', () => {
    const rewards = [
      {
        type: 'unlock_species' as const,
        value: 'species-dragon',
        displayName: 'Dragon Species'
      },
      {
        type: 'unlock_dao' as const,
        value: 'dao-lightning',
        displayName: 'Lightning Dao'
      },
      {
        type: 'unlock_title' as const,
        value: 'title-master',
        displayName: 'Master Title'
      }
    ];

    const updatedProfile = grantRewards(rewards, mockPlayerProfile);
    
    expect(updatedProfile.unlockedSpecies).toContain('species-dragon');
    expect(updatedProfile.unlockedDaos).toContain('dao-lightning');
    expect(updatedProfile.unlockedTitles).toContain('title-master');
  });
});

test.describe('Achievement Service - Edge Cases', () => {
  test('should handle empty achievements array', () => {
    const gameState: GameState = {
      currentWave: 10,
      score: 5000,
      castleHealth: 1000,
      maxCastleHealth: 1000,
      totalEnemiesDefeated: 50,
      cultivatorsDeployed: 5,
      damageTaken: 0
    };

    const result = evaluateAchievements([], [], gameState);
    
    expect(result.newlyUnlocked).toHaveLength(0);
    expect(result.updatedProgress.size).toBe(0);
  });

  test('should handle achievement with no conditions', () => {
    const noConditionAchievement: Achievement = {
      id: 'ach-no-cond',
      key: 'instant',
      name: 'Instant Achievement',
      emoji: '⚡',
      description: 'Unlocked immediately',
      conditions: [],
      rewards: [],
      sortOrder: 1,
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    const playerAchievement: PlayerAchievement = {
      id: 'pa-no-cond',
      playerId: 'player-1',
      achievementId: 'ach-no-cond',
      progress: {},
      isUnlocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    const gameState: GameState = {
      currentWave: 1,
      score: 0,
      castleHealth: 1000,
      maxCastleHealth: 1000,
      totalEnemiesDefeated: 0,
      cultivatorsDeployed: 0,
      damageTaken: 0
    };

    const result = evaluateAchievements(
      [noConditionAchievement],
      [playerAchievement],
      gameState
    );

    // Achievement with no conditions should be unlocked immediately
    expect(result.newlyUnlocked).toHaveLength(1);
  });

  test('should handle invalid reward types gracefully', () => {
    const invalidReward = {
      type: 'invalid_type' as any,
      value: 'test',
      displayName: 'Invalid Reward'
    };

    const mockPlayerProfile: PlayerProfile = {
      id: 'player-1',
      anonymousId: 'anon-123',
      stats: {
        totalGamesPlayed: 0,
        highestWave: 0,
        highestScore: 0,
        totalEnemiesDefeated: 0,
        totalCultivatorsDeployed: 0
      },
      unlockedSpecies: [],
      unlockedDaos: [],
      unlockedTitles: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    // Should not throw error
    const updatedProfile = grantRewards([invalidReward], mockPlayerProfile);
    expect(updatedProfile).toBeDefined();
  });
});
