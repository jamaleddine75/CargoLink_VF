import React from 'react';
import { STATUS_CONFIG } from '@/lib/statusConstants';

const StatusBadge = ({ status, className = "" }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    dot: 'bg-zinc-500'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-[11px] uppercase tracking-wider ${config.color} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </div>
  );
};

export default StatusBadge;
