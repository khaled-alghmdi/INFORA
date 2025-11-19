-- Create shelf_categories table for organizing shelves into categories
CREATE TABLE IF NOT EXISTS shelf_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id column to shelves table
ALTER TABLE shelves
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES shelf_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_shelves_category_id ON shelves(category_id);
CREATE INDEX IF NOT EXISTS idx_shelf_categories_display_order ON shelf_categories(display_order);

-- Create function to update updated_at timestamp for categories
CREATE OR REPLACE FUNCTION update_category_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at for categories
DROP TRIGGER IF EXISTS update_shelf_categories_updated_at ON shelf_categories;
CREATE TRIGGER update_shelf_categories_updated_at
    BEFORE UPDATE ON shelf_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_updated_at_column();

-- Insert default categories
INSERT INTO shelf_categories (name, display_order) VALUES
  ('Category 1', 1),
  ('Category 2', 2),
  ('Category 3', 3)
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE shelf_categories IS 'Categories for organizing shelves into groups';
COMMENT ON COLUMN shelves.category_id IS 'Reference to the category this shelf belongs to';

