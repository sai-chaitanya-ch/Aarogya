import React from 'react';

interface AarogyaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const AarogyaLogo: React.FC<AarogyaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const subtitleSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon: Heart + Leaf + Pulse */}
      <div className={`${iconSizeClasses[size]} relative flex items-center justify-center rounded-full bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 shadow-md text-white p-1.5 flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          {/* Heart shape */}
          <path
            d="M50 82 C50 82 20 63 20 42 C20 28 32 18 45 22 C48 23 50 26 50 26 C50 26 52 23 55 22 C68 18 80 28 80 42 C80 63 50 82 50 82 Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Green leaf vein inside */}
          <path
            d="M50 32 C42 40 43 55 53 62 C53 62 48 50 50 32 Z"
            fill="#0c7c61"
          />
          {/* Pulse heartbeat line */}
          <path
            d="M28 46 L38 46 L43 36 L48 58 L54 42 L58 48 L72 48"
            stroke="#0a634e"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span className={`font-bold tracking-tight text-teal-900 ${titleSizeClasses[size]}`}>
          Aarogya
        </span>
        {showSubtitle && (
          <span className={`font-medium text-teal-700 tracking-normal ${subtitleSizeClasses[size]}`}>
            Your Personal Health Copilot
          </span>
        )}
      </div>
    </div>
  );
};
