import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Globe, User, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getLocalLeaderboard, getPlayerData, LocalScore } from '../utils/local-storage';

interface LocalLeaderboardProps {
  open: boolean;
  onClose: () => void;
  onViewGlobal?: () => void;
  highlightLatest?: boolean;
}

export function LocalLeaderboard({ open, onClose, onViewGlobal, highlightLatest = false }: LocalLeaderboardProps) {
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [personalBest, setPersonalBest] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    if (open) {
      const localScores = getLocalLeaderboard();
      const playerData = getPlayerData();
      setScores(localScores);
      setPlayerName(playerData.playerName);
      setPersonalBest(playerData.personalBest);
      setTotalGames(playerData.totalGamesPlayed);
    }
  }, [open]);

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-green-950 to-amber-950 border-4 border-amber-600 text-amber-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl text-amber-300 flex items-center gap-2">
            <User className="size-8 text-amber-500" />
            Your Journey
          </DialogTitle>
          <DialogDescription className="text-sm text-amber-400">
            {playerName}'s personal records
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-center">
              <div className="text-amber-400 text-xs mb-1">Personal Best</div>
              <div className="text-amber-100 text-2xl flex items-center justify-center gap-1">
                <TrendingUp className="size-5 text-yellow-500" />
                {personalBest.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-center">
              <div className="text-amber-400 text-xs mb-1">Games Played</div>
              <div className="text-amber-100 text-2xl">{totalGames}</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 text-center">
              <div className="text-amber-400 text-xs mb-1">Avg Score</div>
              <div className="text-amber-100 text-2xl">
                {scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toLocaleString() : 0}
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="grid grid-cols-[50px_100px_80px_1fr_100px] gap-3 px-3 py-2 border-b-2 border-amber-700/50 text-xs">
            <div className="text-amber-400">Rank</div>
            <div className="text-amber-400">Score</div>
            <div className="text-amber-400">Wave</div>
            <div className="text-amber-400">Stats</div>
            <div className="text-amber-400 text-right">When</div>
          </div>

          {/* Scores List */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {scores.length === 0 ? (
              <div className="text-center text-amber-300 py-8">
                <div className="text-4xl mb-2">🏯</div>
                <div className="text-lg">No games played yet</div>
                <div className="text-sm text-amber-400 mt-2">Start defending the Sacred Temple!</div>
              </div>
            ) : (
              scores.map((score, index) => {
                const isLatest = highlightLatest && index === 0;
                return (
                  <div
                    key={index}
                    className={`grid grid-cols-[50px_100px_80px_1fr_100px] gap-3 px-3 py-2 rounded-lg text-sm ${
                      isLatest
                        ? 'bg-green-700/40 border-2 border-green-500 animate-pulse'
                        : index === 0
                        ? 'bg-yellow-900/40 border border-yellow-600/50'
                        : index === 1
                        ? 'bg-gray-600/30 border border-gray-500/50'
                        : index === 2
                        ? 'bg-orange-900/30 border border-orange-700/50'
                        : 'bg-green-900/20 hover:bg-green-900/30'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      {index === 0 && <span className="text-xl">🥇</span>}
                      {index === 1 && <span className="text-xl">🥈</span>}
                      {index === 2 && <span className="text-xl">🥉</span>}
                      {index > 2 && <span className="text-amber-300">#{index + 1}</span>}
                    </div>

                    {/* Score */}
                    <div className="flex items-center text-amber-200 font-semibold">
                      {score.score.toLocaleString()}
                    </div>

                    {/* Wave */}
                    <div className="flex items-center text-amber-300">
                      Wave {score.wave}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-amber-400">
                      <span title="Enemies Defeated">👹 {score.enemiesDefeated}</span>
                      <span title="Cultivators Deployed">⚔️ {score.cultivatorsDeployed}</span>
                      <span title="Time Played">⏱️ {formatTime(score.timePlayed)}</span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center justify-end text-xs text-amber-400">
                      {formatDate(score.timestamp)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {onViewGlobal && (
              <Button
                onClick={onViewGlobal}
                variant="outline"
                className="flex-1 border-amber-700 text-amber-300 hover:bg-amber-900/30"
              >
                <Globe className="size-4 mr-2" />
                Global Leaderboard
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
