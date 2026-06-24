import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, Package, Download,
  Target, Zap, Activity, ShieldCheck,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import adminService from '@/services/api/adminService';
import { TaskAnalytics } from '@/types';
import { toast } from 'sonner';

const PERIOD_MAP: Record<string, string> = {
  '24H': 'DAILY',
  '7D': 'DAILY',
  '30D': 'MONTHLY',
  'ALL': 'MONTHLY',
};

const STATUS_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];
const PRIORITY_COLORS = ['#3B82F6', '#F59E0B', '#F97316', '#EF4444'];

function exportCSV(analytics: TaskAnalytics, dashboard: any) {
  const rows = [
    ['Metric', 'Value'],
    ['Total Orders', analytics.totalOrders],
    ['Completed Orders', analytics.completedOrders],
    ['Pending Orders', analytics.pendingOrders],
    ['Cancelled Orders', analytics.cancelledOrders],
    ['Completion Rate (%)', (analytics.completionRate * 100).toFixed(1)],
    ['Average Delivery Time (min)', analytics.averageDeliveryTime],
    ['SLA Compliance Rate (%)', (analytics.slaComplianceRate * 100).toFixed(1)],
    ['Total Order Value (MAD)', analytics.totalOrderValue],
    ['Average Order Value (MAD)', analytics.averageOrderValue?.toFixed(2)],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7D');
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const period = PERIOD_MAP[timeRange] || 'DAILY';
      const [analyticsData, dashboardData] = await Promise.all([
        adminService.getTaskAnalytics(period),
        adminService.getDashboardStats(),
      ]);
      setAnalytics(analyticsData);
      setDashboard(dashboardData);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const orderTrendData: { name: string; value: number }[] = dashboard?.orderTrend
    ? Object.entries(dashboard.orderTrend).map(([name, value]) => ({ name, value: Number(value) }))
    : dashboard?.weeklyOrders?.map((v: number, i: number) => ({ name: `Day ${i + 1}`, value: v })) || [];

  const statusData = analytics ? [
    { name: 'Completed', value: analytics.completedOrders, color: STATUS_COLORS[0] },
    { name: 'Pending', value: analytics.pendingOrders, color: STATUS_COLORS[1] },
    { name: 'Cancelled', value: analytics.cancelledOrders, color: STATUS_COLORS[3] },
  ] : [];

  const priorityData = analytics ? [
    { name: 'Low', value: analytics.lowPriorityCount, color: PRIORITY_COLORS[0] },
    { name: 'Medium', value: analytics.mediumPriorityCount, color: PRIORITY_COLORS[1] },
    { name: 'High', value: analytics.highPriorityCount, color: PRIORITY_COLORS[2] },
    { name: 'Critical', value: analytics.criticalPriorityCount, color: PRIORITY_COLORS[3] },
  ] : [];

  const completionRate = analytics ? (analytics.completionRate * 100).toFixed(1) : '—';
  const slaRate = analytics ? (analytics.slaComplianceRate * 100).toFixed(1) : '—';
  const avgDelivery = analytics ? analytics.averageDeliveryTime?.toFixed(0) : '—';
  const totalRevenue = analytics?.totalOrderValue;

  if (loading) {
    return (
      <div className="space-y-8 pb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-accent/20 rounded animate-pulse" />
            <div className="h-10 w-72 bg-accent/20 rounded animate-pulse" />
          </div>
          <div className="h-12 w-48 bg-accent/20 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-accent/20 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-80 rounded-2xl bg-accent/20 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 font-sans selection:bg-primary/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                 Intelligence Node
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           </div>
           <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-none">
              Mission <span className="text-indigo-500">Analytics</span>
           </h1>
           <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">
              Real-time audit of <span className="text-indigo-400">Fleet Operations</span> and Revenue
           </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-accent/30 p-1.5 rounded-2xl flex items-center gap-1">
              {['24H', '7D', '30D', 'ALL'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    timeRange === range ? "bg-indigo-600 text-foreground shadow-xl" : "text-foreground/30 hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
           </div>
           <Button onClick={fetchData} variant="outline" className="h-14 w-14 rounded-2xl bg-accent/30 border-border/40">
              <RefreshCw className="w-5 h-5" />
           </Button>
           <Button
             onClick={() => analytics && exportCSV(analytics, dashboard)}
             disabled={!analytics}
             className="h-14 w-14 rounded-2xl bg-accent/30 hover:bg-accent/40 text-foreground border border-border/40"
           >
              <Download className="w-5 h-5" />
           </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiItem
          label="Completion Rate"
          value={analytics ? analytics.completionRate * 100 : 0}
          unit="%"
          trend={analytics ? `${(analytics.completionRate * 100).toFixed(1)}%` : '—'}
          trendType={analytics && analytics.completionRate > 0.9 ? 'up' : 'down'}
          color="indigo"
        />
        <KpiItem
          label="Avg Delivery Time"
          value={analytics?.averageDeliveryTime ?? 0}
          unit="min"
          trend={avgDelivery !== '—' ? `${avgDelivery} min` : '—'}
          trendType="neutral"
          color="purple"
        />
        <KpiItem
          label="SLA Compliance"
          value={analytics ? analytics.slaComplianceRate * 100 : 0}
          unit="%"
          trend={slaRate !== '—' ? `${slaRate}%` : '—'}
          trendType={analytics && analytics.slaComplianceRate > 0.95 ? 'up' : 'down'}
          color="emerald"
        />
        <KpiItem
          label="Total Revenue"
          value={totalRevenue ? Math.round(totalRevenue) : 0}
          unit=" MAD"
          trend={totalRevenue ? `${Number(totalRevenue).toLocaleString()} MAD` : '—'}
          trendType="neutral"
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Order Volume Trend */}
        <Card className="premium-glass p-8 border-none overflow-hidden relative group">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Order Velocity</h3>
                    <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1">Mission volume by day</p>
                 </div>
                 <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
              </div>

              {orderTrendData.length > 0 ? (
                <div className="flex-1 h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderTrendData}>
                         <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                               <stop offset="100%" stopColor="#A855F7" stopOpacity={0.8} />
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 900 }} dy={10} />
                         <YAxis hide />
                         <Tooltip cursor={{ fill: '#ffffff05' }} content={({ active, payload }) => {
                            if (active && payload?.length) return (
                              <div className="bg-background border border-border/40 p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{payload[0].payload.name}</p>
                                <p className="text-xl font-black text-indigo-400 mt-1">{payload[0].value} <span className="text-[10px] text-foreground/20">Orders</span></p>
                              </div>
                            );
                            return null;
                         }} />
                         <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 4, 4]} barSize={32} animationDuration={1500} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartState label="No trend data available" />
              )}
           </div>
        </Card>

        {/* Order Status Distribution */}
        <Card className="premium-glass p-8 border-none overflow-hidden relative group">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Status Distribution</h3>
                    <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1">Order outcomes breakdown</p>
                 </div>
                 <Activity className="w-5 h-5 text-emerald-500" />
              </div>

              {statusData.length > 0 ? (
                <div className="flex-1 h-[300px] relative flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" animationDuration={1500}>
                            {statusData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                         </Pie>
                         <Tooltip content={({ active, payload }) => {
                            if (active && payload?.length) return (
                              <div className="bg-background border border-border/40 p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{payload[0].payload.name}</p>
                                <p className="text-xl font-black text-foreground mt-1">{payload[0].value}</p>
                              </div>
                            );
                            return null;
                         }} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-3">
                      {statusData.map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{item.name}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <EmptyChartState label="No status data available" />
              )}
           </div>
        </Card>

        {/* Priority Breakdown */}
        <Card className="premium-glass p-8 border-none overflow-hidden relative group">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Priority Breakdown</h3>
                    <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1">Order urgency distribution</p>
                 </div>
                 <Target className="w-5 h-5 text-purple-500" />
              </div>

              {priorityData.some(d => d.value > 0) ? (
                <div className="flex-1 h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                         <XAxis type="number" hide />
                         <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }} width={60} />
                         <Tooltip cursor={{ fill: '#ffffff05' }} content={({ active, payload }) => {
                            if (active && payload?.length) return (
                              <div className="bg-background border border-border/40 p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{payload[0].payload.name}</p>
                                <p className="text-xl font-black text-foreground mt-1">{payload[0].value} <span className="text-[10px] text-foreground/20">orders</span></p>
                              </div>
                            );
                            return null;
                         }} />
                         <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28} animationDuration={1500}>
                            {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartState label="No priority data available" />
              )}
           </div>
        </Card>

        {/* Operational Summary */}
        <Card className="premium-glass p-8 border-none overflow-hidden relative group">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Operational Summary</h3>
                    <p className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1">Key platform metrics</p>
                 </div>
                 <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Orders', value: analytics?.totalOrders ?? '—', color: 'indigo' },
                  { label: 'Completed', value: analytics?.completedOrders ?? '—', color: 'emerald' },
                  { label: 'SLA Violations', value: analytics?.slaViolations ?? '—', color: 'amber' },
                  { label: 'High Reassign.', value: analytics?.highReassignmentOrders ?? '—', color: 'rose' },
                  { label: 'Avg Reassign/Order', value: analytics?.averageReassignmentCount?.toFixed(1) ?? '—', color: 'purple' },
                  { label: 'Avg Order Value', value: analytics?.averageOrderValue ? `${analytics.averageOrderValue.toFixed(0)} MAD` : '—', color: 'blue' },
                ].map(item => (
                  <div key={item.label} className={cn(
                    "p-5 rounded-2xl bg-accent/20 border border-border/40 space-y-2",
                  )}>
                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">{item.label}</p>
                    <p className={cn(
                      "text-2xl font-black tracking-tighter",
                      item.color === 'emerald' ? "text-emerald-400" :
                      item.color === 'amber' ? "text-amber-400" :
                      item.color === 'rose' ? "text-rose-400" :
                      item.color === 'purple' ? "text-purple-400" :
                      item.color === 'blue' ? "text-blue-400" : "text-indigo-400"
                    )}>{item.value}</p>
                  </div>
                ))}
              </div>
           </div>
        </Card>
      </div>

      {/* Operational Integrity Banner */}
      <Card className="premium-glass p-10 border-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                 <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none mb-2">Operational Status</h3>
                 <p className="text-[10px] text-foreground/30 font-black uppercase tracking-[0.2em]">
                   Period: <span className="text-indigo-400">{timeRange}</span> · {analytics?.totalOrders ?? 0} total orders tracked
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-10">
              <div className="text-center">
                 <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em] mb-1">Completion</p>
                 <p className="text-2xl font-black text-emerald-400 tracking-tight">{completionRate}<span className="text-xs opacity-20">%</span></p>
              </div>
              <div className="text-center">
                 <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em] mb-1">SLA Rate</p>
                 <p className="text-2xl font-black text-foreground tracking-tight">{slaRate}<span className="text-xs opacity-20">%</span></p>
              </div>
              <Button onClick={() => analytics && exportCSV(analytics, dashboard)} disabled={!analytics} className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-foreground font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-600/20">
                 Export Report
              </Button>
           </div>
        </div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
      </Card>
    </div>
  );
};

