import React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'brand';
  size?: 'sm' | 'md';
};

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  brand: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-3 py-1',
};

export default function Badge({ tone = 'neutral', size = 'md', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold ${toneClasses[tone]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}


