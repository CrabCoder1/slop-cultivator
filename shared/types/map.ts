export interface Map {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileInstance[][];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: MapMetadata;
}

export interface MapMetadata {
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  author?: string;
}

export interface TileInstance {
  tileTypeId: string;
  x: number;
  y: number;
}

export interface TileType {
  id: string;
  key: string;
  displayName: string;
  visual: TileVisual;
  pathfinding: TilePathfinding;
  gameplay: TileGameplay;
  createdAt: string;
  updatedAt: string;
}

export interface TileVisual {
  color?: string;
  sprite?: string;
}

export interface TilePathfinding {
  isWalkable: boolean;
  movementCost: number;
}

export interface TileGameplay {
  canDeployCultivator: boolean;
}
