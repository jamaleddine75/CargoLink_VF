import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Truck,
  Users,
  Package,
  Search,
} from 'lucide-react';

import { useDashboardMetrics } from '@/pages/agency/dashboard/hooks/useDashboardMetrics';
import { SearchFilters } from '@/pages/agency/dashboard/components/SearchFilters';
import { ListSkeleton } from '@/pages/agency/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import agencyService from '@/services/api/agencyService';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';

interface LiveIncident {
  id: string;
  orderId: string;
  orderTrackingNumber?: string;
  driverName?: string;
  title?: string;
  description?: string;
  status: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
  resolution?: string;
}

export default function AgencyLiveOps() {
  const navigate = useNavigate();
  const { orders, drivers, loading, refresh, agencyId } = useDashboardMetrics();
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const loadIncidents = async () => {
    if (!agencyId) return;
    setIncidentsLoading(true);
    try {
      const data = await agencyService.getAgencyIncidents(agencyId);
      setIncidents(Array.isArray(data) ? (data as LiveIncident[]) : []);
    } catch {
      setIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [agencyId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadIncidents();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [agencyId]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !q || [
        order.trackingNumber,
        order.receiverName,
        order.deliveryAddress,
        order.driverName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesFilter = filter === 'ALL' || order.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const openIncidents = incidents.filter((incident) => incident.status === 'OPEN' || incident.status === 'IN_PROGRESS');
  const resolvedIncidents = incidents.filter((incident) => incident.status === 'RESOLVED' || incident.status === 'CLOSED');
  const activeDrivers = drivers.filter((driver: any) => driver.driverStatus === 'ONLINE' || driver.driverStatus === 'BUSY');

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <PageHeader
        title="Suivi en direct"
        description="Suivez en temps réel le flux des commandes, la disponibilité des chauffeurs et les incidents."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refresh()}
              disabled={loading || incidentsLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || incidentsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/agency/orders')}
              size="sm"
              className="gap-2"
            >
              <Package className="w-3.5 h-3.5" />
              Open Orders
            </Button>
          </div>
        }
      />

      {/* Mini Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Drivers"
          value={activeDrivers.length}
          icon={Truck}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents.length}
          icon={ShieldAlert}
          valueClassName={openIncidents.length > 0 ? "text-destructive" : ""}
        />
        <StatCard
          title="Resolved Incidents"
          value={resolvedIncidents.length}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Column - Order Flow */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <SearchFilters
              search={search}
              onSearchChange={setSearch}
              filters={['ALL', 'PENDING', 'ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY', 'DELIVERED', 'FAILED']}
              activeFilter={filter}
              onFilterChange={setFilter}
               placeholder="Search orders..."
            />
          </div>

          <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-lg">
            <div className="p-4 md:p-6 border-b border-border flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Order Flow</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time delivery queue</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span>{filteredOrders.length} records</span>
              </div>
            </div>

            {loading ? (
              <div className="p-4">
                <ListSkeleton />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Search className="w-6 h-6 text-muted-foreground/45" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  No orders match the filters
                </p>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  Modify your search or select a different status.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-4 md:p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => navigate(`/agency/orders/${order.id}`)}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                {order.trackingNumber || order.id?.slice(0, 8) || '—'}
                              </button>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="text-xs font-medium text-foreground/80 mt-1 truncate max-w-[60ch]">
                              {order.receiverName || 'Unknown recipient'} • {order.deliveryAddress || 'No address'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Driver: {order.driverName || 'Unassigned'} • {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] uppercase text-muted-foreground">COD</p>
                            <p className="text-sm font-semibold text-foreground">{Number(order.codAmount || 0).toFixed(2)} MAD</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/agency/orders/${order.id}`)}
                            className="h-8 text-xs font-medium"
                          >
                            Ouvrir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Columns - Driver Board & Incident Desk */}
        <div className="xl:col-span-4 space-y-6">
          {/* Driver Board */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Drivers</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Availability and daily load</p>
              </div>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-4 space-y-3 max-h-[460px] overflow-auto">
              {drivers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No drivers found</div>
              ) : (
                drivers.slice(0, 8).map((driver: any) => (
                  <div key={driver.id} className="p-3 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/80 transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full",
                          driver.driverStatus === 'ONLINE' ? 'bg-emerald-500' : 
                          driver.driverStatus === 'BUSY' ? 'bg-amber-500' : 
                          'bg-muted-foreground')} />
                          <p className="text-sm font-semibold">{driver.firstName} {driver.lastName}</p>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">{driver.driverStatus || 'UNKNOWN'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-semibold leading-none">{driver.todayDeliveries || 0}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Today</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Incident Desk */}
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Incident Log</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Agency issue feed</p>
              </div>
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-auto">
              {incidentsLoading ? (
                <div className="py-4"><ListSkeleton /></div>
              ) : incidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No incidents to report</div>
              ) : (
                incidents.slice(0, 8).map((incident) => (
                  <div key={incident.id} className="p-3 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/85 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                          {incident.orderTrackingNumber || incident.orderId?.slice(0, 8) || '—'}
                        </p>
                        <p className="text-xs font-semibold text-foreground mt-0.5 line-clamp-2">
                          {incident.title || incident.description || 'Incident'}
                        </p>
                      </div>
                      <StatusBadge status={incident.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
                      <span>{incident.driverName || 'Driver not linked'}</span>
                      <span>{formatDistanceToNow(new Date(incident.updatedAt || incident.createdAt), { addSuffix: true })}</span>
                    </div>
                    {incident.resolution && (
                      <div className="text-xs text-emerald-600 font-medium leading-relaxed bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                        {incident.resolution}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
