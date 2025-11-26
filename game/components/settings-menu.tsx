import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { soundManager } from '../utils/sound-manager';
import { Volume2, Music, Wand2, Trophy } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LeaderboardSimple } from './leaderboard-simple';

interface SettingsMenuProps {
  onClose: () => void;
  onOpenUIShowcase?: () => void;
}

export function SettingsMenu({ onClose, onOpenUIShowcase }: SettingsMenuProps) {
  const [masterVolume, setMasterVolume] = useState(soundManager.getVolume() * 100);
  const [musicVolume, setMusicVolume] = useState(50); // Default 50%
  const [sfxVolume, setSfxVolume] = useState(60); // Default 60%
  const [testResult, setTestResult] = useState<string>('');
  const [dbTestResult, setDbTestResult] = useState<string>('');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  useEffect(() => {
    // Initialize with current sound manager values
    setMasterVolume(soundManager.getVolume() * 100);
  }, []);

  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMasterVolume(newVolume);
    soundManager.setVolume(newVolume / 100);
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMusicVolume(newVolume);
    soundManager.setMusicVolume(newVolume / 100);
  };

  const handleSFXVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setSfxVolume(newVolume);
    soundManager.setSFXVolume(newVolume / 100);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  // Stage 1: Test endpoint
  const testLeaderboardEndpoint = async () => {
    try {
      setTestResult('Testing...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae0b35aa/leaderboard/test`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      console.log('Leaderboard test response:', data);
      if (data.success) {
        setTestResult('✅ Server connected!');
      } else {
        setTestResult('❌ Server error');
      }
    } catch (error) {
      console.error('Leaderboard test error:', error);
      setTestResult('❌ Connection failed');
    }
  };

  // Stage 2: Test database functions
  const testDatabaseFunctions = async () => {
    try {
      setDbTestResult('Testing DB...');
      
      // 1. Submit a test score
      const submitResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae0b35aa/leaderboard/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName: 'Test Player',
            score: Math.floor(Math.random() * 10000),
            wave: Math.floor(Math.random() * 20) + 1,
          }),
        }
      );
      const submitData = await submitResponse.json();
      console.log('Submit response:', submitData);
      
      if (!submitData.success) {
        setDbTestResult('❌ Submit failed');
        return;
      }
      
      // 2. Retrieve top scores
      const retrieveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ae0b35aa/leaderboard/top?limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const retrieveData = await retrieveResponse.json();
      console.log('Top scores:', retrieveData);
      
      if (retrieveData.success && retrieveData.scores.length > 0) {
        setDbTestResult(`✅ DB works! (${retrieveData.scores.length} scores)`);
      } else {
        setDbTestResult('✅ Submit OK, no scores yet');
      }
    } catch (error) {
      console.error('Database test error:', error);
      setDbTestResult('❌ DB test failed');
    }
  };

  return (
    <div 
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto"
      onContextMenu={handleContextMenu}
    >
      <div className="bg-gradient-to-br from-green-950 to-amber-950 border-4 border-amber-600 rounded-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300 min-w-[400px] max-w-[500px]">
        <div className="text-5xl mb-4 text-center">⚙️</div>
        <div className="text-amber-300 text-2xl mb-6 text-center">Game Settings</div>
        
        <div className="space-y-6 mb-8">
          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="size-5 text-amber-400" />
                <label className="text-amber-200">Master Volume</label>
              </div>
              <span className="text-amber-300 min-w-[3ch] text-right">{Math.round(masterVolume)}%</span>
            </div>
            <Slider
              value={[masterVolume]}
              onValueChange={handleMasterVolumeChange}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="size-5 text-purple-400" />
                <label className="text-amber-200">Music Volume</label>
              </div>
              <span className="text-amber-300 min-w-[3ch] text-right">{Math.round(musicVolume)}%</span>
            </div>
            <Slider
              value={[musicVolume]}
              onValueChange={handleMusicVolumeChange}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="size-5 text-green-400" />
                <label className="text-amber-200">SFX Volume</label>
              </div>
              <span className="text-amber-300 min-w-[3ch] text-right">{Math.round(sfxVolume)}%</span>
            </div>
            <Slider
              value={[sfxVolume]}
              onValueChange={handleSFXVolumeChange}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          {/* Stage 3: Leaderboard Button */}
          <Button 
            onClick={() => setLeaderboardOpen(true)} 
            variant="outline"
            className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/50 px-6 py-2 w-full"
          >
            <Trophy className="size-5 mr-2" />
            View Leaderboard
          </Button>
          
          {/* Stage 1: Test Button */}
          <Button 
            onClick={testLeaderboardEndpoint} 
            variant="outline"
            className="border-blue-600 text-blue-300 hover:bg-blue-900/50 px-6 py-2 w-full"
          >
            🧪 Test Server Connection
          </Button>
          {testResult && (
            <div className="text-center text-amber-200 py-1">
              {testResult}
            </div>
          )}
          
          {/* Stage 2: Test Database Button */}
          <Button 
            onClick={testDatabaseFunctions} 
            variant="outline"
            className="border-green-600 text-green-300 hover:bg-green-900/50 px-6 py-2 w-full"
          >
            🧪 Test Database Functions
          </Button>
          {dbTestResult && (
            <div className="text-center text-amber-200 py-1">
              {dbTestResult}
            </div>
          )}
          
          {/* UI Showcase Button */}
          {onOpenUIShowcase && (
            <Button 
              onClick={onOpenUIShowcase} 
              variant="outline"
              className="border-purple-600 text-purple-300 hover:bg-purple-900/50 px-6 py-2 w-full"
            >
              🎨 UI Element Showcase
            </Button>
          )}
          
          {/* Back Button */}
          <Button 
            onClick={onClose} 
            className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 w-full"
          >
            Back to Menu
          </Button>
        </div>
      </div>

      {/* Stage 3: Leaderboard Dialog */}
      <LeaderboardSimple 
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
    </div>
  );
}