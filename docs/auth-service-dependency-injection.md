# Auth Service Dependency Injection Refactoring

## Overview

The `AuthService` class has been refactored to support dependency injection, enabling proper testing without requiring a live Supabase instance. This change improves testability while maintaining the same security model and production behavior.

## What Changed

### Before (Hardcoded Dependency)

```typescript
import { supabase } from '../../game/utils/supabase/client';

export class AuthService {
  async signInWithProvider(provider: OAuthProvider) {
    // Always uses the hardcoded supabase client
    const { data, error } = await supabase.auth.signInWithOAuth({...});
  }
}

// Singleton export
export const authService = new AuthService();
```

### After (Dependency Injection)

```typescript
import { supabase } from '../../game/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  async signInWithProvider(provider: OAuthProvider) {
    // Uses the injected client (or default real one)
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({...});
  }
}

// Singleton export - unchanged behavior
export const authService = new AuthService();
```

## Key Points

### Production Code (Unchanged)

Production code continues to work exactly as before:

```typescript
import { authService } from '../shared/utils/auth-service';

// Uses the real Supabase client by default
const session = await authService.getSession();
const result = await authService.signInWithProvider('google');
```

### Test Code (Now Possible)

Tests can now inject mock Supabase clients:

```typescript
import { AuthService } from '../shared/utils/auth-service';

// Create a mock Supabase client
const mockSupabase = {
  auth: {
    signInWithOAuth: async () => ({ data: { url: 'mock-url' }, error: null }),
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    getUser: async () => ({ data: { user: mockUser }, error: null }),
    // ... other methods
  }
};

// Inject the mock client
const testAuthService = new AuthService(mockSupabase as any);

// Test with the mock
const result = await testAuthService.handleOAuthCallback();
expect(result.session).not.toBeNull();
```

## Security Analysis

### No New Attack Surface

- ✅ Production code uses the exact same Supabase client as before
- ✅ The singleton export `authService` still uses the real client by default
- ✅ No user input can influence which client is used
- ✅ The constructor parameter is only accessible to your own code
- ✅ Same security model as passing props to React components or config to services

### What This Is NOT

This is **not** like SQL injection or code injection where:
- ❌ User input gets executed as code
- ❌ External data controls program behavior
- ❌ Untrusted sources can inject malicious code

### What This IS

This **is** a standard software design pattern:
- ✅ Passing a database connection to a repository class
- ✅ Passing a logger to a service
- ✅ Passing configuration to a component
- ✅ Used by React (props), Express (middleware), and countless other frameworks

## Benefits

### 1. Testability

- **Property-based testing**: Can now run 100+ test iterations with different mock data
- **No external dependencies**: Tests don't require a live Supabase instance
- **Faster tests**: No network calls, tests run in milliseconds
- **More reliable**: Tests don't fail due to network issues or service outages

### 2. Flexibility

- **Multiple environments**: Easy to use different Supabase instances for dev/staging/prod
- **Testing edge cases**: Can mock error conditions that are hard to reproduce with real services
- **Isolation**: Each test can have its own mock without affecting others

### 3. Maintainability

- **Clear dependencies**: The class explicitly declares what it needs
- **Easier refactoring**: Changing the Supabase client doesn't require changing the AuthService
- **Better documentation**: The constructor signature shows what the class depends on

## Test Results

After refactoring, all property-based tests now pass:

```
✓ Property 2: SSO Authentication Creates Profile and Session (24.8s)
✓ Property 2 (Edge Cases): OAuth callback handles various metadata (22.6s)
✓ Property 2 (Invariant): Session tokens always present (23.0s)
✓ Property 2 (Idempotence): Multiple getSession calls consistent (22.7s)

4 passed (1.7m)
```

Each test runs 100 iterations with randomly generated test data, providing comprehensive coverage.

## Migration Guide

### For Production Code

**No changes needed!** Continue using the singleton:

```typescript
import { authService } from '../shared/utils/auth-service';
```

### For Test Code

**Update to use dependency injection:**

```typescript
// Old approach (doesn't work)
import { authService } from '../shared/utils/auth-service';
// Can't mock the hardcoded supabase client

// New approach (works!)
import { AuthService } from '../shared/utils/auth-service';
const testService = new AuthService(mockSupabase as any);
```

### For New Features

When creating new services that depend on Supabase:

```typescript
export class MyNewService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabaseClient = supabaseClient;
  }

  async myMethod() {
    const { data } = await this.supabaseClient.from('table').select();
  }
}

// Export singleton for production use
export const myNewService = new MyNewService();
```

## Related Files

- **Implementation**: `shared/utils/auth-service.ts`
- **Tests**: `tests/auth-service-session-creation.spec.ts`
- **Documentation**: `docs/oauth-setup-guide.md`
- **Design**: `.kiro/specs/user-authentication/design.md`

## References

- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
- [SOLID Principles - Dependency Inversion](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Testing with Mocks](https://martinfowler.com/articles/mocksArentStubs.html)

## Questions?

If you have questions about this refactoring or how to use dependency injection in your code, please refer to:

1. This document for the rationale and examples
2. `docs/oauth-setup-guide.md` for testing examples
3. `tests/auth-service-session-creation.spec.ts` for working test code
4. The design document for the overall authentication architecture
