import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const projectId = 'rymuyfctxhlsyiiidpry';
const supabaseUrl = `https://${projectId}.supabase.co`;
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bXV5ZmN0eGhsc3lpaWlkcHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjE2MTQsImV4cCI6MjA3ODUzNzYxNH0.naDZmpcmyCATQFbP6H8UXjCf0y4QCH7aGOCz0mYb-Y0';

const supabase = createClient(supabaseUrl, publicAnonKey);

const migrations = [
  '20241120000001_setup_authentication_schema.sql',
  '20241123000001_improve_profile_trigger_error_handling.sql',
  '20241123000002_add_user_id_to_player_profiles.sql'
];

async function applyMigrations() {
  console.log('Starting migration application...\n');

  for (const migration of migrations) {
    const filePath = join(process.cwd(), 'supabase', 'migrations', migration);
    console.log(`Reading migration: ${migration}`);
    
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log(`Applying migration: ${migration}`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Failed to apply ${migration}:`, error);
      process.exit(1);
    }
    
    console.log(`✓ Successfully applied ${migration}\n`);
  }

  console.log('All migrations applied successfully!');
}

applyMigrations().catch(console.error);
