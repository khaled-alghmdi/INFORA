-- Add barcode column to shelves table
ALTER TABLE shelves
ADD COLUMN IF NOT EXISTS barcode VARCHAR(6) UNIQUE;

-- Create function to generate unique 6-digit barcode
CREATE OR REPLACE FUNCTION generate_shelf_barcode()
RETURNS VARCHAR(6) AS $$
DECLARE
  new_barcode VARCHAR(6);
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate random 6-digit number (100000-999999)
    new_barcode := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Check if barcode already exists
    SELECT COUNT(*) INTO exists_check
    FROM shelves
    WHERE barcode = new_barcode;
    
    -- Exit loop if barcode is unique
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN new_barcode;
END;
$$ LANGUAGE plpgsql;

-- Generate barcodes for existing shelves that don't have one
UPDATE shelves
SET barcode = generate_shelf_barcode()
WHERE barcode IS NULL;

-- Create trigger to auto-generate barcode on insert
CREATE OR REPLACE FUNCTION auto_generate_shelf_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := generate_shelf_barcode();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_shelf_barcode ON shelves;
CREATE TRIGGER trigger_auto_generate_shelf_barcode
  BEFORE INSERT ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_shelf_barcode();

-- Add comment
COMMENT ON COLUMN shelves.barcode IS 'Unique 6-digit barcode identifier for the shelf';

