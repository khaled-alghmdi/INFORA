-- Add warehouse management columns to devices table
-- This allows tracking which shelf and slot each device is stored in

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS shelf_id INTEGER,
ADD COLUMN IF NOT EXISTS slot_index INTEGER;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_shelf_slot ON devices(shelf_id, slot_index);
CREATE INDEX IF NOT EXISTS idx_devices_unassigned_shelf ON devices(shelf_id) WHERE shelf_id IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN devices.shelf_id IS 'The shelf number where the device is stored (1-5)';
COMMENT ON COLUMN devices.slot_index IS 'The slot index within the shelf (0-19 for 20 slots per shelf)';

