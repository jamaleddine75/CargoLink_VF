import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line
} from 'recharts';
import {
  DollarSign, Wallet, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight,
  Activity, Users, Building, CreditCard, Briefcase, ArrowRight,
  RefreshCw, Download, FileText, Search, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { financialService } from '../../api/financialService';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v || 0);

const formatNumber = (v: number) => new Intl.NumberFormat('en-US').format(v || 0);

const mockRevenueData = [
  { month: 'Jan', revenue: 124000, profit: 6200, orders: 1450 },
  { month: 'Feb', revenue: 139000, profit: 6950, orders: 1620 },
  { month: 'Mar', revenue: 152000, profit: 7600, orders: 1780 },
  { month: 'Apr', revenue: 168000, profit: 8400, orders: 1950 },
  { month: 'May', revenue: 185000, profit: 9250, orders: 2120 },
  { month: 'Jun', revenue: 201000, profit: 10050, orders: 2380 },
];

const mockCashFlow = [
  { day: 'Mon', inflow: 24000, outflow: 8200 },
  { day: 'Tue', inflow: 28500, outflow: 9100 },
  { day: 'Wed', inflow: 26200, outflow: 7800 },
  { day: 'Thu', inflow: 31000, outflow: 10500 },
  { day: 'Fri', inflow: 29800, outflow: 9600 },
  { day: 'Sat', inflow: 22400, outflow: 5400 },
  { day: 'Sun', inflow: 18500, outflow: 3200 },
];

const mockRecentActivity = [
  { action: 'Withdrawal approved', user: 'Driver Ahmed', amount: '+1,250 MAD', status: 'completed', time: '2 min ago' },
  { action: 'Wallet frozen', user: 'Agency Express', amount: '', status: 'warning', time: '15 min ago' },
  { action: 'COD remittance confirmed', user: 'Driver Karim', amount: '+4,800 MAD', status: 'completed', time: '1h ago' },
  { action: 'Payout rejected', user: 'Agency SpeedLog', amount: '3,200 MAD', status: 'failed', time: '2h ago' },
  { action: 'Balance adjusted', user: 'Admin', amount: '+500 MAD', status: 'completed', time: '3h ago' },
  { action: 'Settlement completed', user: 'System', amount: '12,450 MAD', status: 'completed', time: '5h ago' },
];

const KpiCard: React.FC<{
  title: string; value: string; icon: React.ElementType; trend?: string; trendUp?: boolean;
  gradient: string; iconBg: string; shadowColor: string; subtitle?: string;
}> = ({ title, value, icon: Icon, trend, trendUp, gradient, iconBg, shadowColor, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="group relative bg-[#111318] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full',
            trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-1.5">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-white/30 mt-1">{subtitle}</p>}
    </div>
    <div className={`absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-40 rounded-full transition-opacity duration-500`} />
  </motion.div>
);

