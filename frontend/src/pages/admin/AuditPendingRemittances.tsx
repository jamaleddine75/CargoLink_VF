import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, RefreshCw, X, Loader2, Truck, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GenericDataTable, Column } from '@/components/admin/GenericDataTable';
import PageHeader from '@/components/shared/PageHeader';

const AuditPendingRemittances = () => {
  const queryClient = useQueryClient();

  const { data: pendingTxs, isLoading, refetch } = useQuery({
    queryKey: ['admin-pending-cod'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/financial/cod-remittances/pending');
      return res.data;
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/financial/cod-remittances/${id}/reject?reason=Stuck_Admin_Manual_Clear`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cod'] });
      toast.success('Transaction successfully rejected');
    },
    onError: () => toast.error('Failed to reject transaction')
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/financial/cod-remittances/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cod'] });
      toast.success('Transaction successfully accepted');
    },
    onError: () => toast.error('Failed to accept transaction')
  });

  const [selectedTx, setSelectedTx] = React.useState<any>(null);

  const columns: Column<any>[] = [
    {
      header: "Transaction",
      accessor: (tx) => (
        <div>
          <span className="font-mono text-xs text-foreground/80 block">{tx.id}</span>
          {tx.trackingNumber && (
            <span className="text-xs text-muted-foreground">#{tx.trackingNumber}</span>
          )}
        </div>
      ),
      className: "font-medium"
    },
    {
      header: "Amount",
      accessor: (tx) => (
        <span className="font-bold text-foreground">
          {((tx.amount ?? tx.codAmount ?? 0)).toFixed(2)} MAD
        </span>
      ),
      className: "font-semibold"
    },
    {
      header: "Delivery Address",
      accessor: (tx) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {tx.deliveryAddress || "N/A"}
        </span>
      )
    },
    {
      header: "Date",
      accessor: (tx) => (
        <span className="text-xs text-muted-foreground">
          {new Date(tx.createdAt ?? tx.date).toLocaleDateString()}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (tx) => (
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTx(tx);
            }}
            className="h-8 text-xs"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            Details
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              acceptMutation.mutate(tx.id);
            }}
            disabled={acceptMutation.isPending}
            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {acceptMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
            Validate
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              rejectMutation.mutate(tx.id);
            }}
            disabled={rejectMutation.isPending}
            className="h-8 text-xs"
          >
            {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 mr-1" />}
            Reject
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Audit of COD Remittances"
        description="Review and validate pending Cash on Delivery (COD) remittances."
        action={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* Table Card Wrapper */}
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <GenericDataTable 
            data={pendingTxs} 
            columns={columns} 
            isLoading={isLoading} 
            emptyMessage="No pending remittance found."
          />
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="bg-card border border-border rounded-lg p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Package className="h-5 w-5 text-primary" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-0.5">ID Transaction</p>
                  <p className="font-mono text-xs text-foreground">{selectedTx.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-0.5">Montant</p>
                  <p className="font-bold text-foreground text-sm">
                    {((selectedTx.amount ?? selectedTx.codAmount ?? 0)).toFixed(2)} MAD
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-0.5">Tracking No.</p>
                  <p className="font-mono text-xs text-foreground">{selectedTx.trackingNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-0.5">Status</p>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-none font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Pending
                  </Badge>
                </div>
              </div>
              
              {selectedTx.deliveryAddress && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Delivery Address
                  </p>
                  <p className="text-xs text-foreground">{selectedTx.deliveryAddress}</p>
                </div>
              )}
              
              {selectedTx.description && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-1">Description</p>
                  <p className="text-xs text-foreground">{selectedTx.description}</p>
                </div>
              )}
              
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider mb-1">Creation Date</p>
                <p className="text-xs text-foreground">
                  {new Date(selectedTx.createdAt ?? selectedTx.date).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditPendingRemittances;