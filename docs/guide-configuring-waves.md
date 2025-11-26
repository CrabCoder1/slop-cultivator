# Guide: Configuring Waves

This guide explains how to create and configure wave compositions using the Admin Tool.

## What is a Wave Configuration?

A Wave Configuration defines which enemies spawn during a specific wave, including:
- Which Person Types appear
- How many of each type
- Spawn timing and intervals
- Spawn order and grouping

## Prerequisites

- Admin Tool running on port 5177 (`npm run dev:admin`)
- At least one Person Type with `attackerConfig` created
- Basic understanding of wave progression

## Default Wave Behavior

If no custom configuration exists for a wave, the game uses default generation:
- Total enemies: 5 + (wave × 2)
- Random selection from available attackers
- Weighted by spawn weight
- Respects first appearance wave numbers

Example:
- Wave 1: 7 enemies (5 + 1×2)
- Wave 5: 15 enemies (5 + 5×2)
- Wave 10: 25 enemies (5 + 10×2)

## Step-by-Step Guide

### 1. Open the Admin Tool

Navigate to `http://localhost:5177` and click on the "Waves" tab.

### 2. Select Wave Number

- Choose which wave to configure
- Can configure any wave number (1-999)
- Existing configurations shown in list
- Click "Create New" or select existing

### 3. Add Spawn Groups

A spawn group defines a set of enemies that spawn together.

#### Person Type Selection
- Dropdown shows only Person Types with `attackerConfig`
- Select the enemy type to spawn
- Can have multiple groups with same type

#### Spawn Count
- How many of this type to spawn
- Typical range: 1-20
- Higher counts for common enemies
- Lower counts for elite/boss enemies

#### Spawn Interval (milliseconds)
- Time between individual spawns in this group
- Typical range: 500-2000ms
- Faster intervals = more pressure
- Slower intervals = easier to handle
- Example: 1000ms = 1 enemy per second

#### Spawn Delay (milliseconds)
- Delay before first spawn in this group
- Typical range: 0-5000ms
- Use to stagger different groups
- Creates waves within waves
- Example: 2000ms = 2 second delay

### 4. Arrange Spawn Groups

- Add multiple groups for variety
- Reorder groups to control spawn sequence
- Remove groups that don't fit
- Preview total composition

### 5. Preview Wave Composition

The preview shows:
- Total enemy count
- Breakdown by type
- Estimated wave duration
- Difficulty indicators

### 6. Save Configuration

- Click "Save" to persist to Supabase
- Configuration immediately available in game
- Can edit anytime
- Can delete to revert to default

## Design Patterns

### Pattern 1: Simple Wave

Single enemy type, steady spawn rate.

```
Wave 3:
- Spawn Group 1:
  - Type: Goblin Raider
  - Count: 9
  - Interval: 1000ms
  - Delay: 0ms

Total: 9 enemies over 9 seconds
```

### Pattern 2: Mixed Wave

Multiple enemy types spawning together.

```
Wave 5:
- Spawn Group 1:
  - Type: Goblin Raider
  - Count: 10
  - Interval: 800ms
  - Delay: 0ms
  
- Spawn Group 2:
  - Type: Orc Warrior
  - Count: 5
  - Interval: 1500ms
  - Delay: 0ms

Total: 15 enemies, mixed composition
```

### Pattern 3: Staggered Wave

Groups spawn in sequence.

```
Wave 7:
- Spawn Group 1:
  - Type: Goblin Raider
  - Count: 8
  - Interval: 500ms
  - Delay: 0ms
  
- Spawn Group 2:
  - Type: Orc Warrior
  - Count: 6
  - Interval: 1000ms
  - Delay: 5000ms
  
- Spawn Group 3:
  - Type: Troll Berserker
  - Count: 3
  - Interval: 2000ms
  - Delay: 12000ms

Total: 17 enemies in 3 waves
First: Goblins (0-4s)
Second: Orcs (5-11s)
Third: Trolls (12-18s)
```

### Pattern 4: Boss Wave

Boss with supporting enemies.

```
Wave 10:
- Spawn Group 1:
  - Type: Goblin Raider
  - Count: 12
  - Interval: 600ms
  - Delay: 0ms
  
- Spawn Group 2:
  - Type: Demon Lord (Boss)
  - Count: 1
  - Interval: 0ms
  - Delay: 8000ms

Total: 13 enemies
Goblins spawn first, boss arrives after
```

### Pattern 5: Rush Wave

Fast, overwhelming spawn rate.

```
Wave 12:
- Spawn Group 1:
  - Type: Shadow Wraith
  - Count: 20
  - Interval: 300ms
  - Delay: 0ms

Total: 20 fast enemies in 6 seconds
High pressure, tests player defenses
```

## Balance Guidelines

### Enemy Count Progression

Recommended total enemies per wave:
- Waves 1-5: 7-15 enemies
- Waves 6-10: 15-25 enemies
- Waves 11-15: 25-35 enemies
- Waves 16-20: 35-50 enemies
- Waves 21+: 50+ enemies

