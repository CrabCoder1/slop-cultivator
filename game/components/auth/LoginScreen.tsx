import { useState } from 'react';
import { Button } from '../ui/button';

/**
 * Props for LoginScreen component
 */
export interface LoginScreenProps {
  onGuestMode?: () => void;
  onSSOLogin?: (provider: 'google' | 'discord') => void;
  onSteamLogin?: () => void;
}

/**
 * Login Screen Component
 * Displays authentication options for users
 * 
 * Features:
 * - SSO provider buttons (Google, Discord)
 * - Steam login button (optional)
 * - Guest mode option
 * - Loading states during authentication
 * - Error handling and display
 * 
 * Requirements: 1.1, 2.1, 5.1
 */
export function LoginScreen({ onGuestMode, onSSOLogin, onSteamLogin }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle SSO provider selection
   */
  const handleSSOLogin = async (provider: 'google' | 'discord') => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onSSOLogin) {
        await onSSOLogin(provider);
      }
    } catch (err) {
      console.error('SSO login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Handle Steam login
   */
  const handleSteamLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onSteamLogin) {
        await onSteamLogin();
      }
    } catch (err) {
      console.error('Steam login error:', err);
      setError(err instanceof Error ? err.message : 'Steam authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  /**
   * Handle guest mode selection
   */
  const handleGuestMode = () => {
    if (onGuestMode) {
      onGuestMode();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full px-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Slop Cultivator</h1>
          <p className="text-gray-400">Sign in to save your progress</p>
        </div>

        <div className="bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6 backdrop-blur-sm">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* SSO Provider Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSSOLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <button
              onClick={() => handleSSOLogin('discord')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Continue with Discord
                </>
              )}
            </button>

            {/* Steam login button (optional) */}
            {onSteamLogin && (
              <button
                onClick={handleSteamLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#171a21] hover:bg-[#1b2838] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13v6l5.25 3.15l.75-1.23l-4.5-2.67V7H11z" />
                    </svg>
                    Continue with Steam
                  </>
                )}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-gray-400">or</span>
            </div>
          </div>

          {/* Guest mode button */}
          <Button
            onClick={handleGuestMode}
            disabled={isLoading}
            variant="outline"
            className="w-full border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            Play as Guest
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Guest progress is stored locally and won't sync across devices
          </p>
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
