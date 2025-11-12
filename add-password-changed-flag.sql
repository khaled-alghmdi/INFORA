-- ============================================
-- Add Password Changed Flag to Users Table
-- This prevents repeated password change prompts
-- ============================================

-- Add a column to track if user has changed their password
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Important: When admin resets a user's password, 
-- set password_changed_at to NULL to force password change on next login
-- This is handled automatically in the application code

-- For existing users who have already changed their password,
-- set the flag to now (optional)
-- UPDATE users 
-- SET password_changed_at = NOW()
-- WHERE initial_password IS NOT NULL;

-- When admin resets password, also reset the flag:
-- UPDATE users 
-- SET initial_password = 'NewTempPassword123',
--     password_changed_at = NULL
-- WHERE email = 'user@tamergroup.com';

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
    AND column_name = 'password_changed_at';

-- Check current users
SELECT 
    email,
    full_name,
    initial_password IS NOT NULL as has_password,
    password_changed_at IS NOT NULL as has_changed_password
FROM users;

