# ⚡ Quick Deploy to Vercel - 5 Minutes

## Prerequisites
- Git repository with your code
- Supabase project running
- Vercel account (free)

---

## 🚀 Deploy in 5 Steps

### 1️⃣ Commit Your Code
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Go to Vercel
Open [vercel.com/new](https://vercel.com/new)

### 3️⃣ Import Repository
- Click your Git provider (GitHub/GitLab)
- Select the INFORA repository
- Click "Import"

### 4️⃣ Configure
**Framework**: Next.js ✅ (auto-detected)

**Add Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
https://dmsncyknmivvutrhcfhi.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc25jeWtubWl2dnV0cmhjZmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzUwMDQsImV4cCI6MjA3Nzc1MTAwNH0.G7B1biO7pdAiiKog555lyb4N1Khi2f4vvwv58RcicgM
```

### 5️⃣ Deploy
Click **"Deploy"** button

⏳ Wait 2-3 minutes...

🎉 **Done!** Your URL: `https://infora-xxx.vercel.app`

---

## 🎯 Test Your Deployment

1. Visit your Vercel URL
2. You should see the login page
3. Try signing up
4. Login and test features

---

## 🔄 Updates

Every time you push to Git, Vercel automatically redeploys:

```bash
git add .
git commit -m "Update feature"
git push

# Vercel rebuilds automatically! 🚀
```

---

## 🆘 Issues?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

---

**That's it! You're deployed! 🎊**

