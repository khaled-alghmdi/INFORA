'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useWarehouse } from '@/contexts/WarehouseContext';
import DeviceCard from './DeviceCard';
import { Search, Zap, X } from 'lucide-react';

const DevicePool = () => {
  const {
    unassignedDevices,
    searchQuery,
    setSearchQuery,
    searchDevices,
    autoFillSlots,
    gridSize,
  } = useWarehouse();

  const { setNodeRef, isOver } = useDroppable({
    id: 'device-pool',
  });

  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const filteredDevices = searchQuery
    ? searchDevices(searchQuery).filter((d) => !d.shelf_id || d.slot_index === null)
    : unassignedDevices;

  const deviceIds = filteredDevices.map((d) => d.id);

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      await autoFillSlots();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsAutoFilling(false);
    }
  };

  const gridColsClass = {
    small: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    large: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Device Pool</h3>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({unassignedDevices.length} {unassignedDevices.length === 1 ? 'device' : 'devices'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unassignedDevices.length > 0 && (
            <button
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Auto-fill empty slots"
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Fill</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by asset number, name, serial, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div
        ref={setNodeRef}
        className={`
          min-h-[200px] p-4 rounded-lg border-2 border-dashed transition-all duration-200
          ${isOver
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
          }
        `}
      >
        {filteredDevices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <p className="text-sm text-center">
              {searchQuery
                ? 'No devices found matching your search.'
                : 'No unassigned devices. Drag devices here to remove them from shelves.'}
            </p>
          </div>
        ) : (
          <SortableContext items={deviceIds} strategy={rectSortingStrategy}>
            <div className={`grid ${gridColsClass[gridSize]} gap-3`}>
              {filteredDevices.map((device) => (
                <div key={device.id} className="aspect-square">
                  <DeviceCard device={device} isDragging={false} isInPool={true} gridSize={gridSize} />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default DevicePool;

