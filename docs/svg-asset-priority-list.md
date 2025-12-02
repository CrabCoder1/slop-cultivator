# SVG Asset Priority List

This document lists all 70 pending SVG assets organized by priority, with game context for each.

## Summary

| Status | Count |
|--------|-------|
| Ready | 3 |
| Pending | 70 |
| **Total** | **73** |

### Ready Assets (3)
- ✅ `inventory` - UI icon
- ✅ `sword` - Weapon icon
- ✅ `spear` - Weapon icon

---

## Priority 1: Critical (Blocking Core Gameplay)

These assets are used in the main game loop and have the highest visual impact.

### Weapons (3 pending)
Used in tower-selector and cultivator displays. Players see these constantly.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `bow` | Bow | 🏹 | Arrow cultivator weapon |
| `staff` | Staff | 🪄 | Lightning cultivator weapon |
| `dagger` | Dagger | 🗡️ | Alternative melee weapon |

### Species Sprites (6 pending)
Character sprites for cultivators and enemies on the game board.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `human` | Human | 👤 | Base human cultivator/enemy |
| `spirit` | Spirit | 👻 | Ethereal cultivator/enemy type |
| `beast` | Beast | 🐺 | Animal-like enemy type |
| `golem` | Golem | 🗿 | Stone construct enemy |
| `dragon` | Dragon | 🐉 | Boss-tier enemy/cultivator |
| `demon` | Demon | 👹 | Demonic enemy type |

### Combat Effects (4 pending)
Visual feedback for attacks - essential for game feel.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `slash` | Slash | ⚔️ | Sword attack effect |
| `thrust` | Thrust | 🔱 | Spear attack effect |
| `impact` | Impact | 💥 | Melee hit effect |
| `arrowTrail` | Arrow Trail | ➡️ | Projectile trail |

---

## Priority 2: High (Core UI & Gameplay)

These assets appear frequently in the UI and affect player experience.

### UI Icons (7 pending)
Core interface elements visible throughout gameplay.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `qi` | Qi Currency | ✨ | Resource display (always visible) |
| `castle` | Castle/Temple | 🏯 | Objective indicator |
| `pause` | Pause | ⏸️ | Game control |
| `play` | Play | ▶️ | Game control |
| `fastForward` | Fast Forward | ⏩ | Speed control |
| `settings` | Settings | ⚙️ | Settings menu |
| `map` | Map | 🗺️ | Map selection |

### Stat Icons (5 pending)
Displayed in cultivator details and tooltips.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `health` | Health | ❤️ | HP stat display |
| `damage` | Damage | ⚔️ | Attack power display |
| `attackSpeed` | Attack Speed | ⚡ | Speed stat display |
| `range` | Range | 🎯 | Range stat display |
| `critChance` | Critical Chance | 💥 | Crit stat display |

### Magic Effects (4 pending)
Visual effects for special abilities.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `lightningBolt` | Lightning Bolt | ⚡ | Lightning cultivator attack |
| `fireBurst` | Fire Burst | 🔥 | Fire-based ability |
| `qiAura` | Qi Aura | ✨ | Energy effect |
| `spiritWave` | Spirit Wave | 💨 | Spirit-based attack |

---

## Priority 3: Medium (Skills & Items)

These enhance the RPG elements but don't block core gameplay.

### Skill Icons - Sword (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `bladeMastery` | Blade Mastery | ⚔️ | Passive damage boost |
| `ironBody` | Iron Body | 🛡️ | Defensive skill |
| `swiftStrike` | Swift Strike | ⚡ | Speed ability |
| `whirlwindBlade` | Whirlwind Blade | 🌪️ | AoE attack |

### Skill Icons - Palm (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `innerForce` | Inner Force | 💫 | Power boost |
| `qiShield` | Qi Shield | 🔰 | Defensive barrier |
| `palmAura` | Palm Aura | ✨ | Energy aura |
| `meditation` | Meditation | 🧘 | Regeneration skill |

### Skill Icons - Arrow (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `eagleEye` | Eagle Eye | 🦅 | Range/accuracy boost |
| `rapidFire` | Rapid Fire | 🏹 | Attack speed skill |
| `piercingShot` | Piercing Shot | 🎯 | Penetrating attack |
| `windWalker` | Wind Walker | 🍃 | Movement skill |

