-- Create wave_configurations table
-- This table stores wave composition data for enemy spawning
CREATE TABLE wave_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wave_number INTEGER NOT NULL UNIQUE,
  
  -- Array of spawn definitions
  -- Each spawn: { personTypeId, count, spawnInterval, spawnDelay }
  spawns JSONB NOT NULL,
  
  -- Schema versioning for migrations
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wave_number_positive CHECK (wave_number > 0),
  CONSTRAINT spawns_not_empty CHECK (jsonb_array_length(spawns) > 0)
);

-- Index for quick lookups by wave number
CREATE INDEX idx_wave_configurations_wave_number ON wave_configurations(wave_number);

-- Add comment to table
COMMENT ON TABLE wave_configurations IS 'Stores wave composition data defining which Person Types spawn as enemies';

-- Add comments to columns
COMMENT ON COLUMN wave_configurations.wave_number IS 'The wave number this configuration applies to (must be unique)';
COMMENT ON COLUMN wave_configurations.spawns IS 'JSON array of spawn definitions: [{ personTypeId, count, spawnInterval, spawnDelay }]';
COMMENT ON COLUMN wave_configurations.version IS 'Schema version for data migration support';

-- Create trigger to automatically update updated_at on wave_configurations
CREATE TRIGGER update_wave_configurations_updated_at
  BEFORE UPDATE ON wave_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate person type references in spawns
CREATE OR REPLACE FUNCTION validate_wave_spawns()
RETURNS TRIGGER AS $$
DECLARE
  spawn_item JSONB;
  person_type_id TEXT;
BEGIN
  -- Iterate through each spawn in the spawns array
  FOR spawn_item IN SELECT * FROM jsonb_array_elements(NEW.spawns)
  LOOP
    person_type_id := spawn_item->>'personTypeId';
    
    -- Check if the referenced person type exists
    IF NOT EXISTS (
      SELECT 1 FROM person_types WHERE id::TEXT = person_type_id
    ) THEN
      RAISE EXCEPTION 'Invalid personTypeId reference: %', person_type_id;
    END IF;
    
    -- Validate that count is positive
    IF (spawn_item->>'count')::INTEGER <= 0 THEN
      RAISE EXCEPTION 'Spawn count must be positive';
    END IF;
    
    -- Validate that spawnInterval is non-negative
    IF (spawn_item->>'spawnInterval')::INTEGER < 0 THEN
      RAISE EXCEPTION 'Spawn interval must be non-negative';
    END IF;
    
    -- Validate that spawnDelay is non-negative
    IF (spawn_item->>'spawnDelay')::INTEGER < 0 THEN
      RAISE EXCEPTION 'Spawn delay must be non-negative';
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate spawns before insert or update
CREATE TRIGGER validate_wave_configurations_spawns
  BEFORE INSERT OR UPDATE ON wave_configurations
  FOR EACH ROW
  EXECUTE FUNCTION validate_wave_spawns();
