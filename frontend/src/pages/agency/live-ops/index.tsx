import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  ShieldAlert,
  Truck,
  Users,
  Package,
  CheckCircle2,
  Search,
  MapPinned,
} from 'lucide-react';

import { useDashboardMetrics } from '@/pages/agency/dashboard/hooks/useDashboardMetrics';
import { KPIStats } from '@/pages/agency/dashboard/components/KPIStats';
import { SearchFilters } from '@/pages/agency/dashboard/components/SearchFilters';
import { ChartSkeleton, ListSkeleton } from '@/pages/agency/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import agencyService from '@/services/api/agencyService';

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

const INCIDENT_STYLES: Record<string, string> = {
  OPEN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AgencyLiveOps() {
  const navigate = useNavigate();
  const { metrics, orders, drivers, loading, refresh, agencyId } = useDashboardMetrics();
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const loadIncidents = async () => {
    if (!agencyId) return;
    setIncidentsLoading(true);
    try {
      const data = await agencyService.getAgencyIncidents(agencyId);
      setIncidents(Array.isArray(data) ? data : []);
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
  const activeDrivers = drivers.filter((driver: any) => driver.status === 'ONLINE' || driver.status === 'BUSY');

  return (
    <div className="space-y-8 pb-10 relative">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-56 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-card/60 shadow-2xl shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="relative p-6 md:p-8 lg:p-10 space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="rounded-full bg-sky-500/10 text-sky-400 border-sky-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                  Live Ops
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/35">
                  Orders, drivers, incidents
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase leading-none">
                Operations <span className="text-sky-500">Command</span>
              </h1>
              <p className="text-foreground/50 font-bold uppercase text-[10px] tracking-[0.24em] mt-4 max-w-2xl">
                Track the live flow of agency orders, driver availability, and incident pressure in one operational surface.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Button
                onClick={() => refresh()}
                disabled={loading || incidentsLoading}
                variant="outline"
                className="rounded-2xl font-black text-xs uppercase tracking-widest h-14 px-8 bg-accent/20 border-border/40"
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', (loading || incidentsLoading) && 'animate-spin')} />
                Sync
              </Button>
              <Button
                onClick={() => navigate('/agency/orders')}
                className="rounded-2xl font-black text-xs uppercase tracking-widest h-14 px-8 bg-sky-600 hover:bg-sky-500 text-white shadow-xl shadow-sky-600/25"
              >
                <Package className="w-4 h-4 mr-2" />
                Open Orders
              </Button>
            </div>
          </div>

          <KPIStats metrics={metrics} loading={loading} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LiveMiniCard
              label="Active Drivers"
              value={activeDrivers.length}
              icon={Truck}
              tone="indigo"
              helper="Online or busy"
            />
            <LiveMiniCard
              label="Open Incidents"
              value={openIncidents.length}
              icon={ShieldAlert}
              tone="rose"
              helper="Needs action"
            />
            <LiveMiniCard
              label="Resolved Incidents"
              value={resolvedIncidents.length}
              icon={CheckCircle2}
              tone="emerald"
              helper="Closed or resolved"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            filters={['ALL', 'PENDING', 'ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY', 'DELIVERED', 'FAILED']}
            activeFilter={filter}
            onFilterChange={setFilter}
            placeholder="Search orders by tracking, receiver, address or driver..."
          />

          <Card className="overflow-hidden border border-border/40 bg-card/70 shadow-xl backdrop-blur-sm rounded-[28px]">
            <div className="p-6 md:p-8 border-b border-border/20 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Order Flow</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-2">Real-time delivery queue</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/40">
                <Activity className="w-4 h-4 text-sky-500" />
                {filteredOrders.length} records
              </div>
            </div>

            {loading ? (
              <div className="p-4">
                <ListSkeleton />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center shadow-lg">
                  <Search className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                  No orders match your filters
                </p>
                <p className="text-xs text-muted-foreground max-w-sm text-center">
                  Broaden the search or switch to a different status bucket.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order: any, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-5 md:p-6 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => navigate(`/agency/orders/${order.id}`)}
                                className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-black text-xs uppercase tracking-tight"
                              >
                                {order.trackingNumber || order.id?.slice(0, 8) || '—'}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <Badge className="rounded-xl px-3 py-1 border-none bg-accent/30 text-foreground/60 font-black text-[9px] uppercase tracking-widest">
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-bold text-foreground/70 mt-2 truncate max-w-[60ch]">
                              {order.receiverName || 'Unknown receiver'} • {order.deliveryAddress || 'No address'}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/35 mt-2">
                              Driver: {order.driverName || 'Unassigned'} • {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/35">COD</p>
                            <p className="text-lg font-black text-foreground">{Number(order.codAmount || 0).toFixed(2)} MAD</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/agency/orders/${order.id}`)}
                            className="h-9 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest bg-accent/20 border-border/40"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border border-border/40 bg-card/70 shadow-xl backdrop-blur-sm rounded-[28px] overflow-hidden">
            <div className="p-6 border-b border-border/20 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Driver Board</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-2">Availability and today’s load</p>
              </div>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="p-4 space-y-3 max-h-[460px] overflow-auto">
              {drivers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No driver records found</div>
              ) : (
                drivers.slice(0, 8).map((driver: any) => (
                  <div key={driver.id} className="p-4 rounded-2xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{driver.firstName} {driver.lastName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('w-2 h-2 rounded-full', driver.status === 'ONLINE' ? 'bg-emerald-500' : driver.status === 'BUSY' ? 'bg-amber-500' : 'bg-rose-500')} />
                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/35">{driver.status || 'UNKNOWN'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black leading-none">{driver.todayDeliveries || 0}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Today</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border border-border/40 bg-card/70 shadow-xl backdrop-blur-sm rounded-[28px] overflow-hidden">
            <div className="p-6 border-b border-border/20 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Incident Desk</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-2">Agency-scoped issue feed</p>
              </div>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-auto">
              {incidentsLoading ? (
                <div className="py-4"><ListSkeleton /></div>
              ) : incidents.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No incidents found for this agency</div>
              ) : (
                incidents.slice(0, 8).map((incident) => (
                  <div key={incident.id} className="p-4 rounded-2xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight text-foreground truncate">
                          {incident.orderTrackingNumber || incident.orderId?.slice(0, 8) || '—'}
                        </p>
                        <p className="text-sm font-bold text-foreground/80 mt-1 line-clamp-2">
                          {incident.title || incident.description || 'Incident'}
                        </p>
                      </div>
                      <Badge className={cn('rounded-xl px-3 py-1 border font-black text-[9px] uppercase tracking-widest shrink-0', INCIDENT_STYLES[incident.status] || INCIDENT_STYLES.OPEN)}>
                        {incident.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/35">
                      <span>{incident.driverName || 'Driver not linked'}</span>
                      <span>{formatDistanceToNow(new Date(incident.updatedAt || incident.createdAt), { addSuffix: true })}</span>
                    </div>
                    {incident.resolution && (
                      <div className="text-xs text-emerald-500 font-bold leading-relaxed">
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

function LiveMiniCard({
  label,
  value,
  icon: Icon,
  tone,
  helper,
}: {
  label: string;
  value: number;
  icon: any;
  tone: 'rose' | 'emerald' | 'indigo';
  helper: string;
}) {
  const toneClasses = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }[tone];

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-foreground/30 mb-1">{label}</p>
          <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-2">{helper}</p>
        </div>
        <div className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0', toneClasses)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
