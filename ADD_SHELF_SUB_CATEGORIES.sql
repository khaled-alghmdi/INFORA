-- Add section identifier columns to shelves table
-- Each section (group of 2 rows) has its own text-based identifier (ShSec1, ShSec2, ShSec3)
ALTER TABLE shelves
ADD COLUMN IF NOT EXISTS section_barcode_1 VARCHAR(50),
ADD COLUMN IF NOT EXISTS section_barcode_2 VARCHAR(50),
ADD COLUMN IF NOT EXISTS section_barcode_3 VARCHAR(50),
ADD COLUMN IF NOT EXISTS sub_category_1 VARCHAR(255) DEFAULT 'Section 1',
ADD COLUMN IF NOT EXISTS sub_category_2 VARCHAR(255) DEFAULT 'Section 2',
ADD COLUMN IF NOT EXISTS sub_category_3 VARCHAR(255) DEFAULT 'Section 3';

-- Generate identifiers for existing shelves that don't have section identifiers
-- Format: ShSec1, ShSec2, ShSec3 for each shelf
DO $$
DECLARE
  shelf_rec RECORD;
BEGIN
  FOR shelf_rec IN SELECT id FROM shelves ORDER BY id LOOP
    -- Generate identifiers for sections that don't have them
    UPDATE shelves
    SET 
      section_barcode_1 = COALESCE(section_barcode_1, 'ShSec1'),
      section_barcode_2 = COALESCE(section_barcode_2, 'ShSec2'),
      section_barcode_3 = COALESCE(section_barcode_3, 'ShSec3')
    WHERE id = shelf_rec.id;
  END LOOP;
END $$;

-- Create trigger to auto-generate section identifiers on insert
CREATE OR REPLACE FUNCTION auto_generate_section_identifiers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.section_barcode_1 IS NULL OR NEW.section_barcode_1 = '' THEN
    NEW.section_barcode_1 := 'ShSec1';
  END IF;
  IF NEW.section_barcode_2 IS NULL OR NEW.section_barcode_2 = '' THEN
    NEW.section_barcode_2 := 'ShSec2';
  END IF;
  IF NEW.section_barcode_3 IS NULL OR NEW.section_barcode_3 = '' THEN
    NEW.section_barcode_3 := 'ShSec3';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_section_barcodes ON shelves;
CREATE TRIGGER trigger_auto_generate_section_identifiers
  BEFORE INSERT ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_section_identifiers();

-- Add comments for documentation
COMMENT ON COLUMN shelves.section_barcode_1 IS 'Text identifier for the first section (rows 1-2), format: ShSec1';
COMMENT ON COLUMN shelves.section_barcode_2 IS 'Text identifier for the second section (rows 3-4), format: ShSec2';
COMMENT ON COLUMN shelves.section_barcode_3 IS 'Text identifier for the third section (rows 5-6), format: ShSec3';
COMMENT ON COLUMN shelves.sub_category_1 IS 'Name for the first sub-section (rows 1-2)';
COMMENT ON COLUMN shelves.sub_category_2 IS 'Name for the second sub-section (rows 3-4)';
COMMENT ON COLUMN shelves.sub_category_3 IS 'Name for the third sub-section (rows 5-6)';

