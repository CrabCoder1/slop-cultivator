# SVG Asset Creation Plan

## Goal

Replace all emoji-based icons and sprites with custom SVG assets that:
- Scale properly at any resolution
- Maintain visual consistency with the xianxia/cultivation theme
- Support theming (color customization)
- Improve game polish and professional appearance

## Asset Manifest

All assets are tracked in `game/assets/asset-manifest.ts`. Each entry has:
- `path`: Where the SVG should live
- `name`: Human-readable name
- `status`: 'ready' | 'pending' | 'placeholder'
- `fallback`: Emoji to use until SVG is ready

## Directory Structure

```
game/assets/
├── asset-manifest.ts          # Central registry
├── icons/
│   ├── ui/                    # Interface icons (8 assets)
│   ├── weapons/               # Weapon icons (5 assets)
│   ├── skills/                # Skill icons (16 assets)
│   ├── items/                 # Equipment icons (13 assets)
│   ├── stats/                 # Stat indicators (5 assets)
│   └── badges/                # Level badges (4 assets)
├── effects/
│   ├── combat/                # Attack effects (4 assets)
│   ├── magic/                 # Qi/elemental effects (4 assets)
│   ├── movement/              # Motion effects (4 assets)
│   └── status/                # Buff/debuff effects (4 assets)
└── sprites/
    └── species/               # Character base sprites (6 assets)
```

## Current Progress

| Category | Ready | Pending | Total |
|----------|-------|---------|-------|
| UI Icons | 1 | 7 | 8 |
| Weapons | 2 | 3 | 5 |
| Skills | 0 | 16 | 16 |
| Items | 0 | 13 | 13 |
| Stats | 0 | 5 | 5 |
| Species | 0 | 6 | 6 |
| Combat Effects | 0 | 4 | 4 |
| Magic Effects | 0 | 4 | 4 |
| Movement Effects | 0 | 4 | 4 |
| Status Effects | 0 | 4 | 4 |
| Level Badges | 0 | 4 | 4 |
| **TOTAL** | **3** | **70** | **73** |

## Work Breakdown

### Phase 1: Core UI (Priority: High)
Essential icons for game interface.

- [ ] `ui/settings.svg` - Gear icon
- [ ] `ui/pause.svg` - Pause button
- [ ] `ui/play.svg` - Play button
- [ ] `ui/fast-forward.svg` - Speed control
- [ ] `ui/qi.svg` - Currency indicator
- [ ] `ui/castle.svg` - Temple/base icon
- [ ] `ui/map.svg` - Map selection

### Phase 2: Weapons (Priority: High)
Cultivator weapon types - high visibility on game board.

- [x] `weapons/sword.svg` - Jian straight sword ✓
- [x] `weapons/spear.svg` - Qiang spear with tassel ✓
- [ ] `weapons/bow.svg` - Recurve bow
- [ ] `weapons/staff.svg` - Cultivation staff
- [ ] `weapons/dagger.svg` - Short blade

### Phase 3: Species Sprites (Priority: High)
Base character appearances - most visible game elements.

- [ ] `sprites/species/human.svg` - Human cultivator
- [ ] `sprites/species/spirit.svg` - Ethereal spirit
- [ ] `sprites/species/beast.svg` - Beast/wolf form
- [ ] `sprites/species/golem.svg` - Stone construct
- [ ] `sprites/species/dragon.svg` - Dragon form
- [ ] `sprites/species/demon.svg` - Demon enemy

### Phase 4: Combat Effects (Priority: Medium)
Attack animations and projectiles.

- [ ] `effects/combat/slash.svg` - Melee slash arc
- [ ] `effects/combat/thrust.svg` - Spear thrust
- [ ] `effects/combat/impact.svg` - Hit effect
- [ ] `effects/combat/arrow-trail.svg` - Arrow in flight

### Phase 5: Magic Effects (Priority: Medium)
Qi and elemental abilities.

- [ ] `effects/magic/lightning-bolt.svg` - Electric attack
- [ ] `effects/magic/fire-burst.svg` - Fire explosion
- [ ] `effects/magic/qi-aura.svg` - Energy aura
- [ ] `effects/magic/spirit-wave.svg` - Palm strike wave

