import type { TileType } from '../../shared/types/map';

interface TilePaletteProps {
  tileTypes: TileType[];
  activeBrush: TileType | null;
  isErasing: boolean;
  onSelectBrush: (tileType: TileType) => void;
  onSelectEraser: () => void;
}

export default function TilePalette({
  tileTypes,
  activeBrush,
  isErasing,
  onSelectBrush,
  onSelectEraser,
}: TilePaletteProps) {
  return (
    <div className="space-y-2">
      {/* Tile Type Buttons */}
      {tileTypes.map((tileType) => (
        <button
          key={tileType.id}
          onClick={() => onSelectBrush(tileType)}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-left flex items-center gap-3 ${
            activeBrush?.id === tileType.id && !isErasing
              ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/50 border-2 border-amber-500'
              : 'border-2 border-slate-700 hover:border-emerald-600'
          }`}
          style={{
            backgroundColor: activeBrush?.id === tileType.id && !isErasing
              ? tileType.visual.color || '#1e293b'
              : '#1e293b',
          }}
        >
          {/* Color Swatch */}
          <div
            className="w-8 h-8 rounded border-2 border-white/30 flex-shrink-0"
            style={{ backgroundColor: tileType.visual.color || '#64748b' }}
          />
          
          {/* Tile Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {tileType.displayName}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {tileType.pathfinding.isWalkable ? '✓ Walkable' : '✗ Blocked'}
            </div>
          </div>
        </button>
      ))}

      {/* Eraser Button */}
      <button
        onClick={onSelectEraser}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all text-left flex items-center gap-3 ${
          isErasing
            ? 'bg-red-600 ring-2 ring-amber-500 shadow-lg shadow-amber-500/50 border-2 border-amber-500 text-white'
            : 'bg-slate-800 border-2 border-slate-700 hover:border-emerald-600 text-slate-300'
        }`}
      >
        {/* Eraser Icon */}
        <div className="w-8 h-8 rounded border-2 border-white/30 flex-shrink-0 bg-slate-900 flex items-center justify-center text-lg">
          🧹
        </div>
        
        {/* Eraser Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">
            Eraser
          </div>
          <div className="text-xs mt-0.5 opacity-80">
            Reset to grass
          </div>
        </div>
      </button>
    </div>
  );
}
