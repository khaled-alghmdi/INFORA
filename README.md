# INFORA - IT Device Inventory Management System

A comprehensive IT device inventory tracking system built for Tamer Consumer Company.

## Features

### 🔐 Authentication System
- **Login Page**: Secure login with email/password
- **Sign Up Page**: Registration with @tamergroup.com email validation
- **Protected Routes**: All dashboard pages require authentication
- **Session Management**: Persistent login sessions
- **Logout Functionality**: Secure logout with confirmation

### 1. Dashboard
- Real-time analytics and statistics
- Visual charts showing device distribution by type and status
- Quick action buttons for common tasks
- User statistics overview

### 2. Devices Management
- Complete device inventory listing
- Add, edit, and delete devices
- Assign/unassign devices to users
- Filter by status, type, and search
- Track device specifications, serial numbers, and warranty information

### 3. Users Management
- User directory with role-based access
- Add, edit, and delete users
- Toggle user active/inactive status
- View device assignments per user
- Filter by role and status

### 4. Reports Generation (5 Types)
- **Operations Report**: All device assignments and operations from the last month
- **Asset Report**: Complete list of all devices assigned to all employees
- **User Devices Report**: Detailed breakdown of each user and their assigned devices
- **Available Stock Report**: Inventory of all available devices in stock
- **Warranty Status Report**: Devices still under warranty (within 4 years of purchase)
- Export all reports as PDF files with detailed information

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **PDF Generation**: jsPDF & jspdf-autotable
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ installed
- Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - First, run `supabase/migrations/001_initial_schema.sql`
   - Then, run `supabase/migrations/002_seed_data.sql` (optional, for sample data)

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You will be redirected to the login page. Click "Sign up now" to create an account.

## Database Schema

### Tables

#### `users`
- User information and authentication
- Fields: id, email, full_name, department, role, is_active

#### `devices`
- IT device inventory
- Fields: id, name, type, serial_number, status, assigned_to, purchase_date, warranty_expiry, specifications

#### `assignments`
- Device assignment history
- Fields: id, device_id, user_id, assigned_date, return_date, notes

## Usage

### Creating an Account
1. Navigate to the signup page (`/signup`)
2. Enter your @tamergroup.com email address
3. Once validated, fill in your full name and department
4. Create a password (minimum 8 characters)
5. Click "Create Account"
6. You'll be redirected to login

### Logging In
1. Go to the login page (`/login`)
2. Enter your email and password
3. Click "Sign In"
4. Access the dashboard

### Adding a Device
1. Navigate to the Devices page
2. Click "Add Device" button
3. Fill in the device information
4. Click "Add Device" to save

### Assigning a Device
1. Go to the Devices page
2. Find the device you want to assign
3. Click "Assign" in the Assigned To column
4. Select the user from the list

### Generating Reports
1. Navigate to the Reports page
2. Select the type of report you want to generate
3. Click "Generate & Download PDF"
4. The PDF will download automatically

## Project Structure

```
INFORA/
├── app/
│   ├── page.tsx              # Dashboard (Protected)
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── signup/
│   │   └── page.tsx          # Sign up page
│   ├── devices/
│   │   └── page.tsx          # Devices management (Protected)
│   ├── users/
│   │   └── page.tsx          # Users management (Protected)
│   ├── reports/
│   │   └── page.tsx          # Reports generation (Protected)
│   ├── layout.tsx            # Root layout with auth check
│   └── globals.css           # Global styles
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar with logout
│   ├── PageHeader.tsx        # Page header component
│   ├── StatsCard.tsx         # Statistics card component
│   └── AuthCheck.tsx         # Authentication middleware
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   └── auth.ts               # Authentication utilities
├── supabase/
│   └── migrations/           # Database migrations
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
├── types/
│   └── index.ts              # TypeScript type definitions
└── package.json
```

## Getting Started

### First Time Setup

1. **Create Your Admin Account**:
   - Go to `/signup`
   - Use an email ending with `@tamergroup.com`
   - Fill in your details
   - Create a strong password

2. **Login**:
   - Use your newly created credentials
   - Access the dashboard

### Sample Users

After running the seed data migration, the database has sample users. You can create accounts for these emails:
- admin@tamergroup.com (Admin)
- john.doe@tamergroup.com (User)
- jane.smith@tamergroup.com (User)

## Building for Production

```bash
npm run build
npm start
```

## 🚀 Deploying to Vercel

### Quick Deploy (5 Minutes)

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dmsncyknmivvutrhcfhi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Deploy!** - Click Deploy and wait 2-3 minutes

**📚 Detailed Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**⚡ Quick Guide**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

### Other Platforms
- Netlify
- AWS Amplify
- Railway

## License

Private - Tamer Consumer Company

## Support

For support and questions, contact the IT department.

