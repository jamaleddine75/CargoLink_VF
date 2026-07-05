import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Truck,
  RefreshCw,
  Package,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Activity,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import adminService, { AdminStats } from '@/services/api/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
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
    <div className="space-y-4 md:space-y-8 relative z-10 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.7)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Admin overview</p>
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight font-display text-foreground">
            Admin <span className="text-primary">Dashboard</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
            Quick view of orders, fleet, and revenue. Clean, focused, and ready for daily operations.
          </p>
        </motion.div>

        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="outline"
            onClick={fetchAll}
            disabled={loading}
            className="rounded-full border-border/60 bg-background/80 backdrop-blur-xl font-semibold px-5 md:px-6 h-11 md:h-12 hover:bg-accent/10 transition-all shadow-sm w-full md:w-auto"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2 transition-transform duration-500", loading && "animate-spin text-primary")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <AdminStatCard
          title="Orders today"
          value={stats?.ordersToday || 0}
          icon={Package}
          color="indigo"
          trend="+12%"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Active deliveries"
          value={stats?.activeDeliveries || 0}
          icon={Activity}
          color="sky"
          trend="+5%"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Drivers online"
          value={stats?.driversOnline || 0}
          icon={Truck}
          color="emerald"
          trend="Stable"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Revenue"
          value={`${stats?.totalRevenue || 0} MAD`}
          icon={DollarSign}
          color="violet"
          trend="+18%"
          trendUp
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <Card className="lg:col-span-7 border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-20 right-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <CardContent className="p-5 md:p-7 relative">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base md:text-xl font-black tracking-tight">Revenue trend</h2>
                <p className="text-xs text-muted-foreground mt-1">Monthly performance at a glance</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/map')}
                className="rounded-full text-primary hover:bg-primary/10 font-semibold text-xs px-4"
              >
                Open map <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-3 md:p-4 shadow-inner">
              <div className="h-[260px] md:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.12} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '16px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 20px 40px -20px rgb(0 0 0 / 0.25)',
                        padding: '12px',
                        backdropFilter: 'blur(12px)'
                      }}
                      itemStyle={{ fontWeight: 800, fontSize: '11px', color: 'hsl(var(--primary))' }}
                      labelStyle={{ fontWeight: 800, fontSize: '12px', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorAdminRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-transparent pointer-events-none" />
          <CardContent className="p-5 md:p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base md:text-xl font-black tracking-tight">Quick stats</h2>
                <p className="text-xs text-muted-foreground mt-1">Small summary, no noise</p>
              </div>
              <Globe className="w-5 h-5 text-primary/50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Agencies</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalAgencies || 0}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Clients</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalClients || 0}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Orders</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats?.ordersToday || 0}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Drivers</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats?.driversOnline || 0}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-muted-foreground">
              Live updates are enabled for operational data.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] overflow-hidden relative group">
        <div className="p-5 md:p-7 border-b border-border/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <h2 className="text-base md:text-xl font-black tracking-tight">Recent activity</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Latest platform actions and updates.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/orders')}
            className="rounded-full border-border/60 font-semibold px-5 h-11 hover:bg-primary/10 hover:text-primary transition-all w-full md:w-auto"
          >
            View orders <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="p-10 md:p-16 text-center bg-gradient-to-br from-background/60 to-accent/5 text-muted-foreground">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm">
            <Package className="w-7 h-7 text-primary/40" />
          </div>
          <p className="text-sm md:text-base font-medium text-foreground/70">
            No extra noise here. Keep this area for activity widgets, recent orders, or alerts.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
