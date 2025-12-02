# SVG Asset Creation Guide

This guide documents the complete workflow for creating and adding new SVG assets to Slop Cultivator.

## Quick Reference

| Requirement | Value |
|-------------|-------|
| ViewBox | `0 0 24 24` |
| Readable Size | 24x24 pixels minimum |
| Color Palette | See [Color Palette](#color-palette) below |
| File Format | `.svg` (XML-based) |

## Directory Structure

All SVG assets are organized in the following structure:

```
game/assets/
├── icons/
│   ├── ui/           # UI controls (inventory, settings, pause, play)
│   ├── weapons/      # Weapon icons (sword, spear, bow, staff, dagger)
│   ├── skills/       # Skill icons (16 total, 4 per cultivator type)
│   ├── items/        # Item icons (13 total across rarities)
│   ├── stats/        # Stat icons (health, damage, attack speed, range, crit)
│   └── badges/       # Level badges (novice, intermediate, advanced, master)
├── effects/
│   ├── combat/       # Combat effects (slash, thrust, impact, arrow trail)
│   ├── magic/        # Magic effects (lightning, fire, qi aura, spirit wave)
│   ├── movement/     # Movement effects (jump dust, dash trail, landing, speed)
│   └── status/       # Status effects (heal, shield, poison, stun)
└── sprites/
    └── species/      # Character sprites (human, spirit, beast, golem, dragon, demon)
```

## Color Palette

All SVG assets must use colors from this approved palette:

### Metals
| Name | Hex Code | Usage |
|------|----------|-------|
| Steel Light | `#B8C4D0` | Blade surfaces |
| Steel Dark | `#5D3A1A` | Metal shadows |
| Steel Highlight | `#D4DEE8` | Metal highlights |

### Materials
| Name | Hex Code | Usage |
|------|----------|-------|
| Leather Primary | `#8B5A2B` | Leather surfaces |
| Leather Secondary | `#A0522D` | Leather accents |
| Leather Dark | `#8B4513` | Leather shadows |
| Wood Primary | `#8B4513` | Wood surfaces |
| Wood Light | `#CD853F` | Wood highlights |

### Accents
| Name | Hex Code | Usage |
|------|----------|-------|
| Gold Primary | `#DAA520` | Gold accents, buckles |
| Gold Dark | `#B8860B` | Gold shadows |
| Crimson | `#8B0000` | Red accents, tassels |

### Energy/Magic
| Name | Hex Code | Usage |
|------|----------|-------|
| Qi Cyan | `#7DD3FC` | Qi energy effects |
| Qi Purple | `#A78BFA` | Qi aura effects |
| Lightning Yellow | `#FBBF24` | Lightning effects |
| Lightning Blue | `#60A5FA` | Electric effects |
| Fire Orange | `#F97316` | Fire effects |
| Fire Red | `#EF4444` | Flame effects |

### Status
| Name | Hex Code | Usage |
|------|----------|-------|
| Heal | `#22C55E` | Healing effects |
| Poison | `#84CC16` | Poison effects |
| Shield | `#3B82F6` | Shield effects |

### Special Values
These values are always allowed:
- `none` - No fill/stroke
- `currentColor` - Inherits from CSS
- `transparent` - Transparent fill
- `inherit` - Inherits from parent

## Step-by-Step: Adding a New Asset

### Step 1: Create the SVG File

Create your SVG with the required viewBox:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <!-- Your SVG content here -->
</svg>
```

**Requirements:**
- ViewBox MUST be `0 0 24 24`
- Include `width="24"` and `height="24"` attributes
- Use only colors from the approved palette
- Design should be readable at 24x24 pixels

### Step 2: Save to Correct Directory

Save your SVG file to the appropriate directory based on its category:

| Category | Directory | Example |
|----------|-----------|---------|
| UI Icons | `game/assets/icons/ui/` | `settings.svg` |
| Weapons | `game/assets/icons/weapons/` | `bow.svg` |
| Skills | `game/assets/icons/skills/` | `blade-mastery.svg` |
| Items | `game/assets/icons/items/` | `jade-ring.svg` |
| Stats | `game/assets/icons/stats/` | `health.svg` |
| Badges | `game/assets/icons/badges/` | `novice.svg` |
| Combat Effects | `game/assets/effects/combat/` | `slash.svg` |
| Magic Effects | `game/assets/effects/magic/` | `lightning-bolt.svg` |
| Movement Effects | `game/assets/effects/movement/` | `dash-trail.svg` |
| Status Effects | `game/assets/effects/status/` | `heal-glow.svg` |
| Species Sprites | `game/assets/sprites/species/` | `dragon.svg` |

### Step 3: Update the Asset Manifest

Open `game/assets/asset-manifest.ts` and update the status from `'pending'` to `'ready'`:

```typescript
// Before
bow: {
  path: 'game/assets/icons/weapons/bow.svg',
  name: 'Bow',
  status: 'pending',  // ← Change this
  fallback: '🏹',
},

// After
bow: {
  path: 'game/assets/icons/weapons/bow.svg',
  name: 'Bow',
  status: 'ready',    // ← To this
  fallback: '🏹',
},
```

### Step 4: Verify Your Asset

1. Start the development server: `npm run dev`
2. Navigate to `/asset-preview` in your browser
3. Find your asset in the appropriate category
4. Verify it renders correctly at 24x24, 48x48, and 64x64 sizes

## Example: Complete SVG Asset

Here's a complete example of a properly formatted SVG (the sword icon):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <!-- Blade - jian style straight sword -->
  <path d="M12 2L14 12L12 14L10 12L12 2Z" fill="#B8C4D0"/>
  <!-- Blade edge highlight -->
  <path d="M12 2L13 10L12 12L12 2Z" fill="#D4DEE8"/>
  <!-- Guard - cloud motif -->
  <ellipse cx="12" cy="15" rx="4" ry="1.5" fill="#DAA520"/>
  <!-- Handle wrap -->
  <rect x="11" y="16" width="2" height="5" fill="#8B0000"/>
  <!-- Pommel -->
  <circle cx="12" cy="22" r="1.5" fill="#DAA520"/>
</svg>
```

**Key points:**
- Uses `viewBox="0 0 24 24"`
- All colors are from the approved palette
- Includes descriptive comments
- Simple shapes that are readable at small sizes

## Design Guidelines

### Readability at Small Sizes
- Use bold, simple shapes
- Avoid fine details that disappear at 24x24
- Ensure sufficient contrast between elements
- Test at actual display size before finalizing

### Visual Consistency
- Match the style of existing ready assets (sword, spear, inventory)
- Use similar stroke widths and shape complexity
- Maintain consistent lighting direction (top-left)
- Use the same color palette across all assets

### File Size
- Keep SVGs simple and lightweight
- Remove unnecessary metadata and comments in production
- Avoid embedded images or complex filters

## Asset Status Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   pending   │ ──► │   review    │ ──► │    ready    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │
     │                    ▼
     │              ┌─────────────┐
     └──────────────│   revise    │
                    └─────────────┘
```

1. **pending**: Asset is defined in manifest but SVG doesn't exist yet
2. **review**: SVG created, awaiting validation
3. **ready**: SVG passes all validation, status updated in manifest
4. **revise**: SVG failed validation, needs corrections

## Related Documentation

- [Validation and Preview Workflow](./svg-validation-preview-workflow.md)
- [Asset Priority List](./svg-asset-priority-list.md)
- [Design Document](.kiro/specs/svg-asset-system/design.md)
