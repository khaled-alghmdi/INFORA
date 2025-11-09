-- Add barcode column to devices table
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255) UNIQUE;

-- Create index for barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_barcode ON public.devices(barcode);

-- Add comment
COMMENT ON COLUMN public.devices.barcode IS 'Unique barcode identifier for device scanning';

