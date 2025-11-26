import { useEffect, useState, useRef } from 'react';
import { getItemById } from '@/utils/items';

interface ItemPickup {
  id: string;
  itemId: string;
  towerName: string;
  timestamp: number;
}

interface ItemNotificationProps {
  pickups: ItemPickup[];
}

export function ItemNotification({ pickups }: ItemNotificationProps) {
  const [visiblePickups, setVisiblePickups] = useState<ItemPickup[]>([]);
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only process new pickups that haven't been processed yet
    const newPickups = pickups.filter(
      p => !processedIds.current.has(p.id)
    );
    
    if (newPickups.length > 0) {
      // Mark as processed
      newPickups.forEach(p => processedIds.current.add(p.id));
      
      // Add to visible list
      setVisiblePickups(prev => [...prev, ...newPickups]);
      
      // Auto-dismiss after 3 seconds
      newPickups.forEach(pickup => {
        setTimeout(() => {
          setVisiblePickups(prev => prev.filter(p => p.id !== pickup.id));
        }, 3000);
      });
    }
  }, [pickups]);

  if (visiblePickups.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {visiblePickups.map((pickup, index) => {
        const item = getItemById(pickup.itemId);
        if (!item) return null;

        const rarityColors = {
          common: 'bg-gray-500/90 border-gray-400',
          rare: 'bg-blue-500/90 border-blue-400',
          epic: 'bg-purple-500/90 border-purple-400',
          legendary: 'bg-orange-500/90 border-orange-400',
        };

        return (
          <div
            key={pickup.id}
            className={`
              ${rarityColors[item.rarity]}
              border-2 rounded-lg px-4 py-2 shadow-lg
              animate-slide-in-right
              flex items-center gap-3
              text-white font-medium
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{item.name}</span>
              <span className="text-xs opacity-90">
                {pickup.towerName} found this!
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
