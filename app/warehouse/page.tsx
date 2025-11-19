'use client';

import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { ZoomIn, ZoomOut, Grid, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { WarehouseProvider, useWarehouse } from '@/contexts/WarehouseContext';
import ShelfGrid from '@/components/warehouse/ShelfGrid';
import DeviceCard from '@/components/warehouse/DeviceCard';
import DevicePool from '@/components/warehouse/DevicePool';

const WarehouseContent = () => {
  const {
    devices,
    shelves,
    isLoading,
    error,
    selectedDeviceId,
    setSelectedDeviceId,
    searchQuery,
    setSearchQuery,
    zoomLevel,
    setZoomLevel,
    gridSize,
    setGridSize,
    assignDevice,
    unassignDevice,
    moveDevice,
    loadWarehouse,
  } = useWarehouse();

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadWarehouse();
  }, [loadWarehouse]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setSelectedDeviceId(null);

    if (!over) return;

    const deviceId = active.id as string;
    const overId = over.id as string;

    // Find the device being dragged
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    try {
      // Check if dropping on a shelf slot
      if (overId.startsWith('shelf-') && overId.includes('-slot-')) {
        const [shelfPart, slotPart] = overId.split('-slot-');
        const shelfId = parseInt(shelfPart.replace('shelf-', ''));
        const slotIndex = parseInt(slotPart);

        // Validate shelf exists
        const shelf = shelves.find((s) => s.id === shelfId);
        if (!shelf) {
          throw new Error('Shelf not found');
        }

        // Validate slot index
        const maxSlots = shelf.rows * shelf.columns;
        if (slotIndex < 0 || slotIndex >= maxSlots) {
          throw new Error('Invalid slot index');
        }

        // Check if slot is already occupied
        const occupied = devices.find(
          (d) => d.shelf_id === shelfId && d.slot_index === slotIndex && d.id !== deviceId
        );

        if (occupied) {
          // Slot is occupied - reject drop with animation feedback
          const slotElement = document.getElementById(overId);
          if (slotElement) {
            slotElement.classList.add('shake');
            setTimeout(() => {
              slotElement.classList.remove('shake');
            }, 500);
          }
          return;
        }

        // If device is already on a shelf, move it; otherwise assign it
        if (device.shelf_id && device.slot_index !== null) {
          await moveDevice(deviceId, shelfId, slotIndex);
        } else {
          await assignDevice(deviceId, shelfId, slotIndex);
        }
      }
      // Check if dropping back to device pool
      else if (overId === 'device-pool') {
        await unassignDevice(deviceId);
      }
    } catch (err: any) {
      console.error('Drag and drop error:', err);
      // Error is handled in context, but we can show visual feedback
      const slotElement = document.getElementById(overId);
      if (slotElement) {
        slotElement.classList.add('shake');
        setTimeout(() => {
          slotElement.classList.remove('shake');
        }, 500);
      }
    }
  };

  const handleZoomIn = () => {
    const newLevel = Math.min(zoomLevel + 10, 200);
    setZoomLevel(newLevel);
  };

  const handleZoomOut = () => {
    const newLevel = Math.max(zoomLevel - 10, 25);
    setZoomLevel(newLevel);
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSelectedDeviceId(null);
      return;
    }

    const found = devices.find(
      (d) =>
        d.asset_number?.toLowerCase().includes(query.toLowerCase()) ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.serial_number.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      setSelectedDeviceId(found.id);
      // Scroll to the shelf containing this device
      setTimeout(() => {
        if (found.shelf_id) {
          const shelfElement = document.getElementById(`shelf-${found.shelf_id}`);
          if (shelfElement) {
            shelfElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } else {
      setSelectedDeviceId(null);
    }
  };

  const activeDevice = activeId ? devices.find((d) => d.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading warehouse...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Warehouse Management"
          description="Drag and drop devices to organize them on shelves"
        />

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Controls Bar */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border border-gray-200 dark:border-gray-700">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 25}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Size Toggle */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border border-gray-200 dark:border-gray-700">
              <Grid className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      gridSize === size
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search for Device */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search device by asset number, name, or serial..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Shelves Section */}
          <div
            className="mb-8 transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
          >
            <ShelfGrid />
          </div>

          {/* Device Pool */}
          <DevicePool />

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDevice ? (
              <div className="opacity-90">
                <DeviceCard device={activeDevice} isDragging={true} isInPool={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};

const WarehousePage = () => {
  return (
    <WarehouseProvider>
      <WarehouseContent />
    </WarehouseProvider>
  );
};

export default WarehousePage;
