import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  RefreshCw, CheckCircle2, XCircle, Clock,
  FileText, Play, RotateCcw, History, Loader2
} from 'lucide-react';
import { financialService } from '../../api/financialService';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'border-l-amber-500 bg-amber-500/5', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'border-l-emerald-500 bg-emerald-500/5', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'border-l-red-500 bg-red-500/5', icon: XCircle },
  PROCESSING: { label: 'Processing', color: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10', icon: Loader2 },
};

const statusBadgeStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50',
  FAILED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar py-1">
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
                filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reconcileMutation.mutate()} disabled={reconcileMutation.isPending}
            className="text-xs h-9 gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reconcile
          </Button>
          <Button size="sm" onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending}
            className="text-xs h-9 gap-1.5">
            <Play className="w-3.5 h-3.5" /> Run Settlement
          </Button>
        </div>
      </div>

      {/* Settlement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {settlementStatuses.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = items.filter((i: any) => status === 'ALL' || i.status === status).length;
          return (
            <Card key={status} className={cn('border-l-4 shadow-sm', config.color)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg bg-background text-foreground border border-border')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{config.label}</p>
                    <p className="text-[10px] text-muted-foreground">Settlements</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settlement Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Settlement Queue</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px]">{items.length} items</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No settlements yet</p>
              </div>
            ) : items.slice(0, 10).map((item: any, i: number) => (
              <div key={item.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full',
                    item.status === 'COMPLETED' ? 'bg-emerald-500' :
                    item.status === 'FAILED' ? 'bg-red-500' :
                    item.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-amber-500'
                  )} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.description || `Settlement #${item.id?.slice(0, 8) || i}`}</p>
                    <p className="text-[10px] text-muted-foreground">{item.ownerName || 'System'} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.amount && <span className="text-xs font-semibold text-foreground">{Number(item.amount).toLocaleString()} MAD</span>}
                  <Badge variant="outline" className={cn('text-[10px] font-medium', statusBadgeStyles[item.status] || statusBadgeStyles.PENDING)}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliations */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!reconciliations || reconciliations.length === 0) ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No reconciliation records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expected</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map((rep: any, i: number) => (
                    <TableRow key={rep.id || i}>
                      <TableCell className="font-semibold">{Number(rep.expectedCod).toLocaleString()} MAD</TableCell>
                      <TableCell>{Number(rep.collectedCod).toLocaleString()} MAD</TableCell>
                      <TableCell className={cn('font-semibold', rep.difference !== 0 ? 'text-red-600' : 'text-emerald-600')}>
                        {Number(rep.difference).toLocaleString()} MAD
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', rep.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20')}>
                          {rep.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(rep.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
