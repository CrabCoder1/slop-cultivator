-- Create person_types table
-- This table stores all Person Type definitions (both defenders and attackers)
CREATE TABLE person_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  
  -- Core combat stats (applicable to all roles)
  base_stats JSONB NOT NULL,
  
  -- Defender-specific configuration (optional)
  defender_config JSONB,
  
  -- Attacker-specific configuration (optional)
  attacker_config JSONB,
  
  -- Schema versioning for migrations
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by key
CREATE INDEX idx_person_types_key ON person_types(key);

-- Index for attacker queries (filtering by first appearance wave)
CREATE INDEX idx_person_types_attacker_first_appearance 
  ON person_types((attacker_config->>'firstAppearance'))
  WHERE attacker_config IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE person_types IS 'Stores Person Type definitions for all combat entities (defenders and attackers)';

-- Add comments to columns
COMMENT ON COLUMN person_types.key IS 'Unique identifier key (e.g., sword_cultivator, crimson_demon)';
COMMENT ON COLUMN person_types.base_stats IS 'JSON object: { health, damage, attackSpeed, range, movementSpeed }';
COMMENT ON COLUMN person_types.defender_config IS 'JSON object: { deploymentCost, compatibleSkills[], compatibleItems[] }';
COMMENT ON COLUMN person_types.attacker_config IS 'JSON object: { reward, spawnWeight, firstAppearance, difficulty }';
COMMENT ON COLUMN person_types.version IS 'Schema version for data migration support';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on person_types
CREATE TRIGGER update_person_types_updated_at
  BEFORE UPDATE ON person_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
