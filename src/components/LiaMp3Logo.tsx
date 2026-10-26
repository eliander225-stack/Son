import React from 'react';

interface LiaMp3LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const LiaMp3Logo: React.FC<LiaMp3LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Glowing Geometric Play Triangle Badge */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Outer Glow Halo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-pink-500 rounded-lg blur-[6px] opacity-70 animate-pulse" />
        
        {/* Badge Background */}
        <div className="relative w-full h-full bg-[#0c0c1a] border border-cyan-400/80 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden">
          {/* Triangular Play Icon (Neon Cyan & Magenta) */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="none">
            <polygon
              points="6,4 20,12 6,20"
              fill="url(#logoGrad)"
              stroke="#00f3ff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <polygon
              points="8,7 16,12 8,17"
              fill="#0a0a14"
            />
            <polygon
              points="9.5,9.5 13.5,12 9.5,14.5"
              fill="#00f3ff"
            />
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f3ff" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-wider font-cyber ${textSizes[size]} text-white whitespace-nowrap`}>
          Lia<span className="text-cyan-400">Mp3</span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-mono-cyber text-pink-400 tracking-widest uppercase mt-0.5">
            GAMER AUDIO // OS
          </span>
        )}
      </div>
    </div>
  );
};
