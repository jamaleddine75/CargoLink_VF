import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Clock, AlertTriangle, Truck,
  Plus, RefreshCw, Box, Filter, ChevronLeft, ChevronRight,
  Download, Zap, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from 'sonner';
import { format } from 'date-fns';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { cn } from '@/lib/utils';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { OrdersTable } from './components/OrdersTable';

const statusConfig: Record<string, { label: string }> = {
  'PENDING': { label: 'En attente' },
  'VALIDATED': { label: 'Validé' },
  'ASSIGNED': { label: 'Assigné' },
  'PICKUP_READY': { label: 'Prêt pour ramassage' },
  'ON_THE_WAY': { label: 'En transit' },
  'DELIVERED': { label: 'Livré' },
  'ISSUE': { label: 'Incident' },
  'CANCELLED': { label: 'Annulé' },
};

export default function AgencyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderType, setOrderType] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [cityFilter, setCityFilter] = useState<'all' | 'agency'>('agency');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      if (cityFilter === 'agency' && user?.agencyCity) {
        const data = await agencyService.getOrdersByCity(
          user.agencyCity,
          orderType === 'all' ? undefined : orderType,
          statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          20
        );
        setOrders(data.content || []);
        setTotalPages(data.totalPages || 1);
      } else {
        const data = await agencyService.getAdminOrders(
          statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          20
        );
        setOrders(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error('Accès refusé. Veuillez vérifier vos permissions.');
      } else {
        toast.error('Erreur de synchronisation des commandes');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, orderType, cityFilter, user?.agencyCity]);

  useEffect(() => { setPage(0); }, [statusFilter, orderType, cityFilter]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleValidate = async (orderId: string) => {
    try {
      await agencyService.validateDelivery(orderId);
      toast.success('Mission validée avec succès');
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, validated: true, status: 'DELIVERED', validatedAt: new Date().toISOString() } 
          : order
      ));
    } catch (error) {
      toast.error('Échec de la validation');
    }
  };

  const handleAutoAssign = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Optimisation de l\'assignation des chauffeurs...',
        success: 'Algorithme d\'auto-assignation exécuté avec succès',
        error: 'Échec de l\'optimisation.',
      }
    );
  };

  const handleExport = () => {
    toast.success('Préparation de l\'exportation...');
  };

  const filteredOrders = orders.filter(order => {
    const term = search.toLowerCase();
    const matchesSearch = (
      (order.trackingNumber || '').toLowerCase().includes(term) ||
      (order.receiverName || '').toLowerCase().includes(term) ||
      (order.deliveryAddress || '').toLowerCase().includes(term)
    );

    let matchesType = true;
    if (cityFilter === 'agency' && orderType !== 'all') {
      if (orderType === 'pickup') {
        matchesType = order.senderCity === user?.agencyCity;
      } else if (orderType === 'delivery') {
        matchesType = order.receiverCity === user?.agencyCity;
      }
    }

    return matchesSearch && matchesType;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    incidents: orders.filter(o => o.status === 'ISSUE').length
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Gestion des Commandes"
        description={cityFilter === 'agency' && user?.agencyCity 
          ? `Gestion de ${stats.total} missions à ${user.agencyCity}.`
          : `Suivi des missions du secteur local.`
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/agency/orders/create')}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle Expédition
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Missions" value={stats.total} icon={Package} />
        <StatCard title="En Attente" value={stats.pending} icon={Clock} />
        <StatCard title="Incidents Actifs" value={stats.incidents} icon={AlertTriangle} />
      </div>

      {/* Toolbar / Filters */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par N° de suivi, client ou adresse..."
              className="pl-9 h-10 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Action Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 px-4 text-xs font-semibold gap-2 border-border bg-card">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  {date ? format(date, "PPP") : "Choisir une Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-44 border-border bg-card text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <SelectValue placeholder="Statuts" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="ALL" className="text-xs">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key} className="text-xs">{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Filter */}
            {user?.agencyCity && (
              <Select value={cityFilter} onValueChange={(v) => setCityFilter(v as 'all' | 'agency')}>
                <SelectTrigger className="h-10 w-44 border-border bg-card text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <SelectValue placeholder="Localisation" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-xs">Toutes les localisations</SelectItem>
                  <SelectItem value="agency" className="text-xs">{user.agencyCity}</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Order Type Filter */}
            {cityFilter === 'agency' && (
              <Select value={orderType} onValueChange={(v) => setOrderType(v as 'all' | 'pickup' | 'delivery')}>
                <SelectTrigger className="h-10 w-44 border-border bg-card text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <SelectValue placeholder="Type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-xs">Tous les types</SelectItem>
                  <SelectItem value="pickup" className="text-xs">Ramassages</SelectItem>
                  <SelectItem value="delivery" className="text-xs">Livraisons</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Tools */}
            <div className="h-10 px-1 rounded-lg border border-border bg-card flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleAutoAssign}
                className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                title="Auto-Assigner les Commandes"
              >
                <Zap className="w-4 h-4 fill-current" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleExport}
                className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                title="Exporter les Données"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="min-h-[400px]">
        {filteredOrders.length > 0 ? (
          <OrdersTable 
            orders={filteredOrders} 
            loading={loading} 
            onValidate={handleValidate}
          />
        ) : !loading ? (
          <Card className="border border-border bg-card shadow-sm p-16 text-center">
            <Box className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-foreground">Aucune expédition trouvée</h3>
            <p className="text-xs text-muted-foreground mt-1">Aucune mission ne correspond aux critères de recherche actuels.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-6 border-border"
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            >
              Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 space-y-3">
             {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            disabled={page === 0 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
          </Button>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-card">
            <span className="text-muted-foreground">Page</span>
            <span className="text-primary">{page + 1}</span>
            <span className="text-muted-foreground">sur</span>
            <span className="text-foreground">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Suivant <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
