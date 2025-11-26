import { useState, useEffect } from 'react';
import type { Dao } from '../../shared/types/composition-types';
import { daosAdminService } from '../services/daos-admin-service';
import DaosList from './DaosList';
import DaosForm from './DaosForm';

export default function DaosEditor() {
  const [daos, setDaos] = useState<Dao[]>([]);
  const [selectedDao, setSelectedDao] = useState<Dao | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load daos on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await daosAdminService.loadDaos();
      setDaos(data);

      // Select first dao if available and nothing is selected
      if (data.length > 0 && !selectedDao && !isCreatingNew) {
        setSelectedDao(data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daos. Please try again.';
      setError(errorMessage);
      console.error('Error loading daos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewDao = () => {
    const newDao: Dao = {
      id: `temp-${Date.now()}`,
      key: '',
      name: '',
      emoji: '⚔️',
      description: '',
      lore: undefined,
      combatStats: {
        damage: 10,
        attackSpeed: 1000,
        range: 50,
        attackPattern: 'melee',
      },
      compatibleSkills: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedDao(newDao);
    setIsCreatingNew(true);
    setIsDirty(true);
  };

  const handleSelect = (d: Dao) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch daos?')) {
        return;
      }
    }
    setSelectedDao(d);
    setIsCreatingNew(false);
    setIsDirty(false);
  };

  const handleFieldChange = <K extends keyof Dao>(field: K, value: Dao[K]) => {
    if (!selectedDao) return;

    setSelectedDao({
      ...selectedDao,
      [field]: value,
    });
    setIsDirty(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedDao) return;

    try {
      if (isCreatingNew) {
        const { id, version, createdAt, updatedAt, ...daoData } = selectedDao;
        await daosAdminService.createDao(daoData);
        showNotification('Dao created successfully!', 'success');
      } else {
        await daosAdminService.updateDao(selectedDao.id, selectedDao);
        showNotification('Dao saved successfully!', 'success');
      }

      await loadData();
      setIsCreatingNew(false);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save dao. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error saving dao:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedDao || isCreatingNew) return;

    if (!confirm(`Are you sure you want to delete "${selectedDao.name}"?`)) {
      return;
    }

    try {
      await daosAdminService.deleteDao(selectedDao.id);
      showNotification('Dao deleted successfully!', 'success');
      await loadData();
      setSelectedDao(daos.length > 1 ? daos[0] : null);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dao. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting dao:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading daos...</p>
      </div>
    );
  }

  // Show error state
  if (error && daos.length === 0) {
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
      <DaosList
        daos={daos}
        selectedDao={selectedDao}
        onSelect={handleSelect}
        onNewDao={handleNewDao}
      />

      {/* Detail Panel */}
      <DaosForm
        dao={selectedDao}
        isCreatingNew={isCreatingNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}