### Phase 6: Skills (Priority: Medium)
Skill tree icons - 16 total across 4 cultivator types.

**Sword Skills:**
- [ ] `skills/blade-mastery.svg`
- [ ] `skills/iron-body.svg`
- [ ] `skills/swift-strike.svg`
- [ ] `skills/whirlwind-blade.svg`

**Palm Skills:**
- [ ] `skills/inner-force.svg`
- [ ] `skills/qi-shield.svg`
- [ ] `skills/palm-aura.svg`
- [ ] `skills/meditation.svg`

**Arrow Skills:**
- [ ] `skills/eagle-eye.svg`
- [ ] `skills/rapid-fire.svg`
- [ ] `skills/piercing-shot.svg`
- [ ] `skills/wind-walker.svg`

**Lightning Skills:**
- [ ] `skills/storm-fury.svg`
- [ ] `skills/chain-lightning.svg`
- [ ] `skills/thunder-aura.svg`
- [ ] `skills/static-charge.svg`

### Phase 7: Items (Priority: Medium)
Equipment and drops - 13 items across 4 rarities.

**Common:**
- [ ] `items/jade-ring.svg`
- [ ] `items/silk-sash.svg`
- [ ] `items/iron-bracers.svg`
- [ ] `items/wooden-charm.svg`

**Rare:**
- [ ] `items/dragon-fang.svg`
- [ ] `items/phoenix-feather.svg`
- [ ] `items/tiger-claw.svg`
- [ ] `items/spirit-armor.svg`

**Epic:**
- [ ] `items/celestial-orb.svg`
- [ ] `items/demon-slayer-blade.svg`
- [ ] `items/immortal-robes.svg`

**Legendary:**
- [ ] `items/heavens-mandate.svg`
- [ ] `items/void-breaker.svg`

### Phase 8: Stats & Badges (Priority: Low)
UI indicators.

**Stats:**
- [ ] `stats/health.svg`
- [ ] `stats/damage.svg`
- [ ] `stats/attack-speed.svg`
- [ ] `stats/range.svg`
- [ ] `stats/crit-chance.svg`

**Level Badges:**
- [ ] `badges/novice.svg` (levels 1-3)
- [ ] `badges/intermediate.svg` (levels 4-6)
- [ ] `badges/advanced.svg` (levels 7-9)
- [ ] `badges/master.svg` (level 10)

### Phase 9: Movement & Status Effects (Priority: Low)
Polish effects.

**Movement:**
- [ ] `effects/movement/jump-dust.svg`
- [ ] `effects/movement/dash-trail.svg`
- [ ] `effects/movement/landing-impact.svg`
- [ ] `effects/movement/speed-lines.svg`

**Status:**
- [ ] `effects/status/heal-glow.svg`
- [ ] `effects/status/shield-bubble.svg`
- [ ] `effects/status/poison-drip.svg`
- [ ] `effects/status/stun-stars.svg`

## Design Guidelines

### Style
- Xianxia/cultivation fantasy theme
- Simple, clean shapes (readable at 24x24)
- Consistent stroke width (2px default)
- Rounded corners where appropriate

### Colors
- **Steel/Blades**: `#B8C4D0` (light), `#5D3A1A` (dark)
- **Leather/Wood**: `#8B5A2B`, `#A0522D`, `#8B4513`
- **Gold/Accents**: `#DAA520`, `#B8860B`
- **Crimson/Blood**: `#8B0000`
- **Qi/Energy**: `#7DD3FC` (cyan), `#A78BFA` (purple)
- **Lightning**: `#FBBF24` (yellow), `#60A5FA` (blue)

### Technical
- ViewBox: `0 0 24 24` (standard icon size)
- Use `currentColor` for themeable elements
- No external dependencies
- Optimize paths (remove unnecessary points)

## Integration

Once SVGs are created:
1. Update `status` in `asset-manifest.ts` from 'pending' to 'ready'
2. Use `getAssetOrFallback()` helper in components
3. Gradually replace emoji references with SVG imports

## Completed Assets

- [x] `icons/ui/inventory.svg` (rucksack)
- [x] `icons/weapons/sword.svg` (jian)
- [x] `icons/weapons/spear.svg` (qiang)
