import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerIcon?: React.ReactNode;
  footer?: React.ReactNode;
};

export function Card({ title, description, headerIcon, footer, className = '', children, ...props }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-gray-100 dark:border-gray-700 ${className}`} {...props}>
      {(title || description || headerIcon) && (
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            {title ? <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3> : null}
            {description ? <p className="text-gray-600 dark:text-gray-400">{description}</p> : null}
          </div>
          {headerIcon ? <div className="text-gray-400 dark:text-gray-500">{headerIcon}</div> : null}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer ? <div className="px-6 pb-6">{footer}</div> : null}
    </div>
  );
}

export default Card;


