import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock, ShieldAlert, XCircle, Ban, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info';

const STATUS_CONFIG: Record<string, { variant: StatusType; label: string; icon: React.ElementType }> = {
  // Orders
  DELIVERED: { variant: 'success', label: 'Delivered', icon: ShieldCheck },
  VALIDATED: { variant: 'success', label: 'Validated', icon: CheckCircle2 },
  PAID: { variant: 'success', label: 'Paid', icon: ShieldCheck },
  
  PENDING: { variant: 'warning', label: 'Pending', icon: Clock },
  IN_PROGRESS: { variant: 'info', label: 'In Progress', icon: Clock },
  ON_THE_WAY: { variant: 'info', label: 'In Transit', icon: Clock },
  ASSIGNED: { variant: 'info', label: 'Assigned', icon: ShieldCheck },
  PICKUP_READY: { variant: 'info', label: 'Ready for Pickup', icon: Clock },
  
  CANCELLED: { variant: 'danger', label: 'Cancelled', icon: XCircle },
  RETURNED: { variant: 'info', label: 'Returned', icon: ArrowLeftRight },
  ISSUE: { variant: 'danger', label: 'Incident', icon: ShieldAlert },
  INCIDENT: { variant: 'danger', label: 'Incident', icon: ShieldAlert },

  // Driver / Accounts
  ACTIVE: { variant: 'success', label: 'Active', icon: ShieldCheck },
  APPROVED: { variant: 'success', label: 'Approved', icon: ShieldCheck },
  ONLINE: { variant: 'success', label: 'Online', icon: ShieldCheck },
  OFFLINE: { variant: 'info', label: 'Offline', icon: Clock },
  SUSPENDED: { variant: 'danger', label: 'Suspended', icon: ShieldAlert },
  REJECTED: { variant: 'danger', label: 'Rejected', icon: XCircle },
  BLACKLISTED_LOCAL: { variant: 'danger', label: 'Blacklisted', icon: Ban },
  
  // Wallet / Reconciliation
  UNPAID: { variant: 'warning', label: 'Unpaid', icon: Clock },
  SUCCESS: { variant: 'success', label: 'Successful', icon: ShieldCheck },
  FAILED: { variant: 'danger', label: 'Failed', icon: XCircle },

  // Incidents
  OPEN: { variant: 'danger', label: 'Open', icon: ShieldAlert },
  // (Removed duplicate IN_PROGRESS)
  RESOLVED: { variant: 'success', label: 'Resolved', icon: ShieldCheck },
  CLOSED: { variant: 'info', label: 'Closed', icon: ShieldCheck },

  // Payment Statuses
  CONFIRMED_BY_AGENCY: { variant: 'success', label: 'Confirmed by Agency', icon: ShieldCheck },
  COLLECTED_BY_DRIVER: { variant: 'warning', label: 'Collected by Driver', icon: Clock },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalizedStatus = status?.toUpperCase() || 'PENDING';
  const config = STATUS_CONFIG[normalizedStatus] ?? {
    variant: 'info' as StatusType,
    label: status || 'Unknown',
    icon: Clock,
  };
  
  const Icon = config.icon;
  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 shadow-sm',
        variantStyles[config.variant],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
