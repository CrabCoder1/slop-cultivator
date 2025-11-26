import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Trophy, TrendingUp } from 'lucide-react';
import { getLocalLeaderboard, getPlayerData, LocalScore } from '../utils/local-storage';

interface GameOverScreenProps {
  score: number;
  wave: number;
  enemiesDefeated: number;
  cultivatorsDeployed: number;
  timePlayed: string;
  showNewPBNotification: boolean;
  onReset: () => void;
  onViewGlobalLeaderboard: () => void;
  onQuitToMap: () => void;
}

export function GameOverScreen({
  score,
  wave,
  enemiesDefeated,
  cultivatorsDeployed,
  timePlayed,
  showNewPBNotification,
  onReset,
  onViewGlobalLeaderboard,
  onQuitToMap,
}: GameOverScreenProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'records'>('summary');
  const [localScores, setLocalScores] = useState<LocalScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [personalBest, setPersonalBest] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    const scores = getLocalLeaderboard();
    const playerData = getPlayerData();
    setLocalScores(scores);
    setPlayerName(playerData.playerName);
    setPersonalBest(playerData.personalBest);
    setTotalGames(playerData.totalGamesPlayed);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 pointer-events-auto p-4">
      <div className="bg-gradient-to-br from-red-950 to-amber-950 border-4 border-red-600 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-red-600/50">
          <div className="text-5xl mb-3">⚔️</div>
          <div className="text-red-400 text-3xl mb-2">Temple Destroyed!</div>
          <div className="text-amber-300 text-sm">The demons have breached your defenses</div>
          
          {/* New Personal Best Notification */}
          {showNewPBNotification && (
            <div className="mt-4 bg-gradient-to-r from-yellow-600 to-amber-600 border-2 border-yellow-400 rounded-lg p-3 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-white">
                <Trophy className="size-5" />
                <span className="text-base font-bold">New Personal Best!</span>
                <Trophy className="size-5" />
              </div>
              <div className="text-yellow-100 text-xs mt-1">Auto-submitted to global leaderboard</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-700/50 bg-black/20">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-amber-900/50 text-amber-300 border-b-2 border-amber-500'
                : 'text-amber-400 hover:bg-amber-900/30'
            }`}
          >
            Game Summary
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'records'
                ? 'bg-amber-900/50 text-amber-300 border-b-2 border-amber-500'
                : 'text-amber-400 hover:bg-amber-900/30'
            }`}
          >
            Your Records
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {activeTab === 'summary' ? (
            /* Game Summary Tab */
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-700/50">
                  <div className="text-green-400 text-xs mb-1">⭐ Final Score</div>
                  <div className="text-amber-100 text-2xl font-bold">{score.toLocaleString()}</div>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-700/50">
                  <div className="text-purple-400 text-xs mb-1">🌊 Wave Reached</div>
                  <div className="text-amber-100 text-2xl font-bold">{wave}</div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-3 border border-red-700/50">
                  <div className="text-red-400 text-xs mb-1">👹 Enemies Defeated</div>
                  <div className="text-amber-100 text-2xl font-bold">{enemiesDefeated}</div>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700/50">
                  <div className="text-blue-400 text-xs mb-1">🧘 Cultivators</div>
                  <div className="text-amber-100 text-2xl font-bold">{cultivatorsDeployed}</div>
                </div>
              </div>
              <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700/50">
                <div className="text-amber-400 text-xs mb-1">⏱️ Time Played</div>
                <div className="text-amber-100 text-2xl font-bold">{timePlayed}</div>
              </div>
            </div>
          ) : (
            /* Your Records Tab */
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-2 text-center">
                  <div className="text-amber-400 text-xs mb-1">Personal Best</div>
                  <div className="text-amber-100 text-lg font-bold flex items-center justify-center gap-1">
                    <TrendingUp className="size-4 text-yellow-500" />
                    {personalBest.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-2 text-center">
                  <div className="text-amber-400 text-xs mb-1">Games</div>
                  <div className="text-amber-100 text-lg font-bold">{totalGames}</div>
                </div>
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-2 text-center">
                  <div className="text-amber-400 text-xs mb-1">Avg Score</div>
                  <div className="text-amber-100 text-lg font-bold">
                    {localScores.length > 0 ? Math.round(localScores.reduce((sum, s) => sum + s.score, 0) / localScores.length).toLocaleString() : 0}
                  </div>
                </div>
              </div>

              {/* Player Name */}
              <div className="text-center text-amber-300 text-sm">
                Playing as: <span className="font-bold">{playerName}</span>
              </div>

              {/* Scores List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {localScores.length === 0 ? (
                  <div className="text-center text-amber-300 py-8">
                    <div className="text-4xl mb-2">🏯</div>
                    <div className="text-base">No previous games</div>
                  </div>
                ) : (
                  localScores.map((localScore, index) => {
                    const isLatest = index === 0;
                    return (
                      <div
                        key={index}
                        className={`rounded-lg p-3 text-xs ${
                          isLatest
                            ? 'bg-green-700/40 border-2 border-green-500'
                            : index === 0
                            ? 'bg-yellow-900/40 border border-yellow-600/50'
                            : index === 1
                            ? 'bg-gray-600/30 border border-gray-500/50'
                            : index === 2
                            ? 'bg-orange-900/30 border border-orange-700/50'
                            : 'bg-green-900/20 border border-green-700/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-lg">🥇</span>}
                            {index === 1 && <span className="text-lg">🥈</span>}
                            {index === 2 && <span className="text-lg">🥉</span>}
                            {index > 2 && <span className="text-amber-300">#{index + 1}</span>}
                            <span className="text-amber-200 font-bold text-sm">{localScore.score.toLocaleString()}</span>
                          </div>
                          <span className="text-amber-400">{formatDate(localScore.timestamp)}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-400">
                          <span>Wave {localScore.wave}</span>
                          <div className="flex gap-3">
                            <span title="Enemies">👹 {localScore.enemiesDefeated}</span>
                            <span title="Cultivators">⚔️ {localScore.cultivatorsDeployed}</span>
                            <span title="Time">⏱️ {formatTime(localScore.timePlayed)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 pt-4 border-t border-red-600/50 space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={onViewGlobalLeaderboard}
              variant="outline"
              className="flex-1 border-amber-700 text-amber-300 hover:bg-amber-900/30"
            >
              Global Leaderboard
            </Button>
            <Button
              onClick={onReset}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
            >
              Try Again
            </Button>
          </div>
          <Button
            onClick={onQuitToMap}
            variant="outline"
            className="w-full border-red-600 text-red-300 hover:bg-red-900/50"
          >
            Quit to Map
          </Button>
        </div>
      </div>
    </div>
  );
}
