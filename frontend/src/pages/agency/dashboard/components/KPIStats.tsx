import React from 'react';
import { Package, Truck, Users, AlertTriangle, Wallet } from 'lucide-react';
import { KPISkeleton } from '@/pages/agency/shared';
import StatCard from '@/components/shared/StatCard';

interface KPIStatsProps {
  metrics: {
    TotalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    pendingPickups: number;
    ongoingDeliveries: number;
    activeDrivers: number;
    pendingCOD: number;
  } | null;
  loading: boolean;
}

export const KPIStats: React.FC<KPIStatsProps> = ({ metrics, loading }) => {
  if (loading) return <KPISkeleton />;

  const stats = [
    {
      title: "Total Orders",
      value: metrics?.TotalOrders || 0,
      icon: Package,
      trend: "DB",
    },
    {
      title: "Delivered",
      value: metrics?.deliveredOrders || 0,
      icon: Truck,
      trend: "Real",
    },
    {
      title: "Pending Pickups",
      value: metrics?.pendingPickups || 0,
      icon: AlertTriangle,
      trend: "Live",
    },
    {
      title: "Ongoing Deliveries",
      value: metrics?.ongoingDeliveries || 0,
      icon: Users,
      trend: "Live",
    },
    {
      title: "Pending COD",
      value: metrics?.pendingCOD || 0,
      suffix: " MAD",
      icon: Wallet,
      trend: "Wallet",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          suffix={stat.suffix}
        />
      ))}
    </div>
  );
};
export default KPIStats;
