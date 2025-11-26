# Cultivator Composition System - Developer Guide

## Overview

The Cultivator Composition System is a flexible architecture that allows cultivators to be built from independent, reusable components rather than monolithic entities. This enables rich character combinations and easier content management.

## Architecture

### Core Concept

Instead of defining cultivators as single entities with all attributes inline, cultivators are now **composed** of:

1. **Species** - Biological/racial type (e.g., Human, Demon, Beast)
2. **Dao** - Cultivation path/combat style (e.g., Sword Dao, Palm Dao)
3. **Title** - Achievement rank with stat bonuses (e.g., Palm Sage, Sword Master)
4. **Skills** - Equipped abilities (up to 3)
5. **Equipment** - Equipped items (up to 3)

### Benefits

- **Flexibility**: Any species can follow any dao and hold any title
- **Reusability**: Create one species, use it with multiple daos
- **Maintainability**: Update a dao's stats, all cultivators using it inherit the change
- **Content Variety**: Exponential combinations from linear content creation

## Database Schema

### New Tables

#### `species`
Defines biological/racial characteristics and base physical stats.

```sql
CREATE TABLE species (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  base_stats JSONB NOT NULL, -- { health, movementSpeed }
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `daos`
Defines cultivation paths and combat characteristics.

```sql
CREATE TABLE daos (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  combat_stats JSONB NOT NULL, -- { damage, attackSpeed, range, attackPattern }
  compatible_skills JSONB NOT NULL, -- Array of skill IDs
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `titles`
Defines achievement ranks with stat multipliers and bonuses.

```sql
CREATE TABLE titles (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  stat_bonuses JSONB NOT NULL, -- { healthMultiplier, damageMultiplier, etc. }
  prestige_level INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `achievements`
Defines player achievements with unlock conditions and rewards.

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  conditions JSONB NOT NULL, -- Array of AchievementCondition
  rewards JSONB NOT NULL, -- Array of AchievementReward
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `player_profiles`
Stores player statistics and unlocked content.

```sql
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY,
  anonymous_id TEXT UNIQUE NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}',
  unlocked_species JSONB NOT NULL DEFAULT '[]',
  unlocked_daos JSONB NOT NULL DEFAULT '[]',
  unlocked_titles JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `player_achievements`
Tracks player achievement progress and unlocks.

```sql
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);
```

### Updated Table

#### `person_types`
Now references composition components instead of storing all attributes inline.

```sql
ALTER TABLE person_types 
  ADD COLUMN species_id UUID REFERENCES species(id),
  ADD COLUMN dao_id UUID REFERENCES daos(id),
  ADD COLUMN title_id UUID REFERENCES titles(id),
  ADD COLUMN equipped_skills JSONB DEFAULT '[]',
  ADD COLUMN equipped_items JSONB DEFAULT '[]',
  ADD COLUMN role TEXT NOT NULL DEFAULT 'defender';
```

## Creating Content

### Creating a Species

**Admin Tool**: Navigate to the "Species" tab

1. Click "+ New Species"
2. Fill in the form:
   - **Name**: Display name (e.g., "Human")
   - **Key**: Unique identifier (e.g., "human")
   - **Emoji**: Visual representation (e.g., "🧑")
   - **Description**: Short description
   - **Lore**: Optional backstory
   - **Base Health**: Starting HP (e.g., 100)
   - **Movement Speed**: Pixels per frame (e.g., 1.5)
3. Click "Save"

**Example Species**:
```typescript
{
  key: "human",
  name: "Human",
  emoji: "🧑",
  description: "Versatile and adaptable",
  lore: "Humans are the most common cultivators...",
  baseStats: {
    health: 100,
    movementSpeed: 1.5
  }
}
```

### Creating a Dao

**Admin Tool**: Navigate to the "Daos" tab

