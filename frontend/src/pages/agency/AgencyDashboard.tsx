import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, Truck, AlertTriangle, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  RefreshCw, Calendar, Box, MapPin, Zap, 
  QrCode, Wallet, Banknote, ShieldCheck,
  ChevronRight, ArrowRight, ExternalLink,
  Settings as SettingsIcon, CheckCircle2, Globe, Activity, Plus, Loader2
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from 'framer-motion';
import agencyService, { AgencyMetrics } from '@/services/api/agencyService';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const AgencyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remittances, setRemittances] = useState<any[]>([]);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  // Use agencyId from JWT claim only — user.id is the user's own UUID and is NOT the agency UUID
  const agencyId = user?.agencyId || '';

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const [metricsData, walletData, remData] = await Promise.all([
        agencyService.getAgencyMetrics(agencyId),
        apiClient.get(ENDPOINTS.AGENCIES.WALLET(agencyId)),
        agencyService.getPendingRemittances(agencyId)
      ]);
      setMetrics(metricsData);
      setWallet(walletData.data);
      setRemittances(remData);
    } catch (error) {
      toast.error('Data synchronization error');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Guard: agencyId must be in JWT. Stale tokens (pre-agencyId claim) need re-login.
  if (!loading && !agencyId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 relative z-10">
        <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black uppercase tracking-tight">Session Expired</h3>
          <p className="text-muted-foreground/60 mt-3 font-bold uppercase text-[10px] tracking-[0.3em] max-w-sm">
            Your session token is missing agency credentials. Please log out and log back in.
          </p>
        </div>
        <Button
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
          className="rounded-2xl bg-rose-600 hover:bg-rose-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-10 h-14"
        >
          Re-authenticate
        </Button>
      </div>
    );
  }

  const handleConfirmRemittance = async (txId: string, amount: number) => {
    try {
      setConfirmingIds(prev => new Set(prev).add(txId));
      await agencyService.confirmRemittance(agencyId, txId);
      toast.success(`Remittance of ${amount} MAD confirmed`);
      fetchData();
    } catch {
      toast.error('Error during confirmation');
    } finally {
      setConfirmingIds(prev => {
        const next = new Set(prev);
        next.delete(txId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-10 relative z-10 pb-10">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Agency Control Node</p>
            </div>
          </div>
          <h1 className="text-2xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] font-display">
            {user?.agencyName || 'Agency'} <span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.3)]">Terminal</span>
          </h1>
          <p className="text-muted-foreground/60 mt-4 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
            <Globe className="w-3 h-3 text-primary animate-spin-slow" /> Active Ops — {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl md:rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-5 md:px-8 h-10 md:h-14 hover:bg-accent/40 transition-all border border-border/40 hover:border-primary/30 group shadow-xl flex-1 md:flex-none"
          >
            <RefreshCw className={`${loading ? "animate-spin" : "group-hover:rotate-180"} w-3.5 h-3.5 md:w-4 md:h-4 mr-2 md:mr-3 transition-transform duration-500`} /> Sync
          </Button>
          <Button 
            onClick={() => navigate('/agence/orders')}
            className="flex-[2] md:flex-none rounded-xl md:rounded-2xl bg-hero-gradient text-white font-black text-[10px] uppercase tracking-widest px-5 md:px-10 h-10 md:h-14 shadow-[0_20px_40px_rgba(var(--primary),0.25)] transition-all active:scale-95 border border-border/40"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" /> New Mission
          </Button>
        </div>
      </div>

      {/* KPI HUD Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6 relative z-10">
        <StatHUD 
          title="Total Missions" 
          value={metrics?.totalOrders || 0} 
          icon={Package} 
          color="blue" 
          delay={0.1} 
          trend="+12%" 
          loading={loading}
        />
        <StatHUD 
          title="In Transit" 
          value={metrics?.ongoingDeliveries || 0} 
          icon={Truck} 
          color="indigo" 
          delay={0.2} 
          trend="Active" 
          loading={loading}
        />
        <StatHUD 
          title="Active Drivers" 
          value={metrics?.activeDrivers || 0} 
          icon={Users} 
          color="emerald" 
          delay={0.3} 
          trend="Online" 
          loading={loading}
        />
        <StatHUD 
          title="Incidents" 
          value={metrics?.issuesCount || 0} 
          icon={AlertTriangle} 
          color="rose" 
          delay={0.4} 
          trend="Critical" 
          loading={loading}
        />
        <StatHUD 
          title="Agency Balance" 
          value={wallet?.balance || 0} 
          suffix=" MAD"
          icon={Wallet} 
          color="amber" 
          delay={0.5} 
          trend="Balance" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Section: Chart & Remittances */}
        <div className="lg:col-span-8 space-y-4 md:space-y-8">
          {/* Performance Chart HUD */}
          <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-5 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
              <div>
                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">Activity Flow</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  Weekly mission throughput matrix
                </p>
              </div>
              <div className="flex gap-2 md:gap-3">
                <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 md:px-4 py-1 md:py-1.5 font-black text-[8px] md:text-[9px] uppercase tracking-widest">Volume</Badge>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/30 flex items-center justify-center border border-border/40 group-hover:bg-primary transition-all duration-500 shadow-xl">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/40 group-hover:text-foreground" />
                </div>
              </div>
            </div>

            <div className="h-[240px] md:h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.weeklyOrders || []}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', opacity: 0.3, fontSize: 10, fontWeight: 900}}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', opacity: 0.3, fontSize: 10, fontWeight: 900}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '24px', 
                      border: '1px solid hsl(var(--border))', 
                      boxShadow: 'var(--card-glow)',
                      padding: '20px',
                      backdropFilter: 'blur(20px)'
                    }}
                    itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#3b82f6' }}
                    labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', color: 'hsl(var(--foreground))', marginBottom: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorFlow)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-40 h-40 text-primary" />
            </div>
          </Card>

          {/* COD Remittances HUD */}
          <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-5 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div>
                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">COD Remittances</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 md:mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  Active return validation ({remittances.length})
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg">
                <Banknote className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {remittances.length > 0 ? (
                  remittances.slice(0, 3).map((tx, idx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all group relative overflow-hidden shadow-sm"
                    >
                      <div className="flex items-center gap-4 md:gap-5 relative z-10">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-base md:text-xl font-black tracking-tight">{tx.amount} <span className="text-[8px] md:text-[10px] text-muted-foreground/40">MAD</span></p>
                          <p className="text-[8px] md:text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5 md:mt-1">Driver: {tx.driverId?.slice(0,8)} • {tx.createdAt ? format(new Date(tx.createdAt), 'HH:mm', { locale: enUS }) : '—'}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={confirmingIds.has(tx.id)}
                        onClick={() => handleConfirmRemittance(tx.id, tx.amount)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-primary-foreground rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest h-9 md:h-11 px-6 md:px-8 shadow-xl shadow-emerald-600/20 relative z-10 border border-border/40 active:scale-95 transition-all"
                      >
                        {confirmingIds.has(tx.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                      </Button>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-accent/10 rounded-[2.5rem] border-2 border-dashed border-border/40">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No pending remittances detected</p>
                  </div>
                )}
              </AnimatePresence>
              {remittances.length > 3 && (
                <button 
                  onClick={() => navigate('/agence/wallet')}
                  className="w-full py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center justify-center gap-2 group"
                >
                  View {remittances.length} other pending <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Section: Action Hub & Fleet Status */}
        <div className="lg:col-span-4 space-y-4 md:space-y-8">
          {/* Action Hub HUD */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight ml-2 md:ml-4 flex items-center gap-2 md:gap-3">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Operational Hub
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <QuickActionBtn 
                icon={Users} 
                label="Drivers" 
                subtitle="Fleet Fleet"
                onClick={() => navigate('/agence/drivers')} 
                delay={0.1}
              />
              <QuickActionBtn 
                icon={QrCode} 
                label="Batch Scan" 
                subtitle="Sort Logic"
                onClick={() => navigate('/driver/scan-all')} 
                delay={0.2}
              />
              <QuickActionBtn 
                icon={TrendingUp} 
                label="Analytics" 
                subtitle="Sector Intel"
                onClick={() => navigate('/agence/analytics')} 
                delay={0.3}
              />
              <QuickActionBtn 
                icon={SettingsIcon} 
                label="Config" 
                subtitle="Node Settings"
                onClick={() => navigate('/agence/settings')} 
                delay={0.4}
              />
            </div>
          </div>

          {/* Fleet Performance Pie HUD */}
          <Card className="border-none bg-primary rounded-[2rem] md:rounded-[40px] p-6 md:p-10 text-primary-foreground shadow-[0_20px_50px_rgba(var(--primary),0.3)] relative overflow-hidden group">
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="w-full">
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Fleet Integrity</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest mt-1">Real-time availability</p>
                </div>
              </div>
              
              <div className="h-[160px] md:h-[200px] w-full relative mb-6 md:mb-8">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                    {metrics?.activeDrivers || 0}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-100/40 tracking-widest mt-1 md:mt-2">Active</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.driversStatus || []}
                      innerRadius={70}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {(metrics?.driversStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color === '#10b981' ? '#fff' : 'rgba(255,255,255,0.2)'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 md:space-y-3">
                {(metrics?.driversStatus || []).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-accent/40 backdrop-blur-md border border-border/40 hover:bg-accent/30 transition-all">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" style={{ opacity: item.color === '#10b981' ? 1 : 0.3 }} />
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-foreground/60">{item.name}</span>
                    </div>
                    <span className="font-black text-xs md:text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-400 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe className="w-40 h-40" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatHUD = ({ title, value, prefix = "", suffix = "", icon: Icon, color, trend, loading, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-5 md:p-8 rounded-[2rem] md:rounded-[40px] relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-5 transition-opacity group-hover:opacity-15 ${
      color === 'blue' ? 'bg-blue-500' : 
      color === 'indigo' ? 'bg-indigo-500' : 
      color === 'emerald' ? 'bg-emerald-500' : 
      color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
    }`} />
    
    <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${
        color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
        color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
        color === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <Badge className="bg-accent/30 text-muted-foreground/40 border border-border/40 font-black text-[7px] md:text-[8px] uppercase tracking-widest px-2.5 md:px-3 py-1 rounded-full">
        {trend}
      </Badge>
    </div>
    
    <div className="relative z-10">
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1.5 md:mb-2">{title}</p>
      {loading ? (
        <Skeleton className="h-8 md:h-10 w-20 md:w-24 bg-accent/30 rounded-xl" />
      ) : (
        <h3 className="text-xl md:text-3xl font-black tracking-tighter text-foreground">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </h3>
      )}
    </div>
  </motion.div>
);

const QuickActionBtn = ({ icon: Icon, label, subtitle, onClick, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    onClick={onClick}
    className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-4 md:p-6 rounded-2xl md:rounded-[32px] hover:bg-primary transition-all group cursor-pointer shadow-xl relative overflow-hidden"
  >
    <div className="relative z-10">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/30 group-hover:bg-accent/30 flex items-center justify-center border border-border/40 group-hover:border-border/60 mb-3 md:mb-4 transition-colors">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-400 group-hover:text-foreground transition-colors" />
      </div>
      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-tight text-foreground">{label}</h4>
      <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground/40 group-hover:text-foreground/60 uppercase tracking-widest mt-0.5 md:mt-1">{subtitle}</p>
    </div>
    <ChevronRight className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 group-hover:translate-x-1 transition-all" />
  </motion.div>
);

export default AgencyDashboard;
