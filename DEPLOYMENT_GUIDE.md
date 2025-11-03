# 🚀 Vercel Deployment Guide - INFORA

Complete step-by-step guide to deploy INFORA to Vercel.

---

## Prerequisites

Before deploying, ensure you have:
- ✅ GitHub/GitLab/Bitbucket account
- ✅ Vercel account (free tier works fine)
- ✅ Supabase project set up
- ✅ All code committed to Git repository

---

## 📋 Pre-Deployment Checklist

### 1. **Verify Project Structure**
```bash
INFORA/
├── app/
├── components/
├── lib/
├── public/
├── package.json
├── next.config.js
├── vercel.json          ← Created
└── .vercelignore        ← Created
```

### 2. **Test Locally**
```bash
npm run build
npm start
```
Make sure there are no build errors!

### 3. **Environment Variables**
You'll need these from Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🎯 Deployment Steps

### **Method 1: Deploy via Vercel Dashboard (Recommended)**

#### Step 1: Push to Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add remote repository
git remote add origin YOUR_REPOSITORY_URL

# Push to main branch
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Select your Git provider (GitHub/GitLab/Bitbucket)
4. **Import** the INFORA repository

#### Step 3: Configure Project

**Framework Preset:**
- Should auto-detect as **Next.js** ✅

**Build Settings:**
- Build Command: `npm run build` (auto-filled)
- Output Directory: `.next` (auto-filled)
- Install Command: `npm install` (auto-filled)

**Root Directory:**
- Leave as `./` (root)

#### Step 4: Add Environment Variables

Click **"Environment Variables"** section:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://dmsncyknmivvutrhcfhi.supabase.co
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc25jeWtubWl2dnV0cmhjZmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzUwMDQsImV4cCI6MjA3Nzc1MTAwNH0.G7B1biO7pdAiiKog555lyb4N1Khi2f4vvwv58RcicgM
```

**Select:** All (Production, Preview, Development)

#### Step 5: Deploy!

Click **"Deploy"** button

⏳ Wait 2-3 minutes for build and deployment

🎉 Done! You'll get a URL like: `https://infora-xxx.vercel.app`

---

### **Method 2: Deploy via Vercel CLI**

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy

```bash
# From project root
vercel
```

**Answer the prompts:**
- Set up and deploy? `Y`
- Which scope? Select your account
- Link to existing project? `N` (first time)
- What's your project's name? `infora` (or your choice)
- In which directory is your code located? `./`
- Auto-detected Next.js, continue? `Y`
- Override build settings? `N`

#### Step 4: Add Environment Variables

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## 🔧 Configuration Files Explained

### **vercel.json**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

- `buildCommand`: Command to build the project
- `devCommand`: Command for local development
- `framework`: Tells Vercel this is Next.js
- `regions`: Deploy to US East (closest to Supabase)

### **.vercelignore**
Tells Vercel which files to ignore during deployment (similar to .gitignore)

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. Go to your project dashboard on Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `infora.yourcompany.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

### Example DNS Records

**For subdomain (infora.example.com):**
```
Type: CNAME
Name: infora
Value: cname.vercel-dns.com
```

**For root domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

---

## 📊 Post-Deployment Verification

### 1. **Check Build Logs**
- Go to Vercel dashboard
- Click on your deployment
- Check "Building" tab for any errors

### 2. **Test the Application**
Visit your deployment URL and verify:
- ✅ Login page loads
- ✅ Sign up works
- ✅ Dashboard displays
- ✅ All pages accessible
- ✅ Database connected (try adding a device)
- ✅ Reports generate

### 3. **Check Environment Variables**
```bash
# In Vercel dashboard
Settings → Environment Variables

Verify both variables are set for all environments
```

### 4. **Test Authentication**
- Create a test account
- Login successfully
- Verify user session persists

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Vercel automatically deploys when you push to Git!

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically builds and deploys! 🚀
```

### Branch Deployments

Each Git branch gets its own preview URL:
- `main` branch → Production (`infora.vercel.app`)
- `develop` branch → Preview (`infora-git-develop.vercel.app`)

---

## 🐛 Troubleshooting

### **Build Fails**

**Error: "Module not found"**
```bash
# Solution: Ensure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

**Error: "Build exceeded time limit"**
```bash
# Solution: Optimize build
# Check for large files or infinite loops
```

### **App Not Loading**

**Check Environment Variables:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verify both Supabase variables are set
3. Click "Redeploy" if you just added them

**Check Build Logs:**
1. Go to Deployments tab
2. Click on latest deployment
3. Check "Building" and "Function" logs

### **Database Not Connecting**

1. Verify Supabase URL is correct
2. Check Supabase project is active
3. Verify RLS policies are set
4. Check Supabase dashboard for errors

### **Images Not Loading**

```bash
# Ensure images are in public/ folder
public/
  ├── Tamer_logo.png  ✅
  └── other-images/
```

---

## 🎛️ Environment Management

### Development
```bash
vercel env add VARIABLE_NAME development
```

### Preview (Staging)
```bash
vercel env add VARIABLE_NAME preview
```

### Production
```bash
vercel env add VARIABLE_NAME production
```

---

## 📈 Performance Optimization

### Vercel Analytics (Optional)

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. Enable **Vercel Analytics**
4. Get insights on:
   - Page load times
   - User visits
   - Performance metrics

### Speed Insights

```bash
npm install @vercel/speed-insights
```

Add to `app/layout.tsx`:
```typescript
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## 🔐 Security Best Practices

### 1. **Environment Variables**
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel dashboard to manage secrets
- ✅ Rotate keys periodically

### 2. **Database Security**
- ✅ Supabase RLS policies enabled
- ✅ Use anon key (not service_role) in frontend
- ✅ Verify policies in Supabase dashboard

### 3. **Domain Security**
```bash
# In Vercel, under Settings → Security:
- Enable HTTPS (auto-enabled)
- Add security headers
- Enable DDoS protection (Pro plan)
```

---

## 📱 Mobile Testing

After deployment, test on mobile:
1. Visit your Vercel URL on mobile device
2. Test responsive design
3. Verify touch interactions
4. Check PWA features (if enabled)

---

## 🎉 Success Checklist

After deployment, you should have:
- ✅ Live URL: `https://infora-xxx.vercel.app`
- ✅ Auto-deploy on Git push
- ✅ Environment variables configured
- ✅ All features working
- ✅ Database connected
- ✅ Authentication functional
- ✅ Reports generating
- ✅ Fast load times (<2s)

---

## 📞 Support Resources

### Vercel Documentation
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

### Common Commands
```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel logs              # View deployment logs
vercel env ls            # List environment variables
vercel domains ls        # List domains
vercel rollback          # Rollback to previous deployment
```

---

## 🚀 Quick Deploy (TL;DR)

```bash
# 1. Push to Git
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to vercel.com
# 3. Click "New Project"
# 4. Import your repository
# 5. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
# 6. Click "Deploy"
# 7. Done! 🎉
```

---

**Deployment Version**: 1.0
**Last Updated**: November 2024
**Platform**: Vercel
**Framework**: Next.js 14

---

_Your INFORA application is now live and accessible worldwide! 🌍_

