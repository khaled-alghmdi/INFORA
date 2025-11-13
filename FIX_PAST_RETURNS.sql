-- ============================================
-- FIX PAST RETURNS - Update Missing Return Dates
-- Run this ONCE to fix past returns
-- ============================================

-- ============================================
-- STEP 1: Find devices that were returned but not recorded
-- ============================================
-- These are assignments where:
-- 1. Device is now "available" (was returned)
-- 2. But return_date is NULL (wasn't recorded)

SELECT 
  a.id as assignment_id,
  a.assigned_date,
  a.return_date,
  d.name as device_name,
  d.serial_number,
  d.status as current_device_status,
  u.full_name as user_name
FROM assignments a
JOIN devices d ON d.id = a.device_id
JOIN users u ON u.id = a.user_id
WHERE a.return_date IS NULL
  AND d.assigned_to IS NULL
  AND d.status = 'available'
ORDER BY a.assigned_date DESC;

-- ============================================
-- STEP 2: Fix Dell Pro 14 specifically (Serial: 261208)
-- ============================================
-- Update the assignment for Dell Pro 14 to mark it as returned today
UPDATE assignments
SET return_date = NOW()
WHERE device_id = (
  SELECT id FROM devices WHERE serial_number = '261208'
)
AND return_date IS NULL
AND assigned_date = (
  SELECT MAX(assigned_date) 
  FROM assignments 
  WHERE device_id = (SELECT id FROM devices WHERE serial_number = '261208')
);

-- ============================================
-- STEP 3: Fix ALL past unreturned assignments (OPTIONAL)
-- ============================================
-- Uncomment below to fix ALL devices that were returned but not recorded

-- UPDATE assignments
-- SET return_date = NOW()
-- WHERE return_date IS NULL
--   AND device_id IN (
--     SELECT id FROM devices 
--     WHERE assigned_to IS NULL 
--     AND status = 'available'
--   );

-- ============================================
-- STEP 4: Verify the fix
-- ============================================
-- Check if Dell Pro 14 return is now recorded
SELECT 
  a.assigned_date,
  a.return_date,
  d.name as device_name,
  d.serial_number,
  u.full_name as user_name,
  CASE 
    WHEN a.return_date IS NOT NULL THEN '✓ Return Recorded'
    ELSE '✗ Return Missing'
  END as status
FROM assignments a
JOIN devices d ON d.id = a.device_id
JOIN users u ON u.id = a.user_id
WHERE d.serial_number = '261208'
ORDER BY a.assigned_date DESC
LIMIT 5;

SELECT '✅ Past returns fixed! Generate report again to see all actions.' AS status;

