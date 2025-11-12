# 🔒 Row Level Security (RLS) Setup Guide - INFORA

## Overview

Row Level Security (RLS) is a PostgreSQL/Supabase feature that controls which rows users can access in database tables. This is essential for securing your INFORA application.

---

## 📋 Quick Check

### Option 1: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Tables**
3. Click on each table (devices, users, assignments, requests)
4. Check if **"RLS enabled"** is shown
5. Click **"View RLS Policies"** to see configured policies

### Option 2: Using SQL (Recommended)

Run the SQL file in your Supabase SQL Editor:

**File:** `check-rls-policies.sql`

---

## 🔍 How to Check RLS Status

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Project
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run Check Query

Copy and paste this query:

```sql
-- Check RLS status on all tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ RLS ENABLED' 
        ELSE '✗ RLS DISABLED' 
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename;
```

### Expected Result

You should see:

| tablename | rls_status |
|-----------|------------|
| devices | ✓ RLS ENABLED |
| users | ✓ RLS ENABLED |
| assignments | ✓ RLS ENABLED |
| requests | ✓ RLS ENABLED |

---

## 🛠️ Setting Up RLS (If Not Configured)

### Quick Setup

If RLS is **NOT** enabled, follow these steps:

#### Step 1: Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
```

#### Step 2: Create Policies

Run the complete setup script:

**File:** `setup-rls-policies.sql`

Or use the **Automated Setup** (recommended):

```sql
-- This script enables RLS and creates all necessary policies
-- Just copy the entire content of setup-rls-policies.sql and run it
```

---

## 📊 Verify Policies

### Check All Policies

```sql
-- View all RLS policies
SELECT 
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename, policyname;
```

### Expected Policies (Minimum)

Each table should have at least these policies:

**DEVICES:**
- ✓ Allow authenticated users to read devices (SELECT)
- ✓ Allow authenticated users to insert devices (INSERT)
- ✓ Allow authenticated users to update devices (UPDATE)
- ✓ Allow authenticated users to delete devices (DELETE)

**USERS:**
- ✓ Allow authenticated users to read users (SELECT)
- ✓ Allow authenticated users to insert users (INSERT)
- ✓ Allow authenticated users to update users (UPDATE)
- ✓ Allow authenticated users to delete users (DELETE)

**ASSIGNMENTS:**
- ✓ Allow authenticated users to read assignments (SELECT)
- ✓ Allow authenticated users to insert assignments (INSERT)
- ✓ Allow authenticated users to update assignments (UPDATE)
- ✓ Allow authenticated users to delete assignments (DELETE)

**REQUESTS:**
- ✓ Allow authenticated users to read requests (SELECT)
- ✓ Allow authenticated users to insert requests (INSERT)
- ✓ Allow authenticated users to update requests (UPDATE)
- ✓ Allow authenticated users to delete requests (DELETE)

---

## 🎯 RLS Policy Types

### 1. Permissive Policies (Recommended)

Allow access to rows that match the condition:

```sql
CREATE POLICY "policy_name"
ON table_name FOR SELECT
TO authenticated
USING (true);  -- Allow all rows
```

### 2. Restrictive Policies (Advanced)

Restrict access based on conditions:

```sql
CREATE POLICY "users_can_only_see_own_data"
ON requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());  -- Only see own data
```

---

## 🔐 Security Levels

### Level 1: Open Access (Current Setup)

All authenticated users can access all data:

```sql
USING (true)
WITH CHECK (true)
```

✅ **Good for:** Internal company systems
⚠️ **Note:** Relies on application-level authorization

### Level 2: User-Scoped Access (Advanced)

Users can only access their own data:

```sql
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```

✅ **Good for:** Public-facing applications
⚠️ **Note:** Requires proper user_id columns

### Level 3: Role-Based Access (Most Secure)

Different access levels for different roles:

```sql
-- Admins can see everything
CREATE POLICY "admins_all_access"
ON requests FOR ALL
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Regular users can only see their own
CREATE POLICY "users_own_data"
ON requests FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

---

## 🧪 Testing RLS

### Test 1: Check if RLS is Working

```sql
-- Try to access data without proper authentication
-- This should fail if RLS is properly configured
SET ROLE anon;
SELECT * FROM devices;
RESET ROLE;
```

### Test 2: Verify Policies

```sql
-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected:** 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

---

## 🚨 Troubleshooting

### Issue 1: "Permission Denied" Errors

**Symptom:** Users can't access data even when logged in

**Solution:**
```sql
-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON devices TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON requests TO authenticated;
```

### Issue 2: RLS Not Enforced

**Symptom:** Everyone can access all data

**Solution:**
```sql
-- Ensure RLS is enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
```

### Issue 3: Policies Not Working

**Symptom:** Policies exist but don't apply

**Solution:**
```sql
-- Drop and recreate policies
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name FOR SELECT TO authenticated USING (true);
```

---

## 📝 Quick Commands Reference

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Disable RLS (not recommended)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "policy_name" ON table_name FOR SELECT TO authenticated USING (true);

-- Drop policy
DROP POLICY "policy_name" ON table_name;

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## ✅ RLS Setup Checklist

- [ ] RLS enabled on `devices` table
- [ ] RLS enabled on `users` table
- [ ] RLS enabled on `assignments` table
- [ ] RLS enabled on `requests` table
- [ ] SELECT policies created for all tables
- [ ] INSERT policies created for all tables
- [ ] UPDATE policies created for all tables
- [ ] DELETE policies created for all tables
- [ ] Permissions granted to authenticated role
- [ ] Tested policies with authenticated user
- [ ] Verified policies in Supabase Dashboard

---

## 🎓 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## 📞 Support

If you encounter issues with RLS setup:

1. Run `check-rls-policies.sql` to diagnose
2. Check Supabase logs in Dashboard → Logs
3. Verify authentication is working
4. Test policies one at a time

---

**Last Updated:** November 12, 2024  
**Status:** ✅ Ready to use

