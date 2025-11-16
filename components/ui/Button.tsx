import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
};

const base =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-6 py-3 text-base',
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md hover:from-green-700 hover:to-emerald-800 hover:shadow-lg focus-visible:ring-emerald-500',
  secondary:
    'bg-white dark:bg-gray-900 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950 focus-visible:ring-emerald-500',
  ghost:
    'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-emerald-500',
};

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {icon ? <span className="mr-2 flex items-center">{icon}</span> : null}
      {children}
    </button>
  );
}

export function SecondaryButton(props: ButtonProps) {
  return <Button {...props} variant="secondary" />;
}

export function GhostButton(props: ButtonProps) {
  return <Button {...props} variant="ghost" />;
}

export default Button;


