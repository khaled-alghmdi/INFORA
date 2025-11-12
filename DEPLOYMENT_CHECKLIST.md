# ✅ INFORA Deployment Checklist

## Before You Deploy

- [ ] **1. Get Your Supabase Credentials**
  - Supabase URL: `https://xxxxx.supabase.co`
  - Supabase Anon Key: `eyXxxx...`
  - Find these in: Supabase Dashboard → Settings → API

- [ ] **2. Commit All Changes**
  ```powershell
  git add .
  git commit -m "Prepare for deployment"
  git push origin main
  ```

- [ ] **3. Ensure Database Schema is Ready**
  - Tables created: `devices`, `users`, `assignments`, `requests`
  - Row Level Security (RLS) policies configured

---

## Deploy to Vercel (5 Minutes) 🚀

### Step 1: Go to Vercel
- Visit: [https://vercel.com](https://vercel.com)
- Click: **"Sign Up"** or **"Login"** with GitHub

### Step 2: Import Project
- Click: **"Add New Project"**
- Select: **"INFORA"** repository
- Vercel will detect it's a Next.js app automatically

### Step 3: Add Environment Variables
Click **"Environment Variables"** and add:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### Step 4: Deploy
- Click: **"Deploy"**
- Wait: ~2-3 minutes
- Done: Your app is live! 🎉

### Step 5: Update Supabase (Important!)
Go to Supabase Dashboard:
1. **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: Add the same URL

---

## Post-Deployment Testing

- [ ] Visit your deployed URL
- [ ] Test login page
- [ ] Check if dashboard loads
- [ ] Verify database connectivity
- [ ] Test a few CRUD operations

---

## Alternative: Vercel CLI Method

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project directory)
vercel

# Follow prompts, then add env vars in dashboard
# Finally deploy to production:
vercel --prod
```

---

## If Something Goes Wrong

### Build Fails
- Check build logs in Vercel dashboard
- Verify all files are committed to Git
- Ensure `package.json` dependencies are correct

### Can't Login
- Check Supabase credentials are correct
- Verify environment variables are set
- Check Supabase redirect URLs include your Vercel URL

### Database Errors
- Ensure Supabase project is active
- Check RLS policies allow necessary operations
- Verify table schemas match your types

---

## Your Deployment URLs

After deployment, save these:

- **Production URL**: `https://_____.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/your-username/infora`
- **Supabase Dashboard**: `https://app.supabase.com/project/xxxxx`

---

## Next Steps After Deployment

1. **Custom Domain (Optional)**
   - Go to Vercel Dashboard → Domains
   - Add your custom domain
   - Update DNS records

2. **Set Up Monitoring**
   - Vercel provides analytics automatically
   - Check deployment logs regularly

3. **Configure CI/CD**
   - Vercel automatically deploys on every push to `main`
   - Create `preview` branches for testing

---

## 🎉 You're All Set!

Your INFORA app should now be deployed and accessible worldwide!

**Need Help?**
- Check `DEPLOY.md` for detailed instructions
- Visit [Vercel Docs](https://vercel.com/docs)
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

