import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trophy, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { submitScore } from '../../shared/utils/leaderboard-service';
import { useAuth } from './auth/AuthContext';

interface ScoreSubmitDialogProps {
  open: boolean;
  score: number;
  wave: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScoreSubmitDialog({ open, score, wave, onClose, onSuccess }: ScoreSubmitDialogProps) {
  const { isAuthenticated, profile, user } = useAuth();
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved name from localStorage or use authenticated user's name
  useEffect(() => {
    if (isAuthenticated && profile) {
      // Use authenticated user's display name or username
      setPlayerName(profile.display_name || profile.username || user?.email || '');
    } else {
      // Load saved name from localStorage for guests
      const savedName = localStorage.getItem('wuxia_player_name');
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, [open, isAuthenticated, profile, user]);

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      setError('Please enter your cultivator name');
      return;
    }

    if (playerName.trim().length > 50) {
      setError('Name is too long (max 50 characters)');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Submit score using the new leaderboard service
      // Service automatically handles authenticated vs guest users
      await submitScore({
        playerName: playerName.trim(),
        score,
        waveReached: wave,
      });

      // Save name to localStorage for next time (for guests)
      if (!isAuthenticated) {
        localStorage.setItem('wuxia_player_name', playerName.trim());
      }
      
      setSubmitted(true);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Error submitting score:', err);
      setError('Failed to submit score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitting && !submitted) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-950 to-green-950 border-4 border-amber-600 text-amber-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl text-amber-300 flex items-center gap-2 justify-center">
            <Trophy className="size-8 text-yellow-500" />
            Your Final Score
          </DialogTitle>
          <DialogDescription className="text-sm text-amber-400">
            Enter your cultivator name to submit your score to the Sacred Temple Leaderboard.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Score Display */}
          <div className="bg-green-900/40 border-2 border-amber-700/50 rounded-lg p-6 text-center">
            <div className="text-amber-400 text-sm mb-1">Score</div>
            <div className="text-amber-100 text-4xl mb-3">{score.toLocaleString()}</div>
            <div className="text-amber-300 text-sm">Survived to Wave {wave}</div>
          </div>

          {!submitted ? (
            <>
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-amber-300 text-sm">
                  Enter Your Cultivator Name
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. Iron Palm Master"
                  maxLength={50}
                  disabled={submitting}
                  className="bg-green-900/40 border-amber-700/50 text-amber-100 placeholder:text-amber-700 focus:border-amber-500"
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="size-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  disabled={submitting}
                  className="flex-1 border-amber-700 text-amber-300 hover:bg-amber-900/30"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Trophy className="size-4 mr-2" />
                      Submit Score
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="size-16 text-green-500 mx-auto" />
              <div className="text-2xl text-amber-300">Score Submitted!</div>
              <div className="text-amber-400 text-sm">
                Your name has been added to the Sacred Temple Leaderboard
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}