const EmptyChartState = ({ label }: { label: string }) => (
  <div className="flex-1 h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
    <Package className="w-10 h-10 opacity-20" />
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
  </div>
);

const KpiItem = ({ label, value, unit, trend, trendType, color }: any) => (
  <Card className="premium-glass p-8 border-none relative overflow-hidden group">
     <div className="relative z-10">
        <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em] mb-3">{label}</p>
        <h4 className="text-4xl font-black text-foreground tracking-tighter">
           <AnimatedCounter value={parseFloat(String(value)) || 0} />
           <span className="text-sm opacity-20 ml-1">{unit}</span>
        </h4>
        <div className="flex items-center gap-2 mt-4">
          {trendType === 'neutral' ? (
            <div className="px-2 py-0.5 rounded-md bg-accent/30 text-foreground/40 text-[9px] font-black uppercase tracking-widest border border-border/40">
               {trend}
            </div>
          ) : (
            <div className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-border/40 flex items-center gap-1",
              trendType === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}>
               {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
               {trend}
            </div>
          )}
        </div>
     </div>
     <div className={cn(
       "absolute -bottom-8 -right-8 w-24 h-24 blur-[40px] opacity-10 rounded-full",
       color === 'indigo' ? "bg-indigo-600" : color === 'purple' ? "bg-purple-600" : color === 'emerald' ? "bg-emerald-600" : "bg-blue-600"
     )} />
  </Card>
);

export default Analytics;
