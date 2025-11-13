import { useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/auth';

interface UseSessionTimeoutOptions {
  timeout: number; // Timeout in milliseconds
  warningTime?: number; // Show warning before timeout (in milliseconds)
  onWarning?: () => void;
  onTimeout?: () => void;
}

export const useSessionTimeout = ({
  timeout,
  warningTime = 60000, // Default 1 minute warning
  onWarning,
  onTimeout,
}: UseSessionTimeoutOptions) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Hide warning if it was showing
    setShowWarning(false);

    // Set warning timer
    if (warningTime > 0) {
      warningTimeoutIdRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(warningTime);
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1000) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);

        if (onWarning) {
          onWarning();
        }
      }, timeout - warningTime);
    }

    // Set main timeout
    timeoutIdRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
      logout();
    }, timeout);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any user activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, warningTime]);

  return {
    showWarning,
    timeRemaining,
    resetTimer,
  };
};

