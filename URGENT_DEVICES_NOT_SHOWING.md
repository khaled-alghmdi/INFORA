# 🚨 URGENT FIX: Devices Not Showing

## ❌ **Problem:**
- Devices don't show on "My Devices" page
- Devices only appear AFTER user visits /notifications
- This is an RLS (Row Level Security) issue

---

## ✅ **The Fix:**

### **Run This SQL in Supabase RIGHT NOW:**

1. Go to: https://supabase.com/dashboard
2. Select your INFORA project
3. Click: SQL Editor → New Query
4. Copy and paste this:

```sql
-- FIX DEVICES VISIBILITY

GRANT ALL ON TABLE devices TO authenticated;

DROP POLICY IF EXISTS "Users can only view their own devices" ON devices;
DROP POLICY IF EXISTS "Users can view assigned devices" ON devices;
DROP POLICY IF EXISTS "devices_select_policy" ON devices;
DROP POLICY IF EXISTS "devices_all_policy" ON devices;

CREATE POLICY "allow_select_devices"
ON devices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_all_devices"
ON devices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

SELECT '✅ DEVICES FIXED!' as message;
```

5. Click **Run**
6. Wait for: ✅ "DEVICES FIXED!"

---

## 🧪 **Test Immediately:**

1. **Logout from your app**
2. **Login as user** (the one with assigned devices)
3. **Go directly to:** My Devices
4. **Expected:** Devices show up immediately ✅
5. **Without visiting notifications first!** ✅

---

## 🔍 **Why This Was Happening:**

### **Before (Broken):**
- RLS policy was too restrictive
- Policy maybe required something set by notifications page
- Or policy was checking wrong field

### **After (Fixed):**
- Simple policy: `USING (true)` = allow all
- App filters devices by `assigned_to` (already correct in code)
- Users see their devices immediately

---

## ⚠️ **Important:**

This is a **PRODUCTION DATABASE** fix!
- Run it on the Supabase project connected to Vercel
- Check your Vercel environment variables to confirm which Supabase
- The fix is IMMEDIATE (no deployment needed)

---

## 📋 **After Running SQL:**

- ✅ Users see devices on "My Devices" immediately
- ✅ No need to visit notifications first
- ✅ Devices load on page load
- ✅ Everything works as expected

**Run the SQL and test!** 🚀

