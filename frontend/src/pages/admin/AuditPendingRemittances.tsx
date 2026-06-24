import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, RefreshCw, X, Loader2, Truck, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GenericDataTable, Column } from '@/components/admin/GenericDataTable';

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
      toast.success('Transaction rejected successfully');
    },
    onError: () => toast.error('Failed to reject transaction')
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/financial/cod-remittances/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cod'] });
      toast.success('Transaction accepted successfully');
    },
    onError: () => toast.error('Failed to accept transaction')
  });

  const [selectedTx, setSelectedTx] = React.useState(null);

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
        <span className="font-bold text-primary">
          {((tx.amount ?? tx.codAmount ?? 0)).toFixed(2)} MAD
        </span>
      ),
      className: "font-semibold"
    },
    {
      header: "Delivery Address",
      accessor: (tx) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {tx.deliveryAddress || "N/A"}
        </span>
      )
    },
    {
      header: "Date",
      accessor: (tx) => (
        <span className="text-sm text-muted-foreground">
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
          >
            <ShieldAlert className="h-4 w-4 mr-1" />
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
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Accept
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              rejectMutation.mutate(tx.id);
            }}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
            Reject
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero-style header matching landing page */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-tighter bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                COD Audit Hub
              </h1>
              <p className="mt-2 text-muted-foreground">
                Clear pending transactions that block drivers.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <GenericDataTable 
              data={pendingTxs} 
              columns={columns} 
              isLoading={isLoading} 
              emptyMessage="No pending remittances found."
            />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTx.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-primary text-lg">
                    {((selectedTx.amount ?? selectedTx.codAmount ?? 0)).toFixed(2)} MAD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracking #</p>
                  <p className="font-mono text-sm">{selectedTx.trackingNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending
                  </Badge>
                </div>
              </div>
              
              {selectedTx.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Delivery Address
                  </p>
                  <p className="text-sm">{selectedTx.deliveryAddress}</p>
                </div>
              )}
              
              {selectedTx.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedTx.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
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