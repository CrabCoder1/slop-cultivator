import { useState, useEffect } from 'react';
import { CultivatorTypes } from '@/utils/cultivator';
import { FormInput, FormTextarea, Button } from './ui';
import SelectableCard from './ui/SelectableCard';

type CultivatorData = {
  name: string;
  cost: number;
  rangeInTiles: number;
  damage: number;
  attackSpeed: number;
  emoji: string;
  maxHealth: number;
  description: string;
};

export default function CultivatorEditor() {
  const [cultivators, setCultivators] = useState<Record<string, CultivatorData>>({});
  const [selectedType, setSelectedType] = useState<string>('sword');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load current cultivator data
    const data: Record<string, CultivatorData> = {};
    Object.entries(CultivatorTypes).forEach(([key, cultivator]) => {
      data[key] = {
        name: cultivator.name,
        cost: cultivator.cost,
        rangeInTiles: cultivator.rangeInTiles,
        damage: cultivator.damage,
        attackSpeed: cultivator.attackSpeed,
        emoji: cultivator.emoji,
        maxHealth: cultivator.maxHealth,
        description: cultivator.description,
      };
    });
    setCultivators(data);
  }, []);

  const updateField = (field: keyof CultivatorData, value: string | number) => {
    setCultivators((prev) => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const exportConfig = () => {
    const config = JSON.stringify(cultivators, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cultivators-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setHasChanges(false);
  };

  const current = cultivators[selectedType];
  
  // Show loading state while data is being loaded
  if (Object.keys(cultivators).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading cultivators...</p>
      </div>
    );
  }
  
  if (!current) return null;

  const dps = (current.damage * 1000) / current.attackSpeed;
  const aps = 1000 / current.attackSpeed;

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <div 
        className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
        style={{ paddingRight: '1.5rem' }}
      >
        <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Type</h3>
        </div>
          {Object.keys(cultivators).map((type) => (
            <SelectableCard
              key={type}
              isSelected={selectedType === type}
              onClick={() => setSelectedType(type)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cultivators[type].emoji}</span>
                <span className="text-sm font-bold">{cultivators[type].name}</span>
              </div>
            </SelectableCard>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {current.emoji} {current.name}
          </h2>
          <Button
            onClick={exportConfig}
            disabled={!hasChanges}
            variant="success"
          >
            💾 Export Config
          </Button>
        </div>

        {/* Editor Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <FormInput
              label="Name"
              type="text"
              value={current.name}
              onChange={(e) => updateField('name', e.target.value)}
            />

            <FormInput
              label="Emoji"
              type="text"
              value={current.emoji}
              onChange={(e) => updateField('emoji', e.target.value)}
              maxLength={2}
              className="text-2xl"
            />

            <FormTextarea
              label="Description"
              value={current.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-4">
            <FormInput
              label="Cost (Qi)"
              type="number"
              value={current.cost}
              onChange={(e) => updateField('cost', parseInt(e.target.value))}
            />

            <FormInput
              label="Range (Tiles)"
              type="number"
              step="0.1"
              value={current.rangeInTiles}
              onChange={(e) => updateField('rangeInTiles', parseFloat(e.target.value))}
            />

            <FormInput
              label="Damage"
              type="number"
              value={current.damage}
              onChange={(e) => updateField('damage', parseInt(e.target.value))}
            />

            <FormInput
              label="Attack Speed (ms)"
              type="number"
              value={current.attackSpeed}
              onChange={(e) => updateField('attackSpeed', parseInt(e.target.value))}
            />

            <FormInput
              label="Max Health"
              type="number"
              value={current.maxHealth}
              onChange={(e) => updateField('maxHealth', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Calculated Stats */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
          <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
            Calculated Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-900/50 rounded-xl p-3 border border-fuchsia-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                {dps.toFixed(1)}
              </div>
              <div className="text-sm text-cyan-300 font-semibold mt-1">DPS</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 border border-fuchsia-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                {aps.toFixed(2)}
              </div>
              <div className="text-sm text-cyan-300 font-semibold mt-1">Attacks/Sec</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 border border-fuchsia-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                {current.rangeInTiles * 30}
              </div>
              <div className="text-sm text-cyan-300 font-semibold mt-1">Range (px)</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 border border-fuchsia-500/30">
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                {(current.cost / dps).toFixed(1)}
              </div>
              <div className="text-sm text-cyan-300 font-semibold mt-1">Cost/DPS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
