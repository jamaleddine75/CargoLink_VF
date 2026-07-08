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
  Building,
  CreditCard,
  Briefcase
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 animate-pulse h-36">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mb-6"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl p-8 rounded-3xl border border-red-500/20 text-center flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-red-600 dark:text-red-400 font-semibold text-lg">System Disconnected</h3>
        <p className="text-red-500/80 text-sm mt-2 max-w-sm">The Financial Engine could not synchronize live metrics. Please verify the connection or contact support.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const kpiCards = [
    {
      title: 'Platform Treasury',
      value: formatCurrency(stats.platformBalance),
      icon: Briefcase,
      trend: '+2.5%',
      trendUp: true,
      gradient: 'from-blue-600 to-indigo-600',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-600/10 dark:bg-indigo-400/20',
      shadowColor: 'shadow-indigo-500/20'
    },
    {
      title: 'Global Wallets Liquidity',
      value: formatCurrency(stats.totalWalletBalance),
      icon: Wallet,
      trend: '+1.2%',
      trendUp: true,
      gradient: 'from-emerald-500 to-teal-500',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-600/10 dark:bg-emerald-400/20',
      shadowColor: 'shadow-emerald-500/20'
    },
    {
      title: 'Revenue Generated (24h)',
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      trend: '+12.4%',
      trendUp: true,
      gradient: 'from-amber-500 to-orange-500',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-600/10 dark:bg-orange-400/20',
      shadowColor: 'shadow-orange-500/20'
    },
    {
      title: 'Pending Settlements',
      value: formatCurrency(stats.pendingWithdrawalsAmount),
      icon: CreditCard,
      trend: '-5.0%',
      trendUp: false,
      gradient: 'from-rose-500 to-pink-600',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-600/10 dark:bg-rose-400/20',
      shadowColor: 'shadow-rose-500/20'
    },
    {
      title: 'Active Master Accounts',
      value: formatNumber(stats.activeAgenciesCount),
      icon: Building,
      trend: '+2',
      trendUp: true,
      gradient: 'from-cyan-500 to-blue-500',
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-600/10 dark:bg-cyan-400/20',
      shadowColor: 'shadow-cyan-500/20'
    },
    {
      title: 'Active Operating Wallets',
      value: formatNumber(stats.activeWalletsCount),
      icon: Activity,
      trend: '+14',
      trendUp: true,
      gradient: 'from-purple-500 to-fuchsia-500',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-600/10 dark:bg-purple-400/20',
      shadowColor: 'shadow-purple-500/20'
    },
    {
      title: 'Gross Cash Collected (COD)',
      value: formatCurrency(stats.codPendingAmount),
      icon: DollarSign,
      trend: '+8.1%',
      trendUp: true,
      gradient: 'from-slate-700 to-slate-900',
      iconColor: 'text-slate-700 dark:text-slate-300',
      iconBg: 'bg-slate-500/10 dark:bg-slate-400/20',
      shadowColor: 'shadow-slate-500/20'
    },
    {
      title: 'Monthly Run Rate',
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      trend: '+15.2%',
      trendUp: true,
      gradient: 'from-violet-600 to-purple-600',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-600/10 dark:bg-violet-400/20',
      shadowColor: 'shadow-violet-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div 
            key={index} 
            className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl p-6 rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
          >
            {/* Background Gradient Glow on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-2xl ${card.iconBg} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className={`w-6 h-6 ${card.iconColor} dark:opacity-90`} />
                </div>
                <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${card.trendUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  {card.trendUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                  {card.trend}
                </div>
              </div>
              
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide mb-1 uppercase text-xs">{card.title}</h3>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {card.value}
                </h2>
              </div>
            </div>
            
            {/* Bottom Glow Bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          </div>
        );
      })}
    </div>
  );
};
