import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Download, Filter, RefreshCw, 
  DollarSign, FileSpreadsheet, Search
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { 
  DataTable, 
  DataTableHeader, 
  DataTableBody, 
  DataTableRow, 
  DataTableHead, 
  DataTableCell 
} from '@/components/shared/DataTable';

export default function CODReconciliation() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const agencyId = user?.agencyId || '';

  const fetchOrders = useCallback(async () => {
    if (!agencyId) return;
    try {
      setLoading(true);
      const data = await agencyService.getAgencyOrders(agencyId, 0, 100); // Fetch top 100 for recon
      setOrders(data.content || []);
    } catch (error) {
      toast.error('Échec du chargement des données de rapprochement');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!agencyId) return;
    try {
      setIsExporting(true);
      await agencyService.exportCOD(agencyId, {
        status: filters.status === 'all' ? undefined : filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        format
      });
      toast.success(`Rapport ${format.toUpperCase()} généré avec succès`);
    } catch (error) {
      toast.error(`Échec de la génération du rapport ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = (o.trackingNumber || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                        (o.receiverName || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status === 'all' || o.status === filters.status;
    return matchSearch && matchStatus;
  });

  const totalCod = filteredOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Rapprochement COD"
        description="Auditez et exportez les flux locaux de paiement à la livraison (Cash-on-Delivery)."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exporter CSV
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Exporter Rapport PDF
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total COD Analysé" value={totalCod} icon={DollarSign} suffix=" MAD" />
        <StatCard title="Total Missions" value={filteredOrders.length} icon={FileText} />
        
        {/* Date Range Filter Card */}
        <Card className="border border-border bg-card shadow-sm md:col-span-2">
          <CardContent className="p-4 flex items-center justify-between gap-4 h-full">
            <div className="flex-1 space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Plage de Dates</span>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="h-9 text-xs border-border bg-card" 
                />
                <span className="text-xs text-muted-foreground">à</span>
                <Input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="h-9 text-xs border-border bg-card" 
                />
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={fetchOrders} className="h-9 w-9 rounded-md border border-border">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° de suivi ou nom de client..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="pl-9 h-10 bg-card border-border"
          />
        </div>
        <div className="lg:col-span-4">
          <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
            <SelectTrigger className="h-10 border-border bg-card text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <SelectValue placeholder="Tous les Statuts" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">Toutes les commandes</SelectItem>
              <SelectItem value="DELIVERED" className="text-xs">Livrées</SelectItem>
              <SelectItem value="ON_THE_WAY" className="text-xs">En transit</SelectItem>
              <SelectItem value="FAILED" className="text-xs">Échouées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reconciliation Table */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-lg">
        <DataTable>
          <DataTableHeader>
            <DataTableRow hover={false}>
              <DataTableHead className="w-[180px] pl-6">N° de Suivi</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Statut</DataTableHead>
              <DataTableHead>Destinataire</DataTableHead>
              <DataTableHead className="text-right">Montant COD</DataTableHead>
              <DataTableHead className="pr-6">Paiement</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <DataTableRow key={order.id} className="hover:bg-muted/30">
                  <DataTableCell className="pl-6 py-4 font-semibold text-sm">
                    {order.trackingNumber}
                  </DataTableCell>
                  <DataTableCell className="py-4 text-xs text-muted-foreground">
                    {formatTimestamp(order.createdAt)}
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <StatusBadge status={order.status} />
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground/80">{order.receiverName}</span>
                      <span className="text-[10px] text-muted-foreground">{order.receiverCity}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="py-4 text-right font-semibold text-foreground">
                    {(order.codAmount || 0).toLocaleString()} <span className="text-[10px] text-muted-foreground ml-0.5">MAD</span>
                  </DataTableCell>
                  <DataTableCell className="py-4 pr-6">
                    <StatusBadge status={order.paymentStatus || 'UNPAID'} />
                  </DataTableCell>
                </DataTableRow>
              ))
            ) : (
              <DataTableRow hover={false}>
                <DataTableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileText className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Aucune donnée de rapprochement trouvée</p>
                  </div>
                </DataTableCell>
              </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
      </Card>
    </div>
  );
}
