import { useState, useEffect } from 'react';
import type { Species } from '../../shared/types/composition-types';
import { speciesAdminService } from '../services/species-admin-service';
import SpeciesList from './SpeciesList';
import SpeciesForm from './SpeciesForm';
import { ConfirmDialog } from './ConfirmDialog';

export default function SpeciesEditor() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Species | null>(null);

  // Load species on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await speciesAdminService.loadSpecies();
      setSpecies(data);

      // Select first species if available and nothing is selected
      if (data.length > 0 && !selectedSpecies && !isCreatingNew) {
        setSelectedSpecies(data[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load species. Please try again.';
      setError(errorMessage);
      console.error('Error loading species:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSpecies = () => {
    const newSpecies: Species = {
      id: `temp-${Date.now()}`,
      key: '',
      name: '',
      emoji: '🧬',
      description: '',
      lore: undefined,
      baseStats: {
        health: 100,
        movementSpeed: 1.0,
      },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedSpecies(newSpecies);
    setIsCreatingNew(true);
    setIsDirty(true);
  };

  const handleSelect = (s: Species) => {
    if (isDirty) {
      setPendingSelection(s);
      setSwitchConfirmOpen(true);
      return;
    }
    setSelectedSpecies(s);
    setIsCreatingNew(false);
    setIsDirty(false);
  };

  const confirmSwitch = () => {
    if (pendingSelection) {
      setSelectedSpecies(pendingSelection);
      setIsCreatingNew(false);
      setIsDirty(false);
      setPendingSelection(null);
    }
  };

  const handleFieldChange = <K extends keyof Species>(field: K, value: Species[K]) => {
    if (!selectedSpecies) return;

    setSelectedSpecies({
      ...selectedSpecies,
      [field]: value,
    });
    setIsDirty(true);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedSpecies) return;

    try {
      if (isCreatingNew) {
        const { id, version, createdAt, updatedAt, ...speciesData } = selectedSpecies;
        await speciesAdminService.createSpecies(speciesData);
        showNotification('Species created successfully!', 'success');
      } else {
        await speciesAdminService.updateSpecies(selectedSpecies.id, selectedSpecies);
        showNotification('Species saved successfully!', 'success');
      }

      await loadData();
      setIsCreatingNew(false);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save species. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error saving species:', err);
    }
  };

  const handleDelete = () => {
    if (!selectedSpecies || isCreatingNew) return;
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSpecies || isCreatingNew) return;

    try {
      await speciesAdminService.deleteSpecies(selectedSpecies.id);
      showNotification('Species deleted successfully!', 'success');
      await loadData();
      setSelectedSpecies(species.length > 1 ? species[0] : null);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete species. Please try again.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting species:', err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-cyan-400 text-lg">Loading species...</p>
      </div>
    );
  }

  // Show error state
  if (error && species.length === 0) {
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

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Species"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete <strong>{selectedSpecies?.name}</strong>?
            </p>
            <p className="text-sm text-slate-400">
              This action cannot be undone. The species will be permanently removed.
            </p>
          </div>
        }
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={switchConfirmOpen}
        onClose={() => {
          setSwitchConfirmOpen(false);
          setPendingSelection(null);
        }}
        onConfirm={confirmSwitch}
        title="Unsaved Changes"
        message={
          <div>
            <p className="mb-2">You have unsaved changes that will be lost.</p>
            <p className="text-sm text-slate-400">
              Are you sure you want to switch to another species?
            </p>
          </div>
        }
        confirmText="Switch Anyway"
        variant="warning"
      />

      {/* Master List */}
      <SpeciesList
        species={species}
        selectedSpecies={selectedSpecies}
        onSelect={handleSelect}
        onNewSpecies={handleNewSpecies}
      />

      {/* Detail Panel */}
      <SpeciesForm
        species={selectedSpecies}
        isCreatingNew={isCreatingNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}
