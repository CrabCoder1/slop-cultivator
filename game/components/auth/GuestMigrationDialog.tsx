import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { guestMigrationService, type MigrationResult } from '../../../shared/utils/guest-migration-service';

/**
 * Props for GuestMigrationDialog component
 */
export interface GuestMigrationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onMigrationComplete?: (result: MigrationResult) => void;
}

/**
 * Guest Migration Dialog Component
 * Prompts user to migrate their guest data when creating an account
 * 
 * Features:
 * - Detects guest data on account creation
 * - Shows migration progress
 * - Handles migration errors
 * - Allows user to skip migration
 * 
 * Requirements: 5.4
 */
export function GuestMigrationDialog({ 
  open, 
  onClose, 
  userId,
  onMigrationComplete 
}: GuestMigrationDialogProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  /**
   * Handle migration button click
   * Migrates guest data to authenticated account
   */
  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setMigrationError(null);

      // Perform migration
      const result = await guestMigrationService.migrateGuestData(userId);

      if (result.success) {
        setMigrationSuccess(true);
        setMigrationResult(result);

        // Clear guest data after successful migration
        guestMigrationService.clearGuestData();

        // Notify parent component
        if (onMigrationComplete) {
          onMigrationComplete(result);
        }

        // Auto-close after showing success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMigrationError(result.error?.message || 'Migration failed. Please try again.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsMigrating(false);
    }
  };

  /**
   * Handle skip button click
   * Closes dialog without migrating
   */
  const handleSkip = () => {
    // Don't clear guest data - user might want to migrate later
    onClose();
  };

  /**
   * Handle retry button click
   * Resets error state and allows retry
   */
  const handleRetry = () => {
    setMigrationError(null);
    handleMigrate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {migrationSuccess ? '✅ Migration Complete!' : '🎮 Transfer Your Progress?'}
          </DialogTitle>
          <DialogDescription>
            {migrationSuccess ? (
              <div className="space-y-2">
                <p>Your guest progress has been successfully transferred to your account!</p>
                {migrationResult && (
                  <div className="text-sm text-gray-600">
                    <p>• {migrationResult.migratedScores || 0} scores migrated</p>
                    <p>• {migrationResult.migratedAchievements || 0} achievements migrated</p>
                  </div>
                )}
              </div>
            ) : (
              <p>
                We detected that you have game progress from playing as a guest. 
                Would you like to transfer this progress to your new account?
              </p>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Migration Progress */}
        {isMigrating && (
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Migrating your progress...</p>
            </div>
          </div>
        )}

        {/* Migration Error */}
        {migrationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-1">Migration Failed</p>
            <p className="text-sm text-red-600">{migrationError}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!migrationSuccess && !isMigrating && (
          <DialogFooter className="flex gap-2 sm:gap-0">
            {migrationError ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isMigrating}
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleRetry}
                  disabled={isMigrating}
                >
                  Retry Migration
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isMigrating}
                >
                  Skip
                </Button>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                >
                  Transfer Progress
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
