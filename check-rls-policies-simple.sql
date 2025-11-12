-- ============================================
-- INFORA - Simple RLS Check (No Errors)
-- Quick and easy RLS status check
-- ============================================

-- ============================================
-- 1. CHECK IF RLS IS ENABLED ON YOUR TABLES
-- ============================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS ENABLED' 
        ELSE '✗ RLS DISABLED' 
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename;


-- ============================================
-- 2. LIST ALL RLS POLICIES (SIMPLE VIEW)
-- ============================================

SELECT 
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename, policyname;


-- ============================================
-- 3. COUNT POLICIES PER TABLE
-- ============================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✓ FULLY CONFIGURED'
        WHEN COUNT(*) > 0 THEN '⚠ PARTIAL CONFIGURATION'
        ELSE '✗ NO POLICIES'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
GROUP BY tablename
ORDER BY tablename;


-- ============================================
-- 4. SUMMARY REPORT
-- ============================================

SELECT 
    'Total Tables' as metric,
    COUNT(DISTINCT tablename)::text as value
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')

UNION ALL

SELECT 
    'Tables with RLS Enabled' as metric,
    COUNT(DISTINCT tablename)::text as value
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
    AND rowsecurity = true

UNION ALL

SELECT 
    'Total Policies' as metric,
    COUNT(*)::text as value
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')

UNION ALL

SELECT 
    'Tables Without RLS' as metric,
    COUNT(DISTINCT tablename)::text as value
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
    AND rowsecurity = false;


-- ============================================
-- 5. DETAILED POLICY VIEW (IF NEEDED)
-- ============================================

-- Uncomment to see full policy details
/*
SELECT 
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation,
    roles::text as applies_to,
    pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_clause,
    pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) as check_clause
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename, policyname;
*/

