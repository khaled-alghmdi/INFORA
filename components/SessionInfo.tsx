'use client';

import { Clock } from 'lucide-react';

export default function SessionInfo() {
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 max-w-xs z-50 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-start space-x-2">
        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
          <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
            Session Protection Active
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            You'll be automatically logged out after 20 minutes of inactivity for security.
          </p>
        </div>
      </div>
    </div>
  );
}

