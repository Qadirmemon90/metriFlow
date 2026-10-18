import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'navy' | 'amber' | 'rose' | 'sky';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'emerald',
}) => {
  const iconBackgrounds = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border ${iconBackgrounds[color]}`}>
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
