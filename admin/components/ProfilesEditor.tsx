import { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../utils/supabase-admin-client';
import ProfilesList from './ProfilesList';
import ProfileDetails from './ProfileDetails';

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  provider_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilesEditor() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setProfiles(data || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProfile(profileId: string) {
    alert(
      '🔒 User Deletion Disabled\n\n' +
      'For security reasons, user deletion requires service_role key access, ' +
      'which cannot be safely exposed in a client-side admin tool.\n\n' +
      'To delete users:\n' +
      '1. Go to Supabase Dashboard\n' +
      '2. Navigate to Authentication > Users\n' +
      '3. Find the user and click Delete\n\n' +
      'This will cascade delete all associated data (profile, achievements, scores).'
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Profiles List */}
      <div className="w-96 border-r border-slate-700 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-amber-400">User Profiles</h2>
          <p className="text-slate-400 text-sm mt-1">
            {profiles.length} registered user{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Loading profiles...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 text-red-300 m-4 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ProfilesList
            profiles={profiles}
            selectedProfile={selectedProfile}
            onSelectProfile={setSelectedProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        )}
      </div>

      {/* Right Panel - Profile Details */}
      <div className="flex-1 overflow-auto">
        {selectedProfile ? (
          <ProfileDetails profile={selectedProfile} onRefresh={loadProfiles} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a profile to view details
          </div>
        )}
      </div>
    </div>
  );
}
