import { UserProfile } from './ProfilesEditor';

interface ProfilesListProps {
  profiles: UserProfile[];
  selectedProfile: UserProfile | null;
  onSelectProfile: (profile: UserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
}

export default function ProfilesList({
  profiles,
  selectedProfile,
  onSelectProfile,
  onDeleteProfile,
}: ProfilesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProviderIcon = (provider: string | null | undefined) => {
    if (!provider) return '👤';
    
    switch (provider.toLowerCase()) {
      case 'google':
        return '🔵';
      case 'discord':
        return '💜';
      case 'github':
        return '⚫';
      case 'steam':
        return '🎮';
      default:
        return '👤';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {profiles.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          No profiles found
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${
                  selectedProfile?.id === profile.id
                    ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-amber-500'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                }
              `}
              onClick={() => onSelectProfile(profile)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(profile.provider)}</span>
                    <h3 className="font-semibold text-amber-200 truncate">
                      {profile.display_name || profile.username || 'Unknown User'}
                    </h3>
                  </div>
                  {profile.username && (
                    <p className="text-xs text-slate-400 truncate mt-1">
                      @{profile.username}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Joined {formatDate(profile.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProfile(profile.id);
                  }}
                  className="ml-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 rounded transition-colors cursor-not-allowed"
                  title="Delete disabled - requires service_role access. Use Supabase Dashboard instead."
                >
                  🔒
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
