type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="mb-8 animate-slide-in">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold gradient-text mb-3">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-gray-600 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></span>
              <span>{description}</span>
            </p>
          )}
        </div>
        {action && <div className="animate-fade-in">{action}</div>}
      </div>
      {/* Decorative line */}
      <div className="mt-6 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full w-24"></div>
    </div>
  );
};

export default PageHeader;

