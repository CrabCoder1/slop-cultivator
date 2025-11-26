import { useState } from 'react';
import WaveConfigDialog from './WaveConfigDialog';
import { Button } from './ui';

interface WaveConfigButtonProps {
  mapId: string;
  mapName: string;
  disabled?: boolean;
}

export default function WaveConfigButton({ 
  mapId, 
  mapName,
  disabled = false
}: WaveConfigButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Capture mapId and mapName when dialog opens to prevent changes during dialog lifecycle
  const [dialogMapId, setDialogMapId] = useState<string>('');
  const [dialogMapName, setDialogMapName] = useState<string>('');

  const handleOpenDialog = () => {
    setDialogMapId(mapId);
    setDialogMapName(mapName);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        disabled={disabled}
        variant="primary"
        className="w-full"
      >
        🌊 Configure Waves
      </Button>

      {isDialogOpen && (
        <WaveConfigDialog
          mapId={dialogMapId}
          mapName={dialogMapName}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}
