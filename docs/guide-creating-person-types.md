# Guide: Creating New Person Types

This guide walks you through creating new Person Types for Slop Cultivator using the Admin Tool.

## What is a Person Type?

A Person Type is a template that defines the characteristics, abilities, and visual representation of an entity in the game. Person Types can serve as:
- **Defenders**: Units controlled by the player to protect the castle
- **Attackers**: Enemies that spawn in waves
- **Both**: Some Person Types can be configured for either role

## Prerequisites

- Admin Tool running on port 5177 (`npm run dev:admin`)
- Supabase connection configured
- Basic understanding of game stats and balance

## Step-by-Step Guide

### 1. Open the Admin Tool

Navigate to `http://localhost:5177` and click on the "Cultivators" tab.

### 2. Click "Create New Person Type"

This opens the Person Type editor form.

### 3. Fill in Basic Information

#### Key (Required)
- Unique identifier (e.g., `fire_mage`, `ice_golem`)
- Use snake_case format
- Cannot be changed after creation
- Must be unique across all Person Types

#### Name (Required)
- Display name shown in game (e.g., "Fire Mage", "Ice Golem")
- Can contain spaces and special characters
- Should be descriptive and memorable

#### Emoji (Required)
- Visual representation in game
- Single emoji character
- Choose something that represents the type well
- Examples: 🔥 for fire, ❄️ for ice, 🗡️ for sword

#### Description (Required)
- Short description (1-2 sentences)
- Explains the type's role or specialty
- Shown in tooltips and selection screens

#### Lore (Optional)
- Backstory or flavor text
- Can be longer and more detailed
- Adds depth to the game world

### 4. Set Base Stats

These stats apply to all instances of this Person Type, regardless of role.

#### Health
- Hit points before defeat
- Typical range: 50-300
- Higher for tanks, lower for glass cannons
- Example: 100 for balanced, 200 for tank, 60 for fragile

#### Damage
- Damage dealt per attack
- Typical range: 10-50
- Higher for damage dealers, lower for support
- Example: 20 for balanced, 40 for high damage, 10 for support

#### Attack Speed (milliseconds)
- Time between attacks
- Lower = faster attacks
- Typical range: 500-2000ms
- Example: 1000ms = 1 attack per second

#### Range (pixels)
- Attack range
- Typical range: 30-150 pixels
- 30px = 1 tile, 90px = 3 tiles
- Melee: 30-60px, Ranged: 90-150px

#### Movement Speed (pixels per frame)
- How fast the entity moves
- Typical range: 0.5-2.0
- Higher = faster movement
- Example: 1.0 for balanced, 1.5 for fast, 0.7 for slow

### 5. Choose Role Configuration

Select whether this Person Type can be a Defender, Attacker, or both.

#### Defender Configuration

Enable if this type can be deployed by the player.

**Deployment Cost**
- Qi cost to deploy
- Typical range: 50-200
- Higher cost = more powerful
- Example: 50 for basic, 100 for advanced, 150 for elite

**Compatible Skills**
- List of skill IDs this type can learn
- Select from available skills
- Maximum 3 skills can be equipped at once
- Choose skills that fit the type's theme

**Compatible Items**
- List of item IDs this type can equip
- Select from available items
- Maximum 3 items can be equipped at once
- Choose items that complement the type's strengths

#### Attacker Configuration

Enable if this type can spawn as an enemy.

**Reward**
- Qi reward for defeating this enemy
- Typical range: 10-100
- Higher for tougher enemies
- Example: 20 for common, 50 for elite, 100 for boss

**Spawn Weight**
- Relative probability of spawning (1-10)
- Higher = more common
- Example: 5 for common, 3 for uncommon, 1 for rare

**First Appearance**
- Wave number when this type first appears
- Typical range: 1-20
- Example: 1 for early game, 5 for mid game, 10+ for late game

**Difficulty**
- Visual indicator of threat level
- Options: common, uncommon, rare, elite, boss
- Affects UI color coding
- Choose based on overall power level

### 6. Review and Save

- Double-check all values
- Ensure stats are balanced
- Click "Save" to persist to Supabase
- Person Type is immediately available in game

## Balance Guidelines

### Defender Balance

**Cost vs Power**
- DPS (Damage Per Second) = (Damage × 1000) / Attack Speed
- Cost per DPS should be roughly consistent
- Example: 50 cost → ~1.0 DPS, 100 cost → ~2.0 DPS

**Role Specialization**
- Tank: High health, low damage, low cost
- DPS: Medium health, high damage, medium cost
- Support: Low health, medium damage, high cost (if has special abilities)

