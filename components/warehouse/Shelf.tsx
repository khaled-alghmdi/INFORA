'use client';

import { useDroppable } from '@dnd-kit/core';
import { useWarehouse } from '@/contexts/WarehouseContext';
import DeviceCard from './DeviceCard';

type Shelf = {
  id: number;
  name: string;
  rows: number;
  columns: number;
  barcode?: string | null;
};

type ShelfProps = {
  shelf: Shelf;
};

const Shelf = ({ shelf }: ShelfProps) => {
  const { devices, selectedDeviceId, gridSize } = useWarehouse();
  const totalSlots = shelf.rows * shelf.columns;
  
  // Get devices assigned to this shelf
  const shelfDevices = devices.filter(
    (d) => d.shelf_id === shelf.id && d.slot_index !== null
  );

  // Create slots array
  const slots: (typeof devices[0] | null)[] = Array(totalSlots).fill(null);
  shelfDevices.forEach((device) => {
    if (device.slot_index !== null && device.slot_index < totalSlots) {
      slots[device.slot_index] = device;
    }
  });

  const slotSizeClass = {
    small: 'min-h-[60px] text-[8px]',
    medium: 'min-h-[80px] text-xs',
    large: 'min-h-[100px] text-sm',
  };

  return (
    <div id={`shelf-${shelf.id}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {shelf.name}
          </h3>
          {shelf.barcode && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg font-mono font-bold text-sm text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-600 shadow-sm">
              {shelf.barcode}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {shelf.rows}×{shelf.columns} ({totalSlots} slots)
        </div>
      </div>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${shelf.columns}, 1fr)`,
        }}
      >
        {slots.map((device, index) => {
          const slotId = `shelf-${shelf.id}-slot-${index}`;
          const isHighlighted = selectedDeviceId === device?.id;
          
          return (
            <ShelfSlot
              key={slotId}
              slotId={slotId}
              device={device}
              slotIndex={index}
              isHighlighted={isHighlighted}
              slotSizeClass={slotSizeClass[gridSize]}
              gridSize={gridSize}
            />
          );
        })}
      </div>
    </div>
  );
};

type ShelfSlotProps = {
  slotId: string;
  device: any | null;
  slotIndex: number;
  isHighlighted: boolean;
  slotSizeClass: string;
  gridSize: 'small' | 'medium' | 'large';
};

const ShelfSlot = ({ slotId, device, slotIndex, isHighlighted, slotSizeClass, gridSize }: ShelfSlotProps) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const isDraggingOver = isOver && !device;
  const isInvalidDrop = isOver && device && active?.id !== device.id;

  return (
    <div
      ref={setNodeRef}
      id={slotId}
      className={`
        aspect-square border-2 rounded-lg p-1 transition-all duration-200
        ${device
          ? isHighlighted
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 ring-2 ring-yellow-400'
            : 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : isDraggingOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 border-dashed scale-105 shadow-lg'
          : isInvalidDrop
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${slotSizeClass}
      `}
    >
      {device ? (
        <DeviceCard device={device} isDragging={false} isInPool={false} gridSize={gridSize} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500 font-mono font-semibold">
            {slotIndex + 1}
          </span>
        </div>
      )}
    </div>
  );
};

export default Shelf;

