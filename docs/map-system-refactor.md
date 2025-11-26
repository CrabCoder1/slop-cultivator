# Map System Refactor: Pixel-based to Row/Col-based

## Summary

Refactored the map configuration system from pixel-based dimensions to row/column-based dimensions. The board size now scales automatically based on the number of rows and columns, ensuring all tiles remain square.

## Changes Made

### 1. MapEditor.tsx (Admin Tool)
**Before:**
- Used `boardWidth` and `boardHeight` in pixels
- Calculated rows/cols from pixel dimensions
- Positions defined as `{ x: number, y: number }` in pixels
- Zones defined with pixel coordinates and dimensions

**After:**
- Uses `cols` and `rows` as primary values
- Calculates pixel dimensions: `boardWidth = cols * gridSize`
- Positions defined as `{ col: number, row: number }`
- Zones defined with `{ startCol, startRow, cols, rows }`

### 2. game-board.tsx
**Before:**
```typescript
const BOARD_WIDTH = 450;
const BOARD_HEIGHT = 600;
```

**After:**
```typescript
const COLS = 15;
const ROWS = 20;
const BOARD_WIDTH = COLS * GRID_SIZE; // 450px
const BOARD_HEIGHT = ROWS * GRID_SIZE; // 600px
const DEPLOYMENT_START_ROW = 12; // Bottom 8 rows
```

### 3. pathfinding.ts
**Before:**
```typescript
const BOARD_WIDTH = 450;
const BOARD_HEIGHT = 600;
const COLS = BOARD_WIDTH / GRID_SIZE;
const ROWS = BOARD_HEIGHT / GRID_SIZE;
```

**After:**
```typescript
const COLS = 15;
const ROWS = 20;
const BOARD_WIDTH = COLS * GRID_SIZE;
const BOARD_HEIGHT = ROWS * GRID_SIZE;
```

### 4. Test Updates
Updated `tests/admin-maps-preview.spec.ts` to match new UI text:
- "Tile (x, y)" → "Col x, Row y"
- Added check for "Board Size:" stat display

## Benefits

1. **Clearer Intent**: Rows and columns are the logical units for a grid-based game
2. **Guaranteed Square Tiles**: Pixel dimensions are always multiples of grid size
3. **Easier Configuration**: Changing board size is now as simple as adjusting row/col counts
4. **Better Scalability**: Easy to create different map sizes (e.g., 10x15, 20x25)
5. **Reduced Calculation Errors**: No more manual pixel math for positions

## Configuration Example

```typescript
{
  cols: 15,
  rows: 20,
  castlePosition: { col: 7, row: 18 },
  spawnPoints: [
    { col: 0, row: 0 },
    { col: 7, row: 0 },
    { col: 14, row: 0 }
  ],
  deploymentZones: [
    { startCol: 0, startRow: 12, cols: 15, rows: 8 }
  ]
}
```

**Note:** Grid size is no longer part of the configuration. It's dynamically calculated based on the viewport dimensions to ensure tiles remain square and the board fits properly.

## Testing

All existing tests pass:
- ✅ Map preview displays correctly
- ✅ Tile hover information shows col/row
- ✅ Grid dimensions calculated properly
- ✅ All tile types render in correct positions

## Migration Notes

If you have existing map configurations in JSON format, they will need to be converted:
- Remove `gridSize` field (now dynamic)
- `boardWidth` → `cols = boardWidth / 30` (assuming 30px grid)
- `boardHeight` → `rows = boardHeight / 30`
- `{ x, y }` positions → `{ col: Math.floor(x / 30), row: Math.floor(y / 30) }`
- Zone dimensions → Convert pixel-based to tile-based

## Admin Tool Changes

The Map Editor now only shows:
- **Columns**: Number of horizontal tiles
- **Rows**: Number of vertical tiles
- **Aspect Ratio**: Displayed as cols:rows (e.g., 15:20)

Grid size is automatically calculated to fit the viewport while maintaining square tiles.
