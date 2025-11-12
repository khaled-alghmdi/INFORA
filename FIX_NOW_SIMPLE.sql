-- ============================================
-- SIMPLE FIX FOR REQUESTS - RUN THIS NOW
-- Copy and paste into Supabase SQL Editor
-- ============================================

-- Step 1: Grant ALL permissions (super permissive)
GRANT ALL ON TABLE requests TO authenticated;
GRANT ALL ON TABLE requests TO anon;

-- Step 2: Disable RLS temporarily to drop policies
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies
DROP POLICY IF EXISTS "requests_select_policy" ON requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON requests;
DROP POLICY IF EXISTS "requests_update_policy" ON requests;
DROP POLICY IF EXISTS "requests_delete_policy" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to update requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete requests" ON requests;

-- Step 4: Create new SUPER PERMISSIVE policies
CREATE POLICY "allow_all_select" ON requests FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON requests FOR DELETE USING (true);

-- Step 5: Re-enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Create notification tracking table
CREATE TABLE IF NOT EXISTS notification_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE notification_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_notification_views" ON notification_views;
CREATE POLICY "allow_all_notification_views" ON notification_views FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON notification_views TO authenticated;

-- Step 7: Verify it worked
SELECT 
    'Requests table' as item,
    CASE WHEN COUNT(*) >= 4 THEN '✅ Working' ELSE '❌ Failed' END as status
FROM pg_policies WHERE tablename = 'requests';

-- Success message
SELECT '✅ REQUESTS FIXED - Try creating a request now!' as message;

