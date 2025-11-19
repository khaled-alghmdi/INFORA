-- Create shelves table for dynamic shelf management
CREATE TABLE IF NOT EXISTS shelves (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rows INTEGER NOT NULL DEFAULT 5,
  columns INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shelves_name ON shelves(name);

-- Update devices table to reference shelves
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS shelf_id INTEGER REFERENCES shelves(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS slot_index INTEGER;

-- Add constraint to ensure slot_index is valid when shelf_id is set
-- Drop constraint if it exists, then add it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_slot_with_shelf'
    ) THEN
        ALTER TABLE devices DROP CONSTRAINT check_slot_with_shelf;
    END IF;
END $$;

ALTER TABLE devices
ADD CONSTRAINT check_slot_with_shelf 
CHECK ((shelf_id IS NULL AND slot_index IS NULL) OR (shelf_id IS NOT NULL AND slot_index IS NOT NULL));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_devices_shelf_slot ON devices(shelf_id, slot_index);
CREATE INDEX IF NOT EXISTS idx_devices_unassigned_shelf ON devices(shelf_id) WHERE shelf_id IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_shelves_updated_at ON shelves;
CREATE TRIGGER update_shelves_updated_at
    BEFORE UPDATE ON shelves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default shelves (optional - can be created via UI)
INSERT INTO shelves (name, rows, columns) VALUES
  ('Shelf 1', 5, 4),
  ('Shelf 2', 5, 4),
  ('Shelf 3', 5, 4),
  ('Shelf 4', 5, 4),
  ('Shelf 5', 5, 4)
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE shelves IS 'Stores shelf configurations with customizable rows and columns';
COMMENT ON COLUMN shelves.rows IS 'Number of rows in the shelf grid';
COMMENT ON COLUMN shelves.columns IS 'Number of columns in the shelf grid';
COMMENT ON COLUMN devices.shelf_id IS 'Reference to the shelf where the device is stored';
COMMENT ON COLUMN devices.slot_index IS 'The slot position within the shelf (0-based index)';

