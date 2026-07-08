import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock, ShieldAlert, XCircle, Ban, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info';

const STATUS_CONFIG: Record<string, { variant: StatusType; label: string; icon: React.ElementType }> = {
  // Orders
  DELIVERED: { variant: 'success', label: 'Livré', icon: ShieldCheck },
  VALIDATED: { variant: 'success', label: 'Validé', icon: CheckCircle2 },
  PAID: { variant: 'success', label: 'Payé', icon: ShieldCheck },
  
  PENDING: { variant: 'warning', label: 'En attente', icon: Clock },
  IN_PROGRESS: { variant: 'info', label: 'En cours', icon: Clock },
  ON_THE_WAY: { variant: 'info', label: 'En transit', icon: Clock },
  ASSIGNED: { variant: 'info', label: 'Assigné', icon: ShieldCheck },
  PICKUP_READY: { variant: 'info', label: 'Prêt pour ramassage', icon: Clock },
  
  CANCELLED: { variant: 'danger', label: 'Annulé', icon: XCircle },
  RETURNED: { variant: 'info', label: 'Retourné', icon: ArrowLeftRight },
  ISSUE: { variant: 'danger', label: 'Incident', icon: ShieldAlert },
  INCIDENT: { variant: 'danger', label: 'Incident', icon: ShieldAlert },

  // Driver / Accounts
  ACTIVE: { variant: 'success', label: 'Actif', icon: ShieldCheck },
  APPROVED: { variant: 'success', label: 'Approuvé', icon: ShieldCheck },
  ONLINE: { variant: 'success', label: 'En ligne', icon: ShieldCheck },
  OFFLINE: { variant: 'info', label: 'Hors ligne', icon: Clock },
  SUSPENDED: { variant: 'danger', label: 'Suspendu', icon: ShieldAlert },
  REJECTED: { variant: 'danger', label: 'Rejeté', icon: XCircle },
  BLACKLISTED_LOCAL: { variant: 'danger', label: 'Blacklisté', icon: Ban },
  
  // Wallet / Reconciliation
  UNPAID: { variant: 'warning', label: 'Non payé', icon: Clock },
  SUCCESS: { variant: 'success', label: 'Réussi', icon: ShieldCheck },
  FAILED: { variant: 'danger', label: 'Échoué', icon: XCircle },

  // Incidents
  OPEN: { variant: 'danger', label: 'Ouvert', icon: ShieldAlert },
  IN_PROGRESS: { variant: 'warning', label: 'En cours', icon: Clock },
  RESOLVED: { variant: 'success', label: 'Résolu', icon: ShieldCheck },
  CLOSED: { variant: 'info', label: 'Fermé', icon: ShieldCheck },

  // Payment Statuses
  CONFIRMED_BY_AGENCY: { variant: 'success', label: 'Confirmé par Agence', icon: ShieldCheck },
  COLLECTED_BY_DRIVER: { variant: 'warning', label: 'Collecté par Chauffeur', icon: Clock },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalizedStatus = status?.toUpperCase() || 'PENDING';
  const config = STATUS_CONFIG[normalizedStatus] ?? {
    variant: 'info' as StatusType,
    label: status || 'Inconnu',
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
