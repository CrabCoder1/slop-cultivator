# SelectableCard Component Implementation

## Overview
Created a reusable `SelectableCard` component to ensure consistent styling across all admin editors.

## Component Location
`admin/components/ui/SelectableCard.tsx`

## Design Specifications

### Selected State
- **Background**: Emerald gradient `linear-gradient(to bottom right, #047857, #065f46)`
- **Border**: 2px solid amber-500 (`rgb(245, 158, 11)`)
- **Ring**: 4px amber-500 ring with shadow
- **Text**: White (`rgb(255, 255, 255)`)
- **Transform**: Scale 1.05x
- **Shadow**: Large shadow with amber glow

### Unselected State
- **Background**: Slate-800 (`#1e293b`)
- **Border**: 2px solid slate-700
- **Text**: Slate-300
- **Hover**: Slate-700 background, emerald-600 border

## Usage Across Editors

### Items Editor
```tsx
<SelectableCard isSelected={selectedIndex === index} onClick={() => setSelectedIndex(index)}>
  <div className="text-3xl mb-2">{item.icon}</div>
  <div className="text-sm font-bold truncate">{item.name}</div>
  <div className={`text-xs px-2 py-1 rounded-lg mt-2 inline-block font-bold ${rarityColors[item.rarity]}`}>
    {item.rarity}
  </div>
</SelectableCard>
```

### Skills Editor
Same pattern with skill data

### Enemies Editor
Same pattern with enemy data

### Cultivators Editor
Same pattern with cultivator data

## Test Coverage

### Consistency Tests (`tests/admin-consistency.spec.ts`)
1. **SelectableCard styling across all tabs** - Verifies identical styling
2. **Form input styling** - Ensures consistent form elements
3. **Button styling** - Checks export buttons
4. **No tick marks** - Confirms tick marks removed from all tabs
5. **Emerald gradient and amber outline** - Validates visual design

### Test Results
- ✅ All 16 tests passing
- ✅ Zero accessibility violations
- ✅ Consistent styling verified across Items, Skills, Enemies, Cultivators
- ✅ No tick marks on selected cards
- ✅ Emerald gradient background on all selected cards
- ✅ Amber border outline on all selected cards

## Benefits
1. **Consistency**: All editors use identical selection styling
2. **Maintainability**: Single source of truth for card styling
3. **Accessibility**: Tested and verified contrast ratios
4. **Visual Appeal**: Xianxia-themed emerald and amber colors
5. **Testability**: Comprehensive Playwright tests ensure consistency
