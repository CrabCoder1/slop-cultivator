-- Create composition system tables for cultivator composition
-- This migration creates the Species, Daos, Titles, Achievements, Player Profiles, and Player Achievements tables

-- ============================================================================
-- SPECIES TABLE
-- ============================================================================
-- Stores species definitions (biological/species types like Human, Demon, Beast)
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  
  -- Base physical stats: { health, movementSpeed }
  base_stats JSONB NOT NULL,
  
  -- Schema versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by key
CREATE INDEX idx_species_key ON species(key);

-- Add comments
COMMENT ON TABLE species IS 'Stores species definitions (biological types) for cultivators';
COMMENT ON COLUMN species.key IS 'Unique identifier key (e.g., human, demon, beast)';
COMMENT ON COLUMN species.base_stats IS 'JSON object: { health, movementSpeed }';

-- ============================================================================
-- DAOS TABLE
-- ============================================================================
-- Stores dao definitions (cultivation paths/martial disciplines)
CREATE TABLE daos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  
  -- Combat stats: { damage, attackSpeed, range, attackPattern }
  combat_stats JSONB NOT NULL,
  
  -- Array of compatible skill IDs
  compatible_skills JSONB NOT NULL DEFAULT '[]',
  
  -- Schema versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by key
CREATE INDEX idx_daos_key ON daos(key);

-- Add comments
COMMENT ON TABLE daos IS 'Stores dao definitions (cultivation paths/martial disciplines)';
COMMENT ON COLUMN daos.key IS 'Unique identifier key (e.g., sword_dao, palm_dao, lightning_dao)';
COMMENT ON COLUMN daos.combat_stats IS 'JSON object: { damage, attackSpeed, range, attackPattern }';
COMMENT ON COLUMN daos.compatible_skills IS 'JSON array of skill IDs compatible with this dao';

-- ============================================================================
-- TITLES TABLE
-- ============================================================================
-- Stores title definitions (achievement ranks providing stat bonuses)
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Stat bonuses: { healthMultiplier, damageMultiplier, attackSpeedMultiplier, rangeBonus, movementSpeedMultiplier }
  stat_bonuses JSONB NOT NULL DEFAULT '{}',
  
  -- Prestige level for UI sorting/display (1-10)
  prestige_level INTEGER NOT NULL DEFAULT 1,
  
  -- Schema versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_titles_key ON titles(key);
CREATE INDEX idx_titles_prestige ON titles(prestige_level);

-- Add comments
COMMENT ON TABLE titles IS 'Stores title definitions (achievement ranks with stat bonuses)';
COMMENT ON COLUMN titles.key IS 'Unique identifier key (e.g., palm_sage, sword_cultivator)';
COMMENT ON COLUMN titles.stat_bonuses IS 'JSON object: { healthMultiplier, damageMultiplier, attackSpeedMultiplier, rangeBonus, movementSpeedMultiplier }';
COMMENT ON COLUMN titles.prestige_level IS 'Prestige level for UI sorting (1-10)';

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
-- Stores achievement definitions with conditions and rewards
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Array of AchievementCondition objects
  conditions JSONB NOT NULL,
  
  -- Array of AchievementReward objects
  rewards JSONB NOT NULL DEFAULT '[]',
  
  -- Display order
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Schema versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_achievements_key ON achievements(key);
CREATE INDEX idx_achievements_sort ON achievements(sort_order);

-- Add comments
COMMENT ON TABLE achievements IS 'Stores achievement definitions with unlock conditions and rewards';
COMMENT ON COLUMN achievements.key IS 'Unique identifier key (e.g., wave_10_complete, first_blood)';
COMMENT ON COLUMN achievements.conditions IS 'JSON array of condition objects: [{ type, targetValue, comparisonOperator, isTrackable, progressLabel }]';
COMMENT ON COLUMN achievements.rewards IS 'JSON array of reward objects: [{ type, value, displayName }]';
COMMENT ON COLUMN achievements.sort_order IS 'Display order for UI';

-- ============================================================================
-- PLAYER PROFILES TABLE
-- ============================================================================
-- Stores player profile data including statistics and unlocked content
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  
  -- Player statistics: { totalGamesPlayed, highestWave, highestScore, totalEnemiesDefeated, totalCultivatorsDeployed }
  stats JSONB NOT NULL DEFAULT '{}',
  
  -- Unlocked content (arrays of IDs)
  unlocked_species JSONB NOT NULL DEFAULT '[]',
  unlocked_daos JSONB NOT NULL DEFAULT '[]',
  unlocked_titles JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by anonymous ID
CREATE INDEX idx_player_profiles_anonymous ON player_profiles(anonymous_id);

-- Add comments
COMMENT ON TABLE player_profiles IS 'Stores player profile data for anonymous players';
COMMENT ON COLUMN player_profiles.anonymous_id IS 'Browser-based anonymous identifier';
COMMENT ON COLUMN player_profiles.stats IS 'JSON object: { totalGamesPlayed, highestWave, highestScore, totalEnemiesDefeated, totalCultivatorsDeployed }';
COMMENT ON COLUMN player_profiles.unlocked_species IS 'JSON array of unlocked species IDs';
COMMENT ON COLUMN player_profiles.unlocked_daos IS 'JSON array of unlocked dao IDs';
COMMENT ON COLUMN player_profiles.unlocked_titles IS 'JSON array of unlocked title IDs';

-- ============================================================================
-- PLAYER ACHIEVEMENTS TABLE
-- ============================================================================
-- Stores player achievement progress and unlock status
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- Progress tracking: { "0": currentValue, "1": currentValue, ... } (condition index -> current value)
  progress JSONB NOT NULL DEFAULT '{}',
  
  -- Unlock status
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per player per achievement
  UNIQUE(player_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX idx_player_achievements_unlocked ON player_achievements(is_unlocked);

-- Add comments
COMMENT ON TABLE player_achievements IS 'Stores player achievement progress and unlock status';
COMMENT ON COLUMN player_achievements.progress IS 'JSON object mapping condition index to current progress value';
COMMENT ON COLUMN player_achievements.is_unlocked IS 'Whether the achievement has been unlocked';
COMMENT ON COLUMN player_achievements.unlocked_at IS 'Timestamp when achievement was unlocked';

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
-- Reuse the existing update_updated_at_column function

-- Create triggers for all new tables
CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daos_updated_at
  BEFORE UPDATE ON daos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_titles_updated_at
  BEFORE UPDATE ON titles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_achievements_updated_at
  BEFORE UPDATE ON player_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
