import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  light = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#102A43] to-[#0B1D3A] shadow-md ${iconSizes[size]}`}>
        <svg viewBox="0 0 48 48" className="w-4/5 h-4/5" fill="none">
          <path
            d="M12 36V16L20 28L28 16V36"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28 28C31 25 36 25 36 32"
            stroke="#34D399"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="36" cy="32" r="2.5" fill="#34D399" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900'} ${textSizes[size]}`}>
            Metri<span className="text-emerald-600">Flow</span>
          </span>
          <span className={`text-[10px] uppercase font-semibold tracking-widest mt-0.5 ${light ? 'text-slate-300' : 'text-slate-500'}`}>
            Wholesale ERP
          </span>
        </div>
      )}
    </div>
  );
};
