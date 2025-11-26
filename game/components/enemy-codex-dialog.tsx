import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';
import { getAllEnemyTypes, getEnemyEntry, DIFFICULTY_COLORS, type EnemyType } from '../utils/enemy-codex';

interface EnemyCodexDialogProps {
  open: boolean;
  onClose: () => void;
  highestWave: number; // Used to determine which enemies are unlocked
}

export function EnemyCodexDialog({ open, onClose, highestWave }: EnemyCodexDialogProps) {
  const allEnemies = getAllEnemyTypes();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-red-950 to-purple-950 border-4 border-red-600 text-amber-100 max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl text-red-300 flex items-center gap-2">
            <span className="text-4xl">📖</span>
            Enemy Codex
          </DialogTitle>
          <DialogDescription className="text-amber-400">
            Knowledge of your foes - {allEnemies.filter(type => getEnemyEntry(type).firstAppearance <= highestWave).length}/{allEnemies.length} discovered
          </DialogDescription>
        </DialogHeader>

        {/* Enemy Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEnemies.map(enemyType => {
              const entry = getEnemyEntry(enemyType);
              const isUnlocked = entry.firstAppearance <= highestWave;
              const difficultyColor = DIFFICULTY_COLORS[entry.difficulty];

              return (
                <div
                  key={entry.id}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    isUnlocked
                      ? 'bg-black/30 border-amber-700/50 hover:border-amber-500'
                      : 'bg-black/50 border-gray-700/50 opacity-60'
                  }`}
                  style={isUnlocked ? { borderColor: `${difficultyColor}80` } : undefined}
                >
                  {isUnlocked ? (
                    <>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl">{entry.emoji}</span>
                          <div>
                            <div className="text-amber-200 font-bold text-lg">{entry.name}</div>
                            <div 
                              className="text-xs px-2 py-0.5 rounded font-bold inline-block mt-1"
                              style={{ 
                                backgroundColor: difficultyColor,
                                color: 'white'
                              }}
                            >
                              {entry.difficulty.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="text-amber-400 text-xs text-right">
                          First seen<br/>Wave {entry.firstAppearance}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="text-amber-300 text-sm mb-3 italic">
                        "{entry.description}"
                      </div>

                      {/* Lore */}
                      <div className="text-amber-200 text-xs mb-3 leading-relaxed">
                        {entry.lore}
                      </div>

                      {/* Stats */}
                      <div className="bg-black/40 rounded-lg p-3 border border-amber-700/30">
                        <div className="text-amber-400 text-xs mb-2 font-bold">Base Stats</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-red-400">❤️ Health</div>
                            <div className="text-amber-100 font-bold">{entry.baseStats.health}</div>
                          </div>
                          <div>
                            <div className="text-blue-400">⚡ Speed</div>
                            <div className="text-amber-100 font-bold">{entry.baseStats.speed.toFixed(1)}x</div>
                          </div>
                          <div>
                            <div className="text-yellow-400">💰 Reward</div>
                            <div className="text-amber-100 font-bold">{entry.baseStats.reward} Qi</div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs mt-2">
                          * Stats scale with wave number (+30% health per wave)
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Locked Entry */
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Lock className="size-12 text-gray-500 mb-3" />
                      <div className="text-gray-400 font-bold mb-1">???</div>
                      <div className="text-gray-500 text-sm">
                        Reach Wave {entry.firstAppearance} to unlock
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center pt-4 border-t border-red-600/50">
          <Button
            onClick={onClose}
            className="bg-red-700 hover:bg-red-600 text-white px-8"
          >
            Close Codex
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
