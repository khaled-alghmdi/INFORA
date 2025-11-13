# Quick Start - Session Timeout

## ✅ What's Been Implemented

Your INFORA application now has a **20-minute automatic session timeout** with the following features:

### 🔒 Security Features
- Automatic logout after **20 minutes** of inactivity
- Warning modal appears **2 minutes** before logout
- Real-time countdown display
- Activity detection (mouse, keyboard, touch, scroll)

### 🎨 User Interface
- Beautiful warning modal with countdown timer
- "Stay Logged In" button to extend session
- Automatic dismissal when user resumes activity
- Pulsing animation for attention
- Dark mode support

## 🚀 How to Use

### For End Users
1. Log in normally
2. Work as usual - the timer resets automatically with any activity
3. If inactive for 18 minutes, a warning appears
4. Either:
   - Resume activity (move mouse, type, etc.) - warning disappears
   - Click "Stay Logged In" button
   - Do nothing - automatic logout after 2 more minutes

### For Administrators

#### Change Timeout Duration
Edit `components/AuthCheck.tsx` line 17:

```typescript
// Current: 20 minutes
timeout: 20 * 60 * 1000,

// Examples:
timeout: 15 * 60 * 1000,  // 15 minutes
timeout: 30 * 60 * 1000,  // 30 minutes
timeout: 60 * 60 * 1000,  // 1 hour
```

#### Change Warning Time
Edit `components/AuthCheck.tsx` line 18:

```typescript
// Current: 2 minutes warning
warningTime: 2 * 60 * 1000,

// Examples:
warningTime: 1 * 60 * 1000,   // 1 minute
warningTime: 5 * 60 * 1000,   // 5 minutes
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `hooks/useSessionTimeout.ts` | Core session management logic |
| `components/AuthCheck.tsx` | Authentication wrapper with timeout |
| `components/SessionInfo.tsx` | Optional info tooltip (not enabled by default) |
| `SESSION_TIMEOUT.md` | Detailed documentation |
| `QUICK_START_SESSION.md` | This quick reference |

## 🧪 Testing

### Quick Test (1 minute timeout)
1. Edit `components/AuthCheck.tsx`:
   ```typescript
   timeout: 1 * 60 * 1000,      // 1 minute total
   warningTime: 30 * 1000,       // 30 second warning
   ```
2. Log in
3. Wait 30 seconds without interaction
4. Warning should appear
5. Wait 30 more seconds
6. Should auto-logout

### Production Test (20 minutes)
- Default settings are production-ready
- Log in and wait 18 minutes
- Warning appears at 18-minute mark
- Auto-logout at 20-minute mark

## 💡 Optional: Add Session Info Badge

To show users a persistent reminder about session timeout, add this to any page:

```tsx
import SessionInfo from '@/components/SessionInfo';

// In your component:
<SessionInfo />
```

Example: Add to `components/Sidebar.tsx` after line 113 (before closing `</aside>`):

```tsx
{/* Session timeout info */}
<SessionInfo />
```

## ✨ Features at a Glance

✅ **20-minute timeout** (configurable)  
✅ **2-minute warning** (configurable)  
✅ **Activity detection** (mouse, keyboard, touch, scroll)  
✅ **Visual countdown** timer  
✅ **Dark mode** support  
✅ **Smooth animations**  
✅ **Zero dependencies** (uses React hooks)  
✅ **Memory leak prevention** (proper cleanup)  
✅ **Public pages excluded** (login, reset-password)  

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Warning not showing | Check browser console for errors |
| Session not timing out | Verify timeout value in AuthCheck.tsx |
| Timer keeps resetting | Normal behavior - any activity resets it |
| Want longer timeout | Increase timeout value in AuthCheck.tsx |

## 📞 Need Help?

Check the full documentation in `SESSION_TIMEOUT.md` for:
- Technical architecture details
- Advanced customization options
- Security benefits
- Performance information
- Future enhancement ideas

---

**Status**: ✅ **READY FOR PRODUCTION**

The session timeout is now active and will protect user sessions automatically!

