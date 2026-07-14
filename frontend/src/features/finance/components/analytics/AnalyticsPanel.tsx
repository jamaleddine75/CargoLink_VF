import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { financialService } from '../../api/financialService';
import {
  TrendingUp, Users, Building, Award, Globe, MapPin,
  TrendingDown, DollarSign, Activity
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AnalyticsPanel: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: financialService.getAnalyticsSummary,
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Profit Margin', value: `${((analytics?.profitMargin ?? 0) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Monthly Growth', value: `${((analytics?.monthlyGrowth ?? 0) * 100).toFixed(1)}%`, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Net Profit', value: `${(analytics?.netProfit ?? 0).toLocaleString()} MAD`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Highest Revenue', value: `${(analytics?.highestRevenue ?? 0).toLocaleString()} MAD`, icon: Award, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((metric, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-[#111318] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn('p-2 rounded-lg', metric.bg)}>
                <metric.icon className={cn('w-4 h-4', metric.color)} />
              </div>
            </div>
            <p className="text-[11px] text-white/40">{metric.label}</p>
            <p className="text-lg font-bold text-white/90 mt-0.5">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Agency Performance */}
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/90 mb-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-white/40" /> Agency Performance
          </h3>
          <p className="text-[11px] text-white/30 mb-5">Top agencies by revenue</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAgencyPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Distribution */}
        <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/90 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/40" /> City Distribution
          </h3>
          <p className="text-[11px] text-white/30 mb-5">Orders by city</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockCityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="orders">
                  {mockCityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {mockCityData.map((city, i) => (
              <div key={city.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-white/40">{city.name}</span>
              </div>
            ))}
          </div>
        </div>
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
          <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
              <section.icon className="w-4 h-4 text-white/40" /> {section.title}
            </h3>
            <div className="space-y-2">
              {section.data.map((item: any, j: number) => (
                <div key={j} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-white/30">
                      {j + 1}
                    </span>
                    <span className="text-xs font-medium text-white/70">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/80">{item.revenue?.toLocaleString() || item.spent?.toLocaleString()} MAD</p>
                    <p className="text-[10px] text-white/30">{item.deliveries || item.orders || ''} deliveries</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
