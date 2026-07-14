import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  XCircle, Clock, Search, ChevronLeft, ChevronRight,
  Download, Check, Eye, Loader2
} from 'lucide-react';
import { financialService } from '../../api/financialService';
import { toast } from 'sonner';

const WITHDRAWAL_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-white/5 text-white/30 border-white/[0.08]',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0) + ' MAD';

export const WithdrawalsApproval: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', activeTab, page],
    queryFn: () => financialService.getWithdrawals(page, PAGE_SIZE, activeTab === 'ALL' ? undefined : activeTab),
  });

  const items = data?.content ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const approveMutation = useMutation({
    mutationFn: (id: string) => financialService.approveWithdrawal(id),
    onSuccess: () => {
      toast.success('Withdrawal approved');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: string; reason: string }) => financialService.rejectWithdrawal(params.id, params.reason),
    onSuccess: () => {
      toast.success('Withdrawal rejected');
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const filtered = search
    ? items.filter((i: any) =>
        (i.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.id || '').toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl overflow-x-auto">
          {WITHDRAWAL_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(0); }}
                className={cn('px-4 py-2 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all',
                  isActive ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-white/40 hover:text-white/60'
                )}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search withdrawals..."
              className="h-9 pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white/70 placeholder:text-white/20 w-56"
            />
          </div>
          <Button variant="outline" size="sm" className="border-white/[0.08] text-white/60 text-xs h-9">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-white/30 border-b border-white/[0.06]">
                <th className="px-5 py-3.5 font-medium">ID</th>
                <th className="px-5 py-3.5 font-medium">Requestor</th>
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Method</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No withdrawals found</p>
                </td></tr>
              ) : filtered.map((item: any, i: number) => (
                <motion.tr key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5">
                    <button onClick={() => setDetailId(item.id)} className="font-mono text-xs text-indigo-400 hover:text-indigo-300">
                      #{item.id?.slice(0, 8) || 'N/A'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-medium text-white/70">{item.ownerName || 'User'}</p>
                    <p className="text-[10px] text-white/30">{item.ownerRole || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-white/90">{Number(item.amount || 0).toLocaleString()} MAD</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-white/40">{item.method || 'PayPal'}</td>
                  <td className="px-5 py-3.5">
                    <Badge className={cn('text-[10px] font-medium border', statusStyles[item.status] || statusStyles.PENDING)}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-white/40">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {item.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate(item.id)}
                          className="w-7 h-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectId(item.id)}
                          className="w-7 h-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDetailId(item.id)}
                          className="w-7 h-7 p-0 text-white/40 hover:text-white/60">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <p className="text-[11px] text-white/30">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-7 h-7 p-0 text-white/40 hover:text-white/60">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}
                className="w-7 h-7 p-0 text-white/40 hover:text-white/60">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="bg-[#151821] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="text-white/90">Reject Withdrawal</DialogTitle>
            <DialogDescription className="text-white/40 text-xs">
              This will decline the withdrawal request. The amount will be returned to the wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-medium text-white/60">Reason for rejection</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this withdrawal was rejected..."
              className="bg-white/[0.04] border-white/[0.08] text-white/70 placeholder:text-white/20 text-xs min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectId(null)} className="text-white/40 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
              disabled={!rejectReason || rejectMutation.isPending} className="bg-rose-600 hover:bg-rose-500 text-xs">
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
