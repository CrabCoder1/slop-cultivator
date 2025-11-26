-- Create map_wave_configs table for map-specific wave configuration
-- This replaces the global wave_configurations approach with per-map settings

CREATE TABLE map_wave_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL,
  
  -- Spend limit configuration
  wave1_spend_limit INTEGER NOT NULL DEFAULT 100,
  enemies_per_wave INTEGER NOT NULL DEFAULT 10,
  growth_curve_type TEXT NOT NULL DEFAULT 'linear',
  
  -- Enemy allowlist (JSONB array of person_type IDs)
  allowed_enemy_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one config per map
  UNIQUE(map_id)
);

-- Create indexes for performance
CREATE INDEX idx_map_wave_configs_map_id ON map_wave_configs(map_id);

-- Add comments for documentation
COMMENT ON TABLE map_wave_configs IS 'Map-specific wave configuration with spend limits and growth curves';
COMMENT ON COLUMN map_wave_configs.wave1_spend_limit IS 'Starting spend limit for wave 1 (10-10000)';
COMMENT ON COLUMN map_wave_configs.enemies_per_wave IS 'Target number of enemies per wave (1-100)';
COMMENT ON COLUMN map_wave_configs.growth_curve_type IS 'Growth curve type: linear, exponential, or logarithmic';
COMMENT ON COLUMN map_wave_configs.allowed_enemy_ids IS 'JSONB array of person_type IDs allowed to spawn on this map';

-- Row Level Security (RLS) policies
ALTER TABLE map_wave_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (game needs to fetch wave configs)
CREATE POLICY "Allow public read access"
ON map_wave_configs FOR SELECT
USING (true);

-- Allow authenticated users to insert/update/delete (admin access)
-- Note: In production, you may want to restrict this to specific admin roles
CREATE POLICY "Allow authenticated write access"
ON map_wave_configs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
