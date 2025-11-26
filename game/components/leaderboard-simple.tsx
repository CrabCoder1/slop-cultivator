import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X, Trophy, Swords, Loader2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTopScores, type LeaderboardScore } from '../../shared/utils/leaderboard-service';

interface LeaderboardSimpleProps {
  open: boolean;
  onClose: () => void;
}

export function LeaderboardSimple({ open, onClose }: LeaderboardSimpleProps) {
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scores from database when dialog opens
  useEffect(() => {
    if (open) {
      fetchScores();
    }
  }, [open]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch top 10 scores using the leaderboard service
      const topScores = await getTopScores(10);
      setScores(topScores);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get display name for a score entry
   * Prioritizes authenticated user's display name/username over player name
   */
  const getDisplayName = (score: LeaderboardScore): string => {
    // For authenticated users, show their username or display name
    if (score.userId && (score.username || score.displayName)) {
      return score.displayName || score.username || score.playerName;
    }
    // For guests, show the player name they entered
    return score.playerName;
  };

  /**
   * Check if a score is from an authenticated user
   */
  const isAuthenticatedScore = (score: LeaderboardScore): boolean => {
    return !!score.userId;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-green-950 to-amber-950 border-4 border-amber-600 text-amber-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl text-amber-300 flex items-center gap-2">
            <Trophy className="size-8 text-yellow-500" />
            Sacred Temple Leaderboard
          </DialogTitle>
          <DialogDescription className="text-sm text-amber-400">
            Top 10 defenders of the Sacred Temple
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_100px] gap-4 px-4 py-2 border-b-2 border-amber-700/50">
            <div className="text-amber-400">Rank</div>
            <div className="text-amber-400">Cultivator</div>
            <div className="text-amber-400 text-right">Score</div>
            <div className="text-amber-400 text-right">Wave</div>
          </div>

          {/* Scores List */}
          <div className="space-y-1 mt-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="size-6 animate-spin text-amber-300" />
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-8">
                ❌ {error}
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center text-amber-300 py-8">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-lg">No scores yet</div>
                <div className="text-sm text-amber-400 mt-2">Be the first to defend the Sacred Temple!</div>
              </div>
            ) : (
              scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`grid grid-cols-[60px_1fr_100px_100px] gap-4 px-4 py-3 rounded-lg ${
                    index === 0
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
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                    {index > 2 && <span className="text-amber-300">#{index + 1}</span>}
                  </div>

                  {/* Player Name */}
                  <div className="flex items-center gap-2 text-amber-100">
                    {isAuthenticatedScore(score) ? (
                      <User className="size-4 text-green-500" title="Authenticated User" />
                    ) : (
                      <Swords className="size-4 text-amber-500" title="Guest Player" />
                    )}
                    <span className="truncate">{getDisplayName(score)}</span>
                  </div>

                  {/* Score */}
                  <div className="text-right text-amber-200">
                    {score.score.toLocaleString()}
                  </div>

                  {/* Wave */}
                  <div className="text-right text-amber-300">
                    Wave {score.waveReached}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={onClose}
              className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-2"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}