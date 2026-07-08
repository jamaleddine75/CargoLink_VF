import React from 'react';
import { Card } from '@/components/ui/card';
import SharedStatCard from '@/components/shared/StatCard';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber';
}

export const StatCard = ({ label, value, icon }: StatCardProps) => (
  <SharedStatCard title={label} value={value} icon={icon} suffix=" MAD" />
);

export const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="py-16 text-center">
    <Icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
    <p className="text-xs font-medium text-muted-foreground">{message}</p>
  </div>
);

export const LoaderPulse = () => (
  <div className="flex gap-1">
    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-6 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
  </div>
);
