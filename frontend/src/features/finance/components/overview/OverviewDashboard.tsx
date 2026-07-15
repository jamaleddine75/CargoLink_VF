import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  DollarSign, Wallet, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight,
  Activity, Users, Building, CreditCard, Briefcase, RefreshCw, Download, FileText, Search, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { financialService } from '../../api/financialService';
import { StatCard } from '@/components/shared/StatCard';

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
  { action: 'Withdrawal paid', user: 'Driver Ahmed', amount: '+1,250 MAD', status: 'completed', time: '2 min ago' },
  { action: 'Wallet frozen', user: 'Agency Express', amount: '', status: 'warning', time: '15 min ago' },
  { action: 'COD remittance confirmed', user: 'Driver Karim', amount: '+4,800 MAD', status: 'completed', time: '1h ago' },
  { action: 'Payout rejected', user: 'Agency SpeedLog', amount: '3,200 MAD', status: 'failed', time: '2h ago' },
  { action: 'Balance adjusted', user: 'Admin', amount: '+500 MAD', status: 'completed', time: '3h ago' },
  { action: 'Settlement completed', user: 'System', amount: '12,450 MAD', status: 'completed', time: '5h ago' },
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-7 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Platform Treasury', value: formatCurrency(stats?.platformBalance), icon: Briefcase, trend: '+2.5%' },
    { title: 'Total Wallet Liquidity', value: formatCurrency(stats?.totalWalletBalance), icon: Wallet, trend: '+1.2%' },
    { title: 'Today Revenue', value: formatCurrency(stats?.todayRevenue), icon: TrendingUp, trend: '+12.4%' },
    { title: 'Platform Profit (5%)', value: formatCurrency(stats?.platformProfit), icon: DollarSign, trend: '+8.2%' },
    { title: 'Pending Withdrawals', value: formatCurrency(stats?.pendingWithdrawalsAmount), icon: CreditCard, trend: '-5%' },
    { title: 'COD in Transit', value: formatCurrency(stats?.codPendingAmount), icon: Activity, trend: '+8.1%' },
    { title: 'Active Wallets', value: formatNumber(stats?.activeWalletsCount), icon: Users, trend: '+14' },
    { title: 'Monthly Revenue', value: formatCurrency(stats?.monthlyRevenue), icon: Building, trend: '+15.2%' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <StatCard
            key={i}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue / Profit Chart */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Revenue & Profit</CardTitle>
              <CardDescription>Monthly platform performance metrics</CardDescription>
            </div>
            <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
              {['revenue', 'cashflow'].map((type) => (
                <button key={type} onClick={() => setSelectedChart(type as any)}
                  className={cn('px-3 py-1.5 text-[11px] font-medium rounded-md transition-all',
                    selectedChart === type ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {type === 'revenue' ? 'Revenue' : 'Cash Flow'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'revenue' ? (
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="month" stroke="currentColor" className="opacity-40" tick={{ fontSize: 11 }} />
                    <YAxis stroke="currentColor" className="opacity-40" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#profGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={mockCashFlow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="day" stroke="currentColor" className="opacity-40" tick={{ fontSize: 11 }} />
                    <YAxis stroke="currentColor" className="opacity-40" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                    <Bar dataKey="inflow" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="outflow" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Recent Activity</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentActivity.map((item, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  item.status === 'completed' ? 'bg-emerald-500' :
                  item.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.user} · {item.time}</p>
                </div>
                {item.amount && <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{item.amount}</span>}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {[
              { label: 'Run Settlement', icon: RefreshCw, desc: 'Process pending payouts' },
              { label: 'Reconcile Batch', icon: FileText, desc: 'Match COD vs collections' },
              { label: 'Export Report', icon: Download, desc: 'Download financial summary' },
              { label: 'Fraud Scan', icon: Search, desc: 'Detect anomalies' },
            ].map((action, i) => (
              <Button key={i} variant="outline"
                className="flex flex-col items-start gap-1.5 h-auto p-4 rounded-xl hover:bg-muted/50 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{action.desc}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Active Drivers', value: formatNumber(stats?.activeDriversCount), max: '2,500', color: 'bg-emerald-500' },
              { label: 'Active Agencies', value: formatNumber(stats?.activeAgenciesCount), max: '120', color: 'bg-blue-500' },
              { label: 'Frozen Wallets', value: formatNumber(stats?.frozenWalletsCount), max: '50', color: 'bg-rose-500' },
            ].map((item) => {
              const pct = Math.min(100, (parseInt(item.value.replace(/,/g, '')) / parseInt(item.max.replace(/,/g, ''))) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value} <span className="text-muted-foreground/45">/ {item.max}</span></span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
