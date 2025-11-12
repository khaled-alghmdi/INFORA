# 📧 Email Template Configuration for Supabase

## ✅ Simple Email Template

Copy and paste this into your **Supabase Email Template** for password reset.

---

## 📝 Template to Use

### Subject:
```
Reset Password
```

### Body (HTML):
```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

---

## ⚙️ How to Configure in Supabase

### Step 1: Open Email Template Editor

1. Go to **Supabase Dashboard**
2. Click **"Authentication"**
3. Click **"Email Templates"**
4. Find **"Reset Password"** template
5. Click **"Edit"**

### Step 2: Update Template

**Subject:**
```
Reset Password
```

**Body:**
```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**Click "Save"**

### Step 3: Configure Redirect URL

1. Go to **"Authentication"** → **"URL Configuration"**
2. Under **"Redirect URLs"**, add:

**For Development:**
```
http://localhost:3000/login
```

**For Production:**
```
https://your-app-name.vercel.app/login
```

**Click "Save"**

---

## 🎯 User Flow

### What Happens:

1. **User clicks "Forgot password?"** on login page
2. **Enters email** → Clicks "Send Reset Link"
3. **Receives email** from Supabase
4. **Clicks "Reset Password" link** in email
5. **Redirected to /login page** (with reset session)
6. **Password change screen appears automatically**
7. **User sets new password**
8. **Redirected to login page**
9. **Login with new password** ✅

---

## 📧 Example Email (What Users Receive)

```
From: noreply@yourdomain.com
Subject: Reset Password

----------------------------------

Reset Password

Follow this link to reset the password for your user:

Reset Password
[This is a clickable link]

----------------------------------
```

---

## ✨ Advanced Template (Optional)

If you want a more professional email:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">INFORA</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">IT Device Inventory Management</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
        
        <p style="color: #4b5563;">Hello,</p>
        
        <p style="color: #4b5563;">We received a request to reset your password for your INFORA account.</p>
        
        <p style="color: #4b5563;">Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset Password
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #059669; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px;">{{ .ConfirmationURL }}</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">⏱️ This link will expire in 24 hours.</p>
        
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Best regards,</p>
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0;"><strong>INFORA Team</strong></p>
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Tamer Consumer Company</p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© 2025 Tamer Consumer Company. All rights reserved.</p>
    </div>
</body>
</html>
```

---

## 🔧 Configuration Summary

### Required Settings in Supabase:

| Setting | Value | Location |
|---------|-------|----------|
| **Email Template** | Simple or Advanced HTML | Auth → Email Templates → Reset Password |
| **Redirect URL (Dev)** | `http://localhost:3000/login` | Auth → URL Configuration |
| **Redirect URL (Prod)** | `https://your-domain.vercel.app/login` | Auth → URL Configuration |
| **SMTP (Optional)** | Custom email provider | Settings → Auth → SMTP |

---

## ✅ What's Working Now

1. ✅ User clicks "Forgot password?"
2. ✅ Enters email
3. ✅ Supabase sends email with simple template
4. ✅ User clicks "Reset Password" link
5. ✅ **Redirected to /login page**
6. ✅ **Password change screen appears automatically**
7. ✅ Sets new password
8. ✅ Password updated in Supabase Auth AND users table
9. ✅ Redirected to login
10. ✅ Login with new password

---

## 🎯 Quick Setup Steps

### 1. Configure Email Template (1 minute)
- Authentication → Email Templates → Reset Password
- Subject: `Reset Password`
- Body: Use simple template above
- Save

### 2. Add Redirect URL (30 seconds)
- Authentication → URL Configuration
- Add: `http://localhost:3000/login`
- Save

### 3. Test (1 minute)
- Go to login page
- Click "Forgot password?"
- Enter email
- Check email
- Click link
- Set password
- Done!

---

## 📊 Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Reset Page** | Separate /reset-password | Same /login page ✅ |
| **Redirect** | Goes to /reset-password | Goes to /login ✅ |
| **User Experience** | Two different pages | One consistent page ✅ |
| **Template** | Complex | Simple ✅ |
| **Maintenance** | Two pages to maintain | One page ✅ |

---

## ✨ Benefits

1. ✅ **Simpler** - Users stay on login page
2. ✅ **Consistent** - Same UI throughout
3. ✅ **Less code** - One page instead of two
4. ✅ **Better UX** - Familiar interface
5. ✅ **Easier maintenance** - Single source of truth

---

**Your email verification is ready! Just update the template in Supabase!** 🚀

**Last Updated:** November 12, 2024  
**Template:** Simple and Professional  
**Redirect:** /login (single page)

