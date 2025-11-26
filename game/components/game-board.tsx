import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu, Volume2, VolumeX, Trophy } from 'lucide-react';
import { soundManager } from '../utils/sound-manager';
import { SettingsMenu } from './settings-menu';
import { UIShowcase } from './ui-showcase';
import { LeaderboardSimple } from './leaderboard-simple';
import { ScoreSubmitDialog } from './score-submit-dialog';
import { GameOverScreen } from './game-over-screen';
import { addLocalScore } from '../utils/local-storage';
import { getItemById, RARITY_COLORS, RARITY_GLOW } from '../utils/items';
import { getLevelProgress, getLevelBadgeColor, MAX_LEVEL } from '../utils/experience';
import { getEnemyEntry } from '../utils/enemy-codex';
import { EnemyCodexDialog } from './enemy-codex-dialog';
import { SKILLS } from '../utils/skills';
import type { Tower, Enemy, DroppedItem } from '../App';
import type { Map, TileType } from '../../shared/types/map';
import type { TileGrid } from '../../shared/utils/tile-helper';
import { useMemo } from 'react';

interface GameBoardProps {
  map: Map;
  tileTypes: TileType[];
  tileGrid: TileGrid | null;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: any[];
  droppedItems: DroppedItem[];
  levelUpAnimations: Set<string>;
  enemiesAttackingCastle: string[];
  damagedEnemies: Set<string>;
  castleDamaged: boolean;
  castleHealth: number;
  maxCastleHealth: number;
  gameStatus: string;
  selectedTowerType: string | null;
  selectedTower: Tower | null;
  onPlaceTower: (x: number, y: number) => void;
  onSelectTower: (tower: Tower) => void;
  onCancelPlacement: () => void;
  onReset: () => void;
  onQuitToMap: () => void;
  towerTypes: any;
  qi: number;
  wave: number;
  score: number;
  enemiesRemaining: number;
  waveInProgress: boolean;
  gameSpeed: number;
  onNextWave: () => void;
  onSpeedChange: (speed: number) => void;
  onSelectType: (type: string | null) => void;
  damagedTowers: Set<string>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  previousGameSpeed: number;
  setPreviousGameSpeed: (speed: number) => void;
  waveCountdown: number | null;
  enemiesDefeated: number;
  cultivatorsDeployed: number;
  gameStartTime: number;
  gameTimeElapsed: number;
}

