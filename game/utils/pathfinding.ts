import { Tower } from '../App';
import type { PathfindingGrid } from '../../shared/utils/tile-helper';

const GRID_SIZE = 30;
const COLS = 15;
const ROWS = 20;
const BOARD_WIDTH = COLS * GRID_SIZE; // 450px
const BOARD_HEIGHT = ROWS * GRID_SIZE; // 600px

// Castle occupies tiles (7,18) to (8,19) - bottom center (adjusted for 15 columns)
const CASTLE_TILES = [
  { col: 7, row: 18 },
  { col: 8, row: 18 },
  { col: 7, row: 19 },
  { col: 8, row: 19 }
];

interface Node {
  col: number;
  row: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent: Node | null;
}

// Moore neighborhood (8 directions)
const DIRECTIONS = [
  { col: -1, row: 0 },  // Left
  { col: 1, row: 0 },   // Right
  { col: 0, row: -1 },  // Up
  { col: 0, row: 1 },   // Down
  { col: -1, row: -1 }, // Up-Left
  { col: 1, row: -1 },  // Up-Right
  { col: -1, row: 1 },  // Down-Left
  { col: 1, row: 1 },   // Down-Right
];

function positionToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.floor(x / GRID_SIZE),
    row: Math.floor(y / GRID_SIZE)
  };
}

function gridToPosition(col: number, row: number): { x: number; y: number } {
  return {
    x: col * GRID_SIZE + GRID_SIZE / 2,
    y: row * GRID_SIZE + GRID_SIZE / 2
  };
}

function isValidTile(col: number, row: number, towers: Tower[], tileGrid?: PathfindingGrid): boolean {
  // Out of bounds
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return false;
  }

  // Castle tiles are obstacles
  if (CASTLE_TILES.some(tile => tile.col === col && tile.row === row)) {
    return false;
  }

  // Check tile walkability if tile grid is provided
  if (tileGrid) {
    const tile = tileGrid.getTileAt(col, row);
    if (!tile || !tile.pathfinding.isWalkable) {
      return false;
    }
  }

  // Check if tower occupies this tile
  const towerExists = towers.some(tower => {
    const towerGrid = positionToGrid(tower.x, tower.y);
    return towerGrid.col === col && towerGrid.row === row;
  });

  return !towerExists;
}

function heuristic(col1: number, row1: number, col2: number, row2: number): number {
  // Chebyshev distance (for 8-directional movement)
  return Math.max(Math.abs(col1 - col2), Math.abs(row1 - row2));
}

function getAdjacentCastleTiles(): { col: number; row: number }[] {
  const adjacent: { col: number; row: number }[] = [];
  const checked = new Set<string>();

  CASTLE_TILES.forEach(castle => {
    DIRECTIONS.forEach(dir => {
      const newCol = castle.col + dir.col;
      const newRow = castle.row + dir.row;
      const key = `${newCol},${newRow}`;
      
      // If it's not a castle tile and we haven't checked it yet
      if (!CASTLE_TILES.some(t => t.col === newCol && t.row === newRow) && !checked.has(key)) {
        if (newCol >= 0 && newCol < COLS && newRow >= 0 && newRow < ROWS) {
          adjacent.push({ col: newCol, row: newRow });
          checked.add(key);
        }
      }
    });
  });

  return adjacent;
}

