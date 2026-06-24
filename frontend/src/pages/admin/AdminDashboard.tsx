import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Truck,
  RefreshCw,
  Package,
  ArrowRight,
  TrendingUp,
  Map as MapIcon,
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
import { Badge } from '@/components/ui/badge';
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
    } catch (err: any) {
      toast.error('Failed to load platform matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="space-y-4 md:space-y-10 relative z-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">Platform Root Node</p>
          </div>
          <h1 className="text-2xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] font-display italic">
            Control <span className="text-primary">Matrix</span>
          </h1>
          <p className="text-muted-foreground mt-4 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 opacity-60">
            <Globe className="w-3 h-3 text-primary" /> System Integrity: 99.9%
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={fetchAll}
            disabled={loading}
            className="rounded-xl md:rounded-2xl border-border/40 dark:border-white/5 bg-accent/10 dark:bg-white/5 backdrop-blur-3xl font-black text-[10px] uppercase tracking-widest px-6 md:px-8 h-12 md:h-16 hover:bg-accent/20 dark:hover:bg-white/10 transition-all group shadow-2xl w-full md:w-auto"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 md:w-4 md:h-4 mr-2 md:mr-3 transition-transform duration-500", loading && "animate-spin text-primary")} />
            Synchronize
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AdminStatCard
          title="Daily Throughput"
          value={stats?.ordersToday || 0}
          icon={Package}
          color="indigo"
          trend="+12%"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Active Vectors"
          value={stats?.activeDeliveries || 0}
          icon={Activity}
          color="sky"
          trend="+5%"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Fleet Capacity"
          value={stats?.driversOnline || 0}
          icon={Truck}
          color="emerald"
          trend="Optimal"
          trendUp
          loading={loading}
        />
        <AdminStatCard
          title="Global Revenue"
          value={`${stats?.totalRevenue || 0} MAD`}
          icon={DollarSign}
          color="violet"
          trend="+18%"
          trendUp
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-border/50 bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <CardContent className="p-5 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight font-display">Geospatial Intel</h2>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 md:mt-2 opacity-60">Active driver distribution</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/map')}
                className="rounded-xl text-primary hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest px-4"
              >
                Expand Matrix <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-accent/10 dark:bg-muted/10 rounded-2xl md:rounded-[2.5rem] min-h-[280px] md:min-h-[380px] flex items-center justify-center relative overflow-hidden border border-border/40 dark:border-white/5">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-[0.03] dark:opacity-10 transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

              <div className="relative z-10 flex flex-col items-center px-6 text-center">
                <div className="w-20 h-20 bg-hero-gradient rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="px-6 py-2.5 bg-background/80 dark:bg-background/50 backdrop-blur-xl rounded-full shadow-xl border border-border/50 dark:border-white/10">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Map Engine v2.0 Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-border/50 bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden h-full flex flex-col group">
          <CardContent className="p-5 md:p-8 flex-1 flex flex-col">
            <div className="relative z-10">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight mb-1 md:mb-2 font-display">Revenue Pulse</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 md:mb-10 opacity-60">Network-wide yield</p>

              <div className="h-[280px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderRadius: '20px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
                        padding: '16px',
                        backdropFilter: 'blur(12px)'
                      }}
                      itemStyle={{ fontWeight: 900, fontSize: '11px', color: 'hsl(var(--primary))' }}
                      labelStyle={{ fontWeight: 900, fontSize: '13px', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={5}
                      fillOpacity={1}
                      fill="url(#colorAdminRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-10">
                <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-accent/10 dark:bg-muted/20 border border-border/40 dark:border-white/5 transition-all hover:bg-accent/20 dark:hover:bg-muted/30">
                  <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1 opacity-60">Agencies</p>
                  <p className="text-xl md:text-2xl font-black text-foreground">{stats?.totalAgencies || 0}</p>
                </div>
                <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-accent/10 dark:bg-muted/20 border border-border/40 dark:border-white/5 transition-all hover:bg-accent/20 dark:hover:bg-muted/30">
                  <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1 opacity-60">Clients</p>
                  <p className="text-xl md:text-2xl font-black text-foreground">{stats?.totalClients || 0}</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
            <TrendingUp className="absolute top-8 right-8 w-12 h-12 text-primary/5 transition-transform group-hover:scale-125 duration-700" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
        <div className="p-5 md:p-10 border-b border-border/40 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight font-display">Recent Manifests</h2>
            <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-2 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(var(--emerald-500))]" />
              Latest deliveries synchronized
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/orders')}
            className="rounded-xl border-border/40 dark:border-white/5 font-black text-[10px] uppercase tracking-widest px-6 h-12 hover:bg-primary/10 hover:text-primary transition-all w-full md:w-auto"
          >
            Manage Fleet <ArrowRight className="w-4 h-4 ml-3" />
          </Button>
        </div>
        <div className="p-8 md:p-24 text-center text-muted-foreground bg-accent/5 dark:bg-white/5">
          <Package className="w-10 h-10 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 opacity-10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] opacity-30">Network monitoring active</p>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
