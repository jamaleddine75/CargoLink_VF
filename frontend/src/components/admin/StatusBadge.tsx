import React from 'react';
import { cn } from '@/lib/utils';
import { UserStatus } from '@/types';
import { ShieldCheck, Clock, ShieldAlert, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: UserStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return {
          styles: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
          icon: ShieldCheck,
          label: 'Active'
        };
      case 'PENDING':
        return {
          styles: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
          icon: Clock,
          label: 'Pending'
        };
      case 'SUSPENDED':
        return {
          styles: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
          icon: ShieldAlert,
          label: 'Suspended'
        };
      case 'REJECTED':
        return {
          styles: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          styles: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
          icon: Clock,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 shadow-sm',
        config.styles
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
