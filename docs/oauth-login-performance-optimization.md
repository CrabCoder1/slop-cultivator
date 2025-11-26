# OAuth Login Performance Optimization

**Date**: 2024-11-24
**Issue**: 13-second delay after OAuth callback before map screen loads

## Root Cause

After OAuth callback, the app was performing multiple sequential blocking operations:

1. **AuthContext** - Loading session + profile (10s timeout)
2. **App.tsx** - Loading all game data sequentially with 3 retries each:
   - Person types
   - Species, Daos, Titles
   - Achievements
   - Player profile
   - Player achievements
   - Wave configurations

Total time: ~13 seconds with retries and timeouts

## Optimizations Applied

### 1. Non-Blocking Profile Load (AuthContext.tsx)

**Before**: Profile load blocked auth initialization
```typescript
const userProfile = await loadProfile(currentSession.user.id);
setProfile(userProfile);
setIsLoading(false); // Only after profile loads
```

**After**: Profile loads in background
```typescript
setIsLoading(false); // Immediately mark auth as ready

// Load profile in background (non-blocking)
loadProfile(currentSession.user.id).then(userProfile => {
  setProfile(userProfile);
}).catch(error => {
  console.error('Background profile load failed:', error);
});
```

**Impact**: Auth completes immediately, user sees UI faster

### 2. Reduced Profile Timeout (AuthContext.tsx)

**Before**: 10-second timeout
**After**: 3-second timeout

**Impact**: Faster failure recovery if profile load hangs

### 3. Optimized Data Loading (App.tsx)

**Before**: All data loaded in parallel with `Promise.all` (fails if any fails)
**After**: Critical data first, then non-blocking background loads

```typescript
// Load critical data first (person types only)
const types = await retryWithBackoff(() => personTypeService.loadPersonTypes(), 2, 500);
setPersonTypes(types);

// Generate cultivators immediately
const cultivators = generateRandomCultivators(types, 4);
setGeneratedCultivators(cultivators);

// Mark as loaded - user can start playing
setDataLoading(false);

// Load composition data in background with Promise.allSettled
const compositionPromises = Promise.allSettled([...]);
```

**Impact**: Map screen loads as soon as person types are ready

### 4. Reduced Retry Configuration

**Before**: 
- 3 retries per operation
- 1000ms base delay (exponential: 1s, 2s, 4s)

**After**:
- 2 retries per operation  
- 500ms base delay (exponential: 500ms, 1s)

**Impact**: Faster failures, less waiting on network issues

### 5. Graceful Degradation

All non-critical data loads use `Promise.allSettled` instead of `Promise.all`:
- App continues if composition data fails
- App continues if achievements fail
- Falls back to basic person types if needed

## Performance Improvement

**Before**: ~13 seconds
**Expected After**: ~1-2 seconds

Breakdown:
- Auth session restore: <100ms (from localStorage)
- Person types load: ~500ms (with 1 retry)
- Cultivator generation: <50ms (client-side)
- Map screen render: <100ms

Total: ~650ms + network latency

Background loads (non-blocking):
- Profile: ~500ms
- Composition data: ~1-2s
- Achievements: ~500ms

## Testing Checklist

- [ ] OAuth login with Google - verify fast map screen load
- [ ] OAuth login with Discord - verify fast map screen load
- [ ] Network failure scenarios - verify graceful degradation
- [ ] Profile load failure - verify app continues without profile
- [ ] Composition data failure - verify fallback to person types
- [ ] Achievement data failure - verify game still playable

## Future Improvements

1. **Cache composition data** - Store species/daos/titles in localStorage
2. **Lazy load achievements** - Only load when achievement screen opens
3. **Prefetch on login screen** - Start loading data before OAuth redirect
4. **Service worker caching** - Cache static game data
5. **Database indexes** - Ensure all queries have proper indexes