### Skill Icons - Lightning (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `stormFury` | Storm Fury | ⚡ | Damage boost |
| `chainLightning` | Chain Lightning | 🌩️ | Multi-target attack |
| `thunderAura` | Thunder Aura | ⚡ | Passive effect |
| `staticCharge` | Static Charge | 🔋 | Energy buildup |

### Item Icons - Common (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `jadeRing` | Jade Ring | 💍 | Basic accessory |
| `silkSash` | Silk Sash | 🎀 | Basic armor |
| `ironBracers` | Iron Bracers | 🔗 | Basic defense |
| `woodenCharm` | Wooden Charm | 🪵 | Basic trinket |

### Item Icons - Rare (4 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `dragonFang` | Dragon Fang | 🦷 | Rare damage item |
| `phoenixFeather` | Phoenix Feather | 🪶 | Rare speed item |
| `tigerClaw` | Tiger Claw | 🐅 | Rare attack item |
| `spiritArmor` | Spirit Armor | 👻 | Rare defense item |

### Item Icons - Epic (3 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `celestialOrb` | Celestial Orb | 🔮 | Epic magic item |
| `demonSlayerBlade` | Demon Slayer Blade | 🗡️ | Epic weapon |
| `immortalRobes` | Immortal Robes | 👘 | Epic armor |

### Item Icons - Legendary (2 pending)

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `heavensMandate` | Heaven's Mandate | 👑 | Legendary item |
| `voidBreaker` | Void Breaker | ⚔️ | Legendary weapon |

---

## Priority 4: Low (Polish & Effects)

These add visual polish but aren't essential for gameplay.

### Level Badges (4 pending)
Displayed on cultivator level indicators.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `novice` | Novice (1-3) | 🌱 | Early game badge |
| `intermediate` | Intermediate (4-6) | 🌿 | Mid game badge |
| `advanced` | Advanced (7-9) | ⭐ | Late game badge |
| `master` | Master (10) | 👑 | Max level badge |

### Movement Effects (4 pending)
Subtle visual feedback for unit movement.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `jumpDust` | Jump Dust | 💨 | Jump animation |
| `dashTrail` | Dash Trail | 💨 | Dash animation |
| `landingImpact` | Landing Impact | 💥 | Landing effect |
| `speedLines` | Speed Lines | 〰️ | Fast movement |

### Status Effects (4 pending)
Visual indicators for buffs/debuffs.

| Key | Name | Fallback | Game Context |
|-----|------|----------|--------------|
| `healGlow` | Heal Glow | 💚 | Healing indicator |
| `shieldBubble` | Shield Bubble | 🛡️ | Shield active |
| `poisonDrip` | Poison Drip | ☠️ | Poison debuff |
| `stunStars` | Stun Stars | ⭐ | Stun indicator |

---

## Assets Blocking Features

The following features are partially blocked by missing assets:

### Tower Selector
- **Blocked by**: `bow`, `staff`, `dagger` (weapon icons)
- **Impact**: Arrow and Lightning cultivators show emoji instead of proper icons

### Game Board Units
- **Blocked by**: All species sprites (6 assets)
- **Impact**: Cultivators and enemies display emoji instead of character sprites

### Combat Feedback
- **Blocked by**: Combat effects (4 assets), magic effects (4 assets)
- **Impact**: Attacks show emoji instead of proper visual effects

### UI Controls
- **Blocked by**: `pause`, `play`, `fastForward`, `qi`, `castle`
- **Impact**: Game controls and resource display use emoji

---

## Recommended Creation Order

For maximum impact with minimum effort:

1. **Week 1**: Weapons (3) + UI Icons (7) = 10 assets
2. **Week 2**: Species Sprites (6) + Combat Effects (4) = 10 assets
3. **Week 3**: Stat Icons (5) + Magic Effects (4) = 9 assets
4. **Week 4**: Skill Icons - Sword & Palm (8) = 8 assets
5. **Week 5**: Skill Icons - Arrow & Lightning (8) = 8 assets
6. **Week 6**: Item Icons - Common & Rare (8) = 8 assets
7. **Week 7**: Item Icons - Epic & Legendary (5) + Level Badges (4) = 9 assets
8. **Week 8**: Movement Effects (4) + Status Effects (4) = 8 assets

**Total**: 70 assets over 8 weeks (~9 assets/week)

---

## Related Documentation

- [SVG Asset Creation Guide](./svg-asset-creation-guide.md)
- [Validation and Preview Workflow](./svg-validation-preview-workflow.md)
