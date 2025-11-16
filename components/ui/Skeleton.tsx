import React from 'react';

export function SkeletonRow() {
  return (
    <div className="animate-pulse grid grid-cols-6 gap-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
    </div>
  );
}

export default function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}