export const OverviewDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['financialOverview'],
    queryFn: financialService.getOverviewKPIs,
    refetchInterval: 30000,
  });

  const [selectedChart, setSelectedChart] = useState<'revenue' | 'cashflow'>('revenue');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#111318] rounded-2xl p-5 animate-pulse border border-white/[0.06]">
              <div className="h-3 bg-white/5 rounded w-1/2 mb-4" />
              <div className="h-7 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-2 bg-white/5 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Platform Treasury', value: formatCurrency(stats?.platformBalance), icon: Briefcase, gradient: 'from-indigo-500 to-violet-600', iconBg: 'bg-indigo-500/20', shadowColor: 'shadow-indigo-500/20', trend: '+2.5%', trendUp: true },
    { title: 'Total Wallet Liquidity', value: formatCurrency(stats?.totalWalletBalance), icon: Wallet, gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-500/20', shadowColor: 'shadow-emerald-500/20', trend: '+1.2%', trendUp: true },
    { title: 'Today Revenue', value: formatCurrency(stats?.todayRevenue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-500/20', shadowColor: 'shadow-amber-500/20', trend: '+12.4%', trendUp: true },
    { title: 'Platform Profit (5%)', value: formatCurrency(stats?.platformProfit), icon: DollarSign, gradient: 'from-rose-500 to-pink-500', iconBg: 'bg-rose-500/20', shadowColor: 'shadow-rose-500/20', trend: '+8.2%', trendUp: true },
    { title: 'Pending Withdrawals', value: formatCurrency(stats?.pendingWithdrawalsAmount), icon: CreditCard, gradient: 'from-orange-500 to-red-500', iconBg: 'bg-orange-500/20', shadowColor: 'shadow-orange-500/20', trend: '-5%', trendUp: false, subtitle: 'Awaiting approval' },
    { title: 'COD in Transit', value: formatCurrency(stats?.codPendingAmount), icon: Activity, gradient: 'from-cyan-500 to-blue-500', iconBg: 'bg-cyan-500/20', shadowColor: 'shadow-cyan-500/20', trend: '+8.1%', trendUp: true },
    { title: 'Active Wallets', value: formatNumber(stats?.activeWalletsCount), icon: Users, gradient: 'from-purple-500 to-fuchsia-500', iconBg: 'bg-purple-500/20', shadowColor: 'shadow-purple-500/20', trend: '+14', trendUp: true },
    { title: 'Monthly Revenue', value: formatCurrency(stats?.monthlyRevenue), icon: Building, gradient: 'from-slate-600 to-slate-800', iconBg: 'bg-slate-500/20', shadowColor: 'shadow-slate-500/20', trend: '+15.2%', trendUp: true },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue / Profit Chart */}
        <div className="xl:col-span-2 bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white/90">Revenue & Profit</h3>
              <p className="text-[11px] text-white/40 mt-0.5">Monthly platform performance</p>
            </div>
            <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-lg">
              {['revenue', 'cashflow'].map((type) => (
                <button key={type} onClick={() => setSelectedChart(type as any)}
                  className={cn('px-3 py-1.5 text-[11px] font-medium rounded-md transition-all',
                    selectedChart === type ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'
                  )}>
                  {type === 'revenue' ? 'Revenue' : 'Cash Flow'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'revenue' ? (
                <AreaChart data={mockRevenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={mockCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="inflow" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90">Recent Activity</h3>
            <Clock className="w-4 h-4 text-white/30" />
          </div>
          <div className="space-y-1">
            {mockRecentActivity.map((item, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  item.status === 'completed' ? 'bg-emerald-500' :
                  item.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">{item.action}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.user} · {item.time}</p>
                </div>
                {item.amount && <span className="text-[11px] font-semibold text-emerald-400 shrink-0">{item.amount}</span>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/90 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Run Settlement', icon: RefreshCw, desc: 'Process pending payouts' },
              { label: 'Reconcile Batch', icon: FileText, desc: 'Match COD vs collections' },
              { label: 'Export Report', icon: Download, desc: 'Download financial summary' },
              { label: 'Fraud Scan', icon: Search, desc: 'Detect anomalies' },
            ].map((action, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <action.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-white/80">{action.label}</span>
                <span className="text-[10px] text-white/30">{action.desc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/90 mb-4">Platform Health</h3>
          <div className="space-y-4">
            {[
              { label: 'Active Drivers', value: formatNumber(stats?.activeDriversCount), max: '2,500', color: 'bg-emerald-500' },
              { label: 'Active Agencies', value: formatNumber(stats?.activeAgenciesCount), max: '120', color: 'bg-blue-500' },
              { label: 'Frozen Wallets', value: formatNumber(stats?.frozenWalletsCount), max: '50', color: 'bg-rose-500' },
            ].map((item) => {
              const pct = Math.min(100, (parseInt(item.value.replace(/,/g, '')) / parseInt(item.max.replace(/,/g, ''))) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/60">{item.label}</span>
                    <span className="text-white/90 font-medium">{item.value} <span className="text-white/20">/ {item.max}</span></span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
