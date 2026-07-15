import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  XCircle, Clock, Search, ChevronLeft, ChevronRight,
  Download, Check, Eye, Loader2
} from 'lucide-react';
import { financialService } from '../../api/financialService';
import { toast } from 'sonner';

const WITHDRAWAL_TABS = ['PENDING', 'REJECTED', 'COMPLETED', 'CANCELLED'];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50',
  REJECTED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
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
      toast.success('Withdrawal paid');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: () => toast.error('Failed to pay'),
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
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar py-1">
          {WITHDRAWAL_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(0); }}
                className={cn('px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                {tab === 'COMPLETED' ? 'Paid' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search withdrawals..."
              className="h-9 pl-9 text-xs w-56"
            />
          </div>
          <Button variant="outline" size="sm" className="text-xs h-9 gap-2">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Card Wrapper & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Requestor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No withdrawals found</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((item: any, i: number) => (
                  <TableRow key={item.id || i} className="group">
                    <TableCell>
                      <button onClick={() => setDetailId(item.id)} className="font-mono text-xs text-primary hover:underline">
                        #{item.id?.slice(0, 8) || 'N/A'}
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-semibold text-foreground">{item.ownerName || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground">{item.ownerRole || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-foreground">{Number(item.amount || 0).toLocaleString()} MAD</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.method || 'PayPal'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] font-medium', statusStyles[item.status] || statusStyles.PENDING)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" onClick={() => approveMutation.mutate(item.id)}
                            className="w-7 h-7 p-0 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectId(item.id)}
                            className="w-7 h-7 p-0 text-red-600 hover:text-red-500 hover:bg-red-500/10">
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDetailId(item.id)}
                            className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="w-7 h-7 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}
                  className="w-7 h-7 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              This will decline the withdrawal request. The amount will be returned to the wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Reason for rejection</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this withdrawal was rejected..."
              className="text-xs min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)} className="text-xs">Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
              disabled={!rejectReason || rejectMutation.isPending} className="text-xs">
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
