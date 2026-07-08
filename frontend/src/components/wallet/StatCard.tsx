import React from 'react';
import SharedStatCard from '../shared/StatCard';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'blue' | 'emerald' | 'amber';
  trend?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  loading = false,
}) => {
  return (
    <SharedStatCard
      title={label}
      value={value}
      icon={icon}
      trend={trend}
      loading={loading}
      suffix={typeof value === 'number' ? ' MAD' : ''}
    />
  );
};

export default StatCard;
