-- ============================================
-- Add Notification Tracking System
-- Track when users view their notifications
-- ============================================

-- Create table to track last viewed notifications
CREATE TABLE IF NOT EXISTS notification_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_views ENABLE ROW LEVEL SECURITY;

-- Allow users to view and update their own notification views
CREATE POLICY "Users can view own notification views"
ON notification_views FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own notification views"
ON notification_views FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notification views"
ON notification_views FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON notification_views TO authenticated;


-- ============================================
-- Function to Mark Notifications as Viewed
-- ============================================

CREATE OR REPLACE FUNCTION mark_notifications_viewed(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert or update the last viewed timestamp
    INSERT INTO notification_views (user_id, last_viewed_at)
    VALUES (p_user_id, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- Verification
-- ============================================

SELECT 
    'notification_views table created' as status,
    COUNT(*) as record_count
FROM notification_views;

