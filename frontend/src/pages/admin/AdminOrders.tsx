import React, { useState } from 'react';
import {
  Search, Clock, CheckCircle2,
  Truck, Package, AlertCircle, RefreshCw,
  Shuffle, Calendar, Download, MapPin, Phone,
  ChevronRight, ChevronLeft, ListFilter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import adminService from '@/services/api/adminService';
import { formatTimestamp, cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';
import { Order } from '@/types';
import PageHeader from '@/components/shared/PageHeader';

const AdminOrders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { data: orderData, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'orders', { status: statusFilter, page, search: searchTerm }],
    queryFn: () => adminService.getOrders({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      size: 10,
    }),
  });

  const orders: Order[] = (orderData as any)?.content || [];
  const totalItems: number = (orderData as any)?.totalElements || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map((o: Order) => o.id));
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: 'ALL', label: 'Toutes', icon: ListFilter },
    { id: 'PENDING', label: 'En attente', icon: Clock },
    { id: 'VALIDATED', label: 'Validées', icon: CheckCircle2 },
    { id: 'ASSIGNED', label: 'Assignées', icon: Truck },
    { id: 'DELIVERED', label: 'Livrées', icon: Package },
    { id: 'ISSUE', label: 'Anomalies', icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Gestion des Commandes"
        description="Suivez, filtrez et gérez les ordres d'expédition de la plateforme CargoLink."
        action={
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
              Actualiser
            </Button>
            <Button onClick={() => navigate('/admin/attribution')} size="sm" className="gap-2">
              <Shuffle className="w-3.5 h-3.5" />
              Auto-Attribution
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(0); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter HUD */}
      <div className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un n° de suivi ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 h-10 border-border bg-card text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[140px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="date" className="h-10 pl-9 border-border bg-card text-xs w-full text-foreground" />
          </div>
          <Button variant="outline" size="sm" className="h-10 border-border bg-card flex-1 sm:flex-none">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-40 w-full bg-card border border-border rounded-lg animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border uppercase text-[10px] font-bold tracking-wider">Aucune expédition trouvée</div>
        ) : (
          orders.map((order: Order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/admin/orders/${order.id}`)}
              className="bg-card border border-border rounded-lg p-5 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md w-fit">
                    <p className="font-bold text-primary text-[10px] tracking-wider">{order.trackingNumber}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{formatTimestamp(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Destinataire</p>
                  <p className="text-xs font-bold text-foreground truncate">{order.receiverName || 'Inconnu'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Montant COD</p>
                  <p className="text-xs font-bold text-primary">{order.codAmount || 0} MAD</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Livreur</p>
                  {order.driverName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{order.driverName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold text-foreground truncate">{order.driverName}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-500/70 uppercase tracking-wider italic">Non assigné</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 border border-border">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden lg:block bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] text-center">
                  <Checkbox
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Numéro / Date</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Destinataire</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trajet Logistique</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Livreur Assigné</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Statut</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Valeur COD</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8} className="py-4"><div className="h-8 w-full bg-muted/40 rounded animate-pulse" /></TableCell></TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-muted-foreground text-xs font-semibold uppercase tracking-wider opacity-60">
                    Aucune expédition en cours.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: Order) => (
                  <TableRow
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className={cn(
                      "hover:bg-muted/30 transition-colors cursor-pointer group",
                      selectedOrders.includes(order.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md w-fit mb-1">
                        <p className="font-bold text-primary text-[10px] tracking-wider">{order.trackingNumber}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatTimestamp(order.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-foreground text-xs uppercase tracking-tight">{order.receiverName || 'Inconnu'}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3 text-primary" /> {order.receiverPhone || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="truncate max-w-[150px]">{order.pickupAddress?.split(',')[0] || 'Origine'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span className="truncate max-w-[150px]">{order.deliveryAddress?.split(',')[0] || 'Destination'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.driverName ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            {order.driverAvatarUrl && <AvatarImage src={order.driverAvatarUrl} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {order.driverName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-foreground uppercase tracking-tight">{order.driverName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded uppercase tracking-wider italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-bold text-primary text-xs tracking-wider">{order.codAmount || 0} MAD</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
