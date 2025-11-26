import { useState, useEffect } from 'react';
import type { MapWaveConfig, GrowthCurveType } from '../../shared/types/map-wave-config';
import { mapWaveConfigService } from '../../shared/utils/map-wave-config-service';
import { Button, FormInput, FormSelect } from './ui';
import WaveProgressionGraph from './WaveProgressionGraph';
import EnemyAllowlistSelector from './EnemyAllowlistSelector';

interface WaveConfigDialogProps {
  mapId: string;
  mapName: string;
  onClose: () => void;
}

export default function WaveConfigDialog({
  mapId,
  mapName,
  onClose,
}: WaveConfigDialogProps) {
  const [config, setConfig] = useState<Omit<MapWaveConfig, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load existing config or create default
  useEffect(() => {
    loadData();
  }, [mapId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const existingConfig = await mapWaveConfigService.getMapWaveConfig(mapId);

      if (existingConfig) {
        // Load existing config
        setConfig({
          mapId: existingConfig.mapId,
          wave1SpendLimit: existingConfig.wave1SpendLimit,
          enemiesPerWave: existingConfig.enemiesPerWave,
          growthCurveType: existingConfig.growthCurveType,
          allowedEnemyIds: existingConfig.allowedEnemyIds,
          version: existingConfig.version,
        });
      } else {
        // Create default config for new maps
        setConfig({
          mapId,
          wave1SpendLimit: 100,
          enemiesPerWave: 10,
          growthCurveType: 'linear',
          allowedEnemyIds: [],
          version: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wave configuration');
      console.error('Error loading wave config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    // Validate configuration
    const validation = mapWaveConfigService.validateMapWaveConfig(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please fix the validation errors before saving');
      return;
    }

    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await mapWaveConfigService.upsertMapWaveConfig(config);
      setSuccessMessage('Wave configuration saved successfully!');
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wave configuration');
      console.error('Error saving wave config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : null);
    // Clear validation errors when user makes changes
    setValidationErrors([]);
    setError(null);
  };

  // Handle overlay click to close dialog
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
        <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 border border-slate-700 p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🌊</div>
              <p className="text-slate-300 text-lg">Loading wave configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  const isSaveDisabled = saving || validationErrors.length > 0;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto p-4"
      style={{ zIndex: 9999 }}
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full my-8 border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-cyan-900 border-opacity-50 bg-gradient-to-r from-cyan-900 to-purple-900" style={{ backgroundImage: 'linear-gradient(to right, rgba(22, 78, 99, 0.3), rgba(88, 28, 135, 0.3))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                🌊 Configure Waves
              </h2>
              <p className="text-slate-300 mt-1">
                {mapName}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-white transition-colors text-2xl"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Success Message */}
          {successMessage && (
            <div className="px-4 py-3 rounded bg-emerald-900 bg-opacity-30 border border-emerald-700">
              <p className="text-emerald-400 flex items-center gap-2">
                <span>✓</span>
                <span>{successMessage}</span>
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 rounded bg-red-900 bg-opacity-30 border border-red-700">
              <p className="text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="px-4 py-3 rounded bg-red-900 bg-opacity-20 border border-red-500">
              <p className="font-bold text-red-400 mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1 text-red-400 text-sm">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormInput
                label="Wave 1 Spend Limit"
                type="number"
                value={config.wave1SpendLimit}
                onChange={(e) => updateField('wave1SpendLimit', parseInt(e.target.value) || 0)}
                min="10"
                max="10000"
                step="10"
                placeholder="100"
              />
              <p className="text-xs text-slate-400 mt-1">
                Starting budget for enemy spawning (10-10,000)
              </p>
            </div>

            <div>
              <FormInput
                label="Enemies Per Wave"
                type="number"
                value={config.enemiesPerWave}
                onChange={(e) => updateField('enemiesPerWave', parseInt(e.target.value) || 0)}
                min="1"
                max="100"
                step="1"
                placeholder="10"
              />
              <p className="text-xs text-slate-400 mt-1">
                Total number of enemies to spawn per wave (1-100)
              </p>
            </div>
          </div>

          {/* Growth Curve Selector */}
          <div>
            <FormSelect
              label="Growth Curve Type"
              value={config.growthCurveType}
              onChange={(e) => updateField('growthCurveType', e.target.value as GrowthCurveType)}
            >
              <option value="linear">Linear - Steady increase (spend × wave)</option>
              <option value="exponential">Exponential - Accelerating difficulty (1.2^wave)</option>
              <option value="logarithmic">Logarithmic - Gentle scaling (log₂)</option>
            </FormSelect>
            <p className="text-xs text-slate-400 mt-1">
              Determines how difficulty increases across waves
            </p>
          </div>

          {/* Wave Progression Graph */}
          <WaveProgressionGraph
            wave1SpendLimit={config.wave1SpendLimit}
            growthCurveType={config.growthCurveType}
            maxWaves={20}
          />

          {/* Enemy Allowlist Selector */}
          <EnemyAllowlistSelector
            selectedEnemyIds={config.allowedEnemyIds}
            onChange={(enemyIds) => updateField('allowedEnemyIds', enemyIds)}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-900 bg-opacity-50">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleCancel}
              variant="primary"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="success"
              disabled={isSaveDisabled}
            >
              {saving ? '💾 Saving...' : '💾 Save Configuration'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