export function GameBoard({ 
  map,
  tileTypes,
  tileGrid,
  towers, 
  enemies, 
  projectiles,
  droppedItems,
  levelUpAnimations,
  enemiesAttackingCastle,
  damagedEnemies,
  castleDamaged,
  castleHealth,
  maxCastleHealth,
  gameStatus,
  selectedTowerType,
  selectedTower,
  onPlaceTower,
  onSelectTower,
  onCancelPlacement,
  onReset,
  onQuitToMap,
  towerTypes: cultivatorTypes,
  qi,
  wave,
  score,
  enemiesRemaining,
  waveInProgress,
  gameSpeed,
  onNextWave,
  onSpeedChange,
  onSelectType,
  damagedTowers,
  menuOpen,
  setMenuOpen,
  previousGameSpeed,
  setPreviousGameSpeed,
  waveCountdown,
  enemiesDefeated,
  cultivatorsDeployed,
  gameStartTime,
  gameTimeElapsed
}: GameBoardProps) {
  const GRID_SIZE = 30;
  const COLS = map.width;
  const ROWS = map.height;
  const BOARD_WIDTH = COLS * GRID_SIZE;
  const BOARD_HEIGHT = ROWS * GRID_SIZE;
  // Deployment zone is bottom 40% of map (rounded down)
  const DEPLOYMENT_START_ROW = Math.floor(ROWS * 0.6);
  const TOWER_ZONE_START_Y = DEPLOYMENT_START_ROW * GRID_SIZE;
  
  // Create tile type lookup map
  const tileTypeMap = useMemo(() => {
    return tileTypes.reduce((acc, tt) => {
      acc[tt.id] = tt;
      return acc;
    }, {} as Record<string, TileType>);
  }, [tileTypes]);
  
  // Castle occupies 2x2 tiles at bottom center
  const CASTLE_TILES = useMemo(() => {
    const centerCol = Math.floor(COLS / 2);
    const bottomRow = ROWS - 2;
    
    return [
      { col: centerCol, row: bottomRow },
      { col: centerCol + 1, row: bottomRow },
      { col: centerCol, row: bottomRow + 1 },
      { col: centerCol + 1, row: bottomRow + 1 }
    ];
  }, [COLS, ROWS]);

  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; isValid: boolean } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uiShowcaseOpen, setUIShowcaseOpen] = useState(false);
  const [globalLeaderboardOpen, setGlobalLeaderboardOpen] = useState(false);
  const [scoreSubmitOpen, setScoreSubmitOpen] = useState(false);
  const [enemyCodexOpen, setEnemyCodexOpen] = useState(false);
  const [hasProcessedGameOver, setHasProcessedGameOver] = useState(false);
  const [showNewPBNotification, setShowNewPBNotification] = useState(false);
  const [finalTimePlayed, setFinalTimePlayed] = useState<number>(0);

  // Handle game over - save score locally and auto-submit if new PB
  useEffect(() => {
    if (gameStatus === 'gameOver' && !hasProcessedGameOver) {
      setHasProcessedGameOver(true);
      
      // Use accumulated game time (accounts for speed and pauses)
      const timePlayed = Math.floor(gameTimeElapsed);
      setFinalTimePlayed(timePlayed);
      
      // Save score locally
      const { isNewPB, playerData } = addLocalScore({
        score,
        wave,
        timestamp: Date.now(),
        enemiesDefeated,
        cultivatorsDeployed,
        timePlayed,
      });
      
      // If new personal best, auto-submit to global leaderboard
      if (isNewPB && score > 0) {
        setShowNewPBNotification(true);
        
        // Auto-submit score in background
        submitScoreToGlobal(playerData.playerName, score, wave);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowNewPBNotification(false);
        }, 5000);
      }
    }
    
    // Reset the flag when game is no longer over (user restarted)
    if (gameStatus !== 'gameOver' && hasProcessedGameOver) {
      setHasProcessedGameOver(false);
      setShowNewPBNotification(false);
      setFinalTimePlayed(0);
    }
  }, [gameStatus, hasProcessedGameOver, score, wave, enemiesDefeated, cultivatorsDeployed, gameTimeElapsed]);

  // Revalidate hover position when enemies move
  useEffect(() => {
    if (!hoverPosition || !selectedTowerType) return;

    const gridCol = Math.floor(hoverPosition.x / GRID_SIZE);
    const gridRow = Math.floor(hoverPosition.y / GRID_SIZE);

    // Check if placement is still valid
    const inZone = hoverPosition.y >= TOWER_ZONE_START_Y + GRID_SIZE / 2;
    
    const towerExists = towers.some(tower => {
      const towerCol = Math.floor(tower.x / GRID_SIZE);
      const towerRow = Math.floor(tower.y / GRID_SIZE);
      return towerCol === gridCol && towerRow === gridRow;
    });
    
    const isCastleTile = CASTLE_TILES.some(tile => tile.col === gridCol && tile.row === gridRow);

    const enemyExists = enemies.some(enemy => {
      const enemyCol = Math.floor(enemy.x / GRID_SIZE);
      const enemyRow = Math.floor(enemy.y / GRID_SIZE);
      return enemyCol === gridCol && enemyRow === gridRow;
    });

    const tileAllowsDeployment = tileGrid ? tileGrid.canDeployCultivator(gridCol, gridRow) : true;

    const isValid = inZone && !towerExists && !isCastleTile && !enemyExists && tileAllowsDeployment;

    // Update hover position if validity changed
    if (hoverPosition.isValid !== isValid) {
      setHoverPosition({ x: hoverPosition.x, y: hoverPosition.y, isValid });
    }
  }, [enemies, towers, hoverPosition, selectedTowerType, TOWER_ZONE_START_Y, GRID_SIZE, CASTLE_TILES, tileGrid]);

  // Auto-submit score to global leaderboard
  const submitScoreToGlobal = async (playerName: string, score: number, wave: number) => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae0b35aa/leaderboard/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName,
            score,
            wave,
          }),
        }
      );
    } catch (error) {
      console.error('Error auto-submitting score:', error);
      // Silently fail - user can manually submit later if needed
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTowerType) {
      setHoverPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to board coordinates
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const boardX = mouseX * scaleX;
    const boardY = mouseY * scaleY;

    // Snap to grid center
    const gridX = Math.floor(boardX / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    const gridY = Math.floor(boardY / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // Check if placement is valid
    const inZone = gridY >= TOWER_ZONE_START_Y + GRID_SIZE / 2; // Ensure center is in zone
    
    // Check if another tower occupies this exact grid cell
    const gridCol = Math.floor(gridX / GRID_SIZE);
    const gridRow = Math.floor(gridY / GRID_SIZE);
    
    // Clamp to valid grid bounds (15 columns: 0-14, 20 rows: 0-19)
    const validCol = Math.max(0, Math.min(14, gridCol));
    const validRow = Math.max(0, Math.min(19, gridRow));
    
    // Skip if out of bounds
    if (gridCol !== validCol || gridRow !== validRow) {
      setHoverPosition(null);
      return;
    }
    
    const towerExists = towers.some(tower => {
      const towerCol = Math.floor(tower.x / GRID_SIZE);
      const towerRow = Math.floor(tower.y / GRID_SIZE);
      return towerCol === gridCol && towerRow === gridRow;
    });
    
    // Check if this is a castle tile
    const isCastleTile = CASTLE_TILES.some(tile => tile.col === gridCol && tile.row === gridRow);

    // Check if any enemy occupies this tile
    const enemyExists = enemies.some(enemy => {
      const enemyCol = Math.floor(enemy.x / GRID_SIZE);
      const enemyRow = Math.floor(enemy.y / GRID_SIZE);
      return enemyCol === gridCol && enemyRow === gridRow;
    });

    // Check if tile allows cultivator deployment
    const tileAllowsDeployment = tileGrid ? tileGrid.canDeployCultivator(gridCol, gridRow) : true;

    const isValid = inZone && !towerExists && !isCastleTile && !enemyExists && tileAllowsDeployment;

    setHoverPosition({ x: gridX, y: gridY, isValid });
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTowerType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to board coordinates
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const boardX = clickX * scaleX;
    const boardY = clickY * scaleY;

    // Snap to grid center
    const gridX = Math.floor(boardX / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    const gridY = Math.floor(boardY / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // Check if in tower placement zone (bottom side of map)
    if (gridY < TOWER_ZONE_START_Y + GRID_SIZE / 2) {
      return;
    }

    // Check if another tower occupies this exact grid cell
    const gridCol = Math.floor(gridX / GRID_SIZE);
    const gridRow = Math.floor(gridY / GRID_SIZE);
    
    // Clamp to valid grid bounds (15 columns: 0-14, 20 rows: 0-19)
    const validCol = Math.max(0, Math.min(14, gridCol));
    const validRow = Math.max(0, Math.min(19, gridRow));
    
    // Reject if out of bounds
    if (gridCol !== validCol || gridRow !== validRow) {
      return;
    }
    
    const towerExists = towers.some(tower => {
      const towerCol = Math.floor(tower.x / GRID_SIZE);
      const towerRow = Math.floor(tower.y / GRID_SIZE);
      return towerCol === gridCol && towerRow === gridRow;
    });
    
    // Check if this is a castle tile
    const isCastleTile = CASTLE_TILES.some(tile => tile.col === gridCol && tile.row === gridRow);

    // Check if any enemy occupies this tile
    const enemyExists = enemies.some(enemy => {
      const enemyCol = Math.floor(enemy.x / GRID_SIZE);
      const enemyRow = Math.floor(enemy.y / GRID_SIZE);
      return enemyCol === gridCol && enemyRow === gridRow;
    });

    // Check if tile allows cultivator deployment
    const tileAllowsDeployment = tileGrid ? tileGrid.canDeployCultivator(gridCol, gridRow) : true;

    if (!towerExists && !isCastleTile && !enemyExists && tileAllowsDeployment) {
      onPlaceTower(gridX, gridY);
    }
  };

  const handleTowerClick = (e: React.MouseEvent, tower: Tower) => {
    e.stopPropagation();
    // Prevent tower selection when in placement mode
    if (selectedTowerType) {
      return;
    }
    onSelectTower(tower);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Right-click cancels tower placement
    if (selectedTowerType) {
      onCancelPlacement();
    }
  };

  const getEnemyEmoji = (enemy: Enemy) => {
    // Use Person Type emoji if available, otherwise fall back to enemy codex
    if (enemy.emoji) {
      return enemy.emoji;
    }
    const entry = getEnemyEntry(enemy.type as any);
    return entry ? entry.emoji : '👹';
  };

  const getProjectileEmoji = (type: string) => {
    // Check if it's a cultivator type key (e.g., 'cultivator_0')
    if (cultivatorTypes[type]?.emoji) {
      return cultivatorTypes[type].emoji;
    }
    // Fall back to legacy type mapping
    switch (type) {
      case 'sword': return '⚔';
      case 'palm': return '💨';
      case 'arrow': return '🏹';
      case 'lightning': return '⚡';
      default: return '✨';
    }
  };

  const isGameOver = gameStatus === 'gameOver';

  // Check if game has not started yet (wave 1 and no enemies spawned)
  const gameHasNotStarted = wave === 1 && enemies.length === 0 && !waveInProgress;

  // Calculate time played for game over screen
  const getTimePlayed = () => {
    // Use frozen time if game is over, otherwise use accumulated game time
    const seconds = gameStatus === 'gameOver' ? finalTimePlayed : Math.floor(gameTimeElapsed);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Menu handlers
  const handleOpenMenu = () => {
    if (gameSpeed !== 0) {
      setPreviousGameSpeed(gameSpeed);
      onSpeedChange(0); // Pause the game
    }
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
    if (previousGameSpeed !== 0) {
      onSpeedChange(previousGameSpeed); // Restore previous speed
    }
  };

  const handleRestartFromMenu = () => {
    setMenuOpen(false);
    onReset();
  };

  const handleOpenSettings = () => {
    setMenuOpen(false);
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setMenuOpen(true);
  };

  const handleOpenUIShowcase = () => {
    setSettingsOpen(false);
    setUIShowcaseOpen(true);
  };

  const handleCloseUIShowcase = () => {
    setUIShowcaseOpen(false);
    setSettingsOpen(true);
  };

  const handleOpenLeaderboard = () => {
    setMenuOpen(false);
    setGlobalLeaderboardOpen(true);
  };

  const handleCloseGlobalLeaderboard = () => {
    setGlobalLeaderboardOpen(false);
    setMenuOpen(true);
  };

  const handleViewGlobalLeaderboardFromGameOver = () => {
    setGlobalLeaderboardOpen(true);
  };

  const handleCloseGlobalLeaderboardFromGameOver = () => {
    setGlobalLeaderboardOpen(false);
  };

  const handleOpenScoreSubmit = () => {
    setMenuOpen(false);
    setScoreSubmitOpen(true);
  };

  const handleCloseScoreSubmit = () => {
    setScoreSubmitOpen(false);
    setMenuOpen(true);
  };

  const handleScoreSubmitSuccess = () => {
    setScoreSubmitOpen(false);
    setGlobalLeaderboardOpen(true);
  };

  // Pause/Resume handler
  const handlePauseResume = () => {
    if (gameSpeed === 0) {
      // Resuming - restore previous speed
      onSpeedChange(previousGameSpeed || 1);
    } else {
      // Pausing - save current speed
      setPreviousGameSpeed(gameSpeed);
      onSpeedChange(0);
    }
  };

  // Speed button handler - allows changing speed while paused
  const handleSpeedChange = (speed: number) => {
    if (gameSpeed === 0) {
      // Game is paused - update the speed that will be used when resumed
      setPreviousGameSpeed(speed);
    } else {
      // Game is running - change speed immediately
      onSpeedChange(speed);
    }
  };

  // Mute toggle handler
  const handleToggleMute = () => {
    const newMutedState = soundManager.toggleMute();
    setIsMuted(newMutedState);
  };

  // Right-click handler for menu
  const handleMenuContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    handleCloseMenu();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 cursor-cultivator">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 border-b-2 border-amber-600 px-3 py-2 flex-shrink-0 relative">
        <div className="grid grid-cols-3 gap-3 text-white items-center">
          {/* Left Section - Menu Button */}
          <div className="flex justify-start">
            <Button 
              onClick={handleOpenMenu} 
              variant="outline" 
              size="sm"
              className="border-amber-600 text-amber-300 hover:bg-amber-900/50 h-7 px-2"
            >
              <Menu className="size-4" />
            </Button>
          </div>

          {/* Center Section - Stats */}
          <div className="flex gap-2 justify-center">
            <div className="bg-black/30 rounded px-2 py-1">
              <span className="text-red-400 text-sm">🏛️{castleHealth}/{maxCastleHealth}</span>
            </div>
            <div className="bg-black/30 rounded px-2 py-1">
              <span className="text-blue-400 text-sm">⚡{qi}</span>
            </div>
            <div className="bg-black/30 rounded px-2 py-1">
              <span className="text-purple-400 text-sm">🌊{wave}</span>
            </div>
            <div className="bg-black/30 rounded px-2 py-1">
              <span className="text-green-400 text-sm">⭐{score}</span>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex gap-3 items-center justify-end">
            {/* System Controls */}
            <div className="flex gap-2 items-center">
              {/* Speed Controls with integrated pause state */}
              {gameStatus === 'playing' && !gameHasNotStarted && (
                <div className="flex gap-1 items-center bg-black/30 rounded px-2 py-1">
                  {gameSpeed === 0 && (
                    <span className="text-yellow-400 text-xs mr-1">Paused</span>
                  )}
                  <Button
                    onClick={handlePauseResume}
                    variant={gameSpeed === 0 ? 'default' : 'outline'}
                    size="sm"
                    className={`h-6 px-2 text-xs ${gameSpeed === 0 ? 'bg-yellow-700 hover:bg-yellow-600' : 'border-amber-600 text-amber-300 hover:bg-amber-900/50'}`}
                  >
                    {gameSpeed === 0 ? '▶️' : '⏸️'}
                  </Button>
                  {[1, 2, 3].map((speed) => {
                    // When paused, highlight the speed that will be used when resumed
                    const isActive = gameSpeed === 0 ? previousGameSpeed === speed : gameSpeed === speed;
                    return (
                      <Button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className={`h-6 w-8 px-0 text-xs ${
                          isActive
                            ? 'bg-amber-700 hover:bg-amber-600'
                            : 'border-amber-600 text-amber-300 hover:bg-amber-900/50'
                        }`}
                      >
                        {speed}x
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gameplay Controls */}
            {/* Progress/Skip or Try Again button based on game status */}
            {gameStatus === 'gameOver' ? (
              <Button 
                onClick={onReset} 
                className="bg-amber-700 hover:bg-amber-600 text-white h-7 px-4 text-xs whitespace-nowrap"
              >
                Try Again
              </Button>
            ) : waveCountdown !== null ? (
              /* Circular countdown - clickable skip button when ≤ 25s */
              <button
                onClick={waveCountdown <= 25 ? onNextWave : undefined}
                disabled={waveCountdown > 25}
                className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  waveCountdown <= 25 
                    ? 'hover:bg-amber-500/20 cursor-pointer active:scale-95' 
                    : 'cursor-default'
                }`}
              >
                <svg className="absolute" width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.2)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgb(251, 191, 36)"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 15}`}
                    strokeDashoffset={`${2 * Math.PI * 15 * (1 - waveCountdown / 30)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Show countdown number or skip icon */}
                {waveCountdown > 25 ? (
                  <span className="text-amber-300 text-xs z-10">{waveCountdown}</span>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="text-amber-300 z-10"
                  >
                    <polygon points="5 3 5 21 19 12"></polygon>
                    <rect x="20" y="3" width="2" height="18"></rect>
                  </svg>
                )}
              </button>
            ) : gameHasNotStarted ? (
              /* Start button - only show before first wave */
              <Button
                onClick={onNextWave}
                size="sm"
                className="bg-green-700 hover:bg-green-600 h-7 text-xs"
              >
                Start
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative bg-gradient-to-br from-green-900 to-green-950 flex-1 flex items-center justify-center overflow-hidden px-5">
        <div
          className={`relative w-auto max-w-full h-full ${
            selectedTowerType 
              ? hoverPosition?.isValid 
                ? 'cursor-formation-valid' 
                : 'cursor-formation-invalid'
              : ''
          }`}
          style={{
            aspectRatio: `${COLS} / ${ROWS}`
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        >
          {/* Map Tiles */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`
          }}>
            {map.tiles.map((row, y) =>
              row.map((tileInstance, x) => {
                const tileType = tileTypeMap[tileInstance.tileTypeId];
                if (!tileType) return null;
                
                return (
                  <div
                    key={`tile-${x}-${y}`}
                    style={{
                      backgroundColor: tileType.visual.color || '#4ade80',
                      gridColumn: x + 1,
                      gridRow: y + 1
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Grid Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.1)"
                  strokeWidth="1"
                />
              </pattern>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#grid)" />
            
            {/* Outer border for right and bottom edges */}
            <rect 
              x="0" 
              y="0" 
              width={BOARD_WIDTH} 
              height={BOARD_HEIGHT} 
              fill="none" 
              stroke="rgba(251, 191, 36, 0.1)" 
              strokeWidth="1"
            />
            
            {/* Tower Placement Zone Highlight - background fill */}
            <rect
              x="0"
              y={TOWER_ZONE_START_Y}
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT - TOWER_ZONE_START_Y}
              fill="rgba(251, 191, 36, 0.05)"
              stroke="none"
            />
            
            {/* Tower Placement Zone - top border only */}
            <line
              x1="0"
              y1={TOWER_ZONE_START_Y}
              x2={BOARD_WIDTH}
              y2={TOWER_ZONE_START_Y}
              stroke="rgba(251, 191, 36, 0.3)"
              strokeWidth="2"
              strokeDasharray="10,5"
            />
          </svg>

          {/* Castle */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${((7 * GRID_SIZE + GRID_SIZE) / BOARD_WIDTH) * 100}%`, 
              top: `${((18 * GRID_SIZE + GRID_SIZE) / BOARD_HEIGHT) * 100}%`,
              width: `${(GRID_SIZE * 2 / BOARD_WIDTH) * 100}%`,
              aspectRatio: '1 / 1'
            }}
          >
            {/* Grid tile indicator - shows the 4 tiles the temple occupies */}
            <div 
              className="absolute inset-0 border-2 border-amber-600/40 bg-amber-600/10 pointer-events-none"
              style={{ boxSizing: 'border-box' }}
            />
            
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div className={`text-6xl transition-all ${castleDamaged ? 'brightness-[300%] scale-110' : ''}`}>
                🏯
                {/* Attack effect when enemies are attacking */}
                {enemiesAttackingCastle.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl animate-ping">💥</div>
                  </div>
                )}
              </div>
              <div className="text-amber-300 text-xs mt-1">Sacred Temple</div>
              {/* Health bar - only show when damaged */}
              {castleHealth < maxCastleHealth && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-red-900 rounded">
                  <div
                    className="h-full bg-red-500 rounded transition-all"
                    style={{ width: `${(castleHealth / maxCastleHealth) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Towers */}
          {towers.map(tower => {
            const isSelected = selectedTower?.id === tower.id;
            const isDamaged = damagedTowers.has(tower.id);
            const isLevelingUp = levelUpAnimations.has(tower.id);
            const levelBadgeColor = getLevelBadgeColor(tower.level);
            
            return (
              <div
                key={tower.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${selectedTowerType ? '' : 'cursor-inspect'}`}
                style={{ 
                  left: `${(tower.x / BOARD_WIDTH) * 100}%`, 
                  top: `${(tower.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(GRID_SIZE / BOARD_WIDTH) * 100}%`,
                  height: `${(GRID_SIZE / BOARD_HEIGHT) * 100}%`
                }}
                onClick={(e) => handleTowerClick(e, tower)}
              >
                {/* Level-up celebration animation */}
                {isLevelingUp && (
                  <>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                      <div className="text-4xl animate-ping">⭐</div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                      <div className="text-2xl animate-bounce">✨</div>
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold animate-bounce pointer-events-none z-30 whitespace-nowrap">
                      LEVEL UP!
                    </div>
                  </>
                )}
                
                {/* Base range indicator - always visible with subtle styling */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all border-amber-600/50 bg-amber-400/10 group-hover:opacity-0 pointer-events-none"
                  style={{
                    width: `${(tower.range * 2 / GRID_SIZE) * 100}%`,
                    height: `${(tower.range * 2 / GRID_SIZE) * 100}%`,
                  }}
                />
                {/* Enhanced range indicator - visible on hover or when selected */}
                <div
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all pointer-events-none ${
                    isSelected 
                      ? 'border-amber-400/80 bg-amber-400/25 opacity-100' 
                      : 'border-amber-500/40 bg-amber-500/15 opacity-0 group-hover:opacity-100 group-hover:border-amber-400/80 group-hover:bg-amber-400/25'
                  }`}
                  style={{
                    width: `${(tower.range * 2 / GRID_SIZE) * 100}%`,
                    height: `${(tower.range * 2 / GRID_SIZE) * 100}%`,
                  }}
                />
                {/* Tower - fixed size to fit grid with padding */}
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 drop-shadow-lg group-hover:scale-110 transition-all ${isDamaged ? 'brightness-[300%] scale-125' : ''} ${isLevelingUp ? 'scale-125 brightness-150' : ''}`} style={{ fontSize: '24px', lineHeight: '24px' }}>
                  {cultivatorTypes[tower.type].emoji}
                </div>
                
                {/* Level badge */}
                <div 
                  className="absolute -top-2 -right-2 rounded-full text-white text-xs font-bold w-5 h-5 flex items-center justify-center z-20 border-2 border-white shadow-lg"
                  style={{ backgroundColor: levelBadgeColor }}
                >
                  {tower.level}
                </div>
                
                {/* Skill indicators - show above tower */}
                {tower.equippedSkills.length > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-20">
                    {tower.equippedSkills.map((skillId, index) => {
                      const skill = SKILLS[skillId];
                      if (!skill) return null;
                      
                      return (
                        <div
                          key={skillId}
                          className="w-4 h-4 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-xs shadow-md"
                          title={skill.name}
                        >
                          {skill.icon}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* XP bar - show below tower */}
                {tower.level < MAX_LEVEL && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-700 rounded z-20">
                    <div
                      className="h-full rounded transition-all"
                      style={{ 
                        width: `${getLevelProgress(tower.level, tower.experience)}%`,
                        backgroundColor: levelBadgeColor
                      }}
                    />
                  </div>
                )}
                
                {/* Health bar - only show when damaged */}
                {tower.health < tower.maxHealth && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-red-900 rounded z-20">
                    <div
                      className="h-full bg-green-500 rounded transition-all"
                      style={{ width: `${(tower.health / tower.maxHealth) * 100}%` }}
                    />
                  </div>
                )}
                {/* Hover hint */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-amber-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {tower.name || cultivatorTypes[tower.type].name} • Lv.{tower.level} • {tower.kills} kills
                </div>
              </div>
            );
          })}

          {/* Enemies */}
          {enemies.map(enemy => {
            // Calculate bounce offset for attacking enemies
            let bounceOffsetX = 0;
            let bounceOffsetY = 0;
            
            if (enemy.isAttackingCastle && enemy.attackBounceProgress > 0) {
              // Calculate direction from enemy to castle (approximately right and centered)
              const castleCenterX = BOARD_WIDTH * 0.5;
              const castleCenterY = BOARD_HEIGHT * 0.95;
              const dx = castleCenterX - enemy.x;
              const dy = castleCenterY - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Move 15 pixels towards castle during bounce
              const bounceDistance = 15 * enemy.attackBounceProgress;
              bounceOffsetX = (dx / distance) * bounceDistance;
              bounceOffsetY = (dy / distance) * bounceDistance;
            }

            const displayX = enemy.x + bounceOffsetX;
            const displayY = enemy.y + bounceOffsetY;

            return (
              <div
                key={enemy.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 group"
                style={{ 
                  left: `${(displayX / BOARD_WIDTH) * 100}%`, 
                  top: `${(displayY / BOARD_HEIGHT) * 100}%` 
                }}
              >
                <div className={`text-3xl transition-all ${damagedEnemies.has(enemy.id) ? 'brightness-[300%] scale-125' : ''}`}>
                  {getEnemyEmoji(enemy)}
                </div>
                {/* Health bar - only show when damaged */}
                {enemy.health < enemy.maxHealth && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-red-900 rounded">
                    <div
                      className="h-full bg-red-500 rounded transition-all"
                      style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                    />
                  </div>
                )}
                {/* Hover tooltip with enemy name */}
                {enemy.name && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-red-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {enemy.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Projectiles */}
          {projectiles.map(projectile => {
            const x = projectile.startX + (projectile.targetX - projectile.startX) * projectile.progress;
            const y = projectile.startY + (projectile.targetY - projectile.startY) * projectile.progress;
            
            return (
              <div
                key={projectile.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                style={{ 
                  left: `${(x / BOARD_WIDTH) * 100}%`, 
                  top: `${(y / BOARD_HEIGHT) * 100}%`,
                  transition: 'all 50ms linear',
                }}
              >
                <div className="text-2xl drop-shadow-lg animate-pulse">
                  {getProjectileEmoji(projectile.type)}
                </div>
              </div>
            );
          })}

          {/* Dropped Items */}
          {droppedItems.map(droppedItem => {
            const item = getItemById(droppedItem.itemId);
            if (!item) return null;
            
            const glowColor = RARITY_GLOW[item.rarity];
            const borderColor = RARITY_COLORS[item.rarity];
            
            return (
              <div
                key={droppedItem.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15 animate-bounce"
                style={{ 
                  left: `${(droppedItem.x / BOARD_WIDTH) * 100}%`, 
                  top: `${(droppedItem.y / BOARD_HEIGHT) * 100}%`,
                }}
              >
                {/* Glow effect */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: glowColor,
                    boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`
                  }}
                />
                {/* Item icon */}
                <div 
                  className="relative text-2xl drop-shadow-lg"
                  style={{ 
                    filter: `drop-shadow(0 0 4px ${borderColor})`
                  }}
                >
                  {item.icon}
                </div>
                {/* Item name tooltip */}
                <div 
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded whitespace-nowrap font-bold"
                  style={{ 
                    backgroundColor: borderColor,
                    color: 'white'
                  }}
                >
                  {item.name}
                </div>
              </div>
            );
          })}

          {/* Hover Preview */}
          {hoverPosition && selectedTowerType && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
              style={{ 
                left: `${(hoverPosition.x / BOARD_WIDTH) * 100}%`, 
                top: `${(hoverPosition.y / BOARD_HEIGHT) * 100}%`,
                width: `${(GRID_SIZE / BOARD_WIDTH) * 100}%`,
                aspectRatio: '1 / 1'
              }}
            >
              {/* Range indicator for tower being placed */}
              <div
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                  hoverPosition.isValid 
                    ? 'border-amber-400/60 bg-amber-400/20' 
                    : 'border-red-400/60 bg-red-400/20'
                }`}
                style={{
                  width: `${(cultivatorTypes[selectedTowerType].range * 2 / GRID_SIZE) * 100}%`,
                  height: `${(cultivatorTypes[selectedTowerType].range * 2 / GRID_SIZE) * 100}%`,
                }}
              />
              {/* Grid tile background */}
              <div 
                className={`w-full h-full border-2 transition-all flex items-center justify-center relative z-10 ${
                  hoverPosition.isValid 
                    ? 'bg-green-500/30 border-green-400' 
                    : 'bg-red-500/30 border-red-400'
                }`}
                style={{ boxSizing: 'border-box' }}
              >
                {/* Tower icon with padding inside background */}
                <div 
                  className={`transition-all ${
                    hoverPosition.isValid ? 'opacity-90' : 'opacity-50'
                  }`}
                  style={{ fontSize: '24px', lineHeight: '24px' }}
                >
                  {cultivatorTypes[selectedTowerType].emoji}
                </div>
              </div>
              {/* Validity indicator */}
              <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded whitespace-nowrap ${
                hoverPosition.isValid 
                  ? 'bg-green-900/80 text-green-300 border border-green-500' 
                  : 'bg-red-900/80 text-red-300 border border-red-500'
              }`}>
                {hoverPosition.isValid ? '✓ Valid' : '✗ Invalid'}
              </div>
            </div>
          )}

          {/* Preview placement - only show when tower type is actively selected */}
          {selectedTowerType !== null && selectedTowerType !== undefined && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="text-amber-300 text-xs absolute top-2 left-2 bg-black/70 px-3 py-2 rounded border border-amber-600">
                <div>🎯 Place tower in highlighted zone (8 bottommost rows)</div>
                <div className="text-amber-400 mt-1">Right-click to cancel</div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameStatus === 'gameOver' && (
            <GameOverScreen
              score={score}
              wave={wave}
              enemiesDefeated={enemiesDefeated}
              cultivatorsDeployed={cultivatorsDeployed}
              timePlayed={getTimePlayed()}
              showNewPBNotification={showNewPBNotification}
              onReset={onReset}
              onViewGlobalLeaderboard={handleViewGlobalLeaderboardFromGameOver}
              onQuitToMap={onQuitToMap}
            />
          )}

          {/* In-Game Menu Popup */}
          {menuOpen && gameStatus === 'playing' && (
            <div 
              className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto"
              onContextMenu={handleMenuContextMenu}
            >
              <div className="bg-gradient-to-br from-green-950 to-amber-950 border-4 border-amber-600 rounded-lg p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300 min-w-[250px] relative">
                {/* Mute Button - Top Left */}
                <Button
                  onClick={handleToggleMute}
                  variant={isMuted ? 'default' : 'outline'}
                  size="sm"
                  className={`absolute top-3 left-3 h-8 w-8 px-0 ${
                    isMuted
                      ? 'bg-red-700 hover:bg-red-600'
                      : 'border-amber-600 text-amber-300 hover:bg-amber-900/50'
                  }`}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
                
                <div className="text-5xl mb-4">⚙️</div>
                <div className="text-amber-300 text-2xl mb-6">Game Paused</div>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleCloseMenu} 
                    className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 w-full"
                  >
                    Resume Game
                  </Button>
                  <Button 
                    onClick={handleRestartFromMenu} 
                    variant="outline"
                    className="border-red-600 text-red-300 hover:bg-red-900/50 px-6 py-2 w-full"
                  >
                    Restart Game
                  </Button>
                  <Button 
                    onClick={handleOpenSettings} 
                    variant="outline"
                    className="border-amber-600 text-amber-300 hover:bg-amber-900/50 px-6 py-2 w-full"
                  >
                    Settings
                  </Button>
                  <Button 
                    onClick={handleOpenLeaderboard} 
                    variant="outline"
                    className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/50 px-6 py-2 w-full"
                  >
                    <Trophy className="size-5 mr-2" />
                    Leaderboard
                  </Button>
                  <Button 
                    onClick={() => {
                      setMenuOpen(false);
                      setEnemyCodexOpen(true);
                    }} 
                    variant="outline"
                    className="border-red-600 text-red-300 hover:bg-red-900/50 px-6 py-2 w-full"
                  >
                    📖 Enemy Codex
                  </Button>
                  <Button 
                    onClick={onQuitToMap} 
                    variant="outline"
                    className="border-red-600 text-red-300 hover:bg-red-900/50 px-6 py-2 w-full"
                  >
                    Quit to Map
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Menu Popup */}
          {settingsOpen && gameStatus === 'playing' && (
            <SettingsMenu onClose={handleCloseSettings} onOpenUIShowcase={handleOpenUIShowcase} />
          )}

          {/* UI Showcase Popup */}
          {uiShowcaseOpen && gameStatus === 'playing' && (
            <UIShowcase onClose={handleCloseUIShowcase} />
          )}

          {/* Global Leaderboard Popup */}
          {globalLeaderboardOpen && (
            <LeaderboardSimple 
              open={globalLeaderboardOpen} 
              onClose={gameStatus === 'gameOver' ? handleCloseGlobalLeaderboardFromGameOver : handleCloseGlobalLeaderboard} 
            />
          )}

          {/* Score Submit Popup - for manual submission */}
          {scoreSubmitOpen && (
            <ScoreSubmitDialog 
              open={scoreSubmitOpen} 
              onClose={handleCloseScoreSubmit} 
              score={score} 
              wave={wave}
              onSuccess={handleScoreSubmitSuccess}
            />
          )}

          {/* Enemy Codex */}
          {enemyCodexOpen && (
            <EnemyCodexDialog
              open={enemyCodexOpen}
              onClose={() => {
                setEnemyCodexOpen(false);
                setMenuOpen(true);
              }}
              highestWave={wave}
            />
          )}
        </div>
      </div>

      {/* Cultivators Section - Below Game Board */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 border-t-2 border-amber-700 p-2">
        <div className={isGameOver ? 'opacity-50 pointer-events-none' : ''}>
          <div className="text-amber-300 text-xs mb-2 text-center">Cultivators</div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(cultivatorTypes).map(([key, tower]: [string, any]) => {
              const canAfford = qi >= tower.cost && gameStatus !== 'gameOver';
              const isSelected = selectedTowerType === key;

              return (
                <button
                  key={key}
                  onClick={() => onSelectType(isSelected ? null : key)}
                  disabled={!canAfford}
                  className={`
                    relative p-2 rounded border-2 transition-all
                    ${
                      isSelected 
                        ? 'bg-amber-600 border-amber-400 shadow-lg scale-105' 
                        : canAfford
                          ? 'bg-amber-900/50 border-amber-700 hover:bg-amber-800/50 hover:scale-105'
                          : 'bg-gray-800/30 border-gray-700 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Tower icon */}
                  <div className="flex items-center justify-center mb-1" style={{ fontSize: '20px', lineHeight: '20px' }}>
                    {tower.emoji}
                  </div>
                  <div className="text-amber-100 text-[11px] leading-tight mb-1 truncate">{tower.name}</div>
                  <div className="flex justify-between text-[10px] gap-1">
                    <span className="text-amber-300">⚡{tower.cost}</span>
                    <span className="text-blue-300">🎯{tower.rangeInTiles}</span>
                    <span className="text-red-300">💥{tower.damage}</span>
                    <span className="text-amber-400">⚔️{(1000 / tower.attackSpeed).toFixed(1)}/s</span>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}