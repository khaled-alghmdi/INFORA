import { supabase } from '@/lib/supabase';

export type Shelf = {
  id: number;
  name: string;
  rows: number;
  columns: number;
  barcode?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Device = {
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

// Shelf Management API
export const shelfAPI = {
  // Get all shelves
  getAll: async (): Promise<Shelf[]> => {
    const { data, error } = await supabase
      .from('shelves')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get single shelf
  getById: async (id: number): Promise<Shelf | null> => {
    const { data, error } = await supabase
      .from('shelves')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create shelf
  create: async (name: string, rows: number, columns: number): Promise<Shelf> => {
    const { data, error } = await supabase
      .from('shelves')
      .insert([{ name, rows, columns }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update shelf
  update: async (id: number, updates: Partial<Shelf>): Promise<Shelf> => {
    const { data, error } = await supabase
      .from('shelves')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete shelf
  delete: async (id: number): Promise<void> => {
    // First, unassign all devices from this shelf
    await supabase
      .from('devices')
      .update({ shelf_id: null, slot_index: null })
      .eq('shelf_id', id);

    // Then delete the shelf
    const { error } = await supabase
      .from('shelves')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Device Management API
export const deviceAPI = {
  // Get all devices with shelf positions
  getAll: async (): Promise<Device[]> => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .in('status', ['available', 'maintenance'])
      .order('asset_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get devices by shelf
  getByShelf: async (shelfId: number): Promise<Device[]> => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('shelf_id', shelfId)
      .order('slot_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Assign device to shelf slot
  assignToSlot: async (
    deviceId: string,
    shelfId: number,
    slotIndex: number
  ): Promise<Device> => {
    // Check if slot is already occupied
    const { data: existing } = await supabase
      .from('devices')
      .select('id')
      .eq('shelf_id', shelfId)
      .eq('slot_index', slotIndex)
      .single();

    if (existing && existing.id !== deviceId) {
      throw new Error('Slot is already occupied');
    }

    const { data, error } = await supabase
      .from('devices')
      .update({
        shelf_id: shelfId,
        slot_index: slotIndex,
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unassign device from shelf
  unassign: async (deviceId: string): Promise<Device> => {
    const { data, error } = await supabase
      .from('devices')
      .update({
        shelf_id: null,
        slot_index: null,
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Move device to different slot
  moveDevice: async (
    deviceId: string,
    newShelfId: number,
    newSlotIndex: number
  ): Promise<Device> => {
    // Check if new slot is occupied
    const { data: existing } = await supabase
      .from('devices')
      .select('id')
      .eq('shelf_id', newShelfId)
      .eq('slot_index', newSlotIndex)
      .single();

    if (existing && existing.id !== deviceId) {
      throw new Error('Target slot is already occupied');
    }

    const { data, error } = await supabase
      .from('devices')
      .update({
        shelf_id: newShelfId,
        slot_index: newSlotIndex,
      })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Search devices
  search: async (query: string): Promise<Device[]> => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .or(`asset_number.ilike.%${query}%,name.ilike.%${query}%,serial_number.ilike.%${query}%`)
      .in('status', ['available', 'maintenance'])
      .limit(50);

    if (error) throw error;
    return data || [];
  },
};

// Combined API for loading full warehouse state
export const warehouseAPI = {
  // Load complete warehouse state (shelves + devices)
  loadWarehouse: async (): Promise<{
    shelves: Shelf[];
    devices: Device[];
  }> => {
    const [shelves, devices] = await Promise.all([
      shelfAPI.getAll(),
      deviceAPI.getAll(),
    ]);

    return { shelves, devices };
  },
};

