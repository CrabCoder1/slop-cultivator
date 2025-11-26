import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Achievement } from '../../shared/types/composition-types';

interface AchievementPopupProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementPopup({ achievement, isOpen, onClose }: AchievementPopupProps) {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (isOpen && achievement) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, achievement, onClose]);

  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-950 to-purple-950 border-4 border-amber-500 text-amber-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Achievement Unlocked</DialogTitle>
          <DialogDescription className="sr-only">
            You have unlocked a new achievement: {achievement.name}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-4 py-2">
          {/* Achievement Emoji */}
          <div className="text-8xl animate-bounce" style={{ animationIterationCount: 2 }}>
            {achievement.emoji}
          </div>

          {/* Achievement Unlocked Header */}
          <div className="text-2xl font-bold text-amber-300 tracking-wide">
            🎉 Achievement Unlocked! 🎉
          </div>

          {/* Achievement Name */}
          <div className="text-3xl font-bold text-amber-100">
            {achievement.name}
          </div>

          {/* Achievement Description */}
          <div className="text-amber-300 text-base px-4">
            {achievement.description}
          </div>

          {/* Rewards Section */}
          {achievement.rewards.length > 0 && (
            <div className="border-t-2 border-amber-700/50 pt-4 mt-4">
              <div className="text-amber-400 font-semibold mb-3 text-lg">
                Rewards Granted:
              </div>
              <div className="space-y-2">
                {achievement.rewards.map((reward, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-2 border-green-600/50 rounded-lg p-3"
                  >
                    <div className="text-green-300 font-medium flex items-center justify-center gap-2">
                      <span className="text-xl">✨</span>
                      <span>{reward.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-dismiss hint */}
          <div className="text-amber-500 text-xs pt-2">
            This popup will close automatically in 10 seconds
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
