import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameBoard } from './components/game-board';
import { TowerDetailsDialog } from './components/tower-details-dialog';
import { ItemNotification } from './components/item-notification';
import { MapSelection } from './components/map-selection';
import { findPath, findBlockingTower, findPathToTower } from './utils/pathfinding';
import { soundManager } from './utils/sound-manager';
import { CultivatorTypes, getCultivatorConfig } from './utils/cultivator';
import { rollItemDrop } from './utils/items';
import { getXPReward, checkLevelUp, getXPForLevel } from './utils/experience';
import { calculateTowerStats } from './utils/stat-calculator';
import { getRandomEnemyType, getEnemyStats } from './utils/enemy-codex';
import { applyBuildToTower, updateBuildFromTower } from './utils/cultivator-builds';
import type { Map, TileType } from '../shared/types/map';
import { mapService } from '../shared/utils/map-service';
import { TileGrid } from '../shared/utils/tile-helper';
import { personTypeService } from '../shared/utils/person-type-service';
import { waveConfigService } from '../shared/utils/wave-config-service';
import { generateRandomCultivators, generateRandomCultivatorsWithComposition } from '../shared/utils/cultivator-generator';
import type { PersonType, WaveConfiguration, EntityInstance } from '../shared/types/person-types';
import { loadSpecies, loadDaos, loadTitles, loadAchievements } from '../shared/utils/composition-data-service';
import { loadPlayerAchievements, updateAchievementProgress, unlockAchievement, updatePlayerStats } from '../shared/utils/player-profile-service';
import { loadPlayerProfile } from '../shared/utils/authenticated-player-profile-service';
import type { Species, Dao, Title, Achievement, PlayerProfile, PlayerAchievement } from '../shared/types/composition-types';
import { evaluateAchievements, grantRewards } from '../shared/utils/achievement-service';
import type { GameState as AchievementGameState } from '../shared/utils/achievement-service';
import { AchievementPopup } from './components/achievement-popup';

// Tower interface - transitioning to EntityInstance structure
// Maintains backward compatibility while aligning with new Person Type system
export interface Tower {
  id: string;
  type: string; // Person Type key (e.g., 'sword_cultivator', 'cultivator_0')
  x: number;
  y: number;
  range: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  cost: number;
  health: number;
  maxHealth: number;
  // RPG System fields (maps to DefenderState in EntityInstance)
  level: number; // Cultivator level (1-10)
  experience: number; // Current XP
  equippedSkills: string[]; // Skill IDs (max 3)
  inventory: string[]; // Item IDs (max 3: weapon, armor, accessory)
  kills: number; // Track kills for this cultivator
  baseStats: {
    damage: number;
    attackSpeed: number;
    range: number;
    health: number;
  };
  // Optional EntityInstance compatibility fields
  personTypeId?: string; // Reference to Person Type UUID
  personTypeKey?: string; // Reference to Person Type key
  emoji?: string; // Visual representation
  name?: string; // Display name
}

// Type alias for backward compatibility - Tower is essentially a defender EntityInstance
// This allows gradual migration to the EntityInstance structure
export type DefenderInstance = Tower;

// Enemy interface - transitioning to EntityInstance structure
// Maintains backward compatibility while aligning with new Person Type system
export interface Enemy {
  id: string;
  type: 'demon' | 'shadow' | 'beast' | 'wraith' | 'golem' | 'dragon' | string; // Allow string for Person Type keys
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  pathProgress: number;
  reward: number;
  path: { x: number; y: number }[] | null;
  currentPathIndex: number;
  // Combat stats (for EntityInstance compatibility)
  damage?: number; // Damage dealt per attack
  attackSpeed?: number; // Milliseconds between attacks
  range?: number; // Attack range in pixels
  // Attacker state (maps to attackerState in EntityInstance)
  isAttackingCastle: boolean;
  lastCastleAttack: number;
  attackBounceProgress: number;
  isAttackingTower: boolean;
  targetTowerId: string | null;
  lastTowerAttack: number;
  // Optional EntityInstance compatibility fields
  personTypeId?: string; // Reference to Person Type UUID
  personTypeKey?: string; // Reference to Person Type key
  emoji?: string; // Visual representation
  name?: string; // Display name
}

// Type alias for backward compatibility - Enemy is essentially an attacker EntityInstance
// This allows gradual migration to the EntityInstance structure
export type AttackerInstance = Enemy;

export interface Projectile {
  id: string;
  type: string; // Changed from union type to string to support dynamic cultivator types
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetId: string;
  targetTowerId: string; // Track which tower fired this projectile
  damage: number;
  progress: number;
  speed: number;
}

export interface DroppedItem {
  id: string;
  itemId: string; // Reference to item in items.ts
  x: number;
  y: number;
  spawnTime: number; // For despawn after timeout
}

export interface GameState {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  droppedItems: DroppedItem[]; // Items on the ground
  castleHealth: number;
  maxCastleHealth: number;
  qi: number;
  wave: number;
  score: number;
  gameStatus: 'playing' | 'paused' | 'gameOver' | 'victory';
  enemiesAttackingCastle: string[];
  damagedEnemies: Set<string>;
  castleDamaged: boolean;
  damagedTowers: Set<string>;
  enemiesDefeated: number;
  cultivatorsDeployed: number;
  gameStartTime: number;
  gameTimeElapsed: number; // Accumulated game time in seconds (accounts for speed and pauses)
  levelUpAnimations: Set<string>; // Towers that just leveled up
  damageTaken: number; // Track total damage taken for achievements
}

export interface ItemPickup {
  id: string;
  itemId: string;
  towerName: string;
  timestamp: number;
}

// Fallback tower types for backward compatibility
const FALLBACK_TOWER_TYPES = {
  sword: getCultivatorConfig('sword'),
  palm: getCultivatorConfig('palm'),
  arrow: getCultivatorConfig('arrow'),
  lightning: getCultivatorConfig('lightning'),
};

