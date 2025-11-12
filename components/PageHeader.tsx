import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, icon }) => {
  return (
    <div className="mb-8 animate-slide-in">
      {/* Enhanced Frame Card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Gradient Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600 via-emerald-700 to-emerald-700"></div>
        
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent opacity-30 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100 to-transparent opacity-30 rounded-tr-full"></div>
        
        {/* Content Container */}
        <div className="relative p-6 md:p-8">
          <div className="flex justify-between items-start">
            {/* Title Section */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-12 bg-gradient-to-b from-green-600 via-emerald-700 to-emerald-700 rounded-full shadow-lg"></div>
                {icon && (
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-md">
                    {icon}
                  </div>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                  {title}
                </h1>
              </div>
              {description && (
                <div className="pl-6 ml-1">
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    {description}
                  </p>
                </div>
              )}
            </div>
            
            {/* Actions Section */}
            <div className="flex items-center space-x-3 ml-4 animate-fade-in">
              <ThemeToggle />
              <NotificationBell />
              {action && <div>{action}</div>}
            </div>
          </div>
        </div>
        
        {/* Bottom Border Accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-30"></div>
      </div>
    </div>
  );
};

export default PageHeader;

