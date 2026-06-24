import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock, ShieldAlert, XCircle, Ban } from 'lucide-react';

export type UserDriverStatus =
  | 'ACTIVE'
  | 'APPROVED'
  | 'PENDING'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'BLACKLISTED_LOCAL'
  | string;

interface StatusBadgeProps {
  status: UserDriverStatus;
  className?: string;
}

const STATUS_MAP: Record<string, { styles: string; icon: React.ElementType; label: string }> = {
  ACTIVE: {
    styles: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    icon: ShieldCheck,
    label: 'Active',
  },
  APPROVED: {
    styles: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    icon: ShieldCheck,
    label: 'Approved',
  },
  PENDING: {
    styles: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    icon: Clock,
    label: 'Pending',
  },
  SUSPENDED: {
    styles: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    icon: ShieldAlert,
    label: 'Suspended',
  },
  REJECTED: {
    styles: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
    icon: XCircle,
    label: 'Rejected',
  },
  BLACKLISTED_LOCAL: {
    styles: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    icon: Ban,
    label: 'Blacklisted',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_MAP[status] ?? {
    styles: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
    icon: Clock,
    label: status,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 shadow-sm',
        config.styles,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
