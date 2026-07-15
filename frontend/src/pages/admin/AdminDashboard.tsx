import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Truck,
  RefreshCw,
  Package,
  ArrowRight,
  ChevronRight,
  Activity,
  Globe,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import adminService, { AdminStats } from '@/services/api/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const statsData = await adminService.getGlobalStats();
      setStats(statsData);
    } catch (err: unknown) {
      toast.error('Failed to load platform matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Admin Dashboard"
        description="Global overview of orders, driver fleet and platform revenue."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Orders Today"
          value={stats?.ordersToday || 0}
          icon={Package}
          trend="+12%"
          loading={loading}
        />
        <StatCard
          title="Active Deliveries"
          value={stats?.activeDeliveries || 0}
          icon={Activity}
          trend="+5%"
          loading={loading}
        />
        <StatCard
          title="Drivers Online"
          value={stats?.driversOnline || 0}
          icon={Truck}
          trend="Stable"
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={stats?.totalRevenue || 0}
          suffix=" MAD"
          icon={DollarSign}
          trend="+18%"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 border border-border bg-card shadow-sm rounded-lg relative overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Revenue Trends</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly financial performance overview</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/map')}
                className="text-primary hover:bg-primary/10 font-semibold text-xs px-3 h-8 rounded-lg"
              >
                Open Map <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        padding: '8px',
                      }}
                      itemStyle={{ fontWeight: 600, fontSize: '11px', color: 'hsl(var(--primary))' }}
                      labelStyle={{ fontWeight: 600, fontSize: '11px', color: 'hsl(var(--foreground))', marginBottom: '2px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAdminRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border border-border bg-card shadow-sm rounded-lg relative overflow-hidden group">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Key Indicators</h2>
                <p className="text-xs text-muted-foreground mt-0.5">General platform statistics</p>
              </div>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Agencies</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats?.totalAgencies || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customers</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats?.totalCustomers || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Orders</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats?.ordersToday || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Drivers</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stats?.driversOnline || 0}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
              Live operational data updates.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden relative group">
        <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest logistic actions and system updates.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/orders')}
            className="gap-2"
          >
            View Orders <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="p-12 text-center bg-muted/10 text-muted-foreground">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            No significant events to report. The system is running stably.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
