import { useState, useEffect } from 'react';
import type { Title } from '../../shared/types/composition-types';
import { titlesAdminService } from '../services/titles-admin-service';
import TitlesList from './TitlesList';
import TitlesForm from './TitlesForm';

export default function TitlesEditor() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load titles on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await titlesAdminService.loadTitles();
      setTitles(data);

      // Select first title if available and nothing is selected
      if (data.length > 0 && !selectedTitle && !isCreatingNew) {
        setSelectedTitle(data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load titles. Please try again.';
      setError(errorMessage);
      console.error('Error loading titles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTitle = () => {
    const newTitle: Title = {
      id: `temp-${Date.now()}`,
      key: '',
      name: '',
      emoji: '👑',
      description: '',
      statBonuses: {},
      prestigeLevel: 1,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedTitle(newTitle);
    setIsCreatingNew(true);
    setIsDirty(true);
  };

  const handleSelect = (t: Title) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch titles?')) {
        return;
      }
    }
    setSelectedTitle(t);
    setIsCreatingNew(false);
    setIsDirty(false);
  };

  const handleFieldChange = <K extends keyof Title>(field: K, value: Title[K]) => {
    if (!selectedTitle) return;

    setSelectedTitle({
      ...selectedTitle,
      [field]: value,
    });
    setIsDirty(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedTitle) return;

    try {
      if (isCreatingNew) {
        const { id, version, createdAt, updatedAt, ...titleData } = selectedTitle;
        await titlesAdminService.createTitle(titleData);
        showNotification('Title created successfully!', 'success');
      } else {
        await titlesAdminService.updateTitle(selectedTitle.id, selectedTitle);
        showNotification('Title saved successfully!', 'success');
      }

      await loadData();
      setIsCreatingNew(false);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save title. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error saving title:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedTitle || isCreatingNew) return;

    if (!confirm(`Are you sure you want to delete "${selectedTitle.name}"?`)) {
      return;
    }

    try {
      await titlesAdminService.deleteTitle(selectedTitle.id);
      showNotification('Title deleted successfully!', 'success');
      await loadData();
      setSelectedTitle(titles.length > 1 ? titles[0] : null);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete title. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting title:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading titles...</p>
      </div>
    );
  }

  // Show error state
  if (error && titles.length === 0) {
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
      <TitlesList
        titles={titles}
        selectedTitle={selectedTitle}
        onSelect={handleSelect}
        onNewTitle={handleNewTitle}
      />

      {/* Detail Panel */}
      <TitlesForm
        title={selectedTitle}
        isCreatingNew={isCreatingNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}
