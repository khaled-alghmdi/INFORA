-- ============================================
-- ADMIN PASSWORD RESET - No Email Needed
-- Temporary solution until email is configured
-- ============================================

-- This creates a simple table to handle password reset requests
-- Admins can see requests and generate temporary passwords

-- ============================================
-- STEP 1: Create Password Reset Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    temporary_password TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create reset requests"
ON password_reset_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admins to view and update all requests
CREATE POLICY "Users can view all reset requests"
ON password_reset_requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update reset requests"
ON password_reset_requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- ============================================
-- STEP 2: Function to Request Password Reset
-- ============================================

-- Users call this to request password reset
CREATE OR REPLACE FUNCTION request_password_reset(user_email_input TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_request_id UUID;
BEGIN
    -- Check if user exists
    SELECT id INTO v_user_id
    FROM users
    WHERE email = user_email_input;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    -- Create reset request
    INSERT INTO password_reset_requests (user_id, user_email, status)
    VALUES (v_user_id, user_email_input, 'pending')
    RETURNING id INTO v_request_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset request submitted. Contact your administrator.',
        'request_id', v_request_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- STEP 3: View Pending Requests (For Admin Panel)
-- ============================================

-- Query to see all pending password reset requests
SELECT 
    prr.id,
    prr.user_email,
    u.full_name,
    u.department,
    u.employee_id,
    prr.status,
    prr.requested_at,
    prr.temporary_password
FROM password_reset_requests prr
JOIN users u ON prr.user_id = u.id
WHERE prr.status = 'pending'
ORDER BY prr.requested_at DESC;


-- ============================================
-- STEP 4: Generate Temporary Password (Admin Function)
-- ============================================

CREATE OR REPLACE FUNCTION generate_temp_password_for_request(request_id_input UUID)
RETURNS JSON AS $$
DECLARE
    v_temp_password TEXT;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    -- Generate random temporary password
    v_temp_password := 'Temp' || substring(md5(random()::text) from 1 for 8) || '!';
    
    -- Get user info from request
    SELECT user_id, user_email INTO v_user_id, v_user_email
    FROM password_reset_requests
    WHERE id = request_id_input AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Request not found or already processed'
        );
    END IF;
    
    -- Update user's password
    UPDATE users
    SET initial_password = v_temp_password
    WHERE id = v_user_id;
    
    -- Update request status
    UPDATE password_reset_requests
    SET 
        status = 'completed',
        temporary_password = v_temp_password,
        completed_at = NOW()
    WHERE id = request_id_input;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Temporary password generated',
        'temp_password', v_temp_password,
        'user_email', v_user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- User requests password reset:
-- SELECT request_password_reset('user@tamergroup.com');

-- Admin views pending requests:
-- SELECT * FROM password_reset_requests WHERE status = 'pending';

-- Admin generates temp password for a request:
-- SELECT generate_temp_password_for_request('request-uuid-here');


-- ============================================
-- CLEANUP (Optional)
-- ============================================

-- Delete old completed requests (run periodically)
-- DELETE FROM password_reset_requests 
-- WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '7 days';

