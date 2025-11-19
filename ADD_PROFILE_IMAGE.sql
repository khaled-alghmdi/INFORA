-- Add profile_image column to users table
-- This stores the image as base64 encoded string
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comment
COMMENT ON COLUMN users.profile_image IS 'Base64 encoded profile image stored directly in the database';

