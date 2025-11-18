const WaveBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Plain background with subtle green/emerald gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, rgba(167, 243, 208, 0.25) 25%, rgba(110, 231, 183, 0.2) 50%, rgba(52, 211, 153, 0.15) 75%, rgba(16, 185, 129, 0.1) 100%)',
        }}
      />
    </div>
  );
};

export default WaveBackground;

