import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, CheckCircle2, XCircle, Clock,
  FileText, Play, RotateCcw, History, Loader2
} from 'lucide-react';
import { financialService } from '../../api/financialService';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'border-l-amber-500/60 bg-amber-500/[0.04]', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'border-l-emerald-500/60 bg-emerald-500/[0.04]', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'border-l-rose-500/60 bg-rose-500/[0.04]', icon: XCircle },
  PROCESSING: { label: 'Processing', color: 'border-l-blue-500/60 bg-blue-500/[0.04]', icon: Loader2 },
};

export const SettlementsBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');

  const { data: withdrawals } = useQuery({
    queryKey: ['admin-withdrawals', filter],
    queryFn: () => financialService.getWithdrawals(0, 50, filter === 'ALL' ? undefined : filter),
  });

  const { data: reconciliations } = useQuery({
    queryKey: ['reconciliations'],
    queryFn: financialService.getReconciliations,
  });

  const settleMutation = useMutation({
    mutationFn: () => financialService.runManualSettlement(),
    onSuccess: () => {
      toast.success('Settlement run completed');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: () => toast.error('Settlement failed'),
  });

  const reconcileMutation = useMutation({
    mutationFn: () => financialService.runManualReconciliation(),
    onSuccess: () => {
      toast.success('Reconciliation completed');
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
    onError: () => toast.error('Reconciliation failed'),
  });

  const items = withdrawals?.content ?? withdrawals ?? [];
  const settlementStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all',
                filter === s ? 'bg-white/10 text-white/80' : 'text-white/40 hover:text-white/60 bg-white/[0.04]'
              )}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reconcileMutation.mutate()} disabled={reconcileMutation.isPending}
            className="border-white/[0.08] text-white/60 hover:text-white/80 text-xs h-8">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reconcile
          </Button>
          <Button size="sm" onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8">
            <Play className="w-3.5 h-3.5 mr-1.5" /> Run Settlement
          </Button>
        </div>
      </div>

      {/* Settlement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {settlementStatuses.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = items.filter((i: any) => status === 'ALL' || i.status === status).length;
          return (
            <motion.div key={status} whileHover={{ y: -2 }}
              className={cn('rounded-xl border border-white/[0.06] p-4 border-l-2', config.color)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-lg', status === 'PENDING' ? 'bg-amber-500/10' :
                  status === 'COMPLETED' ? 'bg-emerald-500/10' :
                  status === 'FAILED' ? 'bg-rose-500/10' : 'bg-blue-500/10')}>
                  <Icon className={cn('w-4 h-4', status === 'PENDING' ? 'text-amber-400' :
                    status === 'COMPLETED' ? 'text-emerald-400' :
                    status === 'FAILED' ? 'text-rose-400' : 'text-blue-400')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{config.label}</p>
                  <p className="text-[10px] text-white/40">Settlements</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Settlement Queue */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/90">Settlement Queue</h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/40">{items.length} items</Badge>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">No settlements yet</p>
            </div>
          ) : items.slice(0, 10).map((item: any, i: number) => (
            <motion.div key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full',
                  item.status === 'COMPLETED' ? 'bg-emerald-500' :
                  item.status === 'FAILED' ? 'bg-rose-500' :
                  item.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-amber-500'
                )} />
                <div>
                  <p className="text-xs font-medium text-white/70">{item.description || `Settlement #${item.id?.slice(0, 8) || i}`}</p>
                  <p className="text-[10px] text-white/30">{item.ownerName || 'System'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.amount && <span className="text-xs font-semibold text-white/80">{Number(item.amount).toLocaleString()} MAD</span>}
                <Badge className={cn('text-[10px] font-medium border-0',
                  item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                  item.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-amber-500/10 text-amber-400'
                )}>{item.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reconciliations */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/90 mb-4">Reconciliation History</h3>
        {(!reconciliations || reconciliations.length === 0) ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">No reconciliation records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                  <th className="pb-3 font-medium">Expected</th>
                  <th className="pb-3 font-medium">Collected</th>
                  <th className="pb-3 font-medium">Difference</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map((rep: any, i: number) => (
                  <tr key={rep.id || i} className="text-xs text-white/60 border-b border-white/[0.04]">
                    <td className="py-3 font-medium text-white/80">{Number(rep.expectedCod).toLocaleString()} MAD</td>
                    <td className="py-3">{Number(rep.collectedCod).toLocaleString()} MAD</td>
                    <td className={cn('py-3 font-medium', rep.difference !== 0 ? 'text-rose-400' : 'text-emerald-400')}>
                      {Number(rep.difference).toLocaleString()} MAD
                    </td>
                    <td className="py-3">
                      <Badge className={cn('text-[10px] border-0', rep.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}>
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-white/40">{new Date(rep.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
