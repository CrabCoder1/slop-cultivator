import { formatNumber } from '../utils/number-formatter';

interface TowerSelectorProps {
  towerTypes: any;
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
  qi: number;
  gameStatus: string;
}

export function TowerSelector({ towerTypes, selectedType, onSelectType, qi, gameStatus }: TowerSelectorProps) {
  const isGameOver = gameStatus === 'gameOver';

  return (
    <div className={`bg-gradient-to-r from-amber-950 to-red-950 rounded-lg p-4 border-2 border-amber-700 ${isGameOver ? 'opacity-50 pointer-events-none' : ''}`}>
      <h3 className="text-amber-300 mb-3 text-center">Cultivator Towers</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(towerTypes).map(([key, tower]: [string, any]) => {
          const canAfford = qi >= tower.cost && !isGameOver;
          const isSelected = selectedType === key;

          return (
            <button
              key={key}
              onClick={() => onSelectType(isSelected ? null : key)}
              disabled={!canAfford}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'bg-amber-600 border-amber-400 shadow-lg scale-105' 
                  : canAfford
                    ? 'bg-amber-900/50 border-amber-700 hover:bg-amber-800/50 hover:scale-105'
                    : 'bg-gray-800/30 border-gray-700 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Tower icon - grid tile size */}
              <div 
                className="mb-1 flex items-center justify-center"
                style={{ 
                  width: '30px', 
                  height: '30px', 
                  fontSize: '24px', 
                  lineHeight: '24px',
                  margin: '0 auto'
                }}
              >
                {tower.emoji}
              </div>
              <div className="text-amber-100 text-xs mb-1 truncate" title={tower.name}>
                {tower.name}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-300">⚡ {tower.cost}</span>
                <span className="text-red-300">💥 {formatNumber(tower.damage)}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-400 mt-1">
                <span>Range: {formatNumber(tower.range)}</span>
                <span>⚔️ {formatNumber(1000 / tower.attackSpeed)}/s</span>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-center text-amber-200 text-xs">
        Click a cultivator to select, then click the board to deploy
      </div>
    </div>
  );
}