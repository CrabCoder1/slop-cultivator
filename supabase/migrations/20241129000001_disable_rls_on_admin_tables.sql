-- Disable RLS on admin-only tables
-- These tables are managed through the admin tool which uses service_role key
-- The service role key bypasses RLS, but we're explicitly disabling it for clarity

-- Composition system tables
ALTER TABLE species DISABLE ROW LEVEL SECURITY;
ALTER TABLE daos DISABLE ROW LEVEL SECURITY;
ALTER TABLE titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- Map configuration tables
ALTER TABLE maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE tile_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE map_wave_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE wave_configurations DISABLE ROW LEVEL SECURITY;

-- Person types (cultivator definitions)
ALTER TABLE person_types DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE species IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE daos IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE titles IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE achievements IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE maps IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE tile_types IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE map_wave_configs IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE wave_configurations IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
COMMENT ON TABLE person_types IS 'Admin-managed table: RLS disabled, access controlled via service_role key';
