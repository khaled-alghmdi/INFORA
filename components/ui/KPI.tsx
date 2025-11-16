import React from 'react';
import Badge from './Badge';

type KPIProps = {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'brand';
  hint?: string;
};

export default function KPI({ label, value, tone = 'brand', hint }: KPIProps) {
  return (
    <div className="min-w-[140px]">
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
        <Badge tone={tone} size="sm">{label}</Badge>
      </div>
      {hint ? <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">{hint}</div> : null}
    </div>
  );
}


