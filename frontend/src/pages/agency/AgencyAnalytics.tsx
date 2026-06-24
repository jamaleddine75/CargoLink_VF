import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Truck, 
  Package, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Activity,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AgencyAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  // Use agencyId from JWT claim only — user.id is the user's own UUID and is NOT the agency UUID
  const agencyId = user?.agencyId || '';

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await agencyService.getAgencyMetrics(agencyId);
      setMetrics(data);
    } catch (error) {
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agencyId) fetchAnalytics();
  }, [agencyId]);

  const performanceData = metrics?.weeklyOrders || [
    { name: 'Mon', count: 0 },
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ];

  const distributionData = metrics?.driversStatus || [
    { name: 'Online', value: 0, color: '#10b981' },
    { name: 'Busy', value: 0, color: '#f59e0b' },
    { name: 'Offline', value: 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-12 font-sans selection:bg-blue-500/30 relative z-10 pb-12">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Node Performance Analytics</p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">— Live Stats</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            Operational <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Intelligence</span>
          </h1>
          <p className="text-muted-foreground/60 mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
            <Globe className="w-3 h-3 text-blue-500" /> Deep KPI Analysis — Sector {user?.agencyName || 'MAIN_HQ'}
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-14 hover:bg-accent/40 transition-all border border-border/40 hover:border-blue-500/30"
          >
            <Download className="w-4 h-4 mr-3" /> Export Dataset
          </Button>
          <Button 
            onClick={fetchAnalytics} 
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 h-14 shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all active:scale-95 border border-border/40"
          >
            <RefreshCw className={`w-4 h-4 mr-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Node
          </Button>
        </div>
      </div>

      {/* KPI Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { title: 'Success Rate', value: 94.2, suffix: '%', icon: Target, trend: '+2.4%', up: true, color: 'blue' },
          { title: 'Average Delay', value: 1.2, suffix: ' Days', icon: Clock, trend: '-15%', up: true, color: 'indigo' },
          { title: 'Volume/Driver', value: 18.5, icon: Truck, trend: '+5%', up: true, color: 'emerald' },
          { title: 'Incidents/1000', value: 2.1, icon: BarChart3, trend: '+0.5%', up: false, color: 'rose' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-8 rounded-[40px] relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-5 transition-opacity group-hover:opacity-15 ${
              kpi.color === 'blue' ? 'bg-blue-500' : 
              kpi.color === 'indigo' ? 'bg-indigo-500' : 
              kpi.color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`p-4 rounded-2xl ${
                kpi.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                kpi.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                kpi.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <Badge className={`bg-accent/30 border border-border/40 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full ${kpi.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpi.trend}
              </Badge>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">{kpi.title}</p>
              <h3 className="text-3xl font-black tracking-tighter text-foreground">
                <AnimatedCounter value={kpi.value} suffix={kpi.suffix} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <Card className="lg:col-span-2 border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Delivery Efficiency</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                Volume vs Success Comparison
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 font-black text-[9px] uppercase tracking-widest">Orders</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 font-black text-[9px] uppercase tracking-widest">Delivery</Badge>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff30', fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff30', fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '24px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.2)',
                    padding: '20px',
                    backdropFilter: 'blur(20px)'
                  }}
                  itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#3b82f6' }}
                  labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', color: 'white', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorOrders)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-40 h-40 text-blue-500" />
          </div>
        </Card>

        <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
          <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-center">Status Distribution</h3>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-2">
            <Globe className="w-3 h-3 animate-spin-slow" /> Global fleet status
          </p>
          
          <div className="h-[300px] w-full relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black">100%</span>
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mt-2">Total Node</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-8">
            {distributionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-[20px] bg-accent/10 border border-border/40 hover:bg-accent/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.name}</span>
                </div>
                <span className="text-sm font-black text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Driver Performance Ranking */}
      <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] border border-border/40 shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 md:p-10 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Driver Performance</h3>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              Top performing drivers this month
            </p>
          </div>
          <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 rounded-2xl px-8 h-12 border border-blue-500/10">
            Full Report <ArrowUpRight className="w-4 h-4 ml-3" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/10 text-left">
                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Driver</th>
                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Volume</th>
                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Delivery Rate</th>
                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Rating</th>
                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {[
                { name: 'Mehdi Alami', volume: 450, rate: '98.5%', rating: 4.9, trend: '+12%' },
                { name: 'Sarah Benani', volume: 380, rate: '97.2%', rating: 4.8, trend: '+5%' },
                { name: 'Youssef Idrissi', volume: 320, rate: '95.0%', rating: 4.7, trend: '+8%' },
                { name: 'Amine Jabri', volume: 290, rate: '94.8%', rating: 4.6, trend: '-2%' },
                { name: 'Sofia Karimi', volume: 240, rate: '93.5%', rating: 4.5, trend: '+15%' },
              ].map((driver, i) => (
                <tr key={i} className="hover:bg-accent/10 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/20 group-hover:scale-110 transition-transform shadow-xl">
                        {driver.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-black text-primary-foreground uppercase tracking-tight text-sm">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center font-black text-foreground/60">{driver.volume}</td>
                  <td className="px-10 py-8 text-center">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest shadow-lg">
                      {driver.rate}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center font-black text-amber-400">★ {driver.rating}</td>
                  <td className={`px-10 py-8 text-right font-black text-xs ${driver.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {driver.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export { AgencyAnalytics };
export default AgencyAnalytics;

