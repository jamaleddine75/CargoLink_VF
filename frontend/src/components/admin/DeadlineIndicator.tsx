import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export interface DeadlineIndicatorProps {
  deadline?: string;
  slaStatus?: string;
  createdAt?: string;
}

export const DeadlineIndicator: React.FC<DeadlineIndicatorProps> = ({ deadline, slaStatus, createdAt }) => {
  if (!deadline) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Clock className="w-3 h-3" />
        No deadline
      </div>
    );
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let statusColor = 'text-green-600';
  let bgColor = 'bg-green-50 dark:bg-green-900/20';
  let icon = <CheckCircle className="w-3 h-3" />;
  let label = 'On Track';

  if (slaStatus === 'EXCEEDED') {
    statusColor = 'text-red-600';
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    icon = <AlertTriangle className="w-3 h-3" />;
    label = 'Exceeded';
  } else if (slaStatus === 'AT_RISK' || hoursRemaining <= 1) {
    statusColor = 'text-orange-600';
    bgColor = 'bg-orange-50 dark:bg-orange-900/20';
    icon = <AlertTriangle className="w-3 h-3" />;
    label = 'At Risk';
  }

  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusColor} ${bgColor}`}>
      {icon}
      <span>{formattedDeadline}</span>
      <span className="text-[10px] opacity-75">({label})</span>
    </div>
  );
};
