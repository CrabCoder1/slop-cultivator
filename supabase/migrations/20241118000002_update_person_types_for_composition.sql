-- Update person_types table to support composition system
-- This migration adds columns for species_id, dao_id, title_id references

-- ============================================================================
-- STEP 1: Add composition columns to person_types
-- ============================================================================

-- Add new columns for composition references
ALTER TABLE person_types 
  ADD COLUMN IF NOT EXISTS species_id UUID REFERENCES species(id),
  ADD COLUMN IF NOT EXISTS dao_id UUID REFERENCES daos(id),
  ADD COLUMN IF NOT EXISTS title_id UUID REFERENCES titles(id),
  ADD COLUMN IF NOT EXISTS equipped_skills JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS equipped_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'defender';

-- ============================================================================
-- STEP 2: Create indexes for composition columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_person_types_species ON person_types(species_id);
CREATE INDEX IF NOT EXISTS idx_person_types_dao ON person_types(dao_id);
CREATE INDEX IF NOT EXISTS idx_person_types_title ON person_types(title_id);
CREATE INDEX IF NOT EXISTS idx_person_types_role ON person_types(role);

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON COLUMN person_types.species_id IS 'Reference to species table (biological type)';
COMMENT ON COLUMN person_types.dao_id IS 'Reference to daos table (cultivation path)';
COMMENT ON COLUMN person_types.title_id IS 'Reference to titles table (rank/mastery level)';
COMMENT ON COLUMN person_types.equipped_skills IS 'JSON array of equipped skill IDs';
COMMENT ON COLUMN person_types.equipped_items IS 'JSON array of equipped item IDs';
COMMENT ON COLUMN person_types.role IS 'Entity role: defender or attacker';

