# SVG Asset Requirements

This document lists all emoji/icons that need to be replaced with SVG assets for proper scaling.

## Why SVGs?

Emojis and text don't scale proportionally with the game board when the browser window is resized. SVGs scale perfectly with their container, ensuring consistent visuals at any zoom level.

## Categories

### 1. Cultivator/Defender Types (Person Types with defenderConfig)

These appear on the game board as player units. Need to be visually distinct and recognizable at small sizes.

| Current Emoji | Context | Notes |
|---------------|---------|-------|
| ⚔️ | Sword Cultivator | Melee fighter |
| 🖐️ | Palm Cultivator | Balanced fighter |
| 🏹 | Arrow Cultivator | Ranged specialist |
| ⚡ | Lightning Cultivator | High damage, slow |
| 👤 | Human variants | Shadow/Human species |
| 👻 | Spirit variants | Ethereal appearance |
| 🐺 | Beast variants | Animal-like |
| 🗿 | Golem variants | Stone construct |
| 🐉 | Dragon variants | Legendary creature |
| 👹 | Demon variants | Demonic appearance |

**Note:** The composition system generates cultivators dynamically from Species + Dao + Title combinations. Each Species may need its own base SVG.

### 2. Enemy Types (Person Types with attackerConfig)

These appear on the game board as enemy units moving toward the castle.

| Current Emoji | Enemy Type | Description |
|---------------|------------|-------------|
| 👹 | Crimson Demon | Balanced demon enemy |
| 👤 | Shadow Wraith | Fast, fragile shadow |
| 🐺 | Dire Beast | Slow, tanky beast |
| 👻 | Spectral Wraith | Ethereal spirit |
| 🗿 | Stone Golem | High durability construct |
| 🐉 | Corrupted Dragon | Boss-tier enemy |

### 3. Projectiles

Visual effects for attacks traveling across the board.

| Current Emoji | Projectile Type | Notes |
|---------------|-----------------|-------|
| ⚔️ | Sword slash | Melee attack effect |
| 💨 | Palm strike | Energy wave |
| 🏹 | Arrow | Ranged projectile |
| ⚡ | Lightning bolt | Electric attack |
| ✨ | Default/fallback | Generic projectile |

### 4. UI Elements

Static icons used in menus, dialogs, and HUD.

| Current Emoji | Context | Location |
|---------------|---------|----------|
| 🏯 | Castle/Temple | Game board center |
| 💥 | Attack effect | Castle damage indicator |
| ⭐ | Level up | Animation effect |
| ✨ | Sparkle | Level up animation |
| 👑 | Max level badge | Level indicator |
| 🗺️ | Map icon | Map selection screen |

### 5. Level Badge Indicators

| Current Emoji | Level Range | Notes |
|---------------|-------------|-------|
| 🌱 | 1-3 | Novice |
| 🌿 | 4-6 | Intermediate |
| ⭐ | 7-9 | Advanced |
| 👑 | 10 (max) | Master |

### 6. Achievement Icons

Achievements have their own emoji field in the database. These would need individual SVGs based on achievement types.

### 7. Skill Icons

Skills use emoji icons. Need to audit `game/utils/skills.ts` for the full list.

---

## Recommended Approach

### Option A: Icon Pack
Find a cohesive fantasy/RPG icon pack that includes:
- Character types (human, beast, demon, spirit, dragon, golem)
- Weapons (sword, bow, staff)
- Effects (lightning, fire, energy)
- UI elements (castle, star, crown)

### Option B: Generate with AI
Use an AI image generator to create consistent SVG icons in a unified art style.

### Option C: Lucide Icons + Custom
Use Lucide (already in project) for UI elements, create custom SVGs only for game-specific entities.

---

## Implementation Plan

1. **Phase 1**: Replace cultivator/enemy sprites (highest visual impact)
2. **Phase 2**: Replace projectile effects
3. **Phase 3**: Replace UI elements
4. **Phase 4**: Replace achievement/skill icons

## Technical Notes

- SVGs should be designed at a base size (e.g., 64x64) but will scale to any size
- Use `viewBox` attribute for proper scaling
- Consider using `<symbol>` and `<use>` for reusable icons
- Store SVGs in `game/assets/icons/` or similar
- Create a React component wrapper for consistent usage
