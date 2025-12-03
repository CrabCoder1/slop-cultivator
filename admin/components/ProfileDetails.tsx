// App: Admin

import { useState, useEffect } from 'react';
import { supabase } from '../../game/utils/supabase/client';
import { UserProfile } from './ProfilesEditor';

interface ProfileDetailsProps {
  profile: UserProfile;
  onRefresh: () => void;
}

interface Achievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: any;
  is_unlocked: boolean;
  achievements: {
    key: string;
    name: string;
    emoji: string;
  };
}

interface LeaderboardScore {
  id: string;
  score: number;
  wave_reached: number;
  player_name: string;
  created_at: string;
}

interface PlayerProfile {
  id: string;
  anonymous_id: string | null;
  stats: any;
  unlocked_species: string[];
  unlocked_daos: string[];
  unlocked_titles: string[];
  created_at: string;
  updated_at: string;
}

export default function ProfileDetails({ profile, onRefresh }: ProfileDetailsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scores, setScores] = useState<LeaderboardScore[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [profile.id]);

  async function loadProfileData() {
    try {
      setLoading(true);

      // Load player profile first
      const { data: playerProfileData } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      setPlayerProfile(playerProfileData);

      // Load achievements through player_achievements junction table
      if (playerProfileData) {
        const { data: achievementsData } = await supabase
          .from('player_achievements')
          .select(`
            id,
            achievement_id,
            unlocked_at,
            progress,
            is_unlocked,
            achievements (
              key,
              name,
              emoji
            )
          `)
          .eq('player_id', playerProfileData.id)
          .eq('is_unlocked', true)
          .order('unlocked_at', { ascending: false });

        setAchievements(achievementsData || []);
      }

      // Load leaderboard scores
      const { data: scoresData } = await supabase
        .from('leaderboard_scores')
        .select('*')
        .eq('user_id', profile.id)
        .order('score', { ascending: false })
        .limit(10);

      setScores(scoresData || []);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-400">
              {profile.display_name || profile.username || 'Unknown User'}
            </h2>
            {profile.username && (
              <p className="text-slate-400 mt-1">@{profile.username}</p>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-slate-500">User ID:</span>
                <span className="text-slate-300 font-mono text-xs">{profile.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500">Provider:</span>
                <span className="text-slate-300">{profile.provider || 'Unknown'}</span>
              </div>
              {profile.provider_id && (
                <div className="flex gap-2">
                  <span className="text-slate-500">Provider ID:</span>
                  <span className="text-slate-300 font-mono text-xs">{profile.provider_id}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-slate-500">Joined:</span>
                <span className="text-slate-300">{formatDate(profile.created_at)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500">Last Updated:</span>
                <span className="text-slate-300">{formatDate(profile.updated_at)}</span>
              </div>
            </div>
          </div>
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username || 'User avatar'}
              className="w-20 h-20 rounded-full border-2 border-amber-500"
            />
          )}
        </div>
      </div>

      {/* Player Profile Stats */}
      {playerProfile && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-amber-400 mb-4">Game Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-sm">Profile Created</p>
              <p className="text-slate-200 font-semibold">{formatDate(playerProfile.created_at)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Last Updated</p>
              <p className="text-slate-200 font-semibold">{formatDate(playerProfile.updated_at)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Unlocked Species</p>
              <p className="text-slate-200 font-semibold">{playerProfile.unlocked_species?.length || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Unlocked Daos</p>
              <p className="text-slate-200 font-semibold">{playerProfile.unlocked_daos?.length || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Unlocked Titles</p>
              <p className="text-slate-200 font-semibold">{playerProfile.unlocked_titles?.length || 0}</p>
            </div>
            {playerProfile.stats && Object.keys(playerProfile.stats).length > 0 && (
              <div className="col-span-2">
                <p className="text-slate-500 text-sm mb-2">Stats</p>
                <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(playerProfile.stats, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">
          Achievements ({achievements.length})
        </h3>
        {!playerProfile ? (
          <p className="text-slate-500">No player profile found</p>
        ) : achievements.length === 0 ? (
          <p className="text-slate-500">No achievements unlocked yet</p>
        ) : (
          <div className="space-y-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-slate-900 p-3 rounded border border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.achievements.emoji}</span>
                    <div>
                      <p className="text-slate-300 font-semibold">
                        {achievement.achievements.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {achievement.achievements.key}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Unlocked {formatDate(achievement.unlocked_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Scores */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">
          Top Scores ({scores.length})
        </h3>
        {scores.length === 0 ? (
          <p className="text-slate-500">No scores recorded yet</p>
        ) : (
          <div className="space-y-2">
            {scores.map((score, index) => (
              <div
                key={score.id}
                className="bg-slate-900 p-3 rounded border border-slate-700 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold text-lg">#{index + 1}</span>
                  <div>
                    <p className="text-slate-300 font-semibold">
                      {score.score.toLocaleString()} points
                    </p>
                    <p className="text-xs text-slate-500">Wave {score.wave_reached}</p>
                    <p className="text-xs text-slate-400">{score.player_name}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(score.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
