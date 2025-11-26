# Admin Tool Color System - Thor: Love and Thunder Inspired

## Color Palette

### Primary Colors
- **Electric Cyan**: `cyan-300`, `cyan-400` - Labels, accents, borders
- **Hot Fuchsia**: `fuchsia-400`, `fuchsia-500` - Primary actions, gradients
- **Vibrant Purple**: `purple-400`, `purple-500` - Secondary actions, gradients
- **Neon Green**: `green-400`, `green-500`, `emerald-500` - Success states

### Background Colors
- **Deep Indigo**: `indigo-950` - Main background gradient start
- **Deep Fuchsia**: `fuchsia-950` - Main background gradient middle
- **Deep Violet**: `violet-950` - Main background gradient end
- **Dark Slate**: `slate-800`, `slate-900` - Content areas, cards
- **Darker Slate**: `slate-700` - Input backgrounds

### Text Colors
- **White**: Primary text on dark backgrounds
- **Cyan**: `cyan-300`, `cyan-400` - Labels, secondary text
- **Fuchsia**: `fuchsia-400` - Highlighted text, gradients

## Component Styles

### Buttons

#### Active/Selected
```tsx
className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white 
  shadow-lg shadow-fuchsia-500/50 border-2 border-cyan-400 scale-105"
```

#### Inactive/Hover
```tsx
className="bg-gradient-to-r from-slate-800 to-slate-700 text-cyan-300 
  hover:from-slate-700 hover:to-slate-600 border-2 border-slate-600 
  hover:border-cyan-500"
```

#### Success (Export)
```tsx
className="bg-gradient-to-r from-green-500 to-emerald-500 
  hover:from-green-600 hover:to-emerald-600 text-white 
  shadow-lg shadow-green-500/50 border-2 border-green-400"
```

### Input Fields
```tsx
className="bg-slate-800 text-white rounded-xl border-2 
  border-fuchsia-500/50 focus:border-cyan-400 focus:outline-none 
  focus:ring-2 focus:ring-cyan-400/50 font-semibold"
```

### Labels
```tsx
className="text-sm font-bold text-cyan-300"
```

### Headers
```tsx
className="text-3xl font-bold bg-gradient-to-r from-cyan-400 
  to-fuchsia-400 bg-clip-text text-transparent"
```

### Cards/Panels
```tsx
className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl 
  border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
```

### Stat Displays
```tsx
className="bg-slate-900/50 rounded-xl border border-fuchsia-500/30"
// Text:
className="bg-gradient-to-r from-fuchsia-400 to-purple-400 
  bg-clip-text text-transparent"
```

## Rarity/Difficulty Colors

### Items
- **Common**: `gray-500` → Keep as is (contrast)
- **Rare**: `blue-500` → `cyan-500` (more vibrant)
- **Epic**: `purple-600` → `fuchsia-600` (hot pink)
- **Legendary**: `orange-600` → Keep (good contrast)

### Enemies
- **Common**: `gray-600` → Keep
- **Uncommon**: `green-600` → `emerald-600` (brighter)
- **Rare**: `blue-600` → `cyan-600` (electric)
- **Elite**: `purple-600` → `fuchsia-600` (hot pink)
- **Boss**: `red-600` → Keep (danger)

### Skills
- **Passive**: `blue-600` → `cyan-600` (electric)
- **Active**: `red-600` → Keep (action)
- **Aura**: `purple-600` → `fuchsia-600` (hot pink)

## Design Principles

1. **High Contrast**: All text must be readable against backgrounds
2. **Vibrant Accents**: Use gradients for visual interest
3. **Neon Glow**: Shadow effects with color/50 opacity
4. **Electric Feel**: Cyan for tech/energy, Fuchsia for power
5. **Bold Typography**: Use font-bold and font-semibold liberally

## Inspiration
Thor: Love and Thunder's aesthetic:
- Electric blue lightning
- Hot pink/magenta energy
- Neon 80s vibes
- High contrast
- Vibrant and energetic
