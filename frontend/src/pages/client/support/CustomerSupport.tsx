import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Book
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/api/client';
import { format } from 'date-fns';
import CreateComplaintWizard from './CreateComplaintWizard';
import SupportChatDrawer from './SupportChatDrawer';

interface Incident {
  id: string;
  orderId: string;
  orderTrackingNumber: string;
  title: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

const CustomerSupport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/client/support/incidents');
      if (response.data) {
        setIncidents(response.data);
      }
    } catch (error: any) {
      // Graceful handling of API unavailability
      console.warn('Support system partially unavailable:', error.message);
      if (error.response?.status === 404) {
         setIncidents([]); // Empty state on 404
      } else {
        toast({
          title: "Service Support",
          description: "Impossible de charger vos tickets pour le moment.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const stats = {
    open: incidents.filter(i => i.status === 'OPEN').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    total: incidents.length
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         incident.orderTrackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CLOSED': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'ESCALATED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-rose-500 font-bold';
      case 'HIGH': return 'text-orange-500 font-bold';
      case 'MEDIUM': return 'text-amber-500';
      case 'LOW': return 'text-emerald-500';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white mb-2 italic leading-none">Support <span className="text-primary">Client</span></h1>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Protocol 7 — Operational Assistance Required?</p>
        </div>
        <Button 
          onClick={() => setShowWizard(true)}
          className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nouveau Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: 'text-primary' },
          { label: 'Ouverts', value: stats.open, icon: AlertCircle, color: 'text-blue-500' },
          { label: 'En Cours', value: stats.inProgress, icon: Clock, color: 'text-amber-500' },
          { label: 'Résolus', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 md:p-6 border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className={`w-8 h-8 md:w-12 md:h-12 ${stat.color}`} />
            </div>
            <p className="text-[8px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <h3 className="text-xl md:text-3xl font-black text-white">{stat.value}</h3>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      {/* Search & Filter */}
      <Card className="border-white/5 bg-white/5 backdrop-blur-3xl overflow-hidden rounded-[2.5rem]">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by ticket or order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20 font-bold text-xs"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
             {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    statusFilter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {s.replace('_', ' ')}
                </button>
             ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="relative z-10">
          {/* Mobile View: Card Stacking */}
          <div className="grid grid-cols-1 gap-4 md:hidden p-4">
            {loading ? (
               [...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />)
            ) : filteredIncidents.length === 0 ? (
              <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                 <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No records found</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedIncident(incident)}
                  className="bg-white/5 border border-white/5 rounded-[2rem] p-6 active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary">#{incident.id.slice(0, 8)}</p>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">{incident.title}</h3>
                     </div>
                     <Badge className={`rounded-lg px-2 py-0.5 border font-black text-[8px] tracking-widest ${getStatusColor(incident.status)}`}>
                        {incident.status.split('_').pop()}
                     </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Last Update</span>
                        <span className="text-[10px] font-bold text-white/60">
                           {format(new Date(incident.updatedAt || incident.createdAt), 'dd MMM, HH:mm')}
                        </span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-white/20" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-6 py-5">Incident Node</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden sm:table-cell">Shipping Link</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden lg:table-cell">Protocol</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Status</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden md:table-cell">Sync Timestamp</TableHead>
                  <TableHead className="text-right px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-white/5 animate-pulse">
                      <TableCell colSpan={6} className="h-20 bg-white/5" />
                    </TableRow>
                  ))
                ) : filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                          <MessageSquare className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/30">No active incidents</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow 
                      key={incident.id} 
                      className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <TableCell className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-white group-hover:text-primary transition-colors">
                            {incident.title}
                          </span>
                          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest mt-1">
                            UID: {incident.id.slice(0, 12)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">{incident.orderTrackingNumber || 'N/A'}</span>
                          <span className="text-[8px] text-muted-foreground/40 uppercase font-black tracking-widest mt-1">{incident.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`text-[9px] uppercase font-black tracking-widest ${getPriorityColor(incident.priority)}`}>
                          {incident.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-lg px-2.5 py-1 border font-black text-[8px] tracking-widest ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest hidden md:table-cell">
                        {format(new Date(incident.updatedAt || incident.createdAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ml-auto">
                           <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Helpful Links / Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Knowledge Base', desc: 'Find answers to frequently asked questions.', icon: Book, action: 'Browse' },
          { title: 'Live Chat', desc: 'Chat with a support agent for quick questions.', icon: MessageSquare, action: 'Chat Now' },
          { title: 'Emergency Contact', desc: 'Urgent issues? Call our 24/7 hotline.', icon: AlertTriangle, action: 'Call' },
        ].map((item, i) => (
          <Card key={i} className="p-6 border-white/5 bg-white/5 backdrop-blur-xl group cursor-pointer hover:border-primary/30 transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <h4 className="text-lg font-black text-white mb-1 tracking-tighter uppercase">{item.title}</h4>
            <p className="text-sm text-muted-foreground mb-4 font-medium leading-relaxed">{item.desc}</p>
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              {item.action} <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        ))}
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <CreateComplaintWizard 
            onClose={() => setShowWizard(false)} 
            onSuccess={() => {
              setShowWizard(false);
              fetchIncidents();
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <SupportChatDrawer 
        incident={selectedIncident} 
        onClose={() => setSelectedIncident(null)} 
      />
    </div>
  );
};

export default CustomerSupport;
