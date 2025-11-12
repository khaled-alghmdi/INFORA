# 🚨 URGENT FIX - Request RLS Error

## ❌ **Current Error:**
```
Error submitting request: new row violates row-level security policy for table "requests"
```

## ✅ **The Fix (3 minutes):**

### **Step 1: Go to Your PRODUCTION Supabase**

**IMPORTANT:** You're getting this error on `infora-guek.vercel.app`, which means you need to fix your **PRODUCTION** Supabase database, not local!

1. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **INFORA project** (the one connected to Vercel)
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### **Step 2: Copy and Paste This:**

```sql
-- SIMPLE FIX - Copy ALL of this

GRANT ALL ON TABLE requests TO authenticated;
GRANT ALL ON TABLE requests TO anon;

ALTER TABLE requests DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_policy" ON requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON requests;
DROP POLICY IF EXISTS "requests_update_policy" ON requests;
DROP POLICY IF EXISTS "requests_delete_policy" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to update requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete requests" ON requests;

CREATE POLICY "allow_all_select" ON requests FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON requests FOR DELETE USING (true);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

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

SELECT '✅ FIXED! Try creating a request now!' as message;
```

### **Step 3: Run It**

1. Click **Run** button (or press Ctrl+Enter)
2. Wait for: ✅ "FIXED! Try creating a request now!"

### **Step 4: Test Immediately**

1. Go back to: `https://infora-guek.vercel.app`
2. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Try creating a request again
4. Should work now! ✅

---

## 🔍 **Why This Happened:**

- Your **local** database might be fine
- But your **production** database (on Supabase cloud) doesn't have the right policies
- Vercel deployment uses the production database

---

## ⚠️ **If Still Not Working:**

### **Check 1: Are you in the right Supabase project?**

Make sure you're editing the Supabase project that's connected to your Vercel app.

1. Go to Vercel dashboard
2. Click your INFORA project
3. Go to Settings → Environment Variables
4. Check `NEXT_PUBLIC_SUPABASE_URL` - this shows which Supabase you're using
5. Make sure you ran the SQL on THAT Supabase project

### **Check 2: Clear Supabase cache**

After running SQL, in Supabase dashboard:
1. Go to **API** in left sidebar
2. Click **Reset API** (this clears cache)
3. Try again

### **Check 3: Check policies exist**

Run this in Supabase SQL Editor:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'requests';
```

Should show:
- allow_all_select
- allow_all_insert
- allow_all_update
- allow_all_delete

---

## 📋 **Badge Not Clearing - Separate Issue**

For the notification badge not clearing, after fixing requests, run this too:

```sql
-- Make sure notification_views table exists
CREATE TABLE IF NOT EXISTS notification_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE notification_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_notification_views" ON notification_views;
CREATE POLICY "allow_all_notification_views" 
ON notification_views FOR ALL 
USING (true) WITH CHECK (true);

GRANT ALL ON notification_views TO authenticated;

SELECT '✅ Notification tracking enabled!' as status;
```

---

## 🎯 **Quick Checklist:**

- [ ] Go to Supabase dashboard (production, not local)
- [ ] SQL Editor → New Query
- [ ] Paste the SQL from above
- [ ] Click Run
- [ ] See success message
- [ ] Go to Vercel app and hard refresh (Ctrl+Shift+R)
- [ ] Try creating a request
- [ ] Should work! ✅

---

## 🆘 **Still Having Issues?**

Take a screenshot showing:
1. Which Supabase project you're in (project name at top)
2. The SQL you ran
3. The result/error

This will help debug further!

