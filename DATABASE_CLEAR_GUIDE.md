# 🗑️ Database Clear Guide - Keep Only khalid.alghamdi@tamergroup.com

## ⚠️ **IMPORTANT WARNING**

This will **permanently delete** all data except records related to `khalid.alghamdi@tamergroup.com`

**Before proceeding:**
1. ✅ Backup your database
2. ✅ Verify you want to delete all other data
3. ✅ Understand this action is irreversible

---

## 📁 **Available Scripts**

### 1. **`clear-database-keep-khalid-safe.sql`** ⭐ RECOMMENDED
- **Safe version** with dry run
- Shows what will be deleted BEFORE deletion
- Requires manual uncomment to execute
- Best for first-time use

### 2. **`clear-database-keep-khalid.sql`**
- Direct deletion script
- Immediate execution
- Use only if you're 100% sure

---

## 🚀 **Step-by-Step Guide**

### Step 1: Run Dry Run (Safety Check)

1. Open **Supabase SQL Editor**
2. Copy content from `clear-database-keep-khalid-safe.sql`
3. Run **STEP 1** and **STEP 2** only (leave deletion commented)
4. Review the output to see what will be deleted

**Example Output:**
```
USERS TO DELETE: 15
REQUESTS TO DELETE: 45
ASSIGNMENTS TO DELETE: 28
DEVICES TO UNASSIGN: 12

✓ KHALID - WILL BE KEPT
khalid.alghamdi@tamergroup.com
```

### Step 2: Verify Khalid's Data

Check that Khalid's data will be preserved:

```sql
-- Run this query
SELECT * FROM users 
WHERE email = 'khalid.alghamdi@tamergroup.com';
```

### Step 3: Execute Deletion (When Ready)

**Option A: Safe Method**
1. In `clear-database-keep-khalid-safe.sql`
2. Uncomment STEP 3 (remove `/*` and `*/`)
3. Run the script

**Option B: Direct Method**
1. Use `clear-database-keep-khalid.sql`
2. Run the entire script
3. Check verification queries

---

## 📊 **What Gets Deleted**

| Data Type | Action |
|-----------|--------|
| ❌ **Other Users** | DELETED |
| ❌ **Their Requests** | DELETED |
| ❌ **Their Assignments** | DELETED |
| ⚠️ **Their Devices** | UNASSIGNED (set to available) |
| ✅ **Khalid's User** | KEPT |
| ✅ **Khalid's Requests** | KEPT |
| ✅ **Khalid's Assignments** | KEPT |
| ✅ **Khalid's Devices** | KEPT (still assigned) |

---

## 🔍 **Verification Queries**

### Before Deletion

```sql
-- Count all users
SELECT COUNT(*) as total_users FROM users;

-- Count Khalid's records
SELECT 
    (SELECT COUNT(*) FROM users WHERE email = 'khalid.alghamdi@tamergroup.com') as khalid_user,
    (SELECT COUNT(*) FROM requests WHERE user_id IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com')) as khalid_requests,
    (SELECT COUNT(*) FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com')) as khalid_assignments;
```

### After Deletion

```sql
-- Verify only 1 user remains
SELECT COUNT(*) as remaining_users FROM users;

-- Show remaining user
SELECT email, full_name, role FROM users;

-- Check all tables
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'requests', COUNT(*) FROM requests;
```

---

## 🛡️ **Safety Features**

### Built-in Safeguards

1. **Email verification** - Only keeps exact match: `khalid.alghamdi@tamergroup.com`
2. **Foreign key preservation** - Handles relationships properly
3. **No device deletion** - Devices are unassigned, not deleted
4. **Verification queries** - Check results after deletion

### Manual Backup (Recommended)

```sql
-- Backup users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Backup devices table
CREATE TABLE devices_backup AS SELECT * FROM devices;

-- Backup assignments table
CREATE TABLE assignments_backup AS SELECT * FROM assignments;

-- Backup requests table
CREATE TABLE requests_backup AS SELECT * FROM requests;
```

---

## 📋 **Execution Checklist**

- [ ] 1. Backup database
- [ ] 2. Run dry run queries
- [ ] 3. Review what will be deleted
- [ ] 4. Verify Khalid's data exists
- [ ] 5. Confirm you want to proceed
- [ ] 6. Execute deletion script
- [ ] 7. Run verification queries
- [ ] 8. Check Khalid can still login
- [ ] 9. Verify Khalid's devices are still assigned
- [ ] 10. Test application functionality

---

## 🔄 **Restore from Backup (If Needed)**

If you created backups:

```sql
-- Restore users
INSERT INTO users SELECT * FROM users_backup;

-- Restore devices
INSERT INTO devices SELECT * FROM devices_backup;

-- Restore assignments
INSERT INTO assignments SELECT * FROM assignments_backup;

-- Restore requests
INSERT INTO requests SELECT * FROM requests_backup;
```

---

## 🎯 **Quick Command (For Experts)**

If you're 100% sure and want immediate execution:

```sql
-- WARNING: Immediate deletion without confirmation!
BEGIN;

DELETE FROM requests WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com');
DELETE FROM assignments WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com');
UPDATE devices SET assigned_to = NULL, assigned_date = NULL, status = 'available' WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com');
DELETE FROM users WHERE email != 'khalid.alghamdi@tamergroup.com';

COMMIT;
```

---

## 📞 **Support**

If something goes wrong:
1. Check if backups exist
2. Review Supabase logs
3. Verify RLS policies are not blocking
4. Check foreign key constraints

---

## ✅ **Expected Final State**

After successful execution:

| Table | Records |
|-------|---------|
| **users** | 1 (khalid.alghamdi@tamergroup.com) |
| **devices** | All (unassigned except Khalid's) |
| **assignments** | Only Khalid's |
| **requests** | Only Khalid's |

---

**Last Updated:** November 12, 2024  
**Status:** ✅ Ready to use  
**Risk Level:** 🔴 HIGH - Permanent deletion

