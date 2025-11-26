# Pathfinding Tile Settings - Investigation & Fix

## Issues Found

### 1. ✅ RESOLVED: A* Pathfinding Respecting Tiles
**Status**: Working correctly - pathfinding DOES respect tile walkability.

### 2. ✅ FIXED: Enemies Spawning on Non-Walkable Tiles
**Status**: Fixed - spawn logic now checks tile walkability.

## Investigation

### Map Structure
The "Classic Arena" map has:
- **Mountains** (edges) - `isWalkable: false`
- **Water** (rows 10-11, cols 2-4 and 10-12) - `isWalkable: false`  
- **Grass** (center) - `isWalkable: true`

### Code Analysis

The pathfinding code DOES check tile walkability:

```typescript
// In isValidTile()
if (tileGrid) {
  const tile = tileGrid.getTileAt(col, row);
  if (!tile || !tile.pathfinding.isWalkable) {
    return false;
  }
}
```

The tileGrid IS being passed to findPath() from App.tsx:
```typescript
const path = findPath(spawnX, spawnY, towers, tileGrid || undefined);
```

### Added Debugging

I've added console logging to help diagnose the issue:

1. **In `findPath()`**: Logs whether tileGrid is provided
2. **In `isValidTile()`**: Logs when tiles are not walkable or not found

### Next Steps to Debug

1. **Run the game** and open browser console
2. **Start a wave** to spawn enemies
3. **Check console output** for:
   - `[Pathfinding] findPath called with tileGrid: YES/NO`
   - `[Pathfinding] Tile at (x, y) is not walkable`
   - `[Pathfinding] No tile found at (x, y)`

### Possible Issues

1. **tileGrid is null**: If tileGrid is null/undefined, pathfinding falls back to only checking towers and castle
2. **Map not loaded**: If selectedMap or tileTypes aren't loaded when enemies spawn
3. **Coordinate mismatch**: The tile grid coordinates might not match the pathfinding grid coordinates

### Resolution: Pathfinding

Console logs confirmed:
- `[Pathfinding] findPath called with tileGrid: YES` ✓
- Multiple tiles correctly identified as non-walkable ✓
- Water tiles (4,10), (4,11), (10,10), (10,11), etc. avoided ✓
- Mountain tiles (13,4), (13,8), (13,9), etc. avoided ✓

**Conclusion**: Pathfinding was working correctly all along.

### Resolution: Enemy Spawning

**Problem**: Enemies spawned at random columns (0-14) in row 0, without checking walkability. Columns 0-1 and 13-14 are mountains.

**Fix Applied**: Added `findValidSpawnPosition()` helper function that:
1. Attempts to find a walkable tile in row 0 (up to 50 attempts)
2. Checks `tileGrid.getTileAt(col, row).pathfinding.isWalkable`
3. Falls back to center column if no valid position found
4. Applied to both new Person Type system and legacy enemy system

**Files Modified**:
- `game/App.tsx` - Updated `spawnEnemy()` function

### Testing

Enemies now:
- ✓ Spawn only on walkable tiles (grass, not mountains)
- ✓ Avoid water tiles at rows 10-11 during pathfinding
- ✓ Avoid mountain tiles on edges during pathfinding
- ✓ Path correctly through grass tiles
