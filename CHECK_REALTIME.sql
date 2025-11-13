-- ============================================
-- CHECK AND VERIFY REALTIME STATUS
-- Run this to see if realtime is enabled
-- ============================================

-- Check which tables have realtime enabled
SELECT 
  tablename,
  '✅ Realtime Enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('requests', 'users', 'devices', 'assignments')
ORDER BY tablename;

-- If tables are missing from above, enable them with:
-- (Only run the ones that are missing)

-- For requests table (if missing):
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables 
--     WHERE pubname = 'supabase_realtime' AND tablename = 'requests'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE requests;
--   END IF;
-- END $$;

-- For users table (if missing):
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables 
--     WHERE pubname = 'supabase_realtime' AND tablename = 'users'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE users;
--   END IF;
-- END $$;

-- For devices table (if missing):
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables 
--     WHERE pubname = 'supabase_realtime' AND tablename = 'devices'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE devices;
--   END IF;
-- END $$;

-- For assignments table (if missing):
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables 
--     WHERE pubname = 'supabase_realtime' AND tablename = 'assignments'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
--   END IF;
-- END $$;

-- ============================================
-- FINAL STATUS
-- ============================================
SELECT '✅ Realtime check complete! See results above.' AS status;