### Spawn Rate

**Slow** (1500-2000ms interval)
- Gives player time to react
- Good for early waves
- Use for tough enemies

**Medium** (800-1200ms interval)
- Balanced pressure
- Good for mid-game
- Standard spawn rate

**Fast** (300-600ms interval)
- High pressure
- Use sparingly
- Good for rush waves

### Difficulty Curve

**Early Waves (1-5)**
- Single enemy type
- Slow to medium spawn rate
- Common difficulty enemies
- Focus on teaching mechanics

**Mid Waves (6-10)**
- Mixed enemy types
- Medium spawn rate
- Introduce uncommon/rare enemies
- Test player strategy

**Late Waves (11-15)**
- Complex compositions
- Varied spawn rates
- Elite enemies appear
- Require good defense setup

**End Game (16+)**
- Multiple staggered groups
- Boss enemies
- High enemy counts
- Ultimate challenge

## Advanced Techniques

### Composition Variety

Mix enemy types with different characteristics:
- Fast + Slow: Forces split attention
- Weak + Strong: Tests target prioritization
- Many + Few: Balances quantity vs quality

Example:
```
Wave 8:
- 15 Goblins (fast, weak)
- 5 Orcs (medium, medium)
- 2 Trolls (slow, strong)
```

### Timing Tricks

**Overlapping Spawns**
- Multiple groups with small delays
- Creates continuous pressure
- No breathing room for player

**Gap Spawns**
- Large delays between groups
- Gives player recovery time
- Builds tension before next wave

**Surprise Spawns**
- Boss spawns mid-wave
- Changes player strategy
- Keeps gameplay interesting

### Thematic Waves

**Goblin Horde** (Wave 4)
```
- 20 Goblin Raiders
- Fast spawn rate
- Overwhelming numbers
```

**Undead Rising** (Wave 7)
```
- 8 Skeleton Warriors
- 6 Zombies
- 3 Wraiths
- Staggered spawns
```

**Dragon Attack** (Wave 15)
```
- 1 Dragon (boss)
- 10 Dragonlings (support)
- Dragon spawns last
```

## Testing Your Wave

1. Save the wave configuration
2. Refresh the game (port 5173)
3. Play to the configured wave
4. Observe:
   - Spawn timing feels right?
   - Difficulty appropriate?
   - Composition interesting?
   - Player has fair chance?
5. Adjust and re-test

## Common Issues

### Wave too easy
- Increase enemy count
- Add tougher enemy types
- Reduce spawn intervals
- Add staggered elite enemies

### Wave too hard
- Decrease enemy count
- Use weaker enemy types
- Increase spawn intervals
- Remove elite enemies

### Wave boring
- Mix enemy types
- Vary spawn timing
- Add surprise elements
- Create mini-waves within wave

### Spawn timing off
- Adjust intervals
- Add/remove delays
- Test actual duration
- Consider player reaction time

## Validation

The system automatically validates wave configurations:

### Errors (Prevent Save)
- Person Type doesn't exist
- Person Type not an attacker
- Invalid spawn count (< 1)
- Invalid timing values (< 0)
- No spawn groups defined

### Warnings (Allow Save)
- Person Type appears before firstAppearance wave
- Very high enemy count
- Very fast spawn rate
- Unusual timing patterns

## Best Practices

1. **Start Simple**: Begin with single-type waves
2. **Test Frequently**: Play-test after each change
3. **Progressive Difficulty**: Gradually increase challenge
4. **Variety**: Mix enemy types and patterns
5. **Pacing**: Balance intense and calm waves
6. **Memorable Moments**: Create standout waves (boss, rush, etc.)
7. **Player Feedback**: Watch for frustration or boredom
8. **Iterate**: Refine based on testing

## Example Wave Progression

```
Wave 1: Tutorial
- 7 Goblins, slow spawn
- Teaches basic mechanics

Wave 2: Variety Introduction
- 5 Goblins, 4 Orcs
- Introduces second enemy type

Wave 3: Speed Test
- 12 Shadow Wraiths, fast spawn
- Tests reaction time

Wave 4: Tank Test
- 8 Trolls, slow spawn
- Tests sustained damage

Wave 5: Mini-Boss
- 10 Goblins, 1 Ogre
- First challenging wave

Wave 10: Mid-Boss
- 15 mixed enemies, 1 Demon
- Major difficulty spike

Wave 15: Late-Boss
- 20 mixed enemies, 1 Dragon
- Requires strong defense

Wave 20: Final Boss
- 30 mixed enemies, 2 Dragons
- Ultimate challenge
```

## Next Steps

- Read [Guide: Creating Person Types](guide-creating-person-types.md)
- Review [Database Schema Documentation](database-schema.md)
- Check [Migration Guide](people-race-system-migration.md)
- Experiment with different patterns
- Share successful configurations with team
