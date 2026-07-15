import React, { useMemo, useState } from 'react';
import {
  Search, Clock, CheckCircle2,
  Truck, Package, AlertCircle, RefreshCw,
  Shuffle, Calendar, Download, MapPin, Phone,
  ChevronRight, ChevronLeft, ListFilter, DollarSign,
  TrendingUp, Ban, XCircle, FileText
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import adminService from '@/services/api/adminService';
import { formatTimestamp, cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';
import { Order } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import { useDebounce } from '@/hooks/useDebounce';

const STATUS_TABS = [
  { id: 'ALL', label: 'All', icon: ListFilter },
  { id: 'PENDING', label: 'Pending', icon: Clock },
  { id: 'VALIDATED', label: 'Validated', icon: CheckCircle2 },
  { id: 'ASSIGNED', label: 'Assigned', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', icon: Package },
  { id: 'ISSUE', label: 'Issues', icon: AlertCircle },
] as const;

const AdminOrders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: orderData, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'orders', {
      status: statusFilter,
      page,
      search: debouncedSearch,
      payment: paymentFilter,
      priority: priorityFilter,
      dateFrom,
      dateTo,
    }],
    queryFn: () => adminService.getOrders({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      size: 10,
      startDate: dateFrom || undefined,
      endDate: dateTo || undefined,
    }),
  });

  const orders: Order[] = (orderData as any)?.content || [];
  const totalItems: number = (orderData as any)?.totalElements || 0;
  const totalPages: number = (orderData as any)?.totalPages || 1;

  const ordersToday = useMemo(() =>
    orders.filter(o => {
      if (!o.createdAt) return false;
      const today = new Date();
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === today.toDateString();
    }).length,
  [orders]);

  const totalCodVolume = useMemo(() =>
    orders.reduce((sum, o) => sum + (o.codAmount || 0), 0),
  [orders]);

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

  const clearSelection = () => setSelectedOrders([]);

  const handleExportCSV = () => {
    const headers = ['Tracking', 'Status', 'Recipient', 'COD', 'Date', 'Driver'];
    const rows = orders.map(o => [
      o.trackingNumber, o.status, o.receiverName, o.codAmount || 0,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '', o.driverName || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'commandes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      <AdminBreadcrumb crumbs={[{ label: 'Orders' }]} />

      <PageHeader
        title="Management des Orders"
        description="Track, filter and manage all shipment orders on CargoLink."
        action={
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/admin/attribution')} size="sm" className="gap-2">
              <Shuffle className="w-3.5 h-3.5" />
              Auto-Attribution
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Package className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/60 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Aujourd'hui</p>
              <p className="text-lg font-bold text-foreground">{ordersToday}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/60 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><DollarSign className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Volume COD</p>
              <p className="text-lg font-bold text-foreground">{totalCodVolume.toLocaleString()} MAD</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/60 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500"><AlertCircle className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-foreground">{orders.filter(o => o.status === 'PENDING').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_TABS.map((tab) => {
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
            placeholder="Search tracking number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 h-10 border-border bg-card text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={paymentFilter} onValueChange={v => { setPaymentFilter(v); setPage(0); }}>
            <SelectTrigger className="h-10 w-[130px] border-border bg-card text-xs">
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="COD">COD</SelectItem>
              <SelectItem value="PREPAID">Prepaid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(0); }}>
            <SelectTrigger className="h-10 w-[130px] border-border bg-card text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes</SelectItem>
              <SelectItem value="CRITICAL">Critique</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-[140px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
              className="h-10 pl-9 border-border bg-card text-xs w-full text-foreground" />
          </div>
          <div className="relative w-[140px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }}
              className="h-10 pl-9 border-border bg-card text-xs w-full text-foreground" />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-10 border-border bg-card">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Exporter
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg animate-in slide-in-from-top-2">
          <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-3">
            {selectedOrders.length} selected{selectedOrders.length > 1 ? 's' : ''}
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <Ban className="w-3.5 h-3.5" /> Cancel
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Exporter
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs gap-1.5 ml-auto">
            <XCircle className="w-3.5 h-3.5" /> Effacer
          </Button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full bg-muted/40 rounded-lg" />)
        ) : orders.length === 0 ? (
          <div className="py-16 text-center bg-muted/20 rounded-lg border border-dashed border-border">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">No shipment found</p>
          </div>
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
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Recipient</p>
                  <p className="text-xs font-bold text-foreground truncate">{order.receiverName || 'Inconnu'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">COD Amount</p>
                  <p className="text-xs font-bold text-primary">{order.codAmount || 0} MAD</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Driver</p>
                  {order.driverName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{order.driverName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold text-foreground truncate">{order.driverName}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-500/70 uppercase tracking-wider italic">Not assigned</span>
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

      {/* Desktop Table */}
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
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Number / Date</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recipient</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trajet Logistique</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned Driver</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Valeur COD</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8} className="py-4"><Skeleton className="h-8 w-full bg-muted/40 rounded" /></TableCell></TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Package className="w-10 h-10 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No active shipment.</p>
                    </div>
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
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded uppercase tracking-wider italic">Not assigned</span>
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
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-[10px] font-semibold text-muted-foreground">
              Page {page + 1} / {totalPages} ({totalItems} total)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="h-8 w-8 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-8 w-8 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
