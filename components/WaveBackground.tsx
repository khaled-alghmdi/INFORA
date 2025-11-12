const WaveBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Background base color */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900"></div>
      
      {/* Pulsing dots pattern - grid layout */}
      <div className="absolute inset-0">
        {/* Row 1 */}
        <div className="absolute top-[10%] left-[10%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[10%] left-[25%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[10%] left-[40%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[10%] left-[55%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[10%] left-[70%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[10%] left-[85%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>

        {/* Row 2 */}
        <div className="absolute top-[25%] left-[10%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[25%] left-[25%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[25%] left-[40%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[25%] left-[55%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[25%] left-[70%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>

        {/* Row 3 */}
        <div className="absolute top-[40%] left-[10%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[25%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[40%] left-[40%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[40%] left-[55%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[70%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[40%] left-[85%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>

        {/* Row 4 */}
        <div className="absolute top-[55%] left-[10%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[55%] left-[25%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[55%] left-[40%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[55%] left-[55%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[55%] left-[70%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[55%] left-[85%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>

        {/* Row 5 */}
        <div className="absolute top-[70%] left-[10%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[70%] left-[25%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[70%] left-[40%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[70%] left-[55%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[70%] left-[70%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[70%] left-[85%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>

        {/* Row 6 */}
        <div className="absolute top-[85%] left-[10%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[85%] left-[25%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[85%] left-[40%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
        <div className="absolute top-[85%] left-[55%] w-1 h-1 bg-teal-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-2000"></div>
        <div className="absolute top-[85%] left-[70%] w-1 h-1 bg-green-500 rounded-full opacity-[0.15] animate-pulse-soft animation-delay-4000"></div>
        <div className="absolute top-[85%] left-[85%] w-1 h-1 bg-emerald-500 rounded-full opacity-[0.15] animate-pulse-soft"></div>
      </div>
    </div>
  );
};

export default WaveBackground;