export default function App() {
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [tileTypes, setTileTypes] = useState<TileType[]>([]);
  
  // Person Types and Wave Configurations
  const [personTypes, setPersonTypes] = useState<PersonType[]>([]);
  const [waveConfigurations, setWaveConfigurations] = useState<globalThis.Map<number, WaveConfiguration>>(new globalThis.Map());
  const [generatedCultivators, setGeneratedCultivators] = useState<EntityInstance[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Composition System Data
  const [species, setSpecies] = useState<Species[]>([]);
  const [daos, setDaos] = useState<Dao[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Player Profile and Achievements
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [playerAchievements, setPlayerAchievements] = useState<PlayerAchievement[]>([]);
  
  // Compute TOWER_TYPES from generated cultivators or use fallback
  const TOWER_TYPES = useMemo(() => {
    if (generatedCultivators.length === 4) {
      // Convert generated cultivators to TOWER_TYPES format
      return {
        cultivator_0: {
          name: generatedCultivators[0].name,
          cost: 50, // Use default cost for now
          range: generatedCultivators[0].range,
          damage: generatedCultivators[0].damage,
          attackSpeed: generatedCultivators[0].attackSpeed,
          emoji: generatedCultivators[0].emoji,
          health: generatedCultivators[0].maxHealth,
          rangeInTiles: generatedCultivators[0].range / 30,
          description: `Generated ${generatedCultivators[0].name}`,
        },
        cultivator_1: {
          name: generatedCultivators[1].name,
          cost: 75,
          range: generatedCultivators[1].range,
          damage: generatedCultivators[1].damage,
          attackSpeed: generatedCultivators[1].attackSpeed,
          emoji: generatedCultivators[1].emoji,
          health: generatedCultivators[1].maxHealth,
          rangeInTiles: generatedCultivators[1].range / 30,
          description: `Generated ${generatedCultivators[1].name}`,
        },
        cultivator_2: {
          name: generatedCultivators[2].name,
          cost: 100,
          range: generatedCultivators[2].range,
          damage: generatedCultivators[2].damage,
          attackSpeed: generatedCultivators[2].attackSpeed,
          emoji: generatedCultivators[2].emoji,
          health: generatedCultivators[2].maxHealth,
          rangeInTiles: generatedCultivators[2].range / 30,
          description: `Generated ${generatedCultivators[2].name}`,
        },
        cultivator_3: {
          name: generatedCultivators[3].name,
          cost: 150,
          range: generatedCultivators[3].range,
          damage: generatedCultivators[3].damage,
          attackSpeed: generatedCultivators[3].attackSpeed,
          emoji: generatedCultivators[3].emoji,
          health: generatedCultivators[3].maxHealth,
          rangeInTiles: generatedCultivators[3].range / 30,
          description: `Generated ${generatedCultivators[3].name}`,
        },
      };
    }
    // Fallback to original tower types
    return FALLBACK_TOWER_TYPES;
  }, [generatedCultivators]);
  
  const [gameState, setGameState] = useState<GameState>({
    towers: [],
    enemies: [],
    projectiles: [],
    droppedItems: [],
    castleHealth: 100,
    maxCastleHealth: 100,
    qi: 200,
    wave: 1,
    score: 0,
    gameStatus: 'playing',
    enemiesAttackingCastle: [],
    damagedEnemies: new Set(),
    castleDamaged: false,
    damagedTowers: new Set(),
    enemiesDefeated: 0,
    cultivatorsDeployed: 0,
    gameStartTime: Date.now(),
    gameTimeElapsed: 0,
    levelUpAnimations: new Set(),
    damageTaken: 0,
  });

  // Achievement popup state
  const [achievementPopupOpen, setAchievementPopupOpen] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  const [selectedTowerType, setSelectedTowerType] = useState<string | null>(null);
  const [waveInProgress, setWaveInProgress] = useState(false);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1); // 0 = paused, 1 = 1x, 2 = 2x, 3 = 3x
  const [menuOpen, setMenuOpen] = useState(false);
  const [previousGameSpeed, setPreviousGameSpeed] = useState(1); // Track speed before opening menu
  const [waveCountdown, setWaveCountdown] = useState<number | null>(null); // Countdown in seconds (30, 29, 28... 1, null)
  const WAVE_DURATION = 30; // 30 seconds per wave
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track spawn interval for cleanup
  const gameSpeedRef = useRef(gameSpeed); // Track current game speed
  const lastTimeUpdateRef = useRef<number>(0); // Track last time update for accurate accumulation
  const gameStartedRef = useRef(false); // Track if game has actually started
  const [itemPickups, setItemPickups] = useState<ItemPickup[]>([]); // Track item pickups for notifications

  // Create TileGrid instance for pathfinding
  const tileGrid = useMemo(() => {
    if (!selectedMap || tileTypes.length === 0) {
      return null;
    }
    return new TileGrid(selectedMap, tileTypes);
  }, [selectedMap, tileTypes]);

  // Load tile types when component mounts
  useEffect(() => {
    const loadTileTypes = async () => {
      try {
        const types = await mapService.getTileTypes();
        setTileTypes(types);
      } catch (error) {
        console.error('Error loading tile types:', error);
      }
    };
    loadTileTypes();
  }, []);

  // Retry helper with exponential backoff (optimized for fast failures)
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 500
  ): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  };

  // Load Person Types on mount and generate random cultivators
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      setDataError(null);
      
      try {
        // Load critical data first (person types only - needed for game to work)
        const types = await retryWithBackoff(() => personTypeService.loadPersonTypes(), 2, 500);
        setPersonTypes(types);
        
        // Load composition data in parallel (non-blocking, with faster retry)
        const compositionPromises = Promise.allSettled([
          retryWithBackoff(() => loadSpecies(), 2, 500),
          retryWithBackoff(() => loadDaos(), 2, 500),
          retryWithBackoff(() => loadTitles(), 2, 500),
          retryWithBackoff(() => loadAchievements(), 2, 500),
          retryWithBackoff(() => loadPlayerProfile(), 2, 500)
        ]);
        
        // Generate cultivators immediately with person types (don't wait for composition data)
        try {
          const cultivators = generateRandomCultivators(types, 4);
          setGeneratedCultivators(cultivators);
          console.log('Generated cultivators from person types:', cultivators);
        } catch (error) {
          console.error('Error generating cultivators:', error);
          // Continue without generated cultivators - will fall back to TOWER_TYPES
        }
        
        // Mark as loaded immediately so user can start playing
        setDataLoading(false);
        
        // Handle composition data results in background
        compositionPromises.then(results => {
          const [speciesResult, daosResult, titlesResult, achievementsResult, profileResult] = results;
          
          if (speciesResult.status === 'fulfilled') setSpecies(speciesResult.value);
          if (daosResult.status === 'fulfilled') setDaos(daosResult.value);
          if (titlesResult.status === 'fulfilled') setTitles(titlesResult.value);
          if (achievementsResult.status === 'fulfilled') setAchievements(achievementsResult.value);
          if (profileResult.status === 'fulfilled') {
            setPlayerProfile(profileResult.value);
            
            // Load player achievements in background
            loadPlayerAchievements(profileResult.value.id).then(playerAchievementsData => {
              setPlayerAchievements(playerAchievementsData);
              console.log('Loaded player achievements:', playerAchievementsData.length);
            }).catch(error => {
              console.error('Error loading player achievements:', error);
            });
          }
          
          // Regenerate cultivators with composition system if available
          if (speciesResult.status === 'fulfilled' && 
              daosResult.status === 'fulfilled' && 
              titlesResult.status === 'fulfilled' &&
              speciesResult.value.length > 0 &&
              daosResult.value.length > 0 &&
              titlesResult.value.length > 0) {
            try {
              console.log('Regenerating cultivators with composition system');
              const cultivators = generateRandomCultivatorsWithComposition(
                speciesResult.value,
                daosResult.value,
                titlesResult.value,
                4
              );
              setGeneratedCultivators(cultivators);
              console.log('Regenerated cultivators with composition:', cultivators);
            } catch (error) {
              console.error('Error regenerating cultivators with composition:', error);
            }
          }
        });
        
        // Load initial Wave Configurations (waves 1-5 for now)
        const waveConfigMap = new Map<number, WaveConfiguration>();
        for (let wave = 1; wave <= 5; wave++) {
          try {
            const config = await waveConfigService.loadWaveConfiguration(wave);
            if (config) {
              waveConfigMap.set(wave, config);
            }
          } catch (error) {
            console.warn(`Failed to load wave ${wave} configuration:`, error);
            // Continue loading other waves even if one fails
          }
        }
        setWaveConfigurations(waveConfigMap);
        
        setDataLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load game data');
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle map selection
  const handleMapSelected = (map: Map) => {
    setSelectedMap(map);
  };

  // Handle quit to map
  const handleQuitToMap = () => {
    // Reset game state
    resetGame();
    // Return to map selection
    setSelectedMap(null);
    // Stop background music
    soundManager.stopBackgroundMusic();
  };

  // Clean up old item pickups (older than 5 seconds)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setItemPickups(prev => prev.filter(p => now - p.timestamp < 5000));
    }, 1000);
    
    return () => clearInterval(cleanup);
  }, []);

  const spawnEnemy = useCallback((towers: Tower[], personTypeId?: string) => {
    const GRID_SIZE = 30;
    const COLS = 15;
    
    // Helper function to find a valid spawn position
    const findValidSpawnPosition = (): { x: number; y: number } => {
      const spawnRow = 0; // Top row
      const maxAttempts = 50;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomCol = Math.floor(Math.random() * COLS);
        
        // Check if this tile is walkable
        if (tileGrid) {
          const tile = tileGrid.getTileAt(randomCol, spawnRow);
          if (tile && tile.pathfinding.isWalkable) {
            return {
              x: randomCol * GRID_SIZE + GRID_SIZE / 2,
              y: spawnRow * GRID_SIZE + GRID_SIZE / 2
            };
          }
        } else {
          // If no tileGrid, just use random position (fallback)
          return {
            x: randomCol * GRID_SIZE + GRID_SIZE / 2,
            y: spawnRow * GRID_SIZE + GRID_SIZE / 2
          };
        }
      }
      
      // Fallback: spawn in center if no valid position found
      return {
        x: Math.floor(COLS / 2) * GRID_SIZE + GRID_SIZE / 2,
        y: spawnRow * GRID_SIZE + GRID_SIZE / 2
      };
    };
    
    // If personTypeId is provided, use it; otherwise fall back to old system
    if (personTypeId) {
      // Find the Person Type
      const personType = personTypes.find(pt => pt.id === personTypeId);
      
      if (!personType || !personType.attackerConfig) {
        console.error(`Person Type ${personTypeId} not found or not an attacker, falling back to old system`);
        // Fall back to old system
        const enemyType = getRandomEnemyType(gameState.wave);
        const enemyStats = getEnemyStats(enemyType, gameState.wave);
        
        const spawnPos = findValidSpawnPosition();
        const path = findPath(spawnPos.x, spawnPos.y, towers, tileGrid || undefined);
        
        return {
          id: `enemy-${Date.now()}-${Math.random()}`,
          type: enemyType,
          x: spawnPos.x,
          y: spawnPos.y,
          health: enemyStats.health,
          maxHealth: enemyStats.health,
          speed: enemyStats.speed,
          pathProgress: 0,
          reward: enemyStats.reward,
          path: path,
          currentPathIndex: 0,
          // Combat stats from enemy codex
          damage: enemyStats.damage,
          attackSpeed: 2000, // Default attack speed (2 seconds)
          range: 35, // Default melee range
          isAttackingCastle: false,
          lastCastleAttack: 0,
          attackBounceProgress: 0,
          isAttackingTower: false,
          targetTowerId: null,
          lastTowerAttack: 0,
        };
      }
      
      // Create EntityInstance using Person Type
      const spawnPos = findValidSpawnPosition();
      const path = findPath(spawnPos.x, spawnPos.y, towers, tileGrid || undefined);
      
      // Apply wave scaling to health (30% more per wave)
      const healthMultiplier = 1 + (gameState.wave - 1) * 0.3;
      const scaledHealth = Math.round(personType.baseStats.health * healthMultiplier);
      
      return {
        id: `enemy-${Date.now()}-${Math.random()}`,
        type: personType.key as any, // Use key as type for backward compatibility
        x: spawnPos.x,
        y: spawnPos.y,
        health: scaledHealth,
        maxHealth: scaledHealth,
        speed: personType.baseStats.movementSpeed,
        pathProgress: 0,
        reward: personType.attackerConfig.reward,
        path: path,
        currentPathIndex: 0,
        // Combat stats from Person Type
        damage: personType.baseStats.damage,
        attackSpeed: personType.baseStats.attackSpeed,
        range: personType.baseStats.range,
        // Attacker state (maps to attackerState in EntityInstance)
        isAttackingCastle: false,
        lastCastleAttack: 0,
        attackBounceProgress: 0,
        isAttackingTower: false,
        targetTowerId: null,
        lastTowerAttack: 0,
        // EntityInstance compatibility fields
        personTypeId: personType.id,
        personTypeKey: personType.key,
        emoji: personType.emoji,
        name: personType.name,
      };
    }
    
    // Fallback to old system if no personTypeId provided
    const enemyType = getRandomEnemyType(gameState.wave);
    const enemyStats = getEnemyStats(enemyType, gameState.wave);

    const spawnPos = findValidSpawnPosition();
    const path = findPath(spawnPos.x, spawnPos.y, towers, tileGrid || undefined);

    return {
      id: `enemy-${Date.now()}-${Math.random()}`,
      type: enemyType,
      x: spawnPos.x,
      y: spawnPos.y,
      health: enemyStats.health,
      maxHealth: enemyStats.health,
      speed: enemyStats.speed,
      pathProgress: 0,
      reward: enemyStats.reward,
      path: path,
      currentPathIndex: 0,
      // Combat stats from enemy codex
      damage: enemyStats.damage,
      attackSpeed: 2000, // Default attack speed (2 seconds)
      range: 35, // Default melee range
      isAttackingCastle: false,
      lastCastleAttack: 0,
      attackBounceProgress: 0,
      isAttackingTower: false,
      targetTowerId: null,
      lastTowerAttack: 0,
    };
  }, [gameState.wave, personTypes, tileGrid]);

  const startWave = useCallback(async (forceStart = false) => {
    // Allow forcing wave start even if one is in progress (for Skip functionality)
    if (!forceStart && (waveInProgress || gameState.gameStatus !== 'playing')) return;
    
    // Clear any existing spawn interval before starting a new wave
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    
    setWaveInProgress(true);
    setWaveCountdown(WAVE_DURATION); // Start countdown when wave begins
    
    // Try to load wave configuration
    let waveConfig: WaveConfiguration | null = null;
    try {
      waveConfig = await waveConfigService.loadWaveConfiguration(gameState.wave);
    } catch (error) {
      console.error(`Failed to load wave ${gameState.wave} configuration:`, error);
      // Will fall back to old system below
    }
    
    // If we have a wave configuration, use it
    if (waveConfig && waveConfig.spawns.length > 0) {
      console.log(`Using wave configuration for wave ${gameState.wave}:`, waveConfig);
      
      // Process each spawn group
      waveConfig.spawns.forEach((spawn, spawnIndex) => {
        let spawnedInGroup = 0;
        
        // Apply spawn delay before starting this group
        setTimeout(() => {
          const groupInterval = setInterval(() => {
            // Check if game is paused
            if (gameSpeed === 0) {
              return;
            }
            
            if (spawnedInGroup >= spawn.count) {
              clearInterval(groupInterval);
              return;
            }
            
            setGameState(prev => ({
              ...prev,
              enemies: [...prev.enemies, spawnEnemy(prev.towers, spawn.personTypeId)],
            }));
            spawnedInGroup++;
          }, spawn.spawnInterval);
          
          // Store reference for cleanup (only for the last group)
          if (spawnIndex === waveConfig!.spawns.length - 1) {
            spawnIntervalRef.current = groupInterval;
          }
        }, spawn.spawnDelay);
      });
      
      // Set wave as not in progress after all spawns complete
      // Calculate total spawn time
      const totalTime = waveConfig.spawns.reduce((max, spawn) => {
        const groupTime = spawn.spawnDelay + (spawn.count * spawn.spawnInterval);
        return Math.max(max, groupTime);
      }, 0);
      
      setTimeout(() => {
        setWaveInProgress(false);
      }, totalTime);
      
    } else {
      // Fall back to old system
      console.log(`No wave configuration found for wave ${gameState.wave}, using old spawn system`);
      const enemyCount = 5 + gameState.wave * 2;
      let spawned = 0;

      const spawnInterval = setInterval(() => {
        // Check if game is paused - if so, skip spawning this tick
        if (gameSpeed === 0) {
          return;
        }

        if (spawned >= enemyCount) {
          clearInterval(spawnInterval);
          spawnIntervalRef.current = null;
          setWaveInProgress(false);
          return;
        }

        setGameState(prev => ({
          ...prev,
          enemies: [...prev.enemies, spawnEnemy(prev.towers)],
        }));
        spawned++;
      }, 1500);

      spawnIntervalRef.current = spawnInterval; // Store reference for cleanup
    }

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [waveInProgress, gameState.gameStatus, gameState.wave, spawnEnemy, gameSpeed]);

  // Wave countdown: Tick down during wave and auto-start next wave when it reaches 0
  useEffect(() => {
    // Only run countdown if a wave countdown is active and game is not paused
    if (waveCountdown !== null && waveCountdown > 0 && gameSpeed !== 0 && gameState.gameStatus === 'playing') {
      const countdownInterval = setInterval(() => {
        setWaveCountdown(prev => {
          if (prev === null || prev <= 0) {
            return null;
          }
          
          // When countdown reaches 1, it will become 0 and trigger next wave
          if (prev === 1) {
            // Auto-start next wave
            setGameState(prevState => ({ ...prevState, wave: prevState.wave + 1 }));
            startWave();
            return null;
          }
          
          return prev - 1;
        });
      }, 1000); // Tick every second

      return () => {
        clearInterval(countdownInterval);
      };
    }
  }, [waveCountdown, gameSpeed, gameState.gameStatus, startWave]);

  // Clear damage effects after a brief delay (independent of game loop/pause)
  useEffect(() => {
    if (gameState.castleDamaged) {
      // Play castle damaged sound
      soundManager.playCastleDamaged();
      
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, castleDamaged: false }));
      }, 200); // Flash for 200ms

      return () => clearTimeout(timeout);
    }
  }, [gameState.castleDamaged]);

  useEffect(() => {
    if (gameState.damagedEnemies.size > 0) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, damagedEnemies: new Set() }));
      }, 200); // Flash for 200ms

      return () => clearTimeout(timeout);
    }
  }, [gameState.damagedEnemies]);

  useEffect(() => {
    if (gameState.damagedTowers.size > 0) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, damagedTowers: new Set() }));
      }, 200); // Flash for 200ms

      return () => clearTimeout(timeout);
    }
  }, [gameState.damagedTowers]);

  // Clear level-up animations after celebration
  useEffect(() => {
    if (gameState.levelUpAnimations.size > 0) {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, levelUpAnimations: new Set() }));
      }, 2000); // Show for 2 seconds

      return () => clearTimeout(timeout);
    }
  }, [gameState.levelUpAnimations]);

  // Achievement popup queue handler
  useEffect(() => {
    // If popup is not open and there are achievements in queue, show the next one
    if (!achievementPopupOpen && achievementQueue.length > 0) {
      const nextAchievement = achievementQueue[0];
      setCurrentAchievement(nextAchievement);
      setAchievementPopupOpen(true);
      setAchievementQueue(prev => prev.slice(1)); // Remove from queue
    }
  }, [achievementPopupOpen, achievementQueue]);

  // Achievement checking at wave end
  useEffect(() => {
    // Check if wave has ended (no enemies left and wave was in progress)
    if (
      gameState.enemies.length === 0 &&
      !waveInProgress &&
      gameState.wave > 0 &&
      gameState.gameStatus === 'playing' &&
      achievements.length > 0 &&
      playerProfile &&
      playerAchievements.length > 0
    ) {
      // Evaluate achievements
      const achievementGameState: AchievementGameState = {
        currentWave: gameState.wave,
        score: gameState.score,
        castleHealth: gameState.castleHealth,
        maxCastleHealth: gameState.maxCastleHealth,
        totalEnemiesDefeated: gameState.enemiesDefeated,
        cultivatorsDeployed: gameState.cultivatorsDeployed,
        damageTaken: gameState.damageTaken,
      };

      const { newlyUnlocked, updatedProgress } = evaluateAchievements(
        achievements,
        playerAchievements,
        achievementGameState
      );

      // Update player achievement progress in database
      if (updatedProgress.size > 0) {
        const progressUpdates = Array.from(updatedProgress.values()).map(pa => ({
          achievementId: pa.achievementId,
          progress: pa.progress,
        }));

        updateAchievementProgress(playerProfile.id, progressUpdates)
          .then(updated => {
            // Update local state with new progress
            setPlayerAchievements(prev => {
              const newAchievements = [...prev];
              updated.forEach(updatedAchievement => {
                const index = newAchievements.findIndex(
                  a => a.achievementId === updatedAchievement.achievementId
                );
                if (index >= 0) {
                  newAchievements[index] = updatedAchievement;
                } else {
                  newAchievements.push(updatedAchievement);
                }
              });
              return newAchievements;
            });
          })
          .catch(error => {
            console.error('Failed to update achievement progress:', error);
          });
      }

      // Handle newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        console.log('Newly unlocked achievements:', newlyUnlocked);
        
        // Add to achievement queue for display
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);

        // Process each unlocked achievement
        newlyUnlocked.forEach(achievement => {
          // Unlock in database
          unlockAchievement(playerProfile.id, achievement.id)
            .then(unlockedAchievement => {
              // Update local state
              setPlayerAchievements(prev => {
                const newAchievements = [...prev];
                const index = newAchievements.findIndex(
                  a => a.achievementId === achievement.id
                );
                if (index >= 0) {
                  newAchievements[index] = unlockedAchievement;
                } else {
                  newAchievements.push(unlockedAchievement);
                }
                return newAchievements;
              });
            })
            .catch(error => {
              console.error('Failed to unlock achievement:', error);
            });

          // Grant rewards
          if (achievement.rewards.length > 0) {
            const updatedProfile = grantRewards(achievement.rewards, playerProfile);
            setPlayerProfile(updatedProfile);

            // Update profile in database
            updatePlayerStats(playerProfile.id, updatedProfile.stats)
              .catch(error => {
                console.error('Failed to update player profile with rewards:', error);
              });
          }
        });
      }
    }
  }, [
    gameState.enemies.length,
    waveInProgress,
    gameState.wave,
    gameState.gameStatus,
    gameState.score,
    gameState.castleHealth,
    gameState.maxCastleHealth,
    gameState.enemiesDefeated,
    gameState.cultivatorsDeployed,
    gameState.damageTaken,
    achievements,
    playerProfile,
    playerAchievements,
  ]);

  // Clear attack animations when game is paused or game over
  useEffect(() => {
    if (gameSpeed === 0 || gameState.gameStatus === 'gameOver') {
      setGameState(prev => ({ 
        ...prev, 
        enemiesAttackingCastle: [],
        castleDamaged: false,
      }));
    }
  }, [gameSpeed, gameState.gameStatus]);

  // Stop enemy spawning when game is paused or game over
  useEffect(() => {
    if (gameSpeed === 0 || gameState.gameStatus === 'gameOver') {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
        setWaveInProgress(false);
      }
    }
  }, [gameSpeed, gameState.gameStatus]);

  // Handle wave start sound and background music
  useEffect(() => {
    if (waveInProgress && gameState.wave > 0) {
      soundManager.playWaveStart();
      
      // Start background music on first wave
      if (gameState.wave === 1) {
        soundManager.startBackgroundMusic();
      }
    }
  }, [waveInProgress, gameState.wave]);

  // Handle game over sound
  useEffect(() => {
    if (gameState.gameStatus === 'gameOver') {
      soundManager.playGameOver();
      soundManager.stopBackgroundMusic();
    }
  }, [gameState.gameStatus]);

  // Place tower
  const placeTower = (x: number, y: number) => {
    if (!selectedTowerType || gameState.gameStatus !== 'playing') return;

    const towerConfig = TOWER_TYPES[selectedTowerType as keyof typeof TOWER_TYPES] as typeof FALLBACK_TOWER_TYPES[keyof typeof FALLBACK_TOWER_TYPES] | undefined;
    if (!towerConfig || gameState.qi < towerConfig.cost) return;

    // Check if tile allows cultivator deployment
    if (tileGrid) {
      const GRID_SIZE = 30;
      const gridX = Math.floor(x / GRID_SIZE);
      const gridY = Math.floor(y / GRID_SIZE);
      
      if (!tileGrid.canDeployCultivator(gridX, gridY)) {
        // Cannot deploy on this tile type
        return;
      }
    }

    // Find the corresponding generated cultivator if available
    const cultivatorIndex = selectedTowerType.startsWith('cultivator_') 
      ? parseInt(selectedTowerType.split('_')[1]) 
      : -1;
    const generatedCultivator = cultivatorIndex >= 0 && cultivatorIndex < generatedCultivators.length
      ? generatedCultivators[cultivatorIndex]
      : null;

    let newTower: Tower = {
      id: `tower-${Date.now()}`,
      type: selectedTowerType,
      x,
      y,
      range: towerConfig.range,
      damage: towerConfig.damage,
      attackSpeed: towerConfig.attackSpeed,
      lastAttack: 0,
      cost: towerConfig.cost,
      health: towerConfig.health,
      maxHealth: towerConfig.health,
      // RPG System initialization
      level: 1,
      experience: 0,
      equippedSkills: generatedCultivator?.defenderState?.equippedSkills || [],
      inventory: generatedCultivator?.defenderState?.inventory || [],
      kills: 0,
      baseStats: {
        damage: towerConfig.damage,
        attackSpeed: towerConfig.attackSpeed,
        range: towerConfig.range,
        health: towerConfig.health,
      },
      // EntityInstance compatibility fields
      personTypeId: generatedCultivator?.personTypeId,
      personTypeKey: generatedCultivator?.personTypeKey,
      emoji: towerConfig.emoji,
      name: towerConfig.name,
    };

    // Apply saved build (preferred skills)
    try {
      newTower = applyBuildToTower(newTower);
      
      // Recalculate stats if skills were applied
      if (newTower.equippedSkills.length > 0) {
        const newStats = calculateTowerStats(newTower);
        newTower = {
          ...newTower,
          damage: newStats.damage,
          attackSpeed: newStats.attackSpeed,
          range: newStats.range,
          maxHealth: newStats.maxHealth,
          health: newStats.maxHealth,
        };
      }
    } catch (error) {
      console.error('Error applying saved build:', error);
      // Reset to no skills if there's an error
      newTower.equippedSkills = [];
    }

    // Play tower placement sound
    soundManager.playTowerPlaced();

    setGameState(prev => {
      const newTowers = [...prev.towers, newTower];
      
      // Recalculate paths for all enemies when a new tower is placed
      const updatedEnemies = prev.enemies.map(enemy => {
        const newPath = findPath(enemy.x, enemy.y, newTowers, tileGrid || undefined);
        return {
          ...enemy,
          path: newPath,
          currentPathIndex: 0,
        };
      });

      return {
        ...prev,
        towers: newTowers,
        enemies: updatedEnemies,
        qi: prev.qi - towerConfig.cost,
        cultivatorsDeployed: prev.cultivatorsDeployed + 1,
      };
    });
    setSelectedTowerType(null);
  };

  // Update game speed ref when it changes
  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);

  // Track when game actually starts
  useEffect(() => {
    const gameHasStarted = gameState.wave > 1 || gameState.enemies.length > 0;
    if (gameHasStarted && !gameStartedRef.current) {
      gameStartedRef.current = true;
      lastTimeUpdateRef.current = Date.now();
      console.log(`[Time Accumulator] Game started at ${lastTimeUpdateRef.current}`);
    }
    if (gameState.wave === 1 && gameState.enemies.length === 0 && gameState.gameStatus === 'playing') {
      gameStartedRef.current = false;
    }
  }, [gameState.wave, gameState.enemies.length, gameState.gameStatus]);

  // Game time accumulator - uses requestAnimationFrame for accurate timing
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameSpeed === 0) {
      return;
    }

    let animationFrameId: number;
    
    const updateGameTime = () => {
      const now = Date.now();
      
      // Only accumulate time if game has started
      if (gameStartedRef.current && lastTimeUpdateRef.current > 0) {
        const realTimeElapsed = (now - lastTimeUpdateRef.current) / 1000; // seconds
        const gameTimeToAdd = realTimeElapsed * gameSpeedRef.current;
        
        if (gameTimeToAdd > 0) {
          setGameState(prev => ({
            ...prev,
            gameTimeElapsed: prev.gameTimeElapsed + gameTimeToAdd,
          }));
        }
      }
      
      lastTimeUpdateRef.current = now;
      animationFrameId = requestAnimationFrame(updateGameTime);
    };

    animationFrameId = requestAnimationFrame(updateGameTime);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState.gameStatus, gameSpeed]); // Restart when status or speed changes

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameSpeed === 0) return;

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        let newEnemies = [...prev.enemies];
        let newCastleHealth = prev.castleHealth;
        let newQi = prev.qi;
        let newScore = prev.score;
        let newProjectiles = [...prev.projectiles];
        let newEnemiesAttackingCastle = [...prev.enemiesAttackingCastle];
        let newDamagedEnemies = new Set<string>();
        let newCastleDamaged = false;
        let newDamagedTowers = new Set<string>();

        // Move enemies along their paths
        newEnemies = newEnemies.map(enemy => {
          // If enemy is attacking castle, handle bounce animation
          if (enemy.isAttackingCastle) {
            // Update bounce animation
            let newBounceProgress = enemy.attackBounceProgress;
            if (newBounceProgress > 0) {
              newBounceProgress = Math.max(0, newBounceProgress - 0.1);
            }

            // Check if it's time to attack castle
            // Use enemy's attackSpeed if available, otherwise default to 2000ms
            const enemyAttackSpeed = enemy.attackSpeed || 2000;
            if (now - enemy.lastCastleAttack >= enemyAttackSpeed) {
              // Deal damage to castle using enemy's damage stat
              const enemyDamage = enemy.damage || 5; // Fallback to 5 for backward compatibility
              newCastleHealth -= enemyDamage;
              newCastleDamaged = true;
              
              // Track damage taken for achievements
              setGameState(prevState => ({
                ...prevState,
                damageTaken: prevState.damageTaken + enemyDamage,
              }));
              
              // Start bounce animation
              return {
                ...enemy,
                lastCastleAttack: now,
                attackBounceProgress: 1,
              };
            }

            return {
              ...enemy,
              attackBounceProgress: newBounceProgress,
            };
          }

          // If enemy is attacking a tower
          if (enemy.isAttackingTower && enemy.targetTowerId) {
            // Check if the tower still exists
            const targetTowerIndex = prev.towers.findIndex(t => t.id === enemy.targetTowerId);
            const targetTower = prev.towers[targetTowerIndex];
            
            if (targetTowerIndex === -1 || !targetTower || targetTower.health <= 0) {
              // Tower was destroyed - recalculate path to castle with updated tower list
              // Filter out the destroyed tower from the tower list before pathfinding
              const activeTowers = prev.towers.filter(t => t.id !== enemy.targetTowerId && t.health > 0);
              const newPath = findPath(enemy.x, enemy.y, activeTowers, tileGrid || undefined);
              
              return {
                ...enemy,
                isAttackingTower: false,
                targetTowerId: null,
                path: newPath || enemy.path,
                currentPathIndex: 0,
              };
            }

            // Check if enemy is adjacent to the tower (within attack range)
            const dx = targetTower.x - enemy.x;
            const dy = targetTower.y - enemy.y;
            const distanceToTower = Math.sqrt(dx * dx + dy * dy);
            const MELEE_RANGE = 35; // Enemy needs to be within this distance to attack
            
            if (distanceToTower <= MELEE_RANGE) {
              // Enemy is in range - perform attack
              
              // Update bounce animation
              let newBounceProgress = enemy.attackBounceProgress;
              if (newBounceProgress > 0) {
                newBounceProgress = Math.max(0, newBounceProgress - 0.1);
              }

              // Check if it's time to attack tower
              // Use enemy's attackSpeed if available, otherwise default to 2000ms
              const enemyAttackSpeed = enemy.attackSpeed || 2000;
              if (now - enemy.lastTowerAttack >= enemyAttackSpeed) {
                // Deal damage to tower using enemy's damage stat
                const enemyDamage = enemy.damage || 3; // Fallback to 3 for backward compatibility
                prev.towers[targetTowerIndex].health -= enemyDamage;
                
                // Mark tower as damaged for flash effect
                newDamagedTowers.add(enemy.targetTowerId);

                // Start bounce animation
                return {
                  ...enemy,
                  lastTowerAttack: now,
                  attackBounceProgress: 1,
                };
              }

              return {
                ...enemy,
                attackBounceProgress: newBounceProgress,
              };
            } else {
              // Enemy is not yet in range - move toward the tower
              const moveDistance = enemy.speed * 1.5;
              const moveX = (dx / distanceToTower) * moveDistance;
              const moveY = (dy / distanceToTower) * moveDistance;
              
              return {
                ...enemy,
                x: enemy.x + moveX,
                y: enemy.y + moveY,
              };
            }
          }

          // Check if path is null (blocked)
          if (!enemy.path || enemy.path.length === 0) {
            // Path is blocked - find the blocking tower to attack
            const blockingTower = findBlockingTower(enemy.x, enemy.y, prev.towers);
            
            if (blockingTower) {
              // Start moving toward and attacking this tower
              return {
                ...enemy,
                isAttackingTower: true,
                targetTowerId: blockingTower.id,
                lastTowerAttack: now - 1500, // Attack soon but not immediately
              };
            }
            
            // No towers to attack - just stay in place
            return enemy;
          }

          // Check if enemy reached the end of path (castle)
          if (enemy.currentPathIndex >= enemy.path.length - 1) {
            // Enemy reached castle - start attacking
            if (!newEnemiesAttackingCastle.includes(enemy.id)) {
              newEnemiesAttackingCastle.push(enemy.id);
            }
            
            return {
              ...enemy,
              isAttackingCastle: true,
              lastCastleAttack: now - 1500, // Attack soon but not immediately
            };
          }

          const currentTarget = enemy.path[enemy.currentPathIndex + 1];
          const dx = currentTarget.x - enemy.x;
          const dy = currentTarget.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Move towards next waypoint
          if (distance < enemy.speed * 1.5) {
            // Reached waypoint, move to next
            return {
              ...enemy,
              x: currentTarget.x,
              y: currentTarget.y,
              currentPathIndex: enemy.currentPathIndex + 1,
            };
          } else {
            // Move towards waypoint
            const moveX = (dx / distance) * enemy.speed * 1.5;
            const moveY = (dy / distance) * enemy.speed * 1.5;
            return {
              ...enemy,
              x: enemy.x + moveX,
              y: enemy.y + moveY,
            };
          }
        });

        // Clean up attacking castle list
        newEnemiesAttackingCastle = newEnemiesAttackingCastle.filter(id => 
          newEnemies.some(e => e.id === id)
        );

        // Remove destroyed towers and reset attacking enemies
        let newTowers = prev.towers.filter(tower => tower.health > 0);
        const destroyedTowerIds = prev.towers
          .filter(tower => tower.health <= 0)
          .map(tower => tower.id);
        
        // Reset enemies that were attacking destroyed towers
        if (destroyedTowerIds.length > 0) {
          newEnemies = newEnemies.map(enemy => {
            if (enemy.targetTowerId && destroyedTowerIds.includes(enemy.targetTowerId)) {
              return {
                ...enemy,
                isAttackingTower: false,
                targetTowerId: null,
              };
            }
            return enemy;
          });
        }

        // Update projectiles and handle hits
        const completedProjectiles: Projectile[] = [];
        newProjectiles = newProjectiles
          .map(projectile => {
            const updatedProjectile = {
              ...projectile,
              progress: projectile.progress + projectile.speed,
            };
            
            // Check if projectile reached target
            if (updatedProjectile.progress >= 1) {
              completedProjectiles.push(updatedProjectile);
              return null;
            }
            
            return updatedProjectile;
          })
          .filter(Boolean) as Projectile[];

        // Apply damage from completed projectiles
        const newLevelUpAnimations = new Set<string>();
        const newDroppedItems = [...prev.droppedItems];
        
        completedProjectiles.forEach(projectile => {
          const enemyIndex = newEnemies.findIndex(e => e.id === projectile.targetId);
          
          if (enemyIndex !== -1) {
            const enemy = newEnemies[enemyIndex];
            newEnemies[enemyIndex] = {
              ...enemy,
              health: enemy.health - projectile.damage,
            };

            // Play enemy hit sound
            soundManager.playEnemyHit();

            // Mark enemy as damaged for flash effect
            newDamagedEnemies.add(projectile.targetId);

            // Remove dead enemies and handle XP/items
            if (newEnemies[enemyIndex].health <= 0) {
              // Play enemy defeated sound
              soundManager.playEnemyDefeated();
              
              const killedEnemy = newEnemies[enemyIndex];
              
              // Award Qi and score
              newQi += killedEnemy.reward;
              newScore += killedEnemy.reward;
              
              // Find the tower that fired this projectile
              const towerIndex = prev.towers.findIndex(t => t.id === projectile.targetTowerId);
              if (towerIndex !== -1) {
                const tower = prev.towers[towerIndex];
                
                // Award XP to the tower
                const xpReward = getXPReward(killedEnemy.type, prev.wave);
                const newXP = tower.experience + xpReward;
                const newLevel = checkLevelUp(tower.level, newXP);
                
                // Check if tower leveled up
                if (newLevel > tower.level) {
                  newLevelUpAnimations.add(tower.id);
                  
                  // Calculate overflow XP for next level
                  const xpForCurrentLevel = getXPForLevel(tower.level);
                  const overflowXP = newXP - xpForCurrentLevel;
                  
                  // Recalculate stats with new level
                  const updatedTower = { ...tower, level: newLevel, experience: overflowXP, kills: tower.kills + 1 };
                  const newStats = calculateTowerStats(updatedTower);
                  
                  prev.towers[towerIndex] = {
                    ...updatedTower,
                    damage: newStats.damage,
                    attackSpeed: newStats.attackSpeed,
                    range: newStats.range,
                    maxHealth: newStats.maxHealth,
                    // Keep current health ratio
                    health: Math.floor((tower.health / tower.maxHealth) * newStats.maxHealth),
                  };
                } else {
                  // Just update XP and kills
                  prev.towers[towerIndex] = {
                    ...tower,
                    experience: newXP,
                    kills: tower.kills + 1,
                  };
                }
              }
              
              // Roll for item drop
              const droppedItem = rollItemDrop(killedEnemy.type, prev.wave);
              if (droppedItem) {
                newDroppedItems.push({
                  id: `item-${Date.now()}-${Math.random()}`,
                  itemId: droppedItem.id,
                  x: killedEnemy.x,
                  y: killedEnemy.y,
                  spawnTime: now,
                });
              }
              
              // Remove enemy
              newEnemiesAttackingCastle = newEnemiesAttackingCastle.filter(
                id => id !== killedEnemy.id
              );
              newEnemies.splice(enemyIndex, 1);
              setGameState(prev => ({
                ...prev,
                enemiesDefeated: prev.enemiesDefeated + 1,
              }));
            }
          }
        });

        // Tower attacks - only create projectiles, don't deal damage
        newTowers = newTowers.map(tower => {
          if (now - tower.lastAttack < tower.attackSpeed) return tower;

          const enemiesInRange = newEnemies.filter(enemy => {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            return Math.sqrt(dx * dx + dy * dy) <= tower.range;
          });

          if (enemiesInRange.length > 0) {
            const target = enemiesInRange[0];
            
            // Create projectile
            newProjectiles.push({
              id: `projectile-${Date.now()}-${Math.random()}`,
              type: tower.type,
              startX: tower.x,
              startY: tower.y,
              targetX: target.x,
              targetY: target.y,
              targetId: target.id,
              targetTowerId: tower.id, // Track which tower fired this
              damage: tower.damage,
              progress: 0,
              speed: 0.15, // Speed of projectile animation
            });

            return { ...tower, lastAttack: now };
          }
          
          return tower;
        });

        // Item pickup logic - auto-pickup by nearest tower
        const PICKUP_RANGE = 80; // Pixels
        const pickedUpItems = new Set<string>();
        
        newDroppedItems.forEach(droppedItem => {
          if (pickedUpItems.has(droppedItem.id)) return;
          
          // Find nearest tower
          let nearestTower: Tower | null = null;
          let nearestDistance = Infinity;
          
          prev.towers.forEach(tower => {
            const dx = tower.x - droppedItem.x;
            const dy = tower.y - droppedItem.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance && distance <= PICKUP_RANGE) {
              nearestDistance = distance;
              nearestTower = tower;
            }
          });
          
          // If a tower is in range and has inventory space, pick up the item
          if (nearestTower !== null && (nearestTower as Tower).inventory.length < 3) {
            const tower = nearestTower as Tower;
            const towerIndex = prev.towers.findIndex(t => t.id === tower.id);
            if (towerIndex !== -1) {
              prev.towers[towerIndex] = {
                ...prev.towers[towerIndex],
                inventory: [...prev.towers[towerIndex].inventory, droppedItem.itemId],
              };
              
              // Recalculate stats with new item
              const updatedTower = prev.towers[towerIndex];
              const newStats = calculateTowerStats(updatedTower);
              prev.towers[towerIndex] = {
                ...updatedTower,
                damage: newStats.damage,
                attackSpeed: newStats.attackSpeed,
                range: newStats.range,
                maxHealth: newStats.maxHealth,
                health: Math.min(updatedTower.health, newStats.maxHealth),
              };
              
              pickedUpItems.add(droppedItem.id);
              
              // Show pickup notification
              const towerTypeConfig = TOWER_TYPES[updatedTower.type as keyof typeof TOWER_TYPES] as any;
              const towerName = updatedTower.name || towerTypeConfig?.name || 'Cultivator';
              setItemPickups(prev => [...prev, {
                id: `pickup-${Date.now()}-${Math.random()}`,
                itemId: droppedItem.itemId,
                towerName: towerName,
                timestamp: now,
              }]);
            }
          }
        });
        
        // Remove picked up items and despawn old items (30 seconds)
        const DESPAWN_TIME = 30000;
        const filteredDroppedItems = newDroppedItems.filter(item => 
          !pickedUpItems.has(item.id) && (now - item.spawnTime < DESPAWN_TIME)
        );

        // Check game over
        if (newCastleHealth <= 0) {
          return { ...prev, castleHealth: 0, gameStatus: 'gameOver' as const };
        }

        return {
          ...prev,
          enemies: newEnemies,
          castleHealth: newCastleHealth,
          qi: newQi,
          score: newScore,
          projectiles: newProjectiles,
          droppedItems: filteredDroppedItems,
          enemiesAttackingCastle: newEnemiesAttackingCastle,
          damagedEnemies: newDamagedEnemies,
          castleDamaged: newCastleDamaged,
          damagedTowers: newDamagedTowers,
          towers: newTowers,
          levelUpAnimations: newLevelUpAnimations,
        };
      });
    }, 50 / gameSpeed);

    return () => clearInterval(gameLoop);
  }, [gameState.gameStatus, gameSpeed]);

  const nextWave = () => {
    // Reset wave state to allow Skip functionality to work properly
    // This ensures startWave() can execute even if called during an active wave
    setWaveInProgress(false);
    setWaveCountdown(null); // Clear countdown when manually starting
    setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
    startWave(true); // Force start the wave
  };

  const resetGame = () => {
    setGameState({
      towers: [],
      enemies: [],
      projectiles: [],
      droppedItems: [],
      castleHealth: 100,
      maxCastleHealth: 100,
      qi: 200,
      wave: 1,
      score: 0,
      gameStatus: 'playing',
      enemiesAttackingCastle: [],
      damagedEnemies: new Set(),
      castleDamaged: false,
      damagedTowers: new Set(),
      enemiesDefeated: 0,
      cultivatorsDeployed: 0,
      gameStartTime: Date.now(),
      gameTimeElapsed: 0,
      levelUpAnimations: new Set(),
      damageTaken: 0,
    });
    setWaveInProgress(false);
    setWaveCountdown(null);
    setGameSpeed(1); // Reset game speed to normal
    setMenuOpen(false); // Close any open menus
    
    // Regenerate cultivators for the new game
    try {
      let cultivators: EntityInstance[];
      
      // Use composition system if we have species, daos, and titles
      if (species.length > 0 && daos.length > 0 && titles.length > 0) {
        console.log('Regenerating cultivators using composition system');
        cultivators = generateRandomCultivatorsWithComposition(
          species,
          daos,
          titles,
          4
        );
      } else if (personTypes.length > 0) {
        console.log('Regenerating cultivators using person types');
        cultivators = generateRandomCultivators(personTypes, 4);
      } else {
        console.warn('No data available for cultivator generation, keeping existing cultivators');
        return;
      }
      
      setGeneratedCultivators(cultivators);
      console.log('Regenerated cultivators for new game:', cultivators);
    } catch (error) {
      console.error('Error regenerating cultivators:', error);
      // Keep existing cultivators on error
    }
  };

  const sellTower = (towerId: string) => {
    const tower = gameState.towers.find(t => t.id === towerId);
    if (tower) {
      const sellValue = Math.floor(tower.cost * 0.7);
      setGameState(prevState => ({
        ...prevState,
        towers: prevState.towers.filter(t => t.id !== towerId),
        qi: prevState.qi + sellValue,
      }));
      soundManager.playSellTower();
    }
  };

  const equipSkill = (towerId: string, skillId: string) => {
    console.log('equipSkill called', { towerId, skillId });
    setGameState(prevState => {
      const towerIndex = prevState.towers.findIndex(t => t.id === towerId);
      if (towerIndex === -1) {
        console.log('Tower not found');
        return prevState;
      }
      
      const tower = prevState.towers[towerIndex];
      if (tower.equippedSkills.includes(skillId)) {
        console.log('Skill already equipped');
        return prevState;
      }
      if (tower.equippedSkills.length >= 3) {
        console.log('Max skills reached');
        return prevState;
      }
      
      const updatedTower = {
        ...tower,
        equippedSkills: [...tower.equippedSkills, skillId],
      };
      
      console.log('Equipping skill', { before: tower.equippedSkills, after: updatedTower.equippedSkills });
      
      // Recalculate stats with new skill
      const newStats = calculateTowerStats(updatedTower);
      const newTowers = [...prevState.towers];
      newTowers[towerIndex] = {
        ...updatedTower,
        damage: newStats.damage,
        attackSpeed: newStats.attackSpeed,
        range: newStats.range,
        maxHealth: newStats.maxHealth,
        health: Math.min(updatedTower.health, newStats.maxHealth),
      };
      
      // Auto-save build for this cultivator type
      updateBuildFromTower(newTowers[towerIndex]);
      
      // Update selected tower if this is the one being modified
      if (selectedTower?.id === towerId) {
        setSelectedTower(newTowers[towerIndex]);
      }
      
      return { ...prevState, towers: newTowers };
    });
  };

  const unequipSkill = (towerId: string, skillId: string) => {
    console.log('unequipSkill called', { towerId, skillId });
    setGameState(prevState => {
      const towerIndex = prevState.towers.findIndex(t => t.id === towerId);
      if (towerIndex === -1) return prevState;
      
      const tower = prevState.towers[towerIndex];
      const updatedTower = {
        ...tower,
        equippedSkills: tower.equippedSkills.filter(id => id !== skillId),
      };
      
      // Recalculate stats without skill
      const newStats = calculateTowerStats(updatedTower);
      const newTowers = [...prevState.towers];
      newTowers[towerIndex] = {
        ...updatedTower,
        damage: newStats.damage,
        attackSpeed: newStats.attackSpeed,
        range: newStats.range,
        maxHealth: newStats.maxHealth,
        health: Math.min(updatedTower.health, newStats.maxHealth),
      };
      
      // Auto-save build for this cultivator type
      updateBuildFromTower(newTowers[towerIndex]);
      
      // Update selected tower if this is the one being modified
      if (selectedTower?.id === towerId) {
        setSelectedTower(newTowers[towerIndex]);
      }
      
      return { ...prevState, towers: newTowers };
    });
  };

  const unequipItem = (towerId: string, itemId: string) => {
    console.log('unequipItem called', { towerId, itemId });
    setGameState(prevState => {
      const towerIndex = prevState.towers.findIndex(t => t.id === towerId);
      if (towerIndex === -1) return prevState;
      
      const tower = prevState.towers[towerIndex];
      const updatedTower = {
        ...tower,
        inventory: tower.inventory.filter(id => id !== itemId),
      };
      
      // Recalculate stats without item
      const newStats = calculateTowerStats(updatedTower);
      const newTowers = [...prevState.towers];
      newTowers[towerIndex] = {
        ...updatedTower,
        damage: newStats.damage,
        attackSpeed: newStats.attackSpeed,
        range: newStats.range,
        maxHealth: newStats.maxHealth,
        health: Math.min(updatedTower.health, newStats.maxHealth),
      };
      
      // Update selected tower if this is the one being modified
      if (selectedTower?.id === towerId) {
        setSelectedTower(newTowers[towerIndex]);
      }
      
      return { ...prevState, towers: newTowers };
    });
  };

  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    if (selectedTower) {
      e.preventDefault();
      setSelectedTower(null);
    }
  };

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚔️</div>
          <div className="text-xl text-white mb-2">Preparing your journey...</div>
          <div className="text-sm text-slate-400 mb-4">Loading cultivators and maps</div>
          <div className="flex justify-center">
            <div className="w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data failed to load
  if (dataError) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-white mb-2">Failed to load game data</div>
          <div className="text-sm text-red-400 mb-4">{dataError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <div className="text-xs text-slate-500 mt-4">
            The game will use default configurations as fallback
          </div>
        </div>
      </div>
    );
  }

  // Show map selection if no map is selected
  if (!selectedMap) {
    return <MapSelection onMapSelected={handleMapSelected} />;
  }

  return (
    <div className="h-screen overflow-hidden" onContextMenu={handleGlobalContextMenu}>
      <div className="h-full">
        <GameBoard
          map={selectedMap}
          tileTypes={tileTypes}
          tileGrid={tileGrid}
          towers={gameState.towers}
          enemies={gameState.enemies}
          projectiles={gameState.projectiles}
          droppedItems={gameState.droppedItems}
          levelUpAnimations={gameState.levelUpAnimations}
          enemiesAttackingCastle={gameState.enemiesAttackingCastle}
          damagedEnemies={gameState.damagedEnemies}
          castleDamaged={gameState.castleDamaged}
          castleHealth={gameState.castleHealth}
          maxCastleHealth={gameState.maxCastleHealth}
          gameStatus={gameState.gameStatus}
          selectedTowerType={selectedTowerType}
          selectedTower={selectedTower}
          onPlaceTower={placeTower}
          onSelectTower={setSelectedTower}
          onCancelPlacement={() => setSelectedTowerType(null)}
          onReset={resetGame}
          onQuitToMap={handleQuitToMap}
          towerTypes={TOWER_TYPES}
          qi={gameState.qi}
          wave={gameState.wave}
          score={gameState.score}
          enemiesRemaining={gameState.enemies.length}
          waveInProgress={waveInProgress}
          gameSpeed={gameSpeed}
          onNextWave={nextWave}
          onSpeedChange={setGameSpeed}
          onSelectType={setSelectedTowerType}
          damagedTowers={gameState.damagedTowers}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          previousGameSpeed={previousGameSpeed}
          setPreviousGameSpeed={setPreviousGameSpeed}
          waveCountdown={waveCountdown}
          enemiesDefeated={gameState.enemiesDefeated}
          cultivatorsDeployed={gameState.cultivatorsDeployed}
          gameStartTime={gameState.gameStartTime}
          gameTimeElapsed={gameState.gameTimeElapsed}
        />

        <TowerDetailsDialog
          tower={selectedTower}
          towerTypes={TOWER_TYPES}
          onClose={() => setSelectedTower(null)}
          onSell={sellTower}
          onEquipSkill={equipSkill}
          onUnequipSkill={unequipSkill}
          onUnequipItem={unequipItem}
        />

        <ItemNotification pickups={itemPickups} />

        <AchievementPopup
          achievement={currentAchievement}
          isOpen={achievementPopupOpen}
          onClose={() => setAchievementPopupOpen(false)}
        />
      </div>
    </div>
  );
}