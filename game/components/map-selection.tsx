import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { mapService } from '../../shared/utils/map-service';
import { useAuth } from './auth/AuthContext';
import type { Map } from '../../shared/types/map';

interface MapSelectionProps {
  onMapSelected: (map: Map) => void;
}

export function MapSelection({ onMapSelected }: MapSelectionProps) {
  const { user, profile, isGuestMode, signOut } = useAuth();
  const [availableMaps, setAvailableMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    fetchAvailableMaps();
  }, []);

  const fetchAvailableMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const maps = await mapService.getAvailableMaps();
      setAvailableMaps(maps);
    } catch (err) {
      console.error('Error fetching available maps:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load maps. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <div className="text-white text-xl mb-4">Loading maps...</div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-white text-xl mb-4">{error}</div>
          <Button onClick={fetchAvailableMaps} className="bg-amber-700 hover:bg-amber-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (availableMaps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🏗️</div>
          <div className="text-white text-xl mb-2">No maps available</div>
          <div className="text-gray-400 text-sm">
            Check back later! Administrators are working on creating new maps.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Auth Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚔️</div>
            <div>
              <h2 className="text-white font-semibold">
                {isGuestMode ? 'Guest Player' : profile?.username || user?.email || 'Player'}
              </h2>
              <p className="text-xs text-gray-400">
                {isGuestMode ? 'Playing as guest' : 'Authenticated'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </div>

      {/* Map Selection Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="max-w-4xl w-full px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Select a Map</h1>
            <p className="text-gray-400">Choose your battlefield</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMaps.map((map) => (
              <button
                key={map.id}
                onClick={() => onMapSelected(map)}
                className="bg-gradient-to-br from-green-900 to-green-950 border-2 border-amber-600 rounded-lg p-6 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-600/50 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">🗺️</div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {map.name}
                  </h3>
                  <div className="text-gray-400 text-sm mb-2">
                    {map.width} × {map.height} tiles
                  </div>
                  {map.metadata?.difficulty && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/50 text-amber-300 border border-amber-600">
                      {map.metadata.difficulty.charAt(0).toUpperCase() + map.metadata.difficulty.slice(1)}
                    </div>
                  )}
                  {map.metadata?.description && (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                      {map.metadata.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
