import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number; // e.g. 12
    isPositive: boolean;
    period?: string; // e.g. "vs last month"
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = 'bg-indigo-50 text-indigo-600',
  className,
}) => {
  return (
    <Card className={cn('p-5 hover:border-slate-300 transition-all shadow-xs', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-lg shrink-0 flex items-center justify-center border border-slate-100/80 shadow-xs', iconBgColor)}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
          {trend.isPositive ? (
            <span className="flex items-center text-emerald-600 font-semibold">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
              +{trend.value}%
            </span>
          ) : (
            <span className="flex items-center text-rose-600 font-semibold">
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
              -{trend.value}%
            </span>
          )}
          <span className="text-slate-400">{trend.period || 'vs last month'}</span>
        </div>
      )}
    </Card>
  );
};

