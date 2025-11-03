# INFORA Setup Guide

This guide will help you set up the INFORA IT Device Inventory Management System step by step.

## Step 1: Install Node.js

Make sure you have Node.js 18 or higher installed. Check your version:

```bash
node --version
```

If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/)

## Step 2: Clone/Download the Project

If you received this as a ZIP file, extract it. If it's a Git repository:

```bash
git clone <repository-url>
cd INFORA
```

## Step 3: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages (Next.js, React, Supabase, Tailwind CSS, etc.)

## Step 4: Create a Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - **Name**: INFORA (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is sufficient for testing

5. Wait for the project to be created (takes 1-2 minutes)

## Step 5: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon)
2. Go to **API** section
3. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API keys** - Copy the `anon` `public` key

## Step 6: Create Environment File

1. In the project root directory, create a file named `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual credentials from Step 5.

## Step 7: Set Up the Database

### Option A: Using Supabase Dashboard (Recommended)

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

8. Repeat the process for `supabase/migrations/002_seed_data.sql` to add sample data

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
supabase db push
```

## Step 8: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see three tables:
   - `users`
   - `devices`
   - `assignments`

3. Click on each table to verify they have data (if you ran the seed migration)

## Step 9: Run the Development Server

In your terminal, run:

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
```

## Step 10: Access the Application

1. Open your web browser
2. Go to `http://localhost:3000`
3. You should see the INFORA dashboard!

## Troubleshooting

### Issue: "Failed to fetch" or connection errors

**Solution**: 
- Check your `.env.local` file has the correct Supabase credentials
- Make sure there are no extra spaces in the environment variables
- Restart the development server

### Issue: "Table does not exist"

**Solution**:
- Make sure you ran both SQL migration files in the correct order
- Check the SQL Editor in Supabase for any error messages
- Verify the tables exist in the Table Editor

### Issue: "Module not found" errors

**Solution**:
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Issue: Port 3000 is already in use

**Solution**:
- Run on a different port: `npm run dev -- -p 3001`
- Or stop the other process using port 3000

## Next Steps

After successful setup:

1. **Explore the Dashboard**: View analytics and statistics
2. **Add Devices**: Go to Devices page and add your IT equipment
3. **Add Users**: Go to Users page and add your team members
4. **Assign Devices**: Assign devices to users
5. **Generate Reports**: Create PDF reports from the Reports page

## Sample Data

If you ran the seed data migration, you have:

- **5 sample users** (including 1 admin)
- **10 sample devices** (various types)
- **Sample assignments** already in place

You can edit or delete these and add your own data.

## Production Deployment

When ready to deploy:

```bash
npm run build
npm start
```

You can deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS**
- Any Node.js hosting platform

## Support

If you encounter issues:
1. Check the main README.md file
2. Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
3. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

**Congratulations!** You've successfully set up INFORA. 🎉

