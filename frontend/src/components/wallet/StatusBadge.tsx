import React from 'react';
import { cn } from '@/lib/utils';
import { WALLET_STATUS_COLORS } from '@/lib/constants/walletConstants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const FrenchLabels: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  COMPLETED: 'Complété',
  CREDITED: 'Crédité',
  CONFIRMED: 'Confirmé',
  FAILED: 'Échoué',
  REJECTED: 'Rejeté',
  ACTIVE: 'Actif',
  FROZEN: 'Gelé',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const upper = status?.toUpperCase() || 'PENDING';
  const color = WALLET_STATUS_COLORS[upper as keyof typeof WALLET_STATUS_COLORS] || 'slate';
  const label = FrenchLabels[upper] || status;

  const colorStyles: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
        colorStyles[color] || colorStyles.slate,
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
