import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { LoginScreen } from './LoginScreen';
import { authService } from '../../../shared/utils/auth-service';
import { GuestMigrationDialog } from './GuestMigrationDialog';

/**
 * Props for AuthGate component
 */
export interface AuthGateProps {
  children: ReactNode;
}

/**
 * Authentication Gate Component
 * Controls access to the application based on authentication state
 * 
 * Shows:
 * - Loading spinner while checking auth state
 * - LoginScreen when not authenticated and not in guest mode
 * - Application content when authenticated or in guest mode
 * - Guest migration dialog when guest data exists and user signs in
 * 
 * Requirements: 1.1, 2.1, 5.1, 5.4
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isLoading, isAuthenticated, isGuestMode, enableGuestMode } = useAuth();

  /**
   * Handle SSO login
   */
  const handleSSOLogin = async (provider: 'google' | 'discord') => {
    try {
      await authService.signInWithProvider(provider);
      // Redirect will happen automatically via OAuth flow
    } catch (error) {
      console.error('SSO login error:', error);
      throw error;
    }
  };

  /**
   * Handle guest mode selection
   */
  const handleGuestMode = () => {
    enableGuestMode();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    return (
      <LoginScreen
        onSSOLogin={handleSSOLogin}
        onGuestMode={handleGuestMode}
      />
    );
  }

  // Show application content with guest migration dialog
  return (
    <>
      {children}
      <GuestMigrationDialog />
    </>
  );
}