1. Click "+ New Dao"
2. Fill in the form:
   - **Name**: Display name (e.g., "Sword Dao")
   - **Key**: Unique identifier (e.g., "sword_dao")
   - **Emoji**: Visual representation (e.g., "⚔️")
   - **Description**: Short description
   - **Lore**: Optional backstory
   - **Damage**: Base damage per attack (e.g., 20)
   - **Attack Speed**: Milliseconds between attacks (e.g., 1000)
   - **Range**: Attack range in pixels (e.g., 50)
   - **Attack Pattern**: "melee", "ranged", or "aoe"
   - **Compatible Skills**: Select from available skills
3. Click "Save"

**Example Dao**:
```typescript
{
  key: "sword_dao",
  name: "Sword Dao",
  emoji: "⚔️",
  description: "Masters of blade combat",
  lore: "The Sword Dao emphasizes precision...",
  combatStats: {
    damage: 20,
    attackSpeed: 1000,
    range: 50,
    attackPattern: "melee"
  },
  compatibleSkills: ["skill_id_1", "skill_id_2"]
}
```

### Creating a Title

**Admin Tool**: Navigate to the "Titles" tab

1. Click "+ New Title"
2. Fill in the form:
   - **Name**: Display name (e.g., "Sword Master")
   - **Key**: Unique identifier (e.g., "sword_master")
   - **Emoji**: Visual representation (e.g., "🗡️")
   - **Description**: Short description
   - **Health Multiplier**: e.g., 1.2 = +20% health
   - **Damage Multiplier**: e.g., 1.5 = +50% damage
   - **Attack Speed Multiplier**: e.g., 0.8 = 20% faster
   - **Range Bonus**: Flat bonus in pixels (e.g., 10)
   - **Movement Speed Multiplier**: e.g., 1.1 = +10% speed
   - **Prestige Level**: 1-10 for sorting
3. Click "Save"

**Example Title**:
```typescript
{
  key: "sword_master",
  name: "Sword Master",
  emoji: "🗡️",
  description: "A true master of the blade",
  statBonuses: {
    healthMultiplier: 1.2,
    damageMultiplier: 1.5,
    attackSpeedMultiplier: 0.8,
    rangeBonus: 10,
    movementSpeedMultiplier: 1.0
  },
  prestigeLevel: 5
}
```

### Creating an Achievement

**Admin Tool**: Navigate to the "Achievements" tab

1. Click "+ New Achievement"
2. Fill in the form:
   - **Name**: Display name (e.g., "Wave Master")
   - **Key**: Unique identifier (e.g., "wave_10_complete")
   - **Emoji**: Visual representation (e.g., "🏆")
   - **Description**: What the player accomplished
   - **Sort Order**: Display order (lower = earlier)
3. Add conditions using the Condition Builder:
   - **Type**: wave_complete, enemy_defeat_count, score_threshold, etc.
   - **Target Value**: The value to reach
   - **Comparison**: equals, greater_than, less_than, greater_or_equal
   - **Trackable**: Show progress to player?
   - **Progress Label**: e.g., "Waves Completed"
4. Add rewards using the Reward Builder:
   - **Type**: unlock_species, unlock_dao, unlock_title, grant_qi, unlock_cosmetic
   - **Value**: ID for unlocks, amount for currency
   - **Display Name**: For UI display
5. Click "Save"

**Example Achievement**:
```typescript
{
  key: "wave_10_complete",
  name: "Wave Master",
  emoji: "🏆",
  description: "Complete wave 10",
  conditions: [
    {
      type: "wave_complete",
      targetValue: 10,
      comparisonOperator: "greater_or_equal",
      isTrackable: true,
      progressLabel: "Waves Completed"
    }
  ],
  rewards: [
    {
      type: "unlock_species",
      value: "demon_species_id",
      displayName: "Unlock Demon Species"
    },
    {
      type: "grant_qi",
      value: 1000,
      displayName: "1000 Qi"
    }
  ],
  sortOrder: 10
}
```

## Stat Calculation

### Composition Formula

Final cultivator stats are calculated by combining components:

