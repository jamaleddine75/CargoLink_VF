import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HeadphonesIcon, RefreshCw, Search, AlertCircle,
  CheckCircle2, Clock, ShieldAlert, MessageSquare, Filter,
  X, AlertTriangle, ArrowRight, Activity, MapPin, 
  FileText, Send, UserCheck, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { AdminChat } from './AdminChat';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  id: string;
  orderId: string;
  orderTrackingNumber?: string;
  driverName?: string;
  driverId?: string;
  type: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  notes?: string;
  attachments?: string;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Open', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: AlertCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', color: 'bg-accent/30 text-muted-foreground border-border/40', icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; color: string; icon: any }> = {
  LOW: { label: 'Low', color: 'text-slate-500 dark:text-slate-400', icon: Activity },
  MEDIUM: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-500', icon: Flame },
  CRITICAL: { label: 'Critical', color: 'text-rose-600 dark:text-rose-500', icon: ShieldAlert },
};

export default function AdminSupport() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/incidents');
      setIncidents(Array.isArray(res.data) ? res.data : []);
      setLastRefreshedAt(new Date());
    } catch {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = window.setInterval(fetchIncidents, 30000);
    return () => window.clearInterval(interval);
  }, [fetchIncidents]);

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    setUpdatingId(incidentId);
    try {
      const res = await apiClient.put(`/incidents/${incidentId}/status`, { status: newStatus });
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? res.data : inc));
      if (selectedIncident?.id === incidentId) setSelectedIncident(res.data);
      toast.success(`Incident marked as ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriorityChange = async (incidentId: string, priority: string) => {
    setUpdatingId(incidentId);
    try {
      const res = await apiClient.put(`/incidents/${incidentId}/priority`, { priority });
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? res.data : inc));
      if (selectedIncident?.id === incidentId) setSelectedIncident(res.data);
      toast.success(`Priority updated to ${priority}`);
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolve = async (incident: Incident) => {
    const resolution = window.prompt(`Resolution note for incident:`, incident.resolution || '');
    if (resolution === null) return;
    setUpdatingId(incident.id);
    try {
      const res = await apiClient.put(`/incidents/${incident.id}/status`, { status: 'RESOLVED', resolution });
      setIncidents(prev => prev.map(inc => inc.id === incident.id ? res.data : inc));
      if (selectedIncident?.id === incident.id) setSelectedIncident(res.data);
      toast.success('Incident resolved successfully');
    } catch {
      toast.error('Failed to resolve incident');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedIncident) return;
    
    try {
      const res = await apiClient.post(`/incidents/${selectedIncident.id}/notes`, { note: newNote });
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? res.data : inc));
      setSelectedIncident(res.data);
      setNewNote('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const filtered = useMemo(() => incidents.filter(inc => {
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || inc.priority === priorityFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      inc.orderId?.toLowerCase().includes(q) ||
      inc.orderTrackingNumber?.toLowerCase().includes(q) ||
      inc.driverName?.toLowerCase().includes(q) ||
      inc.description?.toLowerCase().includes(q) ||
      inc.type?.toLowerCase().includes(q);
    return matchesStatus && matchesPriority && matchesSearch;
  }), [incidents, search, statusFilter, priorityFilter]);

  const counts = useMemo(() => ({
    ALL: incidents.length,
    OPEN: incidents.filter(i => i.status === 'OPEN').length,
    IN_PROGRESS: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter(i => i.status === 'RESOLVED').length,
    URGENT: incidents.filter(i => (i.status === 'OPEN' || i.status === 'IN_PROGRESS') && (i.priority === 'CRITICAL' || i.priority === 'HIGH')).length,
  }), [incidents]);

  return (
    <div className="space-y-4 md:space-y-8 pb-16 relative">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-card/40 shadow-2xl shadow-black/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10 pointer-events-none" />
        <div className="relative p-6 md:p-8 lg:p-10">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                  Control Matrix
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/40">
                  Logistics Incident Center
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase leading-none">
                Support & <span className="text-indigo-500">Incidents</span>
              </h1>
              <p className="text-foreground/50 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.24em] mt-3 md:mt-4 max-w-2xl">
                Triage operations, manage escalations, and track SLA compliance across the entire logistics network.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="rounded-2xl border border-border/40 bg-background/70 px-4 py-3 min-w-[220px]">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/30 mb-1">Last Sync</p>
                <p className="text-sm font-bold text-foreground/70">
                  {lastRefreshedAt ? formatDistanceToNow(lastRefreshedAt, { addSuffix: true }) : 'Connecting...'}
                </p>
              </div>
              <Button onClick={fetchIncidents} disabled={loading} variant="outline" className="rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest h-11 md:h-14 px-6 md:px-8 bg-accent/20 border-border/40">
                <RefreshCw className={cn("w-3.5 md:w-4 h-3.5 md:h-4 mr-2", loading && "animate-spin")} /> Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
            <StatCard label="Open Issues" value={counts.OPEN} tone="rose" icon={AlertCircle} />
            <StatCard label="In Progress" value={counts.IN_PROGRESS} tone="amber" icon={Clock} />
            <StatCard label="Critical Queue" value={counts.URGENT} tone="red" icon={ShieldAlert} />
            <StatCard label="Resolved" value={counts.RESOLVED} tone="emerald" icon={CheckCircle2} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-accent/30 p-1 md:p-1.5 rounded-xl md:rounded-2xl flex items-center gap-1 border border-border/30 overflow-x-auto no-scrollbar max-w-full">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === s ? "bg-foreground text-background shadow-xl" : "text-foreground/40 hover:text-foreground"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 md:h-10 rounded-xl md:rounded-2xl border-border/40 bg-accent/20 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
                <Filter className="w-3 h-3 mr-2" />
                Priority: {priorityFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl bg-card/95 backdrop-blur-xl border-border/40">
              <DropdownMenuItem onClick={() => setPriorityFilter('ALL')} className="font-bold text-xs">All Priorities</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPriorityFilter('CRITICAL')} className="font-bold text-xs text-rose-500">Critical</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('HIGH')} className="font-bold text-xs text-orange-500">High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('MEDIUM')} className="font-bold text-xs text-amber-500">Medium</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('LOW')} className="font-bold text-xs text-slate-400">Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 md:w-4 h-3.5 md:h-4 text-foreground/30" />
          <Input
            placeholder="Search Order, Driver, Details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 md:pl-11 h-10 md:h-12 rounded-xl md:rounded-2xl bg-accent/20 border-border/40 font-bold text-xs md:text-sm"
          />
        </div>
      </div>

      {/* Main List / Table */}
      <div className="relative z-10">
        {/* Mobile View: Card Stacking */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? (
             [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full bg-accent/10 rounded-[2.5rem]" />)
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-accent/5 rounded-[2.5rem] border border-dashed border-border/40">
               <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No incidents detected</p>
            </div>
          ) : (
            filtered.map((inc) => {
              const sCfg = STATUS_CONFIG[inc.status] || STATUS_CONFIG.OPEN;
              const pCfg = PRIORITY_CONFIG[inc.priority] || PRIORITY_CONFIG.MEDIUM;
              const PriorityIcon = pCfg.icon;

              return (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedIncident(inc)}
                  className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary">#{inc.orderTrackingNumber || inc.id.slice(0,8)}</p>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight truncate max-w-[200px]">{inc.type}</h3>
                     </div>
                     <Badge className={cn("rounded-xl px-2.5 py-0.5 border font-black text-[9px] uppercase tracking-widest", sCfg.color)}>
                        {sCfg.label}
                     </Badge>
                  </div>

                  <p className="text-xs font-bold text-foreground/60 line-clamp-2 mb-6 h-8">{inc.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/40 dark:border-white/5">
                     <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest", pCfg.color)}>
                        <PriorityIcon className="w-3 h-3" />
                        {pCfg.label}
                     </div>
                     <p className="text-[9px] font-bold text-muted-foreground/40 dark:text-muted-foreground/30 uppercase tracking-widest">
                        {inc.createdAt ? formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true }) : '—'}
                     </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <Card className="hidden lg:block overflow-hidden border border-border/40 bg-card/60 shadow-xl backdrop-blur-sm rounded-[2rem]">
          <Table>
            <TableHeader>
              <TableRow className="border-border/20 hover:bg-transparent">
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30 pl-6">Order</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Priority</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Driver</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Description</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Status</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Agent</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-foreground/30 pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                      Loading matrix...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-10" />
                      <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/30">No active incidents</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inc, i) => {
                    const sCfg = STATUS_CONFIG[inc.status] || STATUS_CONFIG.OPEN;
                    const pCfg = PRIORITY_CONFIG[inc.priority] || PRIORITY_CONFIG.MEDIUM;
                    const PriorityIcon = pCfg.icon;

                    return (
                      <motion.tr
                        key={inc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-border/20 hover:bg-accent/10 transition-colors cursor-pointer group"
                        onClick={() => setSelectedIncident(inc)}
                      >
                        <TableCell className="pl-6 py-4">
                          <span className="font-black text-xs uppercase tracking-tight text-primary">
                            {inc.orderTrackingNumber || inc.orderId?.slice(0,8)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", pCfg.color)}>
                            <PriorityIcon className="w-3.5 h-3.5" />
                            {pCfg.label}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-foreground/80">{inc.driverName || 'Unassigned'}</span>
                        </TableCell>
                        <TableCell className="py-4 max-w-[200px]">
                          <p className="text-xs font-bold text-foreground/60 truncate">{inc.description}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={cn("rounded-xl px-2.5 py-0.5 border font-black text-[9px] uppercase tracking-widest", sCfg.color)}>
                            {sCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            {inc.assignedToName || 'Unassigned'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Slide-over Details Drawer */}
      <AnimatePresence>
        {selectedIncident && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setSelectedIncident(null)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-card border-l border-border/40 shadow-2xl z-50 flex flex-col"
            >

              <div className="p-6 border-b border-border/40 flex items-center justify-between bg-accent/10">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", PRIORITY_CONFIG[selectedIncident.priority]?.color, "bg-accent/30")}>
                    {React.createElement(PRIORITY_CONFIG[selectedIncident.priority]?.icon || AlertTriangle, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight leading-none">Incident Details</h2>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mt-1">
                      ID: {selectedIncident.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-accent/30 p-1 rounded-xl border border-border/40 mr-2">
                    <button 
                      onClick={() => setActiveTab('details')}
                      className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", 
                        activeTab === 'details' ? "bg-background text-foreground shadow-sm" : "text-foreground/40")}
                    >Details</button>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", 
                        activeTab === 'chat' ? "bg-background text-foreground shadow-sm" : "text-foreground/40")}
                    >Conversation</button>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedIncident(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {activeTab === 'chat' ? (
                  <div className="h-full">
                    <AdminChat incidentId={selectedIncident.id} />
                  </div>
                ) : (
                  <>
                    {/* Actions Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-accent/20 p-2 rounded-2xl border border-border/30">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-2xl">
                      {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as IncidentStatus[]).map(s => (
                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(selectedIncident.id, s)} className="font-bold text-xs">
                          {s.replace('_', ' ')}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Set Priority
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-2xl">
                      {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as IncidentPriority[]).map(p => (
                        <DropdownMenuItem key={p} onClick={() => handlePriorityChange(selectedIncident.id, p)} className="font-bold text-xs">
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {selectedIncident.status !== 'RESOLVED' && (
                    <Button size="sm" onClick={() => handleResolve(selectedIncident)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest">
                      Resolve
                    </Button>
                  )}

                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/orders/${selectedIncident.orderId}`)} className="rounded-xl text-[10px] font-black uppercase tracking-widest ml-auto">
                    View Order <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoBox label="Tracking Number" value={selectedIncident.orderTrackingNumber || 'N/A'} icon={FileText} />
                  <InfoBox label="Current Status" value={STATUS_CONFIG[selectedIncident.status]?.label} icon={Activity} />
                  <InfoBox label="Assigned Driver" value={selectedIncident.driverName || 'Unassigned'} icon={UserCheck} />
                  <InfoBox label="Reported On" value={format(new Date(selectedIncident.createdAt), 'dd MMM yyyy, HH:mm')} icon={Clock} />
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Description</h3>
                  <div className="bg-accent/20 rounded-2xl p-4 border border-border/40">
                    <Badge className="mb-2 bg-background border-border text-foreground text-[9px] uppercase tracking-widest">{selectedIncident.type}</Badge>
                    <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                      {selectedIncident.description}
                    </p>
                  </div>
                </div>

                {selectedIncident.resolution && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Resolution</h3>
                    <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                      <p className="text-sm font-medium text-emerald-400 leading-relaxed">
                        {selectedIncident.resolution}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Internal Notes</h3>
                  <div className="space-y-3">
                    {selectedIncident.notes ? (
                      selectedIncident.notes.split('\n').filter(Boolean).map((note, idx) => {
                        const match = note.match(/^\[(.*?)\] (.*)$/);
                        if (match) {
                          return (
                            <div key={idx} className="bg-accent/10 rounded-2xl p-3 border border-border/30">
                              <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mb-1 block">
                                {format(new Date(match[1]), 'dd MMM HH:mm')}
                              </span>
                              <p className="text-sm font-bold text-foreground/70">{match[2]}</p>
                            </div>
                          );
                        }
                        return <p key={idx} className="text-sm font-bold text-foreground/70">{note}</p>;
                      })
                    ) : (
                      <p className="text-xs font-bold text-foreground/30 italic">No internal notes yet.</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleAddNote} className="mt-4 relative">
                    <Input
                      placeholder="Add an internal note..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="pr-12 h-12 rounded-2xl bg-accent/20 border-border/40 font-bold text-sm"
                    />
                    <Button type="submit" size="icon" disabled={!newNote.trim()} className="absolute right-1 top-1 bottom-1 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: 'rose' | 'amber' | 'emerald' | 'red' | 'slate'; icon: any }) {
  const toneClasses = {
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
    slate: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  }[tone];

  return (
    <div className="rounded-2xl md:rounded-3xl border border-border/40 bg-background/60 p-4 md:p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.24em] text-foreground/40">{label}</p>
          <p className="text-2xl md:text-4xl font-black tracking-tighter text-foreground mt-1 md:mt-2">{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner', toneClasses)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-accent/10 rounded-2xl p-4 border border-border/30 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-foreground/40">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground/80 truncate">{value}</span>
    </div>
  );
}

