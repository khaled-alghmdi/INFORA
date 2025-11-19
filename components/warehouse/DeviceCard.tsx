'use client';

import { useDraggable } from '@dnd-kit/core';
import { Monitor, Laptop } from 'lucide-react';

type Device = {
  id: string;
  name: string;
  type: string;
  asset_number: string | null;
  serial_number: string;
  status: string;
  assigned_to: string | null;
  shelf_id: number | null;
  slot_index: number | null;
};

type DeviceCardProps = {
  device: Device;
  isDragging?: boolean;
  isInPool?: boolean;
  gridSize?: 'small' | 'medium' | 'large';
};

const DeviceCard = ({ device, isDragging = false, isInPool = false, gridSize = 'medium' }: DeviceCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingState,
  } = useDraggable({
    id: device.id,
    disabled: isInPool && false, // Allow dragging from pool
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getDeviceIcon = () => {
    const type = device.type?.toLowerCase() || '';
    if (type.includes('laptop')) return <Laptop className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-full h-full bg-white dark:bg-gray-800 rounded border-2 cursor-grab active:cursor-grabbing
        ${isDragging || isDraggingState
          ? 'opacity-50 shadow-2xl scale-105 border-green-500 z-50'
          : 'shadow-md hover:shadow-lg border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
        }
        transition-all duration-200
      `}
    >
      <div className={`h-full flex flex-col items-center justify-center text-center ${
        gridSize === 'small' ? 'p-1' : gridSize === 'large' ? 'p-3' : 'p-2'
      }`}>
        <div className={`text-green-600 dark:text-green-400 mb-1 ${
          gridSize === 'small' ? 'w-3 h-3' : gridSize === 'large' ? 'w-6 h-6' : 'w-4 h-4'
        }`}>
          {getDeviceIcon()}
        </div>
        <div className={`font-bold text-gray-900 dark:text-white font-mono mb-1 ${
          gridSize === 'small' ? 'text-[10px]' : gridSize === 'large' ? 'text-base' : 'text-sm'
        }`}>
          {device.asset_number || 'N/A'}
        </div>
        <div className={`text-gray-600 dark:text-gray-400 truncate w-full ${
          gridSize === 'small' ? 'text-[8px]' : gridSize === 'large' ? 'text-xs' : 'text-[10px]'
        }`}>
          {device.name}
        </div>
        <div className={`text-gray-500 dark:text-gray-500 font-mono mt-0.5 ${
          gridSize === 'small' ? 'text-[7px]' : gridSize === 'large' ? 'text-[10px]' : 'text-[9px]'
        }`}>
          {device.type}
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;

