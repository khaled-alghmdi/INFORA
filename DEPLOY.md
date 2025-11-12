# 🚀 INFORA Deployment Guide

## Quick Start - Deploy to Vercel (Recommended)

### Prerequisites
- A GitHub account
- Your Supabase URL and Anon Key
- Project pushed to GitHub

---

## Option 1: Vercel Web Interface (Easiest) ⭐

### Step 1: Push to GitHub
```powershell
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Login"** with GitHub
3. Click **"Add New Project"**
4. Find and select your **INFORA** repository
5. Vercel will automatically detect it's a Next.js app

### Step 3: Configure Environment Variables
Before deploying, add these environment variables:

- **Variable Name:** `NEXT_PUBLIC_SUPABASE_URL`
  - **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

- **Variable Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **Value:** Your Supabase anon/public key

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Option 2: Vercel CLI (For Advanced Users)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Login to Vercel
```powershell
vercel login
```

### Step 3: Deploy
```powershell
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → infora (or your choice)
- **In which directory is your code located?** → ./ (current directory)

### Step 4: Add Environment Variables
After deployment, add environment variables in one of two ways:

**Option A: Via Vercel Dashboard**
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add the Supabase variables
4. Redeploy: `vercel --prod`

**Option B: Via CLI**
```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your Supabase anon key when prompted
```

### Step 5: Deploy to Production
```powershell
vercel --prod
```

---

## Option 3: Netlify

### Step 1: Push to GitHub (if not done)
```powershell
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy on Netlify
1. Go to [https://netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to **GitHub** and select your repository

### Step 3: Configure Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Base directory:** (leave empty)

### Step 4: Add Environment Variables
In **Site settings** → **Environment variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Deploy
Click **"Deploy site"**

---

## Option 4: Railway

### Step 1: Deploy on Railway
1. Go to [https://railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your INFORA repository

### Step 2: Configure Environment Variables
In the **Variables** tab, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Railway will automatically detect and deploy your Next.js app.

---

## Post-Deployment Steps

### 1. Update Supabase Allowed URLs
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your deployment URL to **Site URL** and **Redirect URLs**:
   - Example: `https://infora.vercel.app`

### 2. Test Your Deployment
- Visit your deployed URL
- Test login functionality
- Check database connections
- Verify all pages load correctly

### 3. Custom Domain (Optional)
To add a custom domain:

**On Vercel:**
1. Go to your project settings
2. Click **Domains**
3. Add your custom domain
4. Update DNS records as instructed

**On Netlify:**
1. Go to **Domain management**
2. Click **Add custom domain**
3. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails on Deployment Platform
- Check the build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Can't Connect to Supabase
- Double-check your Supabase URL and anon key
- Ensure they start with `NEXT_PUBLIC_` for client-side access
- Verify your Supabase project is active

### 404 Errors on Pages
- Ensure all pages are in the `app/` directory
- Check for TypeScript errors
- Verify file names are correct (case-sensitive)

### Environment Variables Not Working
- Make sure they're prefixed with `NEXT_PUBLIC_`
- Redeploy after adding environment variables
- Clear cache and rebuild

---

## Local Development (After Fixing Node Issues)

If you want to fix local development:

### Option 1: Use Node Version Manager (nvm)
```powershell
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows

# Install Node 18 (more stable with Next.js 14)
nvm install 18.18.0
nvm use 18.18.0

# Try building again
npm install
npm run build
```

### Option 2: Move Project Outside OneDrive
OneDrive sync can cause issues with `node_modules`. Consider moving your project to:
- `C:\Projects\INFORA`
- `C:\Dev\INFORA`

Then reinstall:
```powershell
cd C:\Projects\INFORA
npm install
npm run build
```

---

## Quick Reference

### Vercel Domains
- Production: `https://your-project.vercel.app`
- Preview: Automatic for each git push

### Useful Commands
```powershell
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List all projects
vercel list
```

---

## Support & Resources

- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## 🎉 You're Ready to Deploy!

The easiest path is:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Click Deploy

Your app will be live in minutes! 🚀

