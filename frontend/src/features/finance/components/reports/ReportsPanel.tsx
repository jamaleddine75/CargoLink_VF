import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Calendar, Download, ArrowDownToLine, FileSpreadsheet,
  FilePieChart, Printer, Share2, ChevronRight, TrendingUp, Users,
  Building, Package, CreditCard, BarChart3
} from 'lucide-react';

const reportTypes = [
  {
    id: 'daily', label: 'Daily Report', icon: Calendar,
    desc: 'End-of-day financial snapshot', color: 'from-blue-500 to-cyan-500',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'weekly', label: 'Weekly Summary', icon: TrendingUp,
    desc: '7-day revenue and settlement overview', color: 'from-emerald-500 to-teal-500',
    formats: ['CSV', 'PDF', 'Excel'],
  },
  {
    id: 'monthly', label: 'Monthly Statement', icon: FilePieChart,
    desc: 'Full monthly financial reconciliation', color: 'from-violet-500 to-purple-500',
    formats: ['CSV', 'PDF', 'Excel'],
  },
  {
    id: 'yearly', label: 'Annual Report', icon: BarChart3,
    desc: 'Year-over-year platform performance', color: 'from-amber-500 to-orange-500',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'drivers', label: 'Driver Earnings', icon: Users,
    desc: 'Per-driver payout and commission log', color: 'from-rose-500 to-pink-500',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'agencies', label: 'Agency Revenue', icon: Building,
    desc: 'Agency commission and COD collections', color: 'from-indigo-500 to-blue-500',
    formats: ['CSV', 'Excel'],
  },
  {
    id: 'customers', label: 'Customer COD', icon: CreditCard,
    desc: 'Merchant COD settlements and fees', color: 'from-teal-500 to-emerald-500',
    formats: ['CSV', 'PDF'],
  },
  {
    id: 'orders', label: 'Orders Log', icon: Package,
    desc: 'Delivery fee and COD breakdown', color: 'from-sky-500 to-indigo-500',
    formats: ['CSV', 'Excel', 'PDF'],
  },
];

export const ReportsPanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Financial Reports</h2>
          <p className="text-xs text-white/40 mt-0.5">Generate and export platform financial reports</p>
        </div>
        <div className="flex gap-2">
          {['CSV', 'PDF', 'Excel'].map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" disabled={!selectedType}
              className={cn('border-white/[0.08] text-white/50 text-xs h-8',
                selectedType ? 'hover:border-indigo-500/30 hover:text-indigo-400' : 'opacity-40'
              )}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export {fmt}
            </Button>
          ))}
        </div>
      </div>

      {/* Report Period Quick Select */}
      <div className="flex gap-2">
        {['Today', 'This Week', 'This Month', 'Last Month', 'This Year', 'Custom'].map((period) => (
          <button key={period}
            className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            {period}
          </button>
        ))}
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportTypes.map((report, i) => (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => setSelectedType(report.id === selectedType ? null : report.id)}
            className={cn(
              'relative text-left bg-[#111318] border rounded-2xl p-5 transition-all duration-200 group',
              selectedType === report.id
                ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                : 'border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5'
            )}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-[0.04] rounded-2xl transition-opacity duration-300`} />
            <div className="relative z-10">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br',
                report.color, 'shadow-lg'
              )}>
                <report.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white/90 mb-1">{report.label}</h3>
              <p className="text-[11px] text-white/40 mb-3">{report.desc}</p>
              <div className="flex gap-1.5">
                {report.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline" className="text-[9px] border-white/[0.06] text-white/30 px-1.5 py-0">
                    {fmt}
                  </Badge>
                ))}
              </div>
            </div>
            {selectedType === report.id && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Export History */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/40" /> Recent Exports
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Monthly Statement June 2026', format: 'PDF', date: '2 hours ago', size: '2.4 MB' },
            { name: 'Weekly Summary W27', format: 'CSV', date: 'Yesterday', size: '845 KB' },
            { name: 'Driver Earnings Q2 2026', format: 'Excel', date: '3 days ago', size: '4.1 MB' },
          ].map((exp, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-400/60" />
                <div>
                  <p className="text-xs font-medium text-white/70">{exp.name}</p>
                  <p className="text-[10px] text-white/30">{exp.date} · {exp.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] border-white/[0.06] text-white/30">{exp.format}</Badge>
                <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
