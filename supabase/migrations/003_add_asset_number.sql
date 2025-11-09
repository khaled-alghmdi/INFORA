-- Add asset_number column to devices table
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS asset_number VARCHAR(100) UNIQUE;

-- Create index for asset_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_asset_number ON public.devices(asset_number);

-- Add comment to explain the column
COMMENT ON COLUMN public.devices.asset_number IS 'Unique asset number identifier for tracking devices';

