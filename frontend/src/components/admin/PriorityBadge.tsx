import React from 'react';
import { Flag } from 'lucide-react';

export interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
}

const priorityConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  LOW: { color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', icon: '↓' },
  MEDIUM: { color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: '→' },
  HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', icon: '↑' },
  CRITICAL: { color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: '⚠' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config = priorityConfig[priority?.toUpperCase() || 'MEDIUM'] || priorityConfig['MEDIUM'];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 
        font-bold uppercase tracking-widest 
        rounded-full border
        ${config.bgColor}
        ${config.color}
        ${sizeClasses[size]}
      `}
    >
      <Flag className="w-3 h-3" />
      {priority?.toUpperCase() || 'MEDIUM'}
    </div>
  );
};
