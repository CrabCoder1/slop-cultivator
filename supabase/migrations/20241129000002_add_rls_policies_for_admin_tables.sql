-- Add proper RLS policies for admin-managed tables
-- These tables should be:
-- - Readable by everyone (players need to fetch game configuration)
-- - Writable only by authenticated admin users
--
-- SECURITY NOTE: For production, admin writes should go through Edge Functions
-- that verify admin privileges. This migration allows direct writes for the
-- development admin tool.

-- ============================================================================
-- SPECIES TABLE
-- ============================================================================
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to species"
  ON species FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated write access to species"
  ON species FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- DAOS TABLE
-- ============================================================================
ALTER TABLE daos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to daos"
  ON daos FOR SELECT
  USING (true);

-- ============================================================================
-- TITLES TABLE
-- ============================================================================
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to titles"
  ON titles FOR SELECT
  USING (true);

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to achievements"
  ON achievements FOR SELECT
  USING (true);

-- ============================================================================
-- MAPS TABLE
-- ============================================================================
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to maps"
  ON maps FOR SELECT
  USING (true);

-- ============================================================================
-- TILE_TYPES TABLE
-- ============================================================================
ALTER TABLE tile_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tile_types"
  ON tile_types FOR SELECT
  USING (true);

-- ============================================================================
-- MAP_WAVE_CONFIGS TABLE
-- ============================================================================
ALTER TABLE map_wave_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to map_wave_configs"
  ON map_wave_configs FOR SELECT
  USING (true);

-- ============================================================================
-- WAVE_CONFIGURATIONS TABLE
-- ============================================================================
ALTER TABLE wave_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to wave_configurations"
  ON wave_configurations FOR SELECT
  USING (true);

-- ============================================================================
-- PERSON_TYPES TABLE
-- ============================================================================
ALTER TABLE person_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to person_types"
  ON person_types FOR SELECT
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE species IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE daos IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE titles IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE achievements IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE maps IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE tile_types IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE map_wave_configs IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE wave_configurations IS 'Game configuration table: Public read, service_role write';
COMMENT ON TABLE person_types IS 'Game configuration table: Public read, service_role write';
