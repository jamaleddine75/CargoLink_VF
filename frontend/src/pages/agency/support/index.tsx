import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  LifeBuoy,
  Loader2,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Incident {
  id: string;
  orderId: string;
  orderTrackingNumber?: string;
  driverName?: string;
  driverId?: string;
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_META: Record<string, { label: string; className: string; icon: any }> = {
  OPEN: { label: 'Open', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertCircle },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: CheckCircle2 },
};

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function AgencySupport() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchIncidents = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await apiClient.get('/incidents');
      const items = Array.isArray(res.data) ? res.data : [];
      const sorted = [...items].sort((a: Incident, b: Incident) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setIncidents(sorted);
      setLastRefreshedAt(new Date());
    } catch {
      toast.error('Failed to load support incidents');
    } finally {
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchIncidents(true);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchIncidents]);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesStatus = statusFilter === 'ALL' || incident.status === statusFilter;
      const matchesQuery = !query || [
        incident.orderTrackingNumber,
        incident.orderId,
        incident.driverName,
        incident.title,
        incident.description,
        incident.category,
        incident.type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [incidents, search, statusFilter]);

  const counts = useMemo(() => ({
    ALL: incidents.length,
    OPEN: incidents.filter((incident) => incident.status === 'OPEN').length,
    IN_PROGRESS: incidents.filter((incident) => incident.status === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter((incident) => incident.status === 'RESOLVED').length,
    CLOSED: incidents.filter((incident) => incident.status === 'CLOSED').length,
  }), [incidents]);

  const activeQueue = counts.OPEN + counts.IN_PROGRESS;
  const recentIncident = incidents[0];

  return (
    <div className="space-y-8 pb-10 relative">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-64 -left-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-card/60 shadow-2xl shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <div className="relative p-6 md:p-8 lg:p-10 space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="rounded-full bg-rose-500/10 text-rose-400 border-rose-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                  Agency Support
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/35">
                  Live incident feed
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase leading-none">
                Support <span className="text-rose-500">Center</span>
              </h1>
              <p className="text-foreground/50 font-bold uppercase text-[10px] tracking-[0.24em] mt-4 max-w-2xl">
                Track operational incidents, review driver context, and jump straight to the related order when a case needs escalation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="rounded-2xl border border-border/40 bg-background/70 px-4 py-3 min-w-[220px]">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 mb-1">Last refreshed</p>
                <p className="text-sm font-bold text-foreground/70">
                  {lastRefreshedAt ? formatDistanceToNow(lastRefreshedAt, { addSuffix: true }) : 'Just now'}
                </p>
              </div>
              <Button
                onClick={() => fetchIncidents(true)}
                disabled={loading || refreshing}
                variant="outline"
                className="rounded-2xl font-black text-xs uppercase tracking-widest h-14 px-8 bg-accent/20 border-border/40"
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', (loading || refreshing) && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Active Queue" value={activeQueue} tone="rose" icon={AlertCircle} helper="Needs attention" />
            <MetricCard label="Open" value={counts.OPEN} tone="amber" icon={Clock} helper="Unresolved incidents" />
            <MetricCard label="Resolved" value={counts.RESOLVED} tone="emerald" icon={CheckCircle2} helper="Closed by ops" />
            <MetricCard label="All Incidents" value={counts.ALL} tone="slate" icon={MessageSquare} helper="Current history" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-rose-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-foreground/30">Quick scope</span>
              </div>
              <p className="text-sm font-bold text-foreground/80">
                Search by order, driver, incident type, or resolution notes.
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-foreground/30">Latest case</span>
              </div>
              <p className="text-sm font-bold text-foreground/80 truncate">
                {recentIncident?.title || recentIncident?.description || 'No incidents yet'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <LifeBuoy className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-foreground/30">Operational note</span>
              </div>
              <p className="text-sm font-bold text-foreground/80">
                Keep each ticket tied to the order reference so the full delivery context stays visible.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="bg-accent/30 p-1.5 rounded-2xl flex items-center gap-1 flex-wrap border border-border/30">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                statusFilter === status ? 'bg-foreground text-background shadow-xl' : 'text-foreground/30 hover:text-foreground'
              )}
            >
              {status === 'ALL'
                ? `All (${counts.ALL})`
                : status === 'OPEN'
                  ? `Open (${counts.OPEN})`
                  : status === 'IN_PROGRESS'
                    ? `In Progress (${counts.IN_PROGRESS})`
                    : status === 'RESOLVED'
                      ? `Resolved (${counts.RESOLVED})`
                      : `Closed (${counts.CLOSED})`}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-accent/20 border-border/40 font-bold text-sm"
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-border/40 bg-card/70 shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-20 border-b border-border/20 flex items-center gap-4 px-6 animate-pulse">
                <div className="h-3 w-28 bg-accent/30 rounded" />
                <div className="h-3 w-32 bg-accent/20 rounded flex-1" />
                <div className="h-6 w-24 bg-accent/20 rounded-xl" />
                <div className="h-8 w-20 bg-accent/20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center shadow-lg">
              <LifeBuoy className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">
              {search || statusFilter !== 'ALL' ? 'No incidents match your filters' : 'No incidents reported'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm text-center">
              Refresh to sync the latest operational queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            <AnimatePresence mode="popLayout">
              {filteredIncidents.map((incident, index) => {
                const meta = STATUS_META[incident.status] || STATUS_META.OPEN;
                const StatusIcon = meta.icon;
                const updatedAt = incident.updatedAt || incident.createdAt;

                return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-5 md:p-6 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => incident.orderId && navigate(`/agency/orders/${incident.orderId}`)}
                            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-black text-xs uppercase tracking-tight"
                          >
                            {incident.orderTrackingNumber || incident.orderId?.slice(0, 8) || '—'}
                            {incident.orderId && <ExternalLink className="w-3 h-3" />}
                          </button>
                          <Badge variant="outline" className={cn('rounded-xl px-3 py-1 border font-black text-[9px] uppercase tracking-widest', meta.className)}>
                            {incident.status.replace(/_/g, ' ')}
                          </Badge>
                          {incident.category && (
                            <Badge variant="outline" className="rounded-xl px-3 py-1 border-none bg-accent/30 text-foreground/60 font-black text-[9px] uppercase tracking-widest">
                              {incident.category}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-black uppercase tracking-tight text-foreground leading-tight">
                            {incident.title || incident.type || 'Incident'}
                          </h3>
                          <p className="text-sm text-foreground/60 mt-1 leading-relaxed">
                            {incident.description || 'No description provided'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                          <span>{incident.driverName || 'Driver not linked'}</span>
                          <span className="opacity-50">•</span>
                          <span>
                            Updated {updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true }) : 'recently'}
                          </span>
                          {incident.resolution && (
                            <>
                              <span className="opacity-50">•</span>
                              <span className="text-emerald-500">{incident.resolution}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 xl:justify-end shrink-0">
                        <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
                          {incident.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <StatusIcon className="w-4 h-4" />}
                          <span className="text-xs font-bold">
                            {meta.label}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest bg-accent/20 border-border/40"
                            >
                              <MoreVertical className="w-3 h-3 mr-1" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl p-2 shadow-2xl">
                            <DropdownMenuItem onClick={() => incident.orderId && navigate(`/agency/orders/${incident.orderId}`)} className="rounded-xl font-bold cursor-pointer">
                              Open Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(incident.id)} className="rounded-xl font-bold cursor-pointer">
                              Copy Incident ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fetchIncidents(true)} className="rounded-xl font-bold cursor-pointer text-foreground/70">
                              Refresh Queue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
  helper,
}: {
  label: string;
  value: number;
  tone: 'rose' | 'amber' | 'emerald' | 'slate';
  icon: any;
  helper: string;
}) {
  const toneClasses = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
