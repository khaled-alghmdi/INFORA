# INFORA Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- A Supabase project set up with your database schema
- A GitHub account (recommended for easy deployment)
- Your Supabase URL and Anon Key ready

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

Vercel is the best choice for Next.js applications as it's built by the same team.

#### Step-by-Step Instructions:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables**:
   In the Vercel project settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live in ~2 minutes!

#### Vercel CLI Method (Alternative):

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

---

### Option 2: Netlify

1. **Push code to GitHub** (if not already)

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Environment Variables**:
   Go to Site settings → Environment variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Deploy**

---

### Option 3: Railway

1. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Environment Variables**:
   Add in the Variables tab:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Railway will automatically detect and deploy your Next.js app

---

## Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd INFORA
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## Important Notes

### Before Deploying:

1. **Test your build locally**:
   ```bash
   npm run build
   npm start
   ```
   This ensures everything works in production mode.

2. **Check for errors**:
   ```bash
   npm run lint
   ```

3. **Ensure all untracked files are committed**:
   ```bash
   git status
   git add .
   git commit -m "Add new features"
   ```

### Supabase Setup:

Make sure your Supabase database has the required tables:
- `devices`
- `users`
- `assignments`
- `requests`
- `activity_logs` (if used)

You can run your SQL migrations in the Supabase SQL Editor.

---

## Post-Deployment

### Update Supabase URL Whitelist:

1. Go to Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Add your deployment URL to the allowed redirect URLs

### Custom Domain (Optional):

Both Vercel and Netlify support custom domains:
- In your platform dashboard, go to Settings → Domains
- Add your custom domain and follow DNS configuration instructions

---

## Troubleshooting

### Build Fails:
- Check for TypeScript errors: `npm run build`
- Ensure all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working:
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Clear cache and rebuild

### Database Connection Issues:
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Ensure Row Level Security (RLS) policies are configured

---

## Quick Deploy with Vercel (Fastest Method)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy with one command
vercel --prod

# When prompted:
# - Set up and deploy? Y
# - Which scope? Select your account
# - Link to existing project? N
# - Project name? infora (or your choice)
# - Directory? ./
# - Override settings? N

# 4. Add environment variables in the Vercel dashboard
# Then redeploy: vercel --prod
```

---

## Support

For issues or questions:
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)

