import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Filter, MoreVertical, Phone, Truck, Clock,
  ExternalLink, Plus, ShieldCheck, ShieldAlert, Activity,
  Navigation, Mail, AlertTriangle, RefreshCw, Grid, List
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Driver } from '@/types';
import { isAfter } from 'date-fns';
import AddDriverModal from '@/components/modals/AddDriverModal';
import { formatTimestamp } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import StatusBadge from './drivers/components/StatusBadge';
import DisciplinaryModal from './drivers/components/DisciplinaryModal';
import HistoryPanel from './drivers/components/HistoryPanel';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

const DriverHUDCard = ({ driver, idx, onAction, onViewHistory }: { 
  driver: Driver; 
  idx: number;
  onAction: (driver: Driver, action: 'SUSPEND' | 'REACTIVATE' | 'BLACKLIST') => void;
  onViewHistory: (driver: Driver) => void;
}) => {
  const isExpired = driver.workPermissionUntil ? !isAfter(new Date(driver.workPermissionUntil), new Date()) : true;
  const isOnline = driver.status === 'ONLINE';
  const disciplinaryStatus = driver.disciplinaryStatus || 'ACTIVE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="group"
    >
      <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] overflow-hidden hover:bg-accent/20 hover:border-primary/30 transition-all duration-500 relative group shadow-2xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-2xl border-2 border-border/40 shadow-2xl group-hover:scale-105 transition-transform">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.lastName}`} />
                  <AvatarFallback className="bg-blue-600 text-primary-foreground font-black uppercase text-xl">
                    {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-background ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-black text-foreground uppercase tracking-tighter text-xl leading-none mb-2">
                  {driver.firstName} {driver.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                   <Badge className={`rounded-lg px-2 py-0 border-none text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent/20 text-muted-foreground/40'}`}>
                      {isOnline ? 'Active Session' : 'Offline'}
                   </Badge>
                   <StatusBadge status={disciplinaryStatus} />
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center hover:bg-accent/40 transition-colors">
                  <MoreVertical className="w-5 h-5 text-muted-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border/40 rounded-2xl p-2 min-w-[200px]">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-3 py-2">Unit Control</DropdownMenuLabel>
                
                {disciplinaryStatus === 'ACTIVE' && (
                  <DropdownMenuItem 
                    onClick={() => onAction(driver, 'SUSPEND')}
                    className="rounded-xl focus:bg-amber-500/10 focus:text-amber-400 text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                  >
                    <ShieldAlert className="w-4 h-4 mr-3" /> Suspend Unit
                  </DropdownMenuItem>
                )}

                {disciplinaryStatus === 'SUSPENDED' && (
                  <DropdownMenuItem 
                    onClick={() => onAction(driver, 'REACTIVATE')}
                    className="rounded-xl focus:bg-emerald-500/10 focus:text-emerald-400 text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-3" /> Reactivate Unit
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem 
                  onClick={() => onViewHistory(driver)}
                  className="rounded-xl focus:bg-blue-500/10 focus:text-blue-400 text-foreground/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                >
                  <Clock className="w-4 h-4 mr-3" /> View History
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/40 my-2" />

                <DropdownMenuItem 
                  onClick={() => onAction(driver, 'BLACKLIST')}
                  className="rounded-xl focus:bg-rose-500/10 focus:text-rose-400 text-destructive/60 font-bold uppercase text-[10px] tracking-widest cursor-pointer px-3 py-3"
                >
                  <Ban className="w-4 h-4 mr-3" /> Blacklist Node
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4 mb-8">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isExpired ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
               {isExpired ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
               <span className="text-[10px] font-black uppercase tracking-widest">
                  {isExpired ? 'Permission Expired' : `Valid until ${formatTimestamp(driver.workPermissionUntil)}`}
               </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-accent/10 p-4 rounded-2xl border border-border/40">
                  <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Vehicle</p>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-foreground/80">{driver.vehiclePlate || 'N/A'}</span>
                  </div>
               </div>
               <div className="bg-accent/10 p-4 rounded-2xl border border-border/40">
                  <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-2">Contact</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-foreground/80">{driver.phoneNumber?.slice(-4) || 'XXXX'}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex gap-3">
             <Button className="flex-1 rounded-2xl h-12 bg-accent/10 hover:bg-accent/20 border border-border/40 text-[10px] font-black uppercase tracking-widest transition-all">
                Profile
             </Button>
             <Button className="flex-1 rounded-2xl h-12 bg-blue-600 hover:bg-blue-500 text-primary-foreground shadow-lg shadow-blue-600/20 text-[10px] font-black uppercase tracking-widest transition-all group">
                Missions
                <ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-0.5 transition-transform" />
             </Button>
          </div>
        </CardContent>
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      </Card>
    </motion.div>
  );
};

export default function ManageDrivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Disciplinary Management State
  const [disciplinaryAction, setDisciplinaryAction] = useState<{
    driver: { id: string; name: string } | null;
    type: 'SUSPEND' | 'REACTIVATE' | 'BLACKLIST' | null;
  }>({ driver: null, type: null });
  const [isDisciplinaryModalOpen, setIsDisciplinaryModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<{ id: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED_LOCAL'>('ALL');

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agencyService.getAdminDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error('Failed to load fleet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || d.disciplinaryStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDisciplinaryAction = (driver: Driver, type: 'SUSPEND' | 'REACTIVATE' | 'BLACKLIST') => {
    setDisciplinaryAction({
      driver: { id: driver.id, name: `${driver.firstName} ${driver.lastName}` },
      type
    });
    setIsDisciplinaryModalOpen(true);
  };

  const handleViewHistory = (driver: Driver) => {
    setSelectedDriverForHistory({ id: driver.id, name: `${driver.firstName} ${driver.lastName}` });
    setIsHistoryPanelOpen(true);
  };

  const stats = {
    total: drivers.length,
    online: drivers.filter(d => d.status === 'ONLINE').length,
    unauthorized: drivers.filter(d => !d.workPermissionUntil || !isAfter(new Date(d.workPermissionUntil), new Date())).length
  };

  return (
    <div className="space-y-12 font-sans selection:bg-blue-500/30 relative z-10 pb-12">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 blur-[150px] rounded-full" />
      </div>
      
      {/* Header HUD */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Fleet Control Center</p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">— Live Node</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            Manage <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">Drivers</span>
          </h1>
          <p className="text-muted-foreground mt-6 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 max-w-xl">
            <Activity className="w-4 h-4 text-primary/50" /> Monitoring {stats.total} units in sector <span className="text-foreground/80">{user?.agencyName || 'MAIN_HQ'}</span>
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={fetchDrivers}
            disabled={loading}
            className="rounded-2xl border-border/40 bg-accent/30 backdrop-blur-xl font-black text-[10px] uppercase tracking-widest px-8 h-14 hover:bg-accent/40 transition-all border border-border/40 hover:border-blue-500/30"
          >
            <RefreshCw className={`w-5 h-5 mr-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Node
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-10 h-14 shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all active:scale-95 border border-border/40"
          >
            <Plus className="w-5 h-5 mr-3" /> Deploy Unit
          </Button>
        </div>
      </header>

      {/* Fleet Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <FleetStatTile label="Total Fleet" value={stats.total} icon={Users} color="blue" />
        <FleetStatTile label="Active Nodes" value={stats.online} icon={Activity} color="emerald" />
        <FleetStatTile label="Permit Warning" value={stats.unauthorized} icon={AlertTriangle} color="rose" />
      </div>

      <AddDriverModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDriverAdded={fetchDrivers} 
        agencyId={user?.agencyId || ''} 
      />

      {/* Search HUD */}
      <div className="relative group max-w-xl relative z-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Filter by name, plate, or unit ID..."
          className="w-full h-16 pl-16 pr-8 rounded-[1.5rem] bg-accent/10 border-border/40 backdrop-blur-3xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all text-foreground placeholder:text-muted-foreground/20 uppercase tracking-tight"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters HUD */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        {[
          { id: 'ALL', label: 'All Units' },
          { id: 'ACTIVE', label: 'Active Only' },
          { id: 'SUSPENDED', label: 'Suspended' },
          { id: 'BLACKLISTED_LOCAL', label: 'Blacklisted' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id as any)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              statusFilter === filter.id
              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-accent/10 border-border/40 text-muted-foreground hover:bg-accent/20 hover:text-foreground'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Driver Grid */}
      <div className="relative z-10 min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-[40px] bg-accent/10 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-accent/10 rounded-[40px] border-2 border-dashed border-border/40 text-center">
            <Users className="w-20 h-20 text-muted-foreground/10 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tight">No units matching signature</h3>
            <p className="text-muted-foreground/40 mt-2 font-bold uppercase text-[10px] tracking-widest">Broaden your search or check filter parameters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredDrivers.map((driver, i) => (
                <DriverHUDCard 
                  key={driver.id} 
                  driver={driver} 
                  idx={i} 
                  onAction={handleDisciplinaryAction}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <DisciplinaryModal 
        isOpen={isDisciplinaryModalOpen}
        onClose={() => setIsDisciplinaryModalOpen(false)}
        driver={disciplinaryAction.driver}
        actionType={disciplinaryAction.type}
        onSuccess={fetchDrivers}
      />

      <HistoryPanel 
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
        driverId={selectedDriverForHistory?.id || null}
        driverName={selectedDriverForHistory?.name || null}
      />

    </div>
  );
}

const FleetStatTile = ({ label, value, icon: Icon, color }: any) => (
  <Card className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 relative overflow-hidden group hover:bg-accent/20 transition-all duration-500 shadow-xl hover:shadow-primary/10">
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${
      color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'
    }`} />
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">{label}</p>
    <div className="flex items-end justify-between relative z-10">
      <h3 className="text-4xl font-black tracking-tighter">
        <AnimatedCounter value={value} />
      </h3>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-border/40 ${
        color === 'blue' ? 'bg-primary/10 text-primary/60' : color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
      }`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  </Card>
);
