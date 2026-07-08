import React from 'react';
import StatCard from '@/components/shared/StatCard';

interface FleetStatTileProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'rose' | 'amber';
  onClick?: () => void;
}

export const FleetStatTile = ({ label, value, icon, onClick }: FleetStatTileProps) => {
  return (
    <div onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <StatCard title={label} value={value} icon={icon} />
    </div>
  );
};
