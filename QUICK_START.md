# 🚀 INFORA Quick Start Guide

## Step-by-Step Setup

### 1️⃣ Create `.env.local` File

In the root directory, create a file named `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dmsncyknmivvutrhcfhi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc25jeWtubWl2dnV0cmhjZmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzUwMDQsImV4cCI6MjA3Nzc1MTAwNH0.G7B1biO7pdAiiKog555lyb4N1Khi2f4vvwv58RcicgM
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set Up Database

1. Go to: https://supabase.com/dashboard/project/dmsncyknmivvutrhcfhi
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the content from `supabase/migrations/001_initial_schema.sql`
5. Click **Run** (or Ctrl/Cmd + Enter)
6. Repeat for `supabase/migrations/002_seed_data.sql` (optional - adds sample data)

### 4️⃣ Run the Application

```bash
npm run dev
```

### 5️⃣ Access the Application

Open your browser and go to: **http://localhost:3000**

You'll be automatically redirected to the login page.

---

## 🎯 First Time User Journey

### Create Your Account

1. **Click "Sign up now"** on the login page
2. **Enter your email** - Must end with `@tamergroup.com`
   - Example: `admin@tamergroup.com`
3. Once the email is validated, additional fields will appear:
   - **Full Name**: Your complete name
   - **Department**: Your department (e.g., IT, Sales, HR)
   - **Password**: At least 8 characters
   - **Confirm Password**: Match your password
4. **Click "Create Account"**
5. Success! You'll be redirected to login

### Login

1. **Enter your email and password**
2. **Click "Sign In"**
3. Welcome to the INFORA Dashboard! 🎉

---

## 📱 Main Features Tour

### Dashboard (Home)
- View total devices, assigned devices, and availability
- See charts showing device distribution
- Access quick actions

### Devices Page
- **Add Device**: Click the green "+ Add Device" button
- **Edit Device**: Click the edit icon next to any device
- **Assign Device**: Click "Assign" to assign to a user
- **Delete Device**: Click the delete icon (with confirmation)
- **Search & Filter**: Use the search bar and filters at the top

### Users Page
- **Add User**: Click "+ Add User" button
- **Edit User**: Click the edit icon
- **Toggle Status**: Click the Active/Inactive badge to toggle
- **View Devices**: See how many devices each user has

### Reports Page
- **Select Report Type**: Click on any of the 5 report cards
- **Generate PDF**: Click "Generate & Download PDF"
- The PDF will automatically download to your computer

### Logout
- Click the **"Logout"** button at the bottom of the sidebar
- Confirm logout
- You'll be redirected to the login page

---

## 🎨 UI Features

### Beautiful Gradient Green Theme
- Modern gradient effects throughout
- Smooth animations and transitions
- Professional Tamer logo integration
- Responsive design for all screen sizes

### Smart Form Validation
- Real-time email validation
- Password strength indicators
- Instant error messages
- Success confirmations

### Enhanced User Experience
- Loading states for all operations
- Confirmation dialogs for destructive actions
- Toast notifications
- Hover effects and visual feedback

---

## 🔐 Security Features

✅ **Email Domain Restriction**: Only @tamergroup.com emails allowed  
✅ **Protected Routes**: Dashboard requires authentication  
✅ **Session Management**: Persistent login with localStorage  
✅ **Inactive User Blocking**: Deactivated users cannot login  
✅ **Password Requirements**: Minimum 8 characters  
✅ **Logout Confirmation**: Prevents accidental logouts

---

## 🆘 Troubleshooting

### "Failed to fetch" or Connection Errors
- Check your `.env.local` file has the correct Supabase URL and key
- Restart the development server: Stop and run `npm run dev` again

### "Table does not exist"
- Make sure you ran both SQL migration files in order
- Check the Supabase SQL Editor for any errors

### Redirected to Login Immediately
- This is expected! The system protects all dashboard pages
- You need to sign up first, then login

### Email Not Accepted
- Make sure your email ends with `@tamergroup.com` exactly
- Check for spaces or typos

### Password Fields Not Showing
- Enter a valid @tamergroup.com email first
- Wait for the green checkmark to appear

---

## 📚 Documentation Files

- **README.md**: Complete project documentation
- **SETUP_GUIDE.md**: Detailed setup instructions
- **AUTHENTICATION.md**: Authentication system details
- **QUICK_START.md**: This file - quick reference guide

---

## 🎉 You're All Set!

Enjoy using INFORA to manage your IT device inventory!

For questions or issues, refer to the detailed documentation files or contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Built for**: Tamer Consumer Company

