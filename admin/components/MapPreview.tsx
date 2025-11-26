import { useState, useRef, useEffect } from 'react';
import type { Map, TileType, TileInstance } from '../../shared/types/map';

interface MapPreviewProps {
  map: Map;
  tileTypes: TileType[];
  activeBrush: TileType | null;
  isErasing: boolean;
  onTilesChange: (tiles: TileInstance[][]) => void;
}

const BASE_CELL_SIZE = 30; // Base cell size for calculations

export default function MapPreview({
  map,
  tileTypes,
  activeBrush,
  isErasing,
  onTilesChange,
}: MapPreviewProps) {
  const [isPainting, setIsPainting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [userZoom, setUserZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [autoScale, setAutoScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Calculate auto-fit scale
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth - 32;
      const containerHeight = 500 - 120; // Account for toolbar and info

      const mapWidth = map.width * BASE_CELL_SIZE;
      const mapHeight = map.height * BASE_CELL_SIZE;

      const scaleX = containerWidth / mapWidth;
      const scaleY = containerHeight / mapHeight;

      const newScale = Math.min(scaleX, scaleY, 1);
      setAutoScale(newScale);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [map.width, map.height]);

  // Create a lookup map for quick tile type access
  const tileTypeMap = tileTypes.reduce((acc, tt) => {
    acc[tt.id] = tt;
    return acc;
  }, {} as Record<string, TileType>);

  const paintTile = (x: number, y: number) => {
    if (!activeBrush || x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return;
    }

    const newTiles = map.tiles.map(row => [...row]);
    newTiles[y][x] = {
      tileTypeId: activeBrush.id,
      x,
      y,
    };

    onTilesChange(newTiles);
  };

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    paintTile(x, y);
  };

  const handleCellMouseDown = (x: number, y: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsPainting(true);
    paintTile(x, y);
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    if (isPainting) {
      paintTile(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsPainting(false);
    setIsPanning(false);
  };

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out if scrolling down, in if scrolling up
    setUserZoom(prev => Math.min(Math.max(prev * delta, 0.1), 3));
  };

  const handleZoomIn = () => {
    setUserZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setUserZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    setUserZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getTileColor = (tileInstance: TileInstance): string => {
    const tileType = tileTypeMap[tileInstance.tileTypeId];
    return tileType?.visual.color || '#64748b';
  };

  const scale = autoScale * userZoom;
  const cellSize = BASE_CELL_SIZE * scale;

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 rounded-lg border border-purple-900 relative box-border"
      style={{ height: '500px' }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => {
        setShowToolbar(false);
        handleMouseUp();
      }}
    >
      {/* Toolbar */}
      <div
        className={`absolute z-10 transition-opacity duration-200 ${
          showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ bottom: '56px', right: '16px' }}
      >
        <div 
          className="border border-purple-700 rounded-lg p-1 flex flex-col items-center gap-0.5 shadow-xl"
          style={{ backgroundColor: 'rgba(2, 6, 23, 0.95)' }}
        >
          <button
            onClick={handleZoomIn}
            className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded font-bold transition-colors flex items-center justify-center text-sm"
            title="Zoom In"
          >
            +
          </button>
          <span className="text-[9px] text-slate-200 font-semibold leading-none">
            {Math.round(userZoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded font-bold transition-colors flex items-center justify-center text-sm"
            title="Zoom Out"
          >
            −
          </button>
          <div className="w-4 h-px bg-slate-600 my-0.5" />
          <button
            onClick={handleResetView}
            className="w-6 h-6 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded text-xs font-semibold transition-colors flex items-center justify-center"
            title="Reset View"
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className="w-full h-full overflow-hidden flex items-center justify-center p-4"
        onMouseDown={handleViewportMouseDown}
        onMouseMove={handleViewportMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <div
          ref={gridRef}
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${map.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${map.height}, ${cellSize}px)`,
            width: `${map.width * cellSize}px`,
            height: `${map.height * cellSize}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {map.tiles.map((row, y) =>
            row.map((tileInstance, x) => (
              <div
                key={`${x}-${y}`}
                className="border border-slate-700/50 transition-all hover:ring-2 hover:ring-amber-400/50"
                style={{
                  backgroundColor: getTileColor(tileInstance),
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  cursor: isPanning ? 'grabbing' : 'crosshair',
                }}
                onClick={(e) => handleCellClick(x, y, e)}
                onMouseDown={(e) => handleCellMouseDown(x, y, e)}
                onMouseEnter={() => handleCellMouseEnter(x, y)}
              />
            ))
          )}
        </div>
      </div>

      {/* Info Text */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-400 px-4">
        <p>Click/Drag to paint • Middle-click to pan • Scroll to zoom</p>
        <p className="mt-1">
          Active: <span className="text-cyan-300 font-semibold">
            {isErasing ? 'Eraser (Grass)' : activeBrush?.displayName || 'None'}
          </span>
        </p>
      </div>
    </div>
  );
}
