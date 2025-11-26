import { useState, useEffect } from 'react';
import type { Achievement } from '../../shared/types/composition-types';
import { achievementsAdminService } from '../services/achievements-admin-service';
import AchievementsList from './AchievementsList';
import AchievementsForm from './AchievementsForm';

export default function AchievementsEditor() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load achievements on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await achievementsAdminService.loadAchievements();
      setAchievements(data);

      // Select first achievement if available and nothing is selected
      if (data.length > 0 && !selectedAchievement && !isCreatingNew) {
        setSelectedAchievement(data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements. Please try again.';
      setError(errorMessage);
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAchievement = () => {
    const newAchievement: Achievement = {
      id: `temp-${Date.now()}`,
      key: '',
      name: '',
      emoji: '🏆',
      description: '',
      conditions: [],
      rewards: [],
      sortOrder: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedAchievement(newAchievement);
    setIsCreatingNew(true);
    setIsDirty(true);
  };

  const handleSelect = (a: Achievement) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch achievements?')) {
        return;
      }
    }
    setSelectedAchievement(a);
    setIsCreatingNew(false);
    setIsDirty(false);
  };

  const handleFieldChange = <K extends keyof Achievement>(field: K, value: Achievement[K]) => {
    if (!selectedAchievement) return;

    setSelectedAchievement({
      ...selectedAchievement,
      [field]: value,
    });
    setIsDirty(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedAchievement) return;

    try {
      if (isCreatingNew) {
        const { id, version, createdAt, updatedAt, ...achievementData } = selectedAchievement;
        await achievementsAdminService.createAchievement(achievementData);
        showNotification('Achievement created successfully!', 'success');
      } else {
        await achievementsAdminService.updateAchievement(selectedAchievement.id, selectedAchievement);
        showNotification('Achievement saved successfully!', 'success');
      }

      await loadData();
      setIsCreatingNew(false);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save achievement. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error saving achievement:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedAchievement || isCreatingNew) return;

    if (!confirm(`Are you sure you want to delete "${selectedAchievement.name}"?`)) {
      return;
    }

    try {
      await achievementsAdminService.deleteAchievement(selectedAchievement.id);
      showNotification('Achievement deleted successfully!', 'success');
      await loadData();
      setSelectedAchievement(achievements.length > 1 ? achievements[0] : null);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete achievement. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting achievement:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading achievements...</p>
      </div>
    );
  }

  // Show error state
  if (error && achievements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-lg font-semibold shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Master List */}
      <AchievementsList
        achievements={achievements}
        selectedAchievement={selectedAchievement}
        onSelect={handleSelect}
        onNewAchievement={handleNewAchievement}
      />

      {/* Detail Panel */}
      <AchievementsForm
        achievement={selectedAchievement}
        isCreatingNew={isCreatingNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}
