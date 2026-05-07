import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  badge?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon: Icon, actions, badge }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
    <div className="flex items-start gap-6">
      <div className="w-16 h-16 rounded-[24px] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-2xl shadow-blue-600/5 group">
        <Icon className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{title}</h1>
          {badge && (
            <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em]">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, description, className }) => (
  <div className={cn("bg-white/[0.02] border border-white/5 p-6 rounded-[32px] hover:bg-white/[0.04] hover:border-white/10 transition-all group", className)}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4 text-[#333] group-hover:text-blue-500 transition-colors" />
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
          trend.isUp ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
        )}>
          {trend.value}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white italic tracking-tight leading-none mb-1">{value}</p>
    {description && <p className="text-[9px] font-bold text-[#222] uppercase tracking-widest">{description}</p>}
  </div>
);
