import { useState } from 'react';
import { Tower } from '../App';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { getSkillsForType, getSkillById, canEquipSkill } from '../utils/skills';
import { getItemById, RARITY_COLORS, getItemsByType } from '../utils/items';
import { getLevelProgress, getXPForLevel, MAX_LEVEL, getLevelBadgeColor } from '../utils/experience';
import { calculateTowerStats } from '../utils/stat-calculator';
import { formatNumber } from '../utils/number-formatter';

interface TowerDetailsDialogProps {
  tower: Tower | null;
  towerTypes: any;
  onClose: () => void;
  onSell?: (towerId: string) => void;
  onEquipSkill?: (towerId: string, skillId: string) => void;
  onUnequipSkill?: (towerId: string, skillId: string) => void;
  onEquipItem?: (towerId: string, itemId: string) => void;
  onUnequipItem?: (towerId: string, itemId: string) => void;
}

type TabType = 'stats' | 'skills' | 'inventory';

export function TowerDetailsDialog({ 
  tower, 
  towerTypes, 
  onClose, 
  onSell,
  onEquipSkill,
  onUnequipSkill,
  onEquipItem,
  onUnequipItem
}: TowerDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  if (!tower) return null;

  const towerConfig = towerTypes[tower.type];
  const sellValue = Math.floor(tower.cost * 0.7);
  const levelBadgeColor = getLevelBadgeColor(tower.level);
  const calculatedStats = calculateTowerStats(tower);

  // Get available skills for this cultivator type
  // For new Person Type system, check if type is a legacy cultivator type
  const isLegacyType = ['sword', 'palm', 'arrow', 'lightning'].includes(tower.type);
  const availableSkills = isLegacyType ? getSkillsForType(tower.type as any) : [];
  const equippedSkills = tower.equippedSkills.map(id => getSkillById(id)).filter(Boolean);

  // Get equipped items
  const equippedItems = tower.inventory.map(id => getItemById(id)).filter(Boolean);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleEquipSkill = (skillId: string) => {
    console.log('handleEquipSkill called', { skillId, towerId: tower.id, currentSkills: tower.equippedSkills });
    if (tower.equippedSkills.length >= 3) {
      alert('Maximum 3 skills can be equipped!');
      return;
    }
    if (onEquipSkill) {
      console.log('Calling onEquipSkill');
      onEquipSkill(tower.id, skillId);
    } else {
      console.error('onEquipSkill is not defined!');
    }
  };

  const handleUnequipSkill = (skillId: string) => {
    console.log('handleUnequipSkill called', { skillId, towerId: tower.id });
    if (onUnequipSkill) {
      onUnequipSkill(tower.id, skillId);
    } else {
      console.error('onUnequipSkill is not defined!');
    }
  };

  return (
    <Dialog open={!!tower} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gradient-to-br from-amber-950 to-red-950 border-2 border-amber-600 text-amber-100 max-w-2xl max-h-[90vh] flex flex-col"
        onContextMenu={handleContextMenu}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-4xl">{towerConfig.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span>{towerConfig.name}</span>
                  <div 
                    className="rounded-full text-white text-xs font-bold w-6 h-6 flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: levelBadgeColor }}
                  >
                    {tower.level}
                  </div>
                </div>
                <div className="text-sm text-amber-400 font-normal">
                  {tower.kills} kills • {tower.experience}/{getXPForLevel(tower.level)} XP
                </div>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage cultivator stats, skills, and inventory
          </DialogDescription>
        </DialogHeader>

        {/* XP Progress Bar */}
        {tower.level < MAX_LEVEL && (
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ 
                width: `${getLevelProgress(tower.level, tower.experience)}%`,
                backgroundColor: levelBadgeColor
              }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-amber-700/50 -mx-6 px-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-amber-300 border-b-2 border-amber-500'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'skills'
                ? 'text-amber-300 border-b-2 border-amber-500'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Skills ({tower.equippedSkills.length}/3)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'text-amber-300 border-b-2 border-amber-500'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Inventory ({tower.inventory.length}/3)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Current Stats */}
              <div>
                <div className="text-amber-400 text-sm mb-2">Current Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/30 rounded-lg p-2 border border-amber-700/50">
                    <div className="text-amber-400 text-xs">Damage</div>
                    <div className="text-red-400 font-bold">
                      💥 {formatNumber(calculatedStats.damage)}
                      {calculatedStats.damage !== tower.baseStats.damage && (
                        <span className="text-green-400 text-xs ml-1">
                          (+{formatNumber(calculatedStats.damage - tower.baseStats.damage)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-amber-700/50">
                    <div className="text-amber-400 text-xs">Range</div>
                    <div className="text-blue-400 font-bold">
                      🎯 {formatNumber(calculatedStats.range)}
                      {calculatedStats.range !== tower.baseStats.range && (
                        <span className="text-green-400 text-xs ml-1">
                          (+{formatNumber(calculatedStats.range - tower.baseStats.range)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-amber-700/50">
                    <div className="text-amber-400 text-xs">Attack Speed</div>
                    <div className="text-green-400 font-bold">
                      ⚡ {formatNumber(1000 / calculatedStats.attackSpeed)}/s
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-amber-700/50">
                    <div className="text-amber-400 text-xs">Health</div>
                    <div className="text-purple-400 font-bold">
                      ❤️ {formatNumber(tower.health)}/{formatNumber(calculatedStats.maxHealth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* DPS */}
              <div className="bg-gradient-to-r from-amber-900/50 to-red-900/50 rounded-lg p-3 border border-amber-600/50">
                <div className="text-amber-300 text-xs mb-1">Damage Per Second (DPS)</div>
                <div className="text-2xl text-orange-400 font-bold">
                  🔥 {formatNumber((calculatedStats.damage * 1000) / calculatedStats.attackSpeed)}
                </div>
              </div>

              {/* Description */}
              <div className="bg-black/30 rounded-lg p-3 border border-amber-700/50">
                <div className="text-amber-400 text-xs mb-2">About</div>
                <div className="text-amber-200 text-sm">
                  {towerConfig.description || `${towerConfig.name} is a powerful cultivator ready to defend the Sacred Temple.`}
                </div>
              </div>

              {/* Person Type Info (if available) */}
              {(tower.personTypeKey || tower.personTypeId) && (
                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-700/50">
                  <div className="text-purple-400 text-xs mb-2">Person Type</div>
                  <div className="text-purple-200 text-sm">
                    {tower.personTypeKey || tower.personTypeId}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              {/* Equipped Skills */}
              <div>
                <div className="text-amber-400 text-sm mb-2">Equipped Skills</div>
                {equippedSkills.length === 0 ? (
                  <div className="text-amber-300 text-sm text-center py-4 bg-black/20 rounded-lg">
                    No skills equipped
                  </div>
                ) : (
                  <div className="space-y-2">
                    {equippedSkills.map(skill => skill && (
                      <div key={skill.id} className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{skill.icon}</span>
                              <span className="text-amber-200 font-bold">{skill.name}</span>
                              <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded">
                                {skill.type}
                              </span>
                            </div>
                            <div className="text-amber-300 text-xs">{skill.description}</div>
                          </div>
                          <Button
                            onClick={() => handleUnequipSkill(skill.id)}
                            size="sm"
                            variant="outline"
                            className="ml-2 border-red-600 text-red-400 hover:bg-red-900/50"
                          >
                            Unequip
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Skills */}
              <div>
                <div className="text-amber-400 text-sm mb-2">
                  Available Skills
                  {availableSkills.length === 0 && (
                    <span className="text-amber-500 text-xs ml-2">(No compatible skills)</span>
                  )}
                </div>
                {availableSkills.length === 0 ? (
                  <div className="text-amber-300 text-sm text-center py-4 bg-black/20 rounded-lg">
                    This cultivator type has no compatible skills available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableSkills.map(skill => {
                      const isEquipped = tower.equippedSkills.includes(skill.id);
                      if (isEquipped) return null;
                      
                      return (
                        <div key={skill.id} className="bg-black/30 border border-amber-700/50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{skill.icon}</span>
                                <span className="text-amber-200 font-bold">{skill.name}</span>
                                <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded">
                                  {skill.type}
                                </span>
                              </div>
                              <div className="text-amber-300 text-xs">{skill.description}</div>
                            </div>
                            <Button
                              onClick={() => handleEquipSkill(skill.id)}
                              size="sm"
                              disabled={tower.equippedSkills.length >= 3}
                              className="ml-2 bg-green-700 hover:bg-green-600"
                            >
                              Equip
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Equipped Items */}
              <div>
                <div className="text-amber-400 text-sm mb-2">Equipped Items</div>
                {equippedItems.length === 0 ? (
                  <div className="text-amber-300 text-sm text-center py-4 bg-black/20 rounded-lg">
                    No items equipped
                  </div>
                ) : (
                  <div className="space-y-2">
                    {equippedItems.map(item => item && (
                      <div 
                        key={item.id} 
                        className="rounded-lg p-3 border-2"
                        style={{ 
                          backgroundColor: `${RARITY_COLORS[item.rarity]}20`,
                          borderColor: RARITY_COLORS[item.rarity]
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <div className="text-amber-200 font-bold">{item.name}</div>
                                <div className="flex gap-2 items-center">
                                  <span 
                                    className="text-xs px-2 py-0.5 rounded font-bold"
                                    style={{ 
                                      backgroundColor: RARITY_COLORS[item.rarity],
                                      color: 'white'
                                    }}
                                  >
                                    {item.rarity}
                                  </span>
                                  <span className="text-xs text-amber-400">
                                    {item.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-amber-300 text-xs mb-1">{item.description}</div>
                            <div className="text-green-400 text-xs">
                              {item.effects.map((effect, i) => (
                                <div key={i}>
                                  {effect.multiplier 
                                    ? `+${(effect.multiplier * 100).toFixed(0)}% ${effect.stat}`
                                    : `+${effect.value} ${effect.stat}`
                                  }
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => onUnequipItem?.(tower.id, item.id)}
                            size="sm"
                            variant="outline"
                            className="ml-2 border-red-600 text-red-400 hover:bg-red-900/50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                <div className="text-blue-300 text-xs">
                  💡 Items are automatically picked up when enemies drop them nearby. Maximum 3 items can be equipped.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-amber-700/50">
          {onSell && (
            <Button
              onClick={() => {
                onSell(tower.id);
                onClose();
              }}
              variant="destructive"
              className="flex-1 bg-red-800 hover:bg-red-700"
            >
              Dismiss for {sellValue} Qi
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-amber-600 text-amber-300 hover:bg-amber-900/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
