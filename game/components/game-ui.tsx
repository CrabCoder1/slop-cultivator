import { Button } from './ui/button';

interface GameUIProps {
  qi: number;
  wave: number;
  score: number;
  gameStatus: string;
  enemiesRemaining: number;
  waveInProgress: boolean;
  gameSpeed: number;
  onNextWave: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function GameUI({
  qi,
  wave,
  score,
  gameStatus,
  enemiesRemaining,
  waveInProgress,
  gameSpeed,
  onNextWave,
  onReset,
  onSpeedChange,
}: GameUIProps) {
  return (
    <div className="bg-gradient-to-r from-red-950 to-amber-950 rounded-lg p-4 mb-4 border-2 border-amber-600">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-black/30 rounded p-3 text-center">
          <div className="text-amber-300 text-xs mb-1">Qi Energy</div>
          <div className="text-2xl text-blue-400">⚡ {qi}</div>
        </div>

        <div className="bg-black/30 rounded p-3 text-center">
          <div className="text-amber-300 text-xs mb-1">Wave</div>
          <div className="text-2xl text-purple-400">🌊 {wave}</div>
        </div>

        <div className="bg-black/30 rounded p-3 text-center">
          <div className="text-amber-300 text-xs mb-1">Score</div>
          <div className="text-2xl text-green-400">⭐ {score}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        {/* Game Controls */}
        <div className="flex gap-2 items-center">
          <Button
            onClick={onNextWave}
            disabled={waveInProgress || enemiesRemaining > 0}
            className="bg-green-700 hover:bg-green-600"
          >
            {waveInProgress ? 'Wave in Progress...' : enemiesRemaining > 0 ? `${enemiesRemaining} Enemies Left` : 'Start Next Wave'}
          </Button>
          <Button onClick={onReset} variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/50">
            Restart Game
          </Button>
        </div>

        {/* Speed Controls - only show when game is playing */}
        {gameStatus === 'playing' && (
          <div className="flex gap-2 items-center bg-black/30 rounded-lg p-2">
            <span className="text-amber-300 text-sm mr-1">Speed:</span>
            <Button
              onClick={() => onSpeedChange(gameSpeed === 0 ? 1 : 0)}
              variant={gameSpeed === 0 ? 'default' : 'outline'}
              size="sm"
              className={gameSpeed === 0 ? 'bg-yellow-700 hover:bg-yellow-600' : 'border-amber-600 text-amber-300 hover:bg-amber-900/50'}
            >
              {gameSpeed === 0 ? '▶️ Resume' : '⏸️ Pause'}
            </Button>
            <div className="flex gap-1">
              {[1, 2, 3].map((speed) => (
                <Button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  variant={gameSpeed === speed ? 'default' : 'outline'}
                  size="sm"
                  disabled={gameSpeed === 0}
                  className={
                    gameSpeed === speed
                      ? 'bg-amber-700 hover:bg-amber-600'
                      : 'border-amber-600 text-amber-300 hover:bg-amber-900/50'
                  }
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pause Overlay Message */}
      {gameSpeed === 0 && gameStatus === 'playing' && (
        <div className="text-center mt-2">
          <div className="text-yellow-400 text-sm bg-black/50 inline-block px-3 py-1 rounded">
            ⏸️ Game Paused
          </div>
        </div>
      )}
    </div>
  );
}