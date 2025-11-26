import { useState, useEffect } from 'react';
import { SKILLS, Skill, SkillEffect, CultivatorType } from '@/utils/skills';
import SelectableCard from './ui/SelectableCard';
import { FormInput, FormTextarea, FormSelect, Button } from './ui';

export default function SkillEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSkills(Object.values(SKILLS));
  }, []);

  const updateField = <K extends keyof Skill>(field: K, value: Skill[K]) => {
    setSkills((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const updateEffect = (index: number, field: keyof SkillEffect, value: any) => {
    setSkills((prev) => {
      const updated = [...prev];
      const effects = [...updated[selectedIndex].effects];
      effects[index] = { ...effects[index], [field]: value };
      updated[selectedIndex] = { ...updated[selectedIndex], effects };
      return updated;
    });
    setHasChanges(true);
  };

  const addEffect = () => {
    setSkills((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        effects: [
          ...updated[selectedIndex].effects,
          { stat: 'damage', value: 10 },
        ],
      };
      return updated;
    });
    setHasChanges(true);
  };

  const removeEffect = (index: number) => {
    setSkills((prev) => {
      const updated = [...prev];
      const effects = updated[selectedIndex].effects.filter((_, i) => i !== index);
      updated[selectedIndex] = { ...updated[selectedIndex], effects };
      return updated;
    });
    setHasChanges(true);
  };

  const toggleCompatibleType = (type: CultivatorType) => {
    setSkills((prev) => {
      const updated = [...prev];
      const current = updated[selectedIndex];
      const compatibleTypes = current.compatibleTypes.includes(type)
        ? current.compatibleTypes.filter(t => t !== type)
        : [...current.compatibleTypes, type];
      updated[selectedIndex] = { ...updated[selectedIndex], compatibleTypes };
      return updated;
    });
    setHasChanges(true);
  };

  const exportConfig = () => {
    const config = JSON.stringify(skills, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setHasChanges(false);
  };

  // Show loading state while data is being loaded
  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading skills...</p>
      </div>
    );
  }
  
  const current = skills[selectedIndex];
  if (!current) return null;

  const typeColors = {
    passive: 'bg-cyan-600',
    active: 'bg-red-600',
    aura: 'bg-fuchsia-600',
  };

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Master List */}
      <div 
        className="w-64 flex-shrink-0 border-r border-emerald-900/50 pr-6 mr-2 overflow-y-auto"
        style={{ paddingRight: '1.5rem' }}
      >
        <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-cyan-400">Select Skill</h3>
        </div>
          {skills.map((skill, index) => (
            <SelectableCard
              key={skill.id}
              isSelected={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{skill.name}</div>
                  <div className={`text-xs px-2 py-0.5 rounded mt-1 inline-block font-bold ${typeColors[skill.type]}`}>
                    {skill.type}
                  </div>
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
            {current.icon} {current.name}
          </h2>
          <Button onClick={exportConfig} disabled={!hasChanges} variant="success">
            💾 Export Config
          </Button>
        </div>

        {/* Editor Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <FormInput
              label="Name"
              type="text"
              value={current.name}
              onChange={(e) => updateField('name', e.target.value)}
            />

            <FormInput
              label="Icon (Emoji)"
              type="text"
              value={current.icon}
              onChange={(e) => updateField('icon', e.target.value)}
              maxLength={2}
              className="text-2xl"
            />

            <FormSelect
              label="Type"
              value={current.type}
              onChange={(e) => updateField('type', e.target.value as any)}
            >
              <option value="passive">Passive</option>
              <option value="active">Active</option>
              <option value="aura">Aura</option>
            </FormSelect>

            <FormTextarea
              label="Description"
              value={current.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />

            {/* Compatible Types */}
            <div>
              <label className="block text-sm font-medium text-emerald-400 mb-2">
                Compatible Cultivator Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['sword', 'palm', 'arrow', 'lightning'] as CultivatorType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleCompatibleType(type)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      current.compatibleTypes.includes(type)
                        ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                        : 'bg-slate-700 text-slate-400 border-2 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            {current.type === 'active' && (
              <FormInput
                label="Cooldown (milliseconds)"
                type="number"
                value={current.cooldown || ''}
                onChange={(e) => updateField('cooldown', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 5000"
              />
            )}

            {current.type === 'aura' && (
              <FormInput
                label="Range (pixels)"
                type="number"
                value={current.range || ''}
                onChange={(e) => updateField('range', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 100"
              />
            )}
          </div>

          {/* Right Column - Effects */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-emerald-400">
                Effects
              </label>
              <Button onClick={addEffect} variant="success" className="text-sm py-1">
                + Add Effect
              </Button>
            </div>

            <div className="space-y-3">
              {current.effects.map((effect, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-3 space-y-2 border border-purple-900">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-300 font-semibold text-sm">Effect {index + 1}</span>
                    <button
                      onClick={() => removeEffect(index)}
                      className="text-red-400 hover:text-red-300 text-sm font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  <FormSelect
                    label="Stat"
                    value={effect.stat}
                    onChange={(e) => updateEffect(index, 'stat', e.target.value)}
                    className="text-sm"
                  >
                    <option value="damage">Damage</option>
                    <option value="attackSpeed">Attack Speed</option>
                    <option value="range">Range</option>
                    <option value="health">Health</option>
                    <option value="critChance">Crit Chance</option>
                  </FormSelect>

                  <FormInput
                    label="Flat Value"
                    type="number"
                    value={effect.value}
                    onChange={(e) => updateEffect(index, 'value', parseInt(e.target.value))}
                    className="text-sm"
                  />

                  <FormInput
                    label="Multiplier (optional, e.g., 0.2 for +20%)"
                    type="number"
                    step="0.01"
                    value={effect.multiplier || ''}
                    onChange={(e) =>
                      updateEffect(
                        index,
                        'multiplier',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>

            {current.effects.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No effects. Click "Add Effect" to add one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
