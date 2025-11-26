# Authentication UI Components

This directory contains all authentication-related UI components for Slop Cultivator.

## Components

### AuthContext & AuthProvider

The `AuthProvider` component manages authentication state throughout the application.

**Usage:**

```tsx
import { AuthProvider } from './components/auth';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

**Hook:**

```tsx
import { useAuth } from './components/auth';

function MyComponent() {
  const { isAuthenticated, user, profile, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {profile?.display_name || user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### LoginScreen

Full-screen login interface with SSO providers and guest mode.

**Usage:**

```tsx
import { LoginScreen } from './components/auth';
import { authService } from '../shared/utils/auth-service';

function App() {
  const [isGuest, setIsGuest] = useState(false);
  
  const handleSSOLogin = async (provider: 'google' | 'discord') => {
    const { url, error } = await authService.signInWithProvider(provider);
    if (url) {
      window.location.href = url;
    }
  };
  
  const handleGuestMode = () => {
    setIsGuest(true);
  };
  
  return (
    <LoginScreen
      onSSOLogin={handleSSOLogin}
      onGuestMode={handleGuestMode}
    />
  );
}
```

### SSOButton

Reusable button component for OAuth providers.

**Usage:**

```tsx
import { SSOButton } from './components/auth';

function MyLoginForm() {
  return (
    <div>
      <SSOButton
        provider="google"
        onError={(error) => console.error(error)}
      />
      <SSOButton
        provider="discord"
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
```

### AuthError & AuthLoadingState

Error and loading state components for authentication flows.

**Usage:**

```tsx
import { AuthError, AuthLoadingState } from './components/auth';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  if (isLoading) {
    return <AuthLoadingState message="Signing in..." />;
  }
  
  if (error) {
    return (
      <AuthError
        error={error}
        onRetry={() => {
          setError(null);
          // Retry logic
        }}
        onDismiss={() => setError(null)}
      />
    );
  }
  
  return <div>Content</div>;
}
```

## Integration Example

Here's a complete example of integrating authentication into the main App:

```tsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, LoginScreen } from './components/auth';
import { authService } from '../shared/utils/auth-service';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Show login screen if not authenticated and not in guest mode
  if (!isAuthenticated && !isGuest) {
    return (
      <LoginScreen
        onSSOLogin={async (provider) => {
          const { url } = await authService.signInWithProvider(provider);
          if (url) window.location.href = url;
        }}
        onGuestMode={() => setIsGuest(true)}
      />
    );
  }
  
  // Show main game
  return <GameContent />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

## OAuth Callback Handling

After OAuth redirect, handle the callback:

```tsx
import { useEffect } from 'react';
import { authService } from '../shared/utils/auth-service';

function OAuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const { session, error } = await authService.handleOAuthCallback();
      
      if (error) {
        console.error('OAuth callback error:', error);
        // Redirect to login with error
        window.location.href = '/?error=auth_failed';
      } else if (session) {
        // Redirect to main app
        window.location.href = '/';
      }
    };
    
    handleCallback();
  }, []);
  
  return <div>Completing sign in...</div>;
}
```

## Requirements Covered

- **1.1**: Display authentication options (LoginScreen)
- **2.1**: Sign-in options for returning players (LoginScreen, SSOButton)
- **2.4**: Error handling and display (AuthError, InlineAuthError)
- **5.1**: Guest mode option (LoginScreen)
- **7.4**: Auth state management (AuthContext, AuthProvider)

## Next Steps

1. Implement ProfileService (task 5.1) to load user profiles
2. Integrate authentication into main App.tsx
3. Create OAuth callback route/handler
4. Add guest mode state management
5. Implement guest-to-authenticated migration UI


## Component Hierarchy

```
AuthProvider (Context)
└── App
    ├── LoginScreen (when not authenticated)
    │   ├── SSOButton (Google)
    │   ├── SSOButton (Discord)
    │   ├── SteamLoginButton (optional)
    │   └── Guest Mode Button
    │
    └── GameContent (when authenticated or guest)
        └── useAuth() hook available to all children
```

## State Flow

```
1. App Mount
   └── AuthProvider initializes
       └── Checks browser storage for session
           ├── Session found → Restore session → Load profile
           └── No session → Show LoginScreen

2. User Clicks SSO Button
   └── SSOButton.handleSignIn()
       └── authService.signInWithProvider()
           └── Redirect to OAuth provider

3. OAuth Callback
   └── authService.handleOAuthCallback()
       └── Exchange code for session
           └── Store session in browser
               └── Trigger auth state change
                   └── AuthProvider updates state
                       └── App shows GameContent

4. Session Expiration
   └── authService detects expiration
       └── Triggers onSessionExpired callbacks
           └── AuthProvider clears state
               └── App shows LoginScreen
```

## Styling Guide

All components follow the game's dark theme aesthetic:

- **Background:** `bg-gradient-to-br from-slate-900 to-slate-800`
- **Cards:** `bg-slate-800/50 border-2 border-slate-700`
- **Primary Color:** Amber (`amber-600`, `amber-700`)
- **Text:** White for headings, `gray-400` for secondary
- **Errors:** Red (`red-900/50`, `red-600`)
- **Loading:** Amber spinner with transparent top border

## Accessibility

- All buttons have proper focus states
- Loading states prevent double-clicks
- Error messages are clear and actionable
- Keyboard navigation supported
- Screen reader friendly text
