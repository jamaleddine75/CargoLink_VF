import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportIndicator, ChartSkeleton } from '@/pages/agency/shared';
import { 
  Target, Clock, Truck, BarChart3, 
  ArrowUpRight, Globe, TrendingUp,
  PieChart as PieChartIcon,
  Loader2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import AnimatedCounter from '@/components/common/AnimatedCounter';

interface AnalyticsTabProps {
  metrics: any;
  loading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ metrics, loading }) => {
  const [exportStatus, setExportStatus] = React.useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [exportProgress, setExportProgress] = React.useState(0);

  const handleExport = () => {
    setExportStatus('LOADING');
    setExportProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExportStatus('SUCCESS');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const totalOrders = Number(metrics?.totalOrders || 0);
  const deliveredOrders = Number(metrics?.deliveredOrders || 0);
  const activeDrivers = Number(metrics?.activeDrivers || 0);
  const issuesCount = Number(metrics?.issuesCount || 0);
  const totalRevenue = Number(metrics?.totalRevenue || 0);
  const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  const ordersPerDriver = activeDrivers > 0 ? totalOrders / activeDrivers : 0;
  const incidentsPerThousand = totalOrders > 0 ? (issuesCount / totalOrders) * 1000 : 0;

  const distributionData = metrics?.driversStatus || [];

  const kpis = [
    { title: 'Success Rate', value: successRate, suffix: '%', icon: Target, trend: 'DB', up: true, color: 'blue' },
    { title: 'Total Revenue', value: totalRevenue, suffix: ' MAD', icon: Clock, trend: 'DB', up: true, color: 'indigo' },
    { title: 'Orders / Driver', value: ordersPerDriver, icon: Truck, trend: 'DB', up: true, color: 'emerald' },
    { title: 'Incidents / 1000', value: incidentsPerThousand, icon: BarChart3, trend: 'DB', up: false, color: 'rose' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-6">
        <Button 
          onClick={handleExport}
          disabled={exportStatus === 'LOADING'}
          className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-12 hover:bg-blue-600 transition-all border border-border/40 group"
        >
          {exportStatus === 'LOADING' ? (
            <Loader2 className="w-4 h-4 mr-3 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
          )}
          Export Node Intelligence
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-8 rounded-[40px] relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl"
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
                <AnimatedCounter value={kpi.value} suffix={kpi.suffix || ""} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <Card className="lg:col-span-2 border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 relative z-10">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Efficiency Matrix</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  Volume vs Performance trends
                </p>
              </div>
            </div>
            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.weeklyOrders || []}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff30', fontWeight: 900}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff30', fontWeight: 900}} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(2, 6, 23, 0.8)',
                      borderRadius: '24px', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
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
        )}

        {/* Status Distribution Pie Chart */}
        <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
          <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-center">Status Intel</h3>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-2">
            <Globe className="w-3 h-3 animate-spin-slow" /> Global fleet distribution
          </p>
          
          {distributionData.length > 0 ? (
            <>
              <div className="h-[250px] w-full relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black">{distributionData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)}</span>
                  <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mt-2">Drivers</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      {distributionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-8">
                {distributionData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-[20px] bg-accent/10 border border-border/40 hover:bg-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center bg-accent/10 rounded-[2.5rem] border-2 border-dashed border-border/40">
              <PieChartIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No driver status data</p>
            </div>
          )}
        </Card>
      </div>
      <ExportIndicator 
        status={exportStatus} 
        progress={exportProgress} 
        filename={`agency_intelligence_${new Date().toISOString().split('T')[0]}.csv`}
        onClose={() => setExportStatus('IDLE')}
      />
    </div>
  );
};
