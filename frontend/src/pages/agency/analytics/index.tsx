import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Target,
  Truck,
  Download,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const AgencyAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  
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
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Performance overview for {user?.agencyName || 'your agency'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={fetchAnalytics} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Success Rate', value: 94.2, suffix: '%', icon: Target, trend: '+2.4%', up: true },
          { title: 'Avg Delay', value: 1.2, suffix: ' days', icon: Clock, trend: '-15%', up: true },
          { title: 'Volume / Driver', value: 18.5, icon: Truck, trend: '+5%', up: true },
          { title: 'Incidents / 1000', value: 2.1, icon: BarChart3, trend: '+0.5%', up: false },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <span className={`text-xs font-medium ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
              </div>
              <p className="text-xs text-muted-foreground">{kpi.title}</p>
              <p className="text-2xl font-semibold mt-0.5">
                <AnimatedCounter value={kpi.value} suffix={kpi.suffix} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Delivery Efficiency</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Weekly order volume</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/30">Orders</Badge>
                <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">Delivered</Badge>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.06} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'currentColor', opacity: 0.5}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'currentColor', opacity: 0.5}} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-1">Driver Status</h3>
            <p className="text-xs text-muted-foreground mb-4">Fleet distribution</p>
            <div className="h-[200px] w-full relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold">100%</span>
                <span className="text-xs text-muted-foreground mt-1">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {distributionData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Table */}
      <Card>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Driver Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top drivers this month</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            Full Report <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium text-center">Volume</th>
                <th className="px-5 py-3 font-medium text-center">Delivery Rate</th>
                <th className="px-5 py-3 font-medium text-center">Rating</th>
                <th className="px-5 py-3 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {[
                { name: 'Mehdi Alami', volume: 450, rate: '98.5%', rating: 4.9, trend: '+12%' },
                { name: 'Sarah Benani', volume: 380, rate: '97.2%', rating: 4.8, trend: '+5%' },
                { name: 'Youssef Idrissi', volume: 320, rate: '95.0%', rating: 4.7, trend: '+8%' },
                { name: 'Amine Jabri', volume: 290, rate: '94.8%', rating: 4.6, trend: '-2%' },
                { name: 'Sofia Karimi', volume: 240, rate: '93.5%', rating: 4.5, trend: '+15%' },
              ].map((driver, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {driver.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-muted-foreground">{driver.volume}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">{driver.rate}</span>
                  </td>
                  <td className="px-5 py-3 text-center text-amber-500 text-xs">★ {driver.rating}</td>
                  <td className={`px-5 py-3 text-right text-xs font-medium ${driver.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
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

export default AgencyAnalytics;