```typescript
// 1. Start with species base stats
health = species.baseStats.health
movementSpeed = species.baseStats.movementSpeed

// 2. Add dao combat stats
damage = dao.combatStats.damage
attackSpeed = dao.combatStats.attackSpeed
range = dao.combatStats.range

// 3. Apply title multipliers and bonuses
if (title.statBonuses.healthMultiplier) {
  health *= title.statBonuses.healthMultiplier
}
if (title.statBonuses.damageMultiplier) {
  damage *= title.statBonuses.damageMultiplier
}
if (title.statBonuses.attackSpeedMultiplier) {
  attackSpeed *= title.statBonuses.attackSpeedMultiplier
}
if (title.statBonuses.rangeBonus) {
  range += title.statBonuses.rangeBonus
}
if (title.statBonuses.movementSpeedMultiplier) {
  movementSpeed *= title.statBonuses.movementSpeedMultiplier
}
```

### Example Calculation

**Components**:
- Species: Human (100 HP, 1.5 movement)
- Dao: Sword Dao (20 damage, 1000ms attack speed, 50 range)
- Title: Sword Master (1.2x health, 1.5x damage, 0.8x attack speed, +10 range)

**Result**:
- Health: 100 × 1.2 = **120 HP**
- Damage: 20 × 1.5 = **30 damage**
- Attack Speed: 1000 × 0.8 = **800ms** (faster)
- Range: 50 + 10 = **60 pixels**
- Movement Speed: 1.5 × 1.0 = **1.5 pixels/frame**

## Player Profile System

### Anonymous Identification

Players are identified using a browser-based anonymous ID stored in localStorage:

```typescript
// Generate on first visit
const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('player_anonymous_id', anonymousId);
```

### Profile Creation

On first game session, a player profile is automatically created:

```typescript
const profile = await loadOrCreatePlayerProfile();
// Returns existing profile or creates new one
```

### Tracking Statistics

Player stats are updated throughout gameplay:

```typescript
await updatePlayerStats(playerId, {
  totalGamesPlayed: stats.totalGamesPlayed + 1,
  highestWave: Math.max(stats.highestWave, currentWave),
  highestScore: Math.max(stats.highestScore, currentScore),
  totalEnemiesDefeated: stats.totalEnemiesDefeated + enemiesKilled,
  totalCultivatorsDeployed: stats.totalCultivatorsDeployed + cultivatorsDeployed
});
```

### Unlocking Content

When achievements grant rewards, content is unlocked:

```typescript
await unlockContent(playerId, {
  species: ['demon_species_id'],
  daos: ['lightning_dao_id'],
  titles: ['master_title_id']
});
```

## Achievement System

### Condition Types

Available condition types:

- **wave_complete**: Check current wave number
- **enemy_defeat_count**: Total enemies defeated
- **cultivator_deploy_count**: Total cultivators deployed
- **score_threshold**: Current score
- **castle_health_preserved**: Castle health percentage
- **win_without_damage**: Castle at full health after wave

### Evaluation Flow

1. **Wave End**: Achievement evaluation triggers
2. **Check Conditions**: All conditions must be met (AND logic)
3. **Update Progress**: Trackable conditions show progress
4. **Unlock**: If all conditions met, mark as unlocked
5. **Show Popup**: Display achievement notification
6. **Grant Rewards**: Apply rewards to player profile
7. **Persist**: Save to database

### Progress Tracking

For trackable conditions, progress is stored per condition:

```typescript
playerAchievement.progress = {
  "0": 7,  // Condition 0: 7/10 waves completed
  "1": 45  // Condition 1: 45/50 enemies defeated
}
```

## Code Examples

### Using Composition Service

```typescript
import { composeCultivatorStats } from '@/utils/cultivator-composition-service';

// Load components
const species = await getSpeciesByKey('human');
const dao = await getDaoByKey('sword_dao');
const title = await getTitleByKey('sword_master');

// Compose stats
const stats = composeCultivatorStats(species, dao, title);
// Returns: { health, damage, attackSpeed, range, movementSpeed, emoji, displayName }
```

### Evaluating Achievements

