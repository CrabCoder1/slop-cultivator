import type { Map as GameMap, TileType, TileInstance } from '../types/map';

export interface PathfindingGrid {
  width: number;
  height: number;
  getTileAt: (x: number, y: number) => TileType | null;
}

export class TileGrid implements PathfindingGrid {
  private tileTypeMap: globalThis.Map<string, TileType>;
  private tiles: TileInstance[][];
  public readonly width: number;
  public readonly height: number;

  constructor(map: GameMap, tileTypes: TileType[]) {
    this.tiles = map.tiles;
    this.width = map.width;
    this.height = map.height;
    
    // Create lookup map for quick tile type access
    this.tileTypeMap = new globalThis.Map(tileTypes.map(tt => [tt.id, tt]));
  }

  /**
   * Get the tile type at a specific grid position
   * @param x Grid column (0-indexed)
   * @param y Grid row (0-indexed)
   * @returns TileType or null if out of bounds or tile type not found
   */
  getTileAt(x: number, y: number): TileType | null {
    // Check bounds
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }

    // Get tile instance at position
    const tileInstance = this.tiles[y][x];
    if (!tileInstance) {
      return null;
    }

    // Look up tile type
    return this.tileTypeMap.get(tileInstance.tileTypeId) || null;
  }

  /**
   * Check if a cultivator can be deployed at a specific grid position
   * @param x Grid column (0-indexed)
   * @param y Grid row (0-indexed)
   * @returns true if deployment is allowed, false otherwise
   */
  canDeployCultivator(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    if (!tile) {
      return false;
    }
    return tile.gameplay.canDeployCultivator;
  }

  /**
   * Check if a tile is walkable for pathfinding
   * @param x Grid column (0-indexed)
   * @param y Grid row (0-indexed)
   * @returns true if walkable, false otherwise
   */
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    if (!tile) {
      return false;
    }
    return tile.pathfinding.isWalkable;
  }

  /**
   * Get the movement cost for a tile (used in A* pathfinding)
   * @param x Grid column (0-indexed)
   * @param y Grid row (0-indexed)
   * @returns Movement cost, or Infinity if not walkable
   */
  getMovementCost(x: number, y: number): number {
    const tile = this.getTileAt(x, y);
    if (!tile || !tile.pathfinding.isWalkable) {
      return Infinity;
    }
    return tile.pathfinding.movementCost;
  }
}