export function findPath(startX: number, startY: number, towers: Tower[], tileGrid?: PathfindingGrid): { x: number; y: number }[] | null {
  const start = positionToGrid(startX, startY);
  const goalTiles = getAdjacentCastleTiles();

  if (goalTiles.length === 0) {
    // Fallback - no valid adjacent tiles to castle
    return [{ x: startX, y: startY }];
  }

  const openSet: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = {
    col: start.col,
    row: start.row,
    g: 0,
    h: Math.min(...goalTiles.map(goal => heuristic(start.col, start.row, goal.col, goal.row))),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.col},${current.row}`;

    // Check if we reached any goal tile
    if (goalTiles.some(goal => goal.col === current.col && goal.row === current.row)) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: Node | null = current;
      
      while (node !== null) {
        const pos = gridToPosition(node.col, node.row);
        path.unshift(pos);
        node = node.parent;
      }
      
      return path;
    }

    closedSet.add(currentKey);

    // Check all neighbors
    for (const dir of DIRECTIONS) {
      const neighborCol = current.col + dir.col;
      const neighborRow = current.row + dir.row;
      const neighborKey = `${neighborCol},${neighborRow}`;

      if (closedSet.has(neighborKey)) continue;
      if (!isValidTile(neighborCol, neighborRow, towers, tileGrid)) continue;

      // Calculate movement cost - use tile cost if available, otherwise default to 1
      let movementCost = 1;
      if (tileGrid) {
        const tile = tileGrid.getTileAt(neighborCol, neighborRow);
        if (tile && tile.pathfinding.isWalkable) {
          movementCost = tile.pathfinding.movementCost;
        }
      }

      const g = current.g + movementCost;
      const h = Math.min(...goalTiles.map(goal => heuristic(neighborCol, neighborRow, goal.col, goal.row)));
      const f = g + h;

      const existingNode = openSet.find(n => n.col === neighborCol && n.row === neighborRow);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          col: neighborCol,
          row: neighborRow,
          g,
          h,
          f,
          parent: current
        });
      }
    }
  }

  // No path found - path is completely blocked
  return null;
}

// Find the closest tower that's blocking the path to the castle
export function findBlockingTower(enemyX: number, enemyY: number, towers: Tower[]): Tower | null {
  if (towers.length === 0) return null;
  
  // Find the tower closest to the enemy
  let closestTower: Tower | null = null;
  let minDistance = Infinity;
  
  towers.forEach(tower => {
    const dx = tower.x - enemyX;
    const dy = tower.y - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestTower = tower;
    }
  });
  
  return closestTower;
}

// Find a path to move adjacent to a specific tower (for attacking)
export function findPathToTower(enemyX: number, enemyY: number, targetTower: Tower, towers: Tower[], tileGrid?: PathfindingGrid): { x: number; y: number }[] | null {
  const start = positionToGrid(enemyX, enemyY);
  const towerGrid = positionToGrid(targetTower.x, targetTower.y);
  
  // Find all tiles adjacent to the target tower
  const adjacentTiles: { col: number; row: number }[] = [];
  DIRECTIONS.forEach(dir => {
    const adjCol = towerGrid.col + dir.col;
    const adjRow = towerGrid.row + dir.row;
    
    // Check if this adjacent tile is valid (not occupied by another tower)
    const otherTowers = towers.filter(t => t.id !== targetTower.id);
    if (isValidTile(adjCol, adjRow, otherTowers, tileGrid)) {
      adjacentTiles.push({ col: adjCol, row: adjRow });
    }
  });
  
  if (adjacentTiles.length === 0) {
    // No valid adjacent tiles
    return null;
  }
  
  const openSet: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = {
    col: start.col,
    row: start.row,
    g: 0,
    h: Math.min(...adjacentTiles.map(goal => heuristic(start.col, start.row, goal.col, goal.row))),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.col},${current.row}`;

    // Check if we reached any adjacent tile
    if (adjacentTiles.some(goal => goal.col === current.col && goal.row === current.row)) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: Node | null = current;
      
      while (node !== null) {
        const pos = gridToPosition(node.col, node.row);
        path.unshift(pos);
        node = node.parent;
      }
      
      return path;
    }

    closedSet.add(currentKey);

    // Check all neighbors
    for (const dir of DIRECTIONS) {
      const neighborCol = current.col + dir.col;
      const neighborRow = current.row + dir.row;
      const neighborKey = `${neighborCol},${neighborRow}`;

      if (closedSet.has(neighborKey)) continue;
      
      // For pathfinding to tower, exclude the target tower itself from obstacles
      const otherTowers = towers.filter(t => t.id !== targetTower.id);
      if (!isValidTile(neighborCol, neighborRow, otherTowers, tileGrid)) continue;

      // Calculate movement cost - use tile cost if available, otherwise default to 1
      let movementCost = 1;
      if (tileGrid) {
        const tile = tileGrid.getTileAt(neighborCol, neighborRow);
        if (tile && tile.pathfinding.isWalkable) {
          movementCost = tile.pathfinding.movementCost;
        }
      }

      const g = current.g + movementCost;
      const h = Math.min(...adjacentTiles.map(goal => heuristic(neighborCol, neighborRow, goal.col, goal.row)));
      const f = g + h;

      const existingNode = openSet.find(n => n.col === neighborCol && n.row === neighborRow);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          col: neighborCol,
          row: neighborRow,
          g,
          h,
          f,
          parent: current
        });
      }
    }
  }
  
  // No path found to adjacent tiles
  return null;
}