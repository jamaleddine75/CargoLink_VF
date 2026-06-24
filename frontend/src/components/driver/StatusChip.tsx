import React from 'react';
import { cn } from '@/lib/utils';

export type ChipStatus = 'ASSIGNED' | 'PICKUP_READY' | 'EN_LIVRAISON' | 'DELIVERED' | 'PROBLEME' | 'ONLINE' | 'OFFLINE';

const CHIP_CONFIG: Record<ChipStatus, { bg: string; text: string; border: string; label: string }> = {
  ASSIGNED:     { bg: 'bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20',  label: 'Assigné'    },
  PICKUP_READY: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/20',   label: 'En collecte' },
  EN_LIVRAISON: { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',    border: 'border-blue-500/20',    label: 'En livraison'},
  DELIVERED:    { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', label: 'Livré'       },
  PROBLEME:     { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-500/20',    label: 'Incident'    },
  ONLINE:       { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', label: 'En ligne'   },
  OFFLINE:      { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400',   border: 'border-slate-500/20',   label: 'Hors ligne'  },
};

interface StatusChipProps {
  status: ChipStatus | string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  // Fallback to OFFLINE style if status is unknown
  const config = CHIP_CONFIG[status as ChipStatus] || CHIP_CONFIG.OFFLINE;

  return (
    <span className={cn(
      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border whitespace-nowrap backdrop-blur-md",
      config.bg,
      config.text,
      config.border,
      className
    )}>
      {config.label || status}
    </span>
  );
};