```typescript
import { evaluateAchievements } from '@/utils/achievement-service';

// At wave end
const gameState = {
  currentWave: 10,
  score: 5000,
  castleHealth: 80,
  maxCastleHealth: 100,
  totalEnemiesDefeated: 45,
  cultivatorsDeployed: 8
};

const { newlyUnlocked, updatedProgress } = evaluateAchievements(
  achievements,
  playerAchievements,
  gameState
);

// Show popups for newly unlocked
for (const achievement of newlyUnlocked) {
  showAchievementPopup(achievement);
  await grantRewards(playerId, achievement.rewards);
}

// Save progress
for (const [achievementId, playerAchievement] of updatedProgress) {
  await savePlayerAchievement(playerAchievement);
}
```

### Loading Player Profile

```typescript
import { loadOrCreatePlayerProfile } from '@/utils/player-profile-service';

// On game start
const profile = await loadOrCreatePlayerProfile();

// Use profile data
const unlockedSpecies = profile.unlockedSpecies;
const highestWave = profile.stats.highestWave;
```

## Best Practices

### Species Design

- Keep base stats moderate - titles provide the power scaling
- Focus on thematic differences (fast vs tanky, etc.)
- Use clear, recognizable emojis
- Write engaging lore to build world

### Dao Design

- Each dao should feel distinct in combat
- Balance damage with attack speed and range
- Limit compatible skills to maintain dao identity
- Consider synergies with different species

### Title Design

- Use multipliers for percentage bonuses (1.2 = +20%)
- Use flat bonuses sparingly (range bonus, etc.)
- Higher prestige = stronger bonuses
- Make titles feel like meaningful progression

### Achievement Design

- Start with simple, achievable goals
- Use trackable conditions for long-term goals
- Provide meaningful rewards (unlocks > currency)
- Create achievement chains (Bronze → Silver → Gold)
- Balance difficulty with reward value

### Performance

- Cache loaded species/daos/titles in memory
- Batch achievement progress updates
- Use database indexes for lookups
- Lazy load player achievements

### Testing

- Test stat calculations with edge cases
- Verify skill compatibility validation
- Test achievement condition evaluation
- Test profile persistence across sessions
- Test reward distribution

## Troubleshooting

### Missing Component References

**Problem**: PersonType references species_id that doesn't exist

**Solution**: 
1. Check if species was deleted
2. Verify foreign key constraints
3. Use admin tool to reassign valid species

### Stat Calculation Issues

**Problem**: Cultivator stats seem incorrect

**Solution**:
1. Verify species base stats
2. Check dao combat stats
3. Confirm title multipliers are applied
4. Use `composeCultivatorStats()` directly to debug

### Achievement Not Unlocking

**Problem**: Conditions met but achievement not unlocking

**Solution**:
1. Check all conditions (must all be true)
2. Verify comparison operators
3. Check if already unlocked
4. Review game state values passed to evaluator

### Profile Not Persisting

**Problem**: Player progress lost between sessions

**Solution**:
1. Check localStorage for anonymous_id
2. Verify Supabase connection
3. Check browser console for errors
4. Ensure profile saves after updates

## Migration Notes

See `MIGRATION_GUIDE.md` for detailed migration instructions from the old person_types system to the composition system.

## API Reference

### Composition Service

- `composeCultivatorStats(species, dao, title)` - Calculate final stats
- `validateSkillCompatibility(skills, dao)` - Check skill compatibility
- `validateComposition(species, dao, title)` - Validate all components exist

### Player Profile Service

- `loadOrCreatePlayerProfile()` - Get or create player profile
- `updatePlayerStats(playerId, stats)` - Update player statistics
- `unlockContent(playerId, content)` - Unlock species/daos/titles
- `loadPlayerAchievements(playerId)` - Get player achievement progress
- `updateAchievementProgress(playerId, achievementId, progress)` - Update progress
- `unlockAchievement(playerId, achievementId)` - Mark achievement unlocked

### Achievement Service

- `evaluateAchievements(achievements, playerAchievements, gameState)` - Check conditions
- `grantRewards(playerId, rewards)` - Apply achievement rewards
- `getConditionValue(type, gameState)` - Extract condition value from state
- `compareValues(current, target, operator)` - Compare with operator

## Further Reading

- `database-schema.md` - Complete database schema documentation
- `MIGRATION_GUIDE.md` - Migration from old to new system
- `design.md` - Original design document
- `requirements.md` - System requirements
