'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { shelfAPI, deviceAPI, warehouseAPI, categoryAPI, Shelf, Device, ShelfCategory } from '@/lib/api/warehouse';

type WarehouseContextType = {
  shelves: Shelf[];
  categories: ShelfCategory[];
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
  createShelf: (name: string, rows: number, columns: number, categoryId?: number | null) => Promise<void>;
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
  // Category actions
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, updates: Partial<ShelfCategory>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
};

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [categories, setCategories] = useState<ShelfCategory[]>([]);
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
      
      // Try to load categories, but don't fail if table doesn't exist yet
      let categoriesData: ShelfCategory[] = [];
      try {
        categoriesData = await categoryAPI.getAll();
      } catch (categoryErr: any) {
        // If table doesn't exist, just log and continue with empty categories
        if (categoryErr.code === 'PGRST205' || categoryErr.message?.includes('shelf_categories')) {
          console.warn('Categories table not found. Please run the SQL migration to create it.');
        } else {
          throw categoryErr;
        }
      }
      
      const { shelves: shelvesData, devices: devicesData } = await warehouseAPI.loadWarehouse();
      setCategories(categoriesData);
      setShelves(shelvesData);
      setDevices(devicesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouse');
      console.error('Error loading warehouse:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createShelf = useCallback(async (name: string, rows: number, columns: number, categoryId?: number | null) => {
    try {
      const newShelf = await shelfAPI.create(name, rows, columns, categoryId);
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

  const createCategory = useCallback(async (name: string) => {
    try {
      const newCategory = await categoryAPI.create(name);
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.display_order - b.display_order));
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: number, updates: Partial<ShelfCategory>) => {
    try {
      const updated = await categoryAPI.update(id, updates);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.display_order - b.display_order)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      await categoryAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  }, []);

  const value: WarehouseContextType = {
    shelves,
    categories,
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
    createCategory,
    updateCategory,
    deleteCategory,
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

