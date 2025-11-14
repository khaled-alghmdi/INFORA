-- ============================================
-- Add Permanent Device Field to Users Table
-- This marks users who DON'T need delivery notes
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_permanent_device BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS permanent_device_id UUID REFERENCES devices(id) ON DELETE SET NULL;

-- Add comments to explain the fields
COMMENT ON COLUMN users.has_permanent_device IS 'REMINDER FLAG: True if user MUST do delivery note for specific device';
COMMENT ON COLUMN users.permanent_device_id IS 'The specific device that user MUST do delivery note for (reminder for admin)';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_permanent_device ON users(has_permanent_device);

-- Update existing users who already have devices assigned as permanent
UPDATE users 
SET has_permanent_device = TRUE 
WHERE id IN (
  SELECT DISTINCT assigned_to 
  FROM devices 
  WHERE assigned_to IS NOT NULL 
  AND status = 'assigned'
);

-- Verify the changes
SELECT 
  id, 
  full_name, 
  has_permanent_device,
  (SELECT COUNT(*) FROM devices WHERE assigned_to = users.id AND status = 'assigned') as device_count
FROM users 
ORDER BY has_permanent_device DESC, full_name;

-- Success message
SELECT 'Column has_permanent_device added successfully!' as status;

