-- ============================================
-- ENABLE REALTIME FOR REQUESTS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Enable Realtime Replication (with error handling)
-- ============================================

-- Enable realtime for requests table (with IF NOT EXISTS check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE requests;
    RAISE NOTICE '✅ Realtime enabled for requests table';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime already enabled for requests table';
  END IF;
END $$;

-- Enable realtime for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
    RAISE NOTICE '✅ Realtime enabled for users table';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime already enabled for users table';
  END IF;
END $$;

-- Enable realtime for devices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE devices;
    RAISE NOTICE '✅ Realtime enabled for devices table';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime already enabled for devices table';
  END IF;
END $$;

-- Enable realtime for assignments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
    RAISE NOTICE '✅ Realtime enabled for assignments table';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime already enabled for assignments table';
  END IF;
END $$;

-- ============================================
-- STEP 2: Set Row Level Security (Optional - Skip if using localStorage auth)
-- ============================================
-- NOTE: RLS policies are commented out because your app uses localStorage auth
-- Only uncomment if you migrate to Supabase Auth

-- Enable RLS on requests (if not already enabled)
-- ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
-- DROP POLICY IF EXISTS "Users can view their own requests" ON requests;
-- DROP POLICY IF EXISTS "Admins can view all requests" ON requests;
-- DROP POLICY IF EXISTS "Users can create requests" ON requests;
-- DROP POLICY IF EXISTS "Admins can update requests" ON requests;

-- Policy: Users can see their own requests
-- CREATE POLICY "Users can view their own requests"
-- ON requests FOR SELECT
-- USING (auth.uid()::text = user_id);

-- Policy: Admins can see all requests
-- CREATE POLICY "Admins can view all requests"
-- ON requests FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()::text
--     AND users.role = 'admin'
--   )
-- );

-- Policy: Users can create their own requests
-- CREATE POLICY "Users can create requests"
-- ON requests FOR INSERT
-- WITH CHECK (auth.uid()::text = user_id);

-- Policy: Admins can update requests
-- CREATE POLICY "Admins can update requests"
-- ON requests FOR UPDATE
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()::text
--     AND users.role = 'admin'
--   )
-- );

-- ============================================
-- VERIFY REALTIME IS ENABLED
-- ============================================
SELECT 
  schemaname,
  tablename,
  'Realtime Enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('requests', 'users', 'devices', 'assignments');

-- If the above query returns rows, realtime is enabled!

-- ============================================
-- TEST REALTIME
-- ============================================
-- After running this script:
-- 1. Open your app in two browser windows
-- 2. Update a request status in one window
-- 3. The other window should update automatically!

SELECT '✅ Realtime enabled for requests! Changes will sync automatically.' AS status;

