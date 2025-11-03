# Authentication Guide - INFORA

## Overview

INFORA now includes a complete authentication system with login and signup functionality.

## Features

### 🔐 Login Page (`/login`)
- Email and password authentication
- Password visibility toggle
- Remember me option
- Forgot password link
- Beautiful gradient green theme
- Responsive design with branding panel
- Error handling and validation

### 📝 Sign Up Page (`/signup`)
- **Email Domain Validation**: Only `@tamergroup.com` emails are allowed
- **Progressive Form Display**: Password fields and additional information only appear after valid email is entered
- Real-time email validation with visual feedback
- Password strength requirements (minimum 8 characters)
- Password confirmation matching
- Success notification with auto-redirect
- Department and full name fields

### 🛡️ Protected Routes
- All dashboard pages require authentication
- Automatic redirect to login if not authenticated
- Session persistence using localStorage
- User information stored and accessible throughout the app

### 🚪 Logout Functionality
- Logout button in sidebar
- Confirmation dialog before logout
- Clears session and redirects to login

## User Flow

### New User Registration

1. Navigate to `/signup`
2. Enter email address ending with `@tamergroup.com`
3. Once valid email is detected:
   - Full name field appears
   - Department field appears
   - Password fields appear
4. Fill in all required information
5. Click "Create Account"
6. Success message displays
7. Automatic redirect to login page
8. Login with credentials

### Existing User Login

1. Navigate to `/login` (or get redirected automatically)
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard

### Logout

1. Click "Logout" button in sidebar
2. Confirm logout
3. Session cleared and redirected to login

## Email Domain Requirement

**Important**: Only emails ending with `@tamergroup.com` are allowed to create accounts.

Valid examples:
- `john.doe@tamergroup.com` ✅
- `admin@tamergroup.com` ✅
- `sarah.jones@tamergroup.com` ✅

Invalid examples:
- `user@gmail.com` ❌
- `admin@tamer.com` ❌
- `user@tamergroup.co` ❌

## Technical Details

### Authentication Storage
- User session stored in `localStorage` as `infora_user`
- Includes: id, email, full_name, department, role, is_active

### Protected Pages
- `/` (Dashboard)
- `/devices`
- `/users`
- `/reports`

### Public Pages
- `/login`
- `/signup`

### Authentication Functions (lib/auth.ts)
```typescript
getCurrentUser() // Get current logged-in user
isAuthenticated() // Check if user is authenticated
logout() // Clear session and redirect to login
requireAuth() // Redirect to login if not authenticated
```

### Database Integration
- New users are inserted into `users` table
- Login checks against existing users in database
- Active status is validated on login

## Security Notes

1. **Email Validation**: Server-side validation ensures only @tamergroup.com emails
2. **Password Requirements**: Minimum 8 characters enforced
3. **Active Status**: Inactive users cannot login
4. **Session Management**: Uses localStorage for client-side session

## UI/UX Enhancements

### Design Features
- ✅ Split-screen layout (form + branding)
- ✅ Gradient green theme throughout
- ✅ Animated transitions and hover effects
- ✅ Loading states for async operations
- ✅ Error and success notifications
- ✅ Password visibility toggle
- ✅ Form validation with instant feedback
- ✅ Responsive design for all screen sizes
- ✅ Tamer logo integration
- ✅ Professional typography and spacing

### Visual Feedback
- Real-time email domain validation
- Password match indicator
- Loading spinners during authentication
- Success checkmarks and error icons
- Smooth transitions between states

## Testing the Authentication

### Test Users (from seed data)
After running the seed migration, you can test with:

```
Email: admin@tamer.com
Password: (Create during signup)

Email: john.doe@tamer.com
Password: (Create during signup)
```

Note: You'll need to create a new account first since passwords aren't stored in the current implementation. Update the users table to add a password field if needed.

## Future Enhancements

Potential improvements:
- [ ] Password hashing with bcrypt
- [ ] Email verification
- [ ] Forgot password functionality
- [ ] Two-factor authentication
- [ ] Session timeout
- [ ] Password reset via email
- [ ] OAuth integration
- [ ] Activity logging

## Routes Overview

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page |
| `/signup` | Public | Registration page |
| `/` | Protected | Dashboard |
| `/devices` | Protected | Devices management |
| `/users` | Protected | User management |
| `/reports` | Protected | Reports generation |

---

**Implemented by:** INFORA Development Team
**Last Updated:** 2024

