import { useState, useEffect } from 'react';
import type { Map, TileType, TileInstance } from '../../shared/types/map';
import { mapService } from '../../shared/utils/map-service';
import SelectableCard from './ui/SelectableCard';
import TilePalette from './TilePalette';
import MapPreview from './MapPreview';
import WaveConfigButton from './WaveConfigButton';
import { FormInput, Button } from './ui';

export default function MapEditor() {
  const [maps, setMaps] = useState<Map[]>([]);
  const [tileTypes, setTileTypes] = useState<TileType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBrush, setActiveBrush] = useState<TileType | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load maps and tile types on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mapsData, tileTypesData] = await Promise.all([
        mapService.getAllMaps(),
        mapService.getTileTypes(),
      ]);
      setMaps(mapsData);
      setTileTypes(tileTypesData);
      
      // Set default brush to first tile type (grass)
      if (tileTypesData.length > 0 && !activeBrush) {
        const grassTile = tileTypesData.find(t => t.key === 'grass') || tileTypesData[0];
        setActiveBrush(grassTile);
      }
      
      // Select first map if available
      if (mapsData.length > 0 && selectedIndex === null) {
        setSelectedIndex(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load maps. Please try again.';
      setError(errorMessage);
      console.error('Error loading maps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMap = () => {
    // Create a new map with default values
    const defaultTileType = tileTypes.find(t => t.key === 'grass');
    if (!defaultTileType) {
      setError('No tile types available. Cannot create map.');
      return;
    }

    const newMap: Map = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      name: 'New Map',
      width: 20,
      height: 15,
      tiles: Array.from({ length: 15 }, (_, y) =>
        Array.from({ length: 20 }, (_, x) => ({
          tileTypeId: defaultTileType.id,
          x,
          y,
        }))
      ),
      isAvailable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMaps([newMap, ...maps]);
    setSelectedIndex(0);
    setIsCreatingNew(true);
    setIsDirty(true);
  };

  const updateField = <K extends keyof Map>(field: K, value: Map[K]) => {
    if (selectedIndex === null) return;
    
    setMaps((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], [field]: value };
      return updated;
    });
    setIsDirty(true);
  };

  const updateDimensions = (field: 'width' | 'height', value: number) => {
    if (selectedIndex === null) return;
    
    const currentMap = maps[selectedIndex];
    const defaultTileType = tileTypes.find(t => t.key === 'grass') || tileTypes[0];
    if (!defaultTileType) return;

    const newWidth = field === 'width' ? value : currentMap.width;
    const newHeight = field === 'height' ? value : currentMap.height;

    // Resize the tiles array
    const newTiles: TileInstance[][] = [];
    for (let y = 0; y < newHeight; y++) {
      const row: TileInstance[] = [];
      for (let x = 0; x < newWidth; x++) {
        // Keep existing tile if within old bounds, otherwise use default
        if (y < currentMap.tiles.length && x < currentMap.tiles[y].length) {
          row.push({ ...currentMap.tiles[y][x], x, y });
        } else {
          row.push({
            tileTypeId: defaultTileType.id,
            x,
            y,
          });
        }
      }
      newTiles.push(row);
    }

    setMaps((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        [field]: value,
        tiles: newTiles,
      };
      return updated;
    });
    setIsDirty(true);
  };

  const validateMap = (map: Map): string[] => {
    const errors: string[] = [];

    if (!map.name || map.name.trim().length < 1 || map.name.length > 100) {
      errors.push('Map name must be 1-100 characters');
    }

    if (map.width < 5 || map.width > 100) {
      errors.push('Width must be 5-100 tiles');
    }

    if (map.height < 5 || map.height > 100) {
      errors.push('Height must be 5-100 tiles');
    }

    if (!map.tiles || map.tiles.length !== map.height) {
      errors.push('Tile grid height mismatch');
    }

    if (map.tiles && map.tiles.some(row => row.length !== map.width)) {
      errors.push('Tile grid width mismatch');
    }

    // Check that all tiles reference valid tile types
    if (map.tiles) {
      const validTileTypeIds = new Set(tileTypes.map(t => t.id));
      for (const row of map.tiles) {
        for (const tile of row) {
          if (!validTileTypeIds.has(tile.tileTypeId)) {
            errors.push('Map contains invalid tile types');
            return errors; // Exit early to avoid duplicate errors
          }
        }
      }
    }

    return errors;
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (selectedIndex === null) return;
    
    const currentMap = maps[selectedIndex];
    
    // Validate map before saving
    const validationErrors = validateMap(currentMap);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      showNotification(validationErrors[0], 'error');
      return;
    }
    
    try {
      if (isCreatingNew) {
        const { id, createdAt, updatedAt, ...mapData } = currentMap;
        await mapService.createMap(mapData);
        await loadData();
        setIsCreatingNew(false);
        setIsDirty(false);
        showNotification('Map created successfully!', 'success');
      } else {
        await mapService.updateMap(currentMap.id, currentMap);
        await loadData();
        setIsDirty(false);
        showNotification('Map saved successfully!', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save map. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error saving map:', err);
    }
  };

  const handleDelete = async () => {
    if (selectedIndex === null) return;
    
    const currentMap = maps[selectedIndex];
    
    if (!confirm(`Are you sure you want to delete "${currentMap.name}"?`)) {
      return;
    }

    try {
      await mapService.deleteMap(currentMap.id);
      showNotification('Map deleted successfully!', 'success');
      await loadData();
      setSelectedIndex(maps.length > 1 ? 0 : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete map. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting map:', err);
    }
  };

  const handleToggleAvailability = async () => {
    if (selectedIndex === null) return;
    
    const currentMap = maps[selectedIndex];
    const newAvailability = !currentMap.isAvailable;
    
    try {
      await mapService.toggleAvailability(
        currentMap.id,
        newAvailability
      );
      await loadData();
      showNotification(
        newAvailability 
          ? 'Map is now available to players!' 
          : 'Map is now hidden from players',
        'success'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle availability. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error toggling availability:', err);
    }
  };

  const handleSelectBrush = (tileType: TileType) => {
    setActiveBrush(tileType);
    setIsErasing(false);
  };

  const handleSelectEraser = () => {
    setIsErasing(true);
    // Set brush to grass for eraser
    const grassTile = tileTypes.find(t => t.key === 'grass');
    if (grassTile) {
      setActiveBrush(grassTile);
    }
  };

  const handleTilesChange = (tiles: TileInstance[][]) => {
    if (selectedIndex === null) return;
    
    setMaps((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], tiles };
      return updated;
    });
    setIsDirty(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading maps...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Button onClick={loadData} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const current = selectedIndex !== null ? maps[selectedIndex] : null;

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <div 
        className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
        style={{ paddingRight: '1.5rem' }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-cyan-400">Select Map</h3>
          </div>
          
          <Button onClick={handleNewMap} variant="success" className="w-full mb-4">
            + New Map
          </Button>

          {maps.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No maps yet. Create one!
            </div>
          ) : (
            maps.map((map, index) => (
              <SelectableCard
                key={map.id}
                isSelected={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className="w-full"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{map.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {map.width}×{map.height}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded mt-1 inline-block font-bold ${
                      map.isAvailable 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {map.isAvailable ? 'Available' : 'Hidden'}
                    </div>
                  </div>
                </div>
              </SelectableCard>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {current ? (
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Notification */}
          {notification && (
            <div
              className={`px-4 py-3 rounded-lg font-semibold ${
                notification.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {notification.message}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              🗺️ {current.name}
              {isDirty && <span className="text-amber-400 text-lg ml-2">*</span>}
            </h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={!isDirty} 
                variant="success"
              >
                💾 Save
              </Button>
              {!isCreatingNew && (
                <Button onClick={handleDelete} variant="danger">
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>

          {/* Top Row - Map Preview & Tile Palette */}
          <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)' }}>
            {/* Map Preview */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Map Preview
              </label>
              <MapPreview
                map={current}
                tileTypes={tileTypes}
                activeBrush={activeBrush}
                isErasing={isErasing}
                onTilesChange={handleTilesChange}
              />
            </div>

            {/* Tile Palette */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Tile Palette
              </label>
              <TilePalette
                tileTypes={tileTypes}
                activeBrush={activeBrush}
                isErasing={isErasing}
                onSelectBrush={handleSelectBrush}
                onSelectEraser={handleSelectEraser}
              />
            </div>
          </div>

          {/* Bottom Row - Map Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-cyan-400">Map Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Map Name"
                type="text"
                value={current.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter map name"
              />

              <FormInput
                label="Width (tiles)"
                type="number"
                min={5}
                max={100}
                value={current.width}
                onChange={(e) => updateDimensions('width', parseInt(e.target.value))}
              />

              <FormInput
                label="Height (tiles)"
                type="number"
                min={5}
                max={100}
                value={current.height}
                onChange={(e) => updateDimensions('height', parseInt(e.target.value))}
              />
            </div>

            {/* Availability Toggle */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Availability
              </label>
              <button
                onClick={handleToggleAvailability}
                disabled={isCreatingNew}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  current.isAvailable
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                } ${isCreatingNew ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {current.isAvailable ? '✓ Available to Players' : '✗ Hidden from Players'}
              </button>
              {isCreatingNew && (
                <p className="text-xs text-slate-500 mt-1">
                  Save the map first to toggle availability
                </p>
              )}
            </div>

            {/* Wave Configuration */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Wave Configuration
              </label>
              <WaveConfigButton
                mapId={current.id}
                mapName={current.name}
                disabled={isCreatingNew}
              />
              {isCreatingNew && (
                <p className="text-xs text-slate-500 mt-1">
                  Save the map first to configure waves
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-lg">
            Select a map or create a new one to get started
          </p>
        </div>
      )}
    </div>
  );
}
