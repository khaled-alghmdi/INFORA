# Session Timeout Feature

## Overview
The INFORA application now includes an automatic session timeout feature that logs users out after 20 minutes of inactivity for enhanced security.

## How It Works

### Automatic Session Management
- **Timeout Duration**: 20 minutes (1,200,000 milliseconds)
- **Warning Period**: 2 minutes before timeout
- **Activity Detection**: The system detects user activity through:
  - Mouse movements
  - Mouse clicks
  - Keyboard input
  - Scrolling
  - Touch events

### User Experience Flow

1. **Active Session**: User works normally without interruption
2. **Inactivity Detection**: If no activity is detected for 18 minutes
3. **Warning Modal**: A warning modal appears with:
   - Countdown timer showing remaining time
   - "Stay Logged In" button to reset the session
   - Automatic dismissal if user resumes activity
4. **Automatic Logout**: After 20 minutes of total inactivity, user is automatically logged out and redirected to login page

## Files Created/Modified

### New Files
1. **`hooks/useSessionTimeout.ts`** - Custom React hook for session management
   - Manages timeout timers
   - Tracks user activity
   - Provides warning state and countdown

2. **`components/AuthCheck.tsx`** - Authentication wrapper component
   - Verifies user authentication
   - Integrates session timeout
   - Displays warning modal

3. **`components/SessionInfo.tsx`** - Optional informational component
   - Shows users that session protection is active
   - Can be added to any page for user awareness

### Modified Files
- **`app/layout.tsx`** - Already integrated with AuthCheck component

## Customization

### Changing Timeout Duration

To modify the session timeout duration, edit `components/AuthCheck.tsx`:

```typescript
const { showWarning, timeRemaining, resetTimer } = useSessionTimeout({
  timeout: 20 * 60 * 1000, // Change this value (in milliseconds)
  warningTime: 2 * 60 * 1000, // Warning time before logout
  onTimeout: () => {
    console.log('Session expired due to inactivity');
  },
});
```

**Common Durations**:
- 10 minutes: `10 * 60 * 1000`
- 15 minutes: `15 * 60 * 1000`
- 20 minutes: `20 * 60 * 1000` (current)
- 30 minutes: `30 * 60 * 1000`
- 1 hour: `60 * 60 * 1000`

### Changing Warning Time

To modify when the warning appears:

```typescript
warningTime: 5 * 60 * 1000, // Show warning 5 minutes before logout
```

### Disabling Session Timeout

To temporarily disable session timeout (not recommended for production):

1. Remove or comment out the `useSessionTimeout` hook in `components/AuthCheck.tsx`
2. Remove the warning modal JSX

## Security Benefits

- **Prevents Unauthorized Access**: Automatically logs out users who leave their workstation unattended
- **Compliance**: Helps meet security compliance requirements for idle session termination
- **Data Protection**: Reduces risk of data exposure in shared or public environments
- **User Awareness**: Warning system keeps users informed about session status

## Technical Details

### Architecture
- **React Hooks**: Uses custom `useSessionTimeout` hook for state management
- **Event Listeners**: Attaches to DOM events to detect user activity
- **Timer Management**: Efficiently manages multiple timers for timeout and warning
- **Cleanup**: Properly removes event listeners and clears timers on unmount

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard DOM APIs for maximum compatibility
- No external dependencies required

### Performance
- Minimal performance impact
- Event listeners are throttled naturally by React
- Timers are cleaned up properly to prevent memory leaks

## Testing

To test the session timeout feature:

1. **Quick Test** (for development):
   - Temporarily change timeout to 1 minute: `1 * 60 * 1000`
   - Change warning to 30 seconds: `30 * 1000`
   - Log in and wait without interaction
   - Verify warning appears after 30 seconds
   - Verify logout happens after 1 minute

2. **Warning Dismissal Test**:
   - Wait for warning to appear
   - Move mouse or press a key
   - Warning should disappear immediately
   - Timer should reset

3. **Manual Reset Test**:
   - Wait for warning to appear
   - Click "Stay Logged In" button
   - Warning should close
   - Session should continue

## Troubleshooting

### Warning Not Appearing
- Check browser console for errors
- Verify `useSessionTimeout` hook is properly imported
- Ensure component is mounted and user is authenticated

### Session Not Timing Out
- Verify timeout duration is set correctly
- Check if activity events are being triggered unintentionally
- Ensure logout function is working properly

### Timer Not Resetting
- Check if event listeners are attached properly
- Verify resetTimer function is called on activity
- Check browser console for JavaScript errors

## Future Enhancements

Potential improvements:
- Server-side session validation
- Configurable timeout per user role
- Session activity logging
- "Remember this device" option
- Session extension prompts for long-running tasks

