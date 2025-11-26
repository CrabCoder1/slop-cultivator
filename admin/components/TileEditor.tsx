import { useState, useEffect } from 'react';
import { mapService } from '../../shared/utils/map-service';
import type { TileType } from '../../shared/types/map';
import SelectableCard from './ui/SelectableCard';
import { Button, FormInput, FormSelect } from './ui';

export default function TileEditor() {
  const [tileTypes, setTileTypes] = useState<TileType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTileTypes();
  }, []);

  const loadTileTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const types = await mapService.getTileTypes();
      setTileTypes(types);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tile types');
      setIsLoading(false);
    }
  };

  const handleSelectTile = (index: number) => {
    setSelectedIndex(index);
    setValidationErrors({});
    setHasChanges(false);
  };

  const updateField = (field: keyof TileType, value: any) => {
    setTileTypes(prev => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        [field]: value
      };
      return updated;
    });
    setHasChanges(true);
  };

  const updateNestedField = (
    parent: 'visual' | 'pathfinding' | 'gameplay',
    field: string,
    value: any
  ) => {
    setTileTypes(prev => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        [parent]: {
          ...updated[selectedIndex][parent],
          [field]: value
        }
      };
      return updated;
    });
    setHasChanges(true);
  };

  const validateTileType = (tileType: TileType): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate key field
    if (!tileType.key || tileType.key.trim() === '') {
      errors.key = 'Key is required';
    } else if (!/^[a-z0-9_]+$/.test(tileType.key)) {
      errors.key = 'Key must contain only lowercase letters, numbers, and underscores';
    }

    // Validate displayName field
    if (!tileType.displayName || tileType.displayName.trim() === '') {
      errors.displayName = 'Display name is required';
    }

    // Validate movementCost field
    if (tileType.pathfinding.movementCost <= 0) {
      errors.movementCost = 'Movement cost must be a positive number greater than 0';
    }

    return errors;
  };

  const handleSave = async () => {
    const current = tileTypes[selectedIndex];
    if (!current) return;

    // Validate before saving
    const errors = validateTileType(current);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors if validation passes
    setValidationErrors({});

    try {
      setError(null);
      // Call mapService.updateTileType with tile type id and updated fields
      const updated = await mapService.updateTileType(current.id, current);
      
      // Update local state with the returned tile type
      setTileTypes(prev => {
        const newTypes = [...prev];
        newTypes[selectedIndex] = updated;
        return newTypes;
      });

      // Display success notification and set hasChanges to false
      setHasChanges(false);
      setError(null);
      
      // Show success message briefly
      const successMsg = 'Changes saved successfully!';
      setError(successMsg);
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      // Display error notification on save failure
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCreateNew = async () => {
    try {
      setError(null);
      
      // Create new tile type object with default values
      const newTileType = {
        key: 'new_tile',
        displayName: 'New Tile',
        visual: {
          color: '#808080'
        },
        pathfinding: {
          isWalkable: true,
          movementCost: 1
        },
        gameplay: {
          canDeployCultivator: false
        }
      };

      // Call mapService.createTileType with the new tile type object
      const createdTile = await mapService.createTileType(newTileType);
      
      // On success, add the returned tile type to tileTypes array
      setTileTypes(prev => [...prev, createdTile]);
      
      // Set selectedIndex to the new tile's index
      setSelectedIndex(tileTypes.length);
      
      // Clear any changes flag and validation errors
      setHasChanges(false);
      setValidationErrors({});
      
      // Show success message briefly
      const successMsg = 'New tile created successfully!';
      setError(successMsg);
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      // Display error notification on creation failure using error message from Map Service
      setError(err instanceof Error ? err.message : 'Failed to create new tile');
    }
  };

  // Show loading state while data is being loaded
  if (isLoading || tileTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading tiles...</p>
      </div>
    );
  }

  const current = tileTypes[selectedIndex];
  if (!current) return null;

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <div 
        className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
        style={{ paddingRight: '1.5rem' }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-cyan-400">Select Tile</h3>
          </div>
          <Button onClick={handleCreateNew} variant="success" className="w-full mb-4">
            ➕ New Tile
          </Button>
          {tileTypes.map((tileType, index) => (
            <SelectableCard
              key={tileType.id}
              isSelected={selectedIndex === index}
              onClick={() => handleSelectTile(index)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border border-slate-600 flex-shrink-0"
                  style={{ backgroundColor: tileType.visual.color || '#808080' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{tileType.displayName}</div>
                  <div className="text-xs text-slate-400 truncate">{tileType.key}</div>
                </div>
              </div>
            </SelectableCard>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {current.displayName}
          </h2>
          <Button onClick={handleSave} disabled={!hasChanges} variant="success">
            💾 Save Changes
          </Button>
        </div>

        {/* Error/Success Display */}
        {error && (
          <div className={`px-4 py-3 rounded ${
            error.includes('success') 
              ? 'bg-green-900/20 border border-green-500 text-green-400'
              : 'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {error}
          </div>
        )}

        {/* Editor Form */}
        <div className="space-y-6">
          {/* Basic Properties */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Basic Properties</h3>
            
            <div>
              <FormInput
                label="Key"
                type="text"
                value={current.key}
                onChange={(e) => updateField('key', e.target.value)}
                placeholder="e.g., grass, water, stone"
              />
              {validationErrors.key && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.key}</p>
              )}
            </div>

            <div>
              <FormInput
                label="Display Name"
                type="text"
                value={current.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="e.g., Grass Tile"
              />
              {validationErrors.displayName && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.displayName}</p>
              )}
            </div>
          </div>

          {/* Visual Properties */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Visual Properties</h3>
            
            <div>
              <FormInput
                label="Color (Hex)"
                type="text"
                value={current.visual.color || ''}
                onChange={(e) => updateNestedField('visual', 'color', e.target.value)}
                placeholder="#4CAF50"
              />
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-400">Preview:</span>
                <div 
                  className="w-8 h-8 rounded border border-slate-600"
                  style={{ backgroundColor: current.visual.color || '#808080' }}
                />
              </div>
            </div>

            <FormInput
              label="Sprite (Optional)"
              type="text"
              value={current.visual.sprite || ''}
              onChange={(e) => updateNestedField('visual', 'sprite', e.target.value)}
              placeholder="sprite_identifier"
            />
          </div>

          {/* Pathfinding Properties */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Pathfinding Properties</h3>
            
            <FormSelect
              label="Is Walkable"
              value={current.pathfinding.isWalkable ? 'true' : 'false'}
              onChange={(e) => updateNestedField('pathfinding', 'isWalkable', e.target.value === 'true')}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </FormSelect>

            <div>
              <FormInput
                label="Movement Cost"
                type="number"
                value={current.pathfinding.movementCost}
                onChange={(e) => updateNestedField('pathfinding', 'movementCost', parseFloat(e.target.value))}
                placeholder="1"
                min="0.1"
                step="0.1"
              />
              {validationErrors.movementCost && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.movementCost}</p>
              )}
            </div>
          </div>

          {/* Gameplay Properties */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-400">Gameplay Properties</h3>
            
            <FormSelect
              label="Can Deploy Cultivator"
              value={current.gameplay.canDeployCultivator ? 'true' : 'false'}
              onChange={(e) => updateNestedField('gameplay', 'canDeployCultivator', e.target.value === 'true')}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </FormSelect>
          </div>
        </div>
      </div>
    </div>
  );
}
