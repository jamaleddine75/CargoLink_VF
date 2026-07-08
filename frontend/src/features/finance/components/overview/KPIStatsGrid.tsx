import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Users,
  Building
} from 'lucide-react';
import { financialService } from '../../api/financialService';

export const KPIStatsGrid = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['financialOverview'],
    queryFn: financialService.getOverviewKPIs,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-800 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-red-800 dark:text-red-400 font-medium">Failed to load financial statistics</h3>
        <p className="text-red-600 dark:text-red-500 text-sm mt-1">Please try again later or contact support.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD' }).format(amount || 0);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const kpiCards = [
    {
      title: 'Platform Balance',
      value: formatCurrency(stats.platformBalance),
      icon: DollarSign,
      trend: '+2.5%',
      trendUp: true,
      color: 'bg-emerald-500'
    },
    {
      title: 'Total Wallet Balance',
      value: formatCurrency(stats.totalWalletBalance),
      icon: Wallet,
      trend: '+1.2%',
      trendUp: true,
      color: 'bg-indigo-500'
    },
    {
      title: 'Today\'s Revenue',
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      trend: '+12.4%',
      trendUp: true,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Withdrawals',
      value: formatCurrency(stats.pendingWithdrawalsAmount),
      icon: AlertCircle,
      trend: '-5.0%',
      trendUp: false,
      color: 'bg-amber-500'
    },
    {
      title: 'Active Wallets',
      value: formatNumber(stats.activeWalletsCount),
      icon: Activity,
      trend: '+14',
      trendUp: true,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Agencies',
      value: formatNumber(stats.activeAgenciesCount),
      icon: Building,
      trend: '+2',
      trendUp: true,
      color: 'bg-cyan-500'
    },
    {
      title: 'COD Pending',
      value: formatCurrency(stats.codPendingAmount),
      icon: DollarSign,
      trend: '+8.1%',
      trendUp: true,
      color: 'bg-rose-500'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      trend: '+15.2%',
      trendUp: true,
      color: 'bg-teal-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{card.title}</h3>
              <div className={`p-2 rounded-lg ${card.color} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="flex items-baseline space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</h2>
              <div className={`flex items-center text-sm font-medium ${card.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {card.trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {card.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
