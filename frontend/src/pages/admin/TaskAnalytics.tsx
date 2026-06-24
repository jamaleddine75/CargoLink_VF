import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import adminService from '@/services/api/adminService';
import { TaskAnalytics } from '@/types';
import { toast } from 'sonner';
import { KpiCard } from '@/components/common/KpiCard';

export const TaskAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTaskAnalytics(period);
      setAnalytics(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-screen">No analytics data available</div>;
  }

  const priorityData = [
    { name: 'Low', value: analytics.lowPriorityCount, fill: '#3b82f6' },
    { name: 'Medium', value: analytics.mediumPriorityCount, fill: '#f59e0b' },
    { name: 'High', value: analytics.highPriorityCount, fill: '#f97316' },
    { name: 'Critical', value: analytics.criticalPriorityCount, fill: '#ef4444' },
  ];

  const statusData = [
    { name: 'Completed', value: analytics.completedOrders, fill: '#10b981' },
    { name: 'Pending', value: analytics.pendingOrders, fill: '#3b82f6' },
    { name: 'Cancelled', value: analytics.cancelledOrders, fill: '#6b7280' },
  ];

  return (
    <div className="space-y-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Task Analytics</h1>
            <p className="text-sm text-muted-foreground/70 mt-1">Performance metrics and insights for {period.toLowerCase()} period</p>
          </div>
          <div className="flex gap-2">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                  period === p
                    ? 'bg-primary text-foreground'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total Orders"
            value={analytics.totalOrders}
            icon={CheckCircle}
          />
          <KpiCard
            title="Completion Rate"
            value={`${analytics.completionRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
          <KpiCard
            title="SLA Compliance"
            value={`${analytics.slaComplianceRate.toFixed(1)}%`}
            icon={Clock}
          />
          <KpiCard
            title="SLA Violations"
            value={analytics.slaViolations}
            icon={AlertTriangle}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Priority Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Order Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Average Delivery Time"
            value={`${analytics.averageDeliveryTime.toFixed(0)} min`}
            subtitle="Time from creation to delivery"
          />
          <MetricCard
            title="Average Pickup Time"
            value={`${analytics.averageTimeToPickup.toFixed(0)} min`}
            subtitle="Time from creation to pickup"
          />
          <MetricCard
            title="Average Reassignments"
            value={analytics.averageReassignmentCount.toFixed(2)}
            subtitle="Per order reassignment count"
          />
          <MetricCard
            title="High Reassignment Orders"
            value={analytics.highReassignmentOrders}
            subtitle="Orders reassigned >2 times"
            warning
          />
          <MetricCard
            title="Cost Per Delivery"
            value={`$${analytics.costPerDelivery.toFixed(2)}`}
            subtitle="Average cost per completed order"
          />
          <MetricCard
            title="Total Order Value"
            value={`$${analytics.totalOrderValue.toFixed(2)}`}
            subtitle="Total revenue for period"
          />
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string | number; subtitle: string; warning?: boolean }> = ({
  title,
  value,
  subtitle,
  warning,
}) => (
  <Card className={`glass-card ${warning ? 'border-orange-200 dark:border-orange-800' : ''}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-black mt-2">{value}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        {warning && <AlertCircle className="w-5 h-5 text-orange-500" />}
      </div>
    </CardContent>
  </Card>
);
