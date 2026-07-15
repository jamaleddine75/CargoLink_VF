import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { financialService } from '../../api/financialService';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp, Users, Building, Award, MapPin, DollarSign, Activity
} from 'lucide-react';

const mockCityData = [
  { name: 'Casablanca', orders: 8450, revenue: 254000, drivers: 320 },
  { name: 'Rabat', orders: 5620, revenue: 168000, drivers: 210 },
  { name: 'Marrakech', orders: 4100, revenue: 123000, drivers: 180 },
  { name: 'Fes', orders: 3200, revenue: 96000, drivers: 140 },
  { name: 'Tangier', orders: 2980, revenue: 89000, drivers: 120 },
];

const mockAgencyPerf = [
  { name: 'SpeedLog', revenue: 158000, orders: 3200, rating: 4.8 },
  { name: 'ExpressPro', revenue: 142000, orders: 2900, rating: 4.6 },
  { name: 'QuickShip', revenue: 128000, orders: 2600, rating: 4.7 },
  { name: 'FastTrack', revenue: 115000, orders: 2300, rating: 4.5 },
  { name: 'GoDeliver', revenue: 98000, orders: 2000, rating: 4.4 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AnalyticsPanel: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: financialService.getAnalyticsSummary,
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Profit Margin', value: `${((analytics?.profitMargin ?? 0) * 100).toFixed(1)}%`, icon: TrendingUp },
          { label: 'Monthly Growth', value: `${((analytics?.monthlyGrowth ?? 0) * 100).toFixed(1)}%`, icon: Activity },
          { label: 'Net Profit', value: `${(analytics?.netProfit ?? 0).toLocaleString()} MAD`, icon: DollarSign },
          { label: 'Highest Revenue', value: `${(analytics?.highestRevenue ?? 0).toLocaleString()} MAD`, icon: Award },
        ].map((metric, i) => (
          <StatCard
            key={i}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Agency Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Agency Performance</CardTitle>
            </div>
            <CardDescription>Top logistics agencies by revenue generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAgencyPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" horizontal={false} />
                  <XAxis type="number" stroke="currentColor" className="opacity-40" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="currentColor" className="opacity-40" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">City Distribution</CardTitle>
            </div>
            <CardDescription>Orders breakdown by region and municipality</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-72">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockCityData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="orders">
                    {mockCityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2 pb-4">
              {mockCityData.map((city, i) => (
                <div key={city.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{city.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Top Drivers', icon: Users,
            data: analytics?.topDrivers?.slice(0, 5) ?? [
              { name: 'Ahmed B.', deliveries: 342, revenue: 28500 },
              { name: 'Karim L.', deliveries: 298, revenue: 24100 },
              { name: 'Youssef M.', deliveries: 276, revenue: 22300 },
              { name: 'Hassan T.', deliveries: 254, revenue: 19800 },
              { name: 'Omar K.', deliveries: 231, revenue: 18200 },
            ]
          },
          {
            title: 'Top Customers', icon: Award,
            data: analytics?.topCustomers?.slice(0, 5) ?? [
              { name: 'ElectroShop', orders: 520, spent: 15600 },
              { name: 'FashionHub', orders: 480, spent: 14200 },
              { name: 'GadgetPro', orders: 410, spent: 12300 },
              { name: 'HomeDecor', orders: 380, spent: 11400 },
              { name: 'BookStore', orders: 350, spent: 10500 },
            ]
          },
          {
            title: 'Top Agencies', icon: Building,
            data: analytics?.topAgencies?.slice(0, 5) ?? mockAgencyPerf.map(a => ({ name: a.name, deliveries: a.orders, revenue: a.revenue }))
          },
        ].map((section, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <section.icon className="w-4 h-4 text-muted-foreground" /> {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.data.map((item: any, j: number) => (
                <div key={j} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {j + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{item.revenue?.toLocaleString() || item.spent?.toLocaleString()} MAD</p>
                    <p className="text-[10px] text-muted-foreground">{item.deliveries || item.orders || ''} deliveries</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
