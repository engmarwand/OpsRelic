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
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 relative">
    <div className="flex items-start gap-8">
      <div className="w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-2xl relative group overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
        <Icon className="w-8 h-8 text-white relative z-10 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter leading-none">{title}</h1>
          {badge && (
            <span className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] leading-relaxed max-w-xl">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-4">{actions}</div>}
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
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  shadow?: boolean;
}

const colorMap = {
  blue: 'bg-blue-600/5 group-hover:bg-blue-600',
  emerald: 'bg-emerald-500/5 group-hover:bg-emerald-500',
  purple: 'bg-purple-600/5 group-hover:bg-purple-600',
  amber: 'bg-amber-500/5 group-hover:bg-amber-500'
};

const iconColorMap = {
  blue: 'text-blue-500 group-hover:text-white',
  emerald: 'text-emerald-500 group-hover:text-white',
  purple: 'text-purple-500 group-hover:text-white',
  amber: 'text-amber-500 group-hover:text-white'
};

const shadowMap = {
  blue: 'hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)]',
  emerald: 'hover:shadow-[0_40px_80px_-20px_rgba(16,185,129,0.15)]',
  purple: 'hover:shadow-[0_40px_80px_-20px_rgba(139,92,246,0.15)]',
  amber: 'hover:shadow-[0_40px_80px_-20px_rgba(245,158,11,0.15)]'
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, description, className, color = 'blue', shadow }) => (
  <div className={cn(
    "bg-[#0A0A0A] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-all group relative overflow-hidden",
    shadow && shadowMap[color],
    className
  )}>
    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2", 
      color === 'blue' ? 'bg-blue-600/5' : 
      color === 'emerald' ? 'bg-emerald-500/5' :
      color === 'purple' ? 'bg-purple-600/5' : 'bg-amber-500/5'
    )} />
    <div className="flex items-center justify-between mb-8">
      <div className={cn("p-3 border border-white/10 rounded-[18px] group-hover:scale-110 transition-all duration-500", colorMap[color])}>
        <Icon className={cn("w-4 h-4 transition-colors", iconColorMap[color])} />
      </div>
      {trend && (
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border",
          trend.isUp ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" : "text-amber-500 bg-amber-500/5 border-amber-500/10"
        )}>
          {trend.value}
        </span>
      )}
    </div>
    <div className="space-y-1 relative z-10">
      <p className="text-[9px] font-black text-[#222] uppercase tracking-[0.4em] mb-2">{label}</p>
      <p className="text-3xl font-display font-black text-white italic tracking-tighter leading-none">{value}</p>
      {description && <p className="text-[9px] font-bold text-[#333] uppercase tracking-widest mt-3">{description}</p>}
    </div>
  </div>
);
