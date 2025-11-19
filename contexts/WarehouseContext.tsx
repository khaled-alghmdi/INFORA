'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { shelfAPI, deviceAPI, warehouseAPI, Shelf, Device } from '@/lib/api/warehouse';

type WarehouseContextType = {
  shelves: Shelf[];
  devices: Device[];
  unassignedDevices: Device[];
  isLoading: boolean;
  error: string | null;
  selectedDeviceId: string | null;
  searchQuery: string;
  zoomLevel: number;
  gridSize: 'small' | 'medium' | 'large';
  
  // Actions
  loadWarehouse: () => Promise<void>;
  createShelf: (name: string, rows: number, columns: number) => Promise<void>;
  updateShelf: (id: number, updates: Partial<Shelf>) => Promise<void>;
  deleteShelf: (id: number) => Promise<void>;
  assignDevice: (deviceId: string, shelfId: number, slotIndex: number) => Promise<void>;
  unassignDevice: (deviceId: string) => Promise<void>;
  moveDevice: (deviceId: string, newShelfId: number, newSlotIndex: number) => Promise<void>;
  setSelectedDeviceId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setZoomLevel: (level: number) => void;
  setGridSize: (size: 'small' | 'medium' | 'large') => void;
  autoFillSlots: () => Promise<void>;
  searchDevices: (query: string) => Device[];
};

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');

  const unassignedDevices = devices.filter(
    (d) => !d.shelf_id || d.slot_index === null
  );

  const loadWarehouse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { shelves: shelvesData, devices: devicesData } = await warehouseAPI.loadWarehouse();
      setShelves(shelvesData);
      setDevices(devicesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouse');
      console.error('Error loading warehouse:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createShelf = useCallback(async (name: string, rows: number, columns: number) => {
    try {
      const newShelf = await shelfAPI.create(name, rows, columns);
      setShelves((prev) => [...prev, newShelf].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.message || 'Failed to create shelf');
      throw err;
    }
  }, []);

  const updateShelf = useCallback(async (id: number, updates: Partial<Shelf>) => {
    try {
      const updated = await shelfAPI.update(id, updates);
      setShelves((prev) =>
        prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.name.localeCompare(b.name))
      );
      
      // If rows/columns changed, unassign devices that no longer fit
      if (updates.rows || updates.columns) {
        const shelf = shelves.find((s) => s.id === id);
        if (shelf) {
          const maxSlots = (updates.rows || shelf.rows) * (updates.columns || shelf.columns);
          const devicesToUnassign = devices.filter(
            (d) => d.shelf_id === id && d.slot_index !== null && d.slot_index >= maxSlots
          );
          
          for (const device of devicesToUnassign) {
            await deviceAPI.unassign(device.id);
          }
          
          // Reload devices
          const updatedDevices = await deviceAPI.getAll();
          setDevices(updatedDevices);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update shelf');
      throw err;
    }
  }, [shelves, devices]);

  const deleteShelf = useCallback(async (id: number) => {
    try {
      await shelfAPI.delete(id);
      setShelves((prev) => prev.filter((s) => s.id !== id));
      
      // Reload devices to reflect unassignments
      const updatedDevices = await deviceAPI.getAll();
      setDevices(updatedDevices);
    } catch (err: any) {
      setError(err.message || 'Failed to delete shelf');
      throw err;
    }
  }, []);

  const assignDevice = useCallback(async (
    deviceId: string,
    shelfId: number,
    slotIndex: number
  ) => {
    try {
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

      // Check if slot is occupied
      const occupied = devices.find(
        (d) => d.shelf_id === shelfId && d.slot_index === slotIndex && d.id !== deviceId
      );
      if (occupied) {
        throw new Error('Slot is already occupied');
      }

      const updated = await deviceAPI.assignToSlot(deviceId, shelfId, slotIndex);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
    } catch (err: any) {
      setError(err.message || 'Failed to assign device');
      throw err;
    }
  }, [shelves, devices]);

  const unassignDevice = useCallback(async (deviceId: string) => {
    try {
      const updated = await deviceAPI.unassign(deviceId);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
    } catch (err: any) {
      setError(err.message || 'Failed to unassign device');
      throw err;
    }
  }, []);

  const moveDevice = useCallback(async (
    deviceId: string,
    newShelfId: number,
    newSlotIndex: number
  ) => {
    try {
      const updated = await deviceAPI.moveDevice(deviceId, newShelfId, newSlotIndex);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
    } catch (err: any) {
      setError(err.message || 'Failed to move device');
      throw err;
    }
  }, []);

  const autoFillSlots = useCallback(async () => {
    try {
      const unassigned = devices.filter((d) => !d.shelf_id || d.slot_index === null);
      if (unassigned.length === 0) return;

      let deviceIndex = 0;
      for (const shelf of shelves) {
        const maxSlots = shelf.rows * shelf.columns;
        const occupiedSlots = new Set(
          devices
            .filter((d) => d.shelf_id === shelf.id && d.slot_index !== null)
            .map((d) => d.slot_index!)
        );

        for (let slotIndex = 0; slotIndex < maxSlots && deviceIndex < unassigned.length; slotIndex++) {
          if (!occupiedSlots.has(slotIndex)) {
            await deviceAPI.assignToSlot(unassigned[deviceIndex].id, shelf.id, slotIndex);
            deviceIndex++;
          }
        }

        if (deviceIndex >= unassigned.length) break;
      }

      // Reload devices
      const updatedDevices = await deviceAPI.getAll();
      setDevices(updatedDevices);
    } catch (err: any) {
      setError(err.message || 'Failed to auto-fill slots');
      throw err;
    }
  }, [shelves, devices]);

  const searchDevices = useCallback((query: string): Device[] => {
    if (!query.trim()) return devices;
    
    const lowerQuery = query.toLowerCase();
    return devices.filter(
      (d) =>
        d.asset_number?.toLowerCase().includes(lowerQuery) ||
        d.name.toLowerCase().includes(lowerQuery) ||
        d.serial_number.toLowerCase().includes(lowerQuery) ||
        d.type.toLowerCase().includes(lowerQuery)
    );
  }, [devices]);

  const value: WarehouseContextType = {
    shelves,
    devices,
    unassignedDevices,
    isLoading,
    error,
    selectedDeviceId,
    searchQuery,
    zoomLevel,
    gridSize,
    loadWarehouse,
    createShelf,
    updateShelf,
    deleteShelf,
    assignDevice,
    unassignDevice,
    moveDevice,
    setSelectedDeviceId,
    setSearchQuery,
    setZoomLevel,
    setGridSize,
    autoFillSlots,
    searchDevices,
  };

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within WarehouseProvider');
  }
  return context;
};