**Range vs Damage**
- Longer range should have lower DPS
- Melee (30-60px): Higher DPS
- Ranged (90-150px): Lower DPS

### Attacker Balance

**Health vs Reward**
- More health = higher reward
- Reward should be ~20-30% of health value
- Example: 100 health → 20-30 reward

**Speed vs Health**
- Faster enemies should have less health
- Slower enemies should have more health
- Maintains time-to-kill balance

**Wave Scaling**
- Early waves (1-5): 50-100 health
- Mid waves (6-10): 100-200 health
- Late waves (11+): 200-300+ health

## Examples

### Example 1: Melee Defender

```
Key: berserker_warrior
Name: Berserker Warrior
Emoji: 🪓
Description: Fierce melee fighter with high damage and health
Lore: Warriors who channel rage into devastating attacks

Base Stats:
- Health: 150
- Damage: 30
- Attack Speed: 1200ms
- Range: 45px (1.5 tiles)
- Movement Speed: 1.2

Defender Config:
- Deployment Cost: 100
- Compatible Skills: [rage, bloodlust, iron_skin]
- Compatible Items: [battle_axe, berserker_helm, rage_ring]
```

### Example 2: Ranged Defender

```
Key: frost_archer
Name: Frost Archer
Emoji: 🏹
Description: Long-range archer with ice-infused arrows
Lore: Masters of the frozen north who slow enemies with every shot

Base Stats:
- Health: 80
- Damage: 25
- Attack Speed: 1500ms
- Range: 120px (4 tiles)
- Movement Speed: 1.0

Defender Config:
- Deployment Cost: 120
- Compatible Skills: [ice_shot, multishot, piercing_arrow]
- Compatible Items: [frost_bow, quiver_of_ice, eagle_eye]
```

### Example 3: Common Attacker

```
Key: goblin_raider
Name: Goblin Raider
Emoji: 👺
Description: Fast but weak goblin warrior
Lore: Greedy goblins drawn by the castle's treasures

Base Stats:
- Health: 60
- Damage: 10
- Attack Speed: 1000ms
- Range: 30px
- Movement Speed: 1.3

Attacker Config:
- Reward: 15
- Spawn Weight: 7
- First Appearance: 1
- Difficulty: common
```

### Example 4: Boss Attacker

```
Key: demon_lord
Name: Demon Lord
Emoji: 😈
Description: Powerful demon commander with devastating attacks
Lore: Ancient demon lord awakened to lead the invasion

Base Stats:
- Health: 400
- Damage: 50
- Attack Speed: 1800ms
- Range: 60px
- Movement Speed: 0.6

Attacker Config:
- Reward: 150
- Spawn Weight: 1
- First Appearance: 15
- Difficulty: boss
```

## Testing Your Person Type

### As Defender
1. Save the Person Type in Admin Tool
2. Refresh the game (port 5173)
3. Start a new game
4. Check if your type appears in random cultivator selection
5. Deploy and test combat behavior
6. Verify stats and abilities work correctly

### As Attacker
1. Save the Person Type in Admin Tool
2. Create a Wave Configuration that includes it (see Wave Configuration guide)
3. Refresh the game
4. Play to the configured wave
5. Verify enemy spawns correctly
6. Check combat behavior and difficulty

## Common Issues

### Person Type not appearing in game
- Check Supabase connection
- Verify Person Type saved successfully
- Clear browser cache and refresh
- Check browser console for errors

### Stats seem unbalanced
- Compare to existing Person Types
- Calculate DPS and cost ratios
- Test in actual gameplay
- Adjust and re-save

### Skills/Items not working
- Verify skill/item IDs are correct
- Check compatibility lists
- Ensure skills/items exist in game
- Test with different combinations

## Advanced Tips

### Dual-Role Person Types
- Configure both Defender and Attacker configs
- Enables same type as ally or enemy
- Useful for faction-based gameplay
- Example: Mercenary that can be hired or fought

### Themed Sets
- Create multiple related Person Types
- Share visual theme (emojis, names)
- Complementary abilities
- Example: Fire Mage, Fire Knight, Fire Elemental

### Progression Design
- Design types for different game stages
- Early: Simple, low stats
- Mid: Specialized roles
- Late: Complex, high stats
- Ensures smooth difficulty curve

## Next Steps

- Read [Guide: Configuring Waves](guide-configuring-waves.md)
- Review [Database Schema Documentation](database-schema.md)
- Check [Migration Guide](people-race-system-migration.md)
- Explore existing Person Types in Admin Tool
