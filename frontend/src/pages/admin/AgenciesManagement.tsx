import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Users, Truck, Search, Plus,
  ArrowUpRight, ShieldCheck, Package, Globe, Edit2,
  X, RefreshCw, DollarSign, MoreVertical, AlertCircle,
  Activity, Wallet, Phone, Mail, Calendar, BarChart3, Trash2,
  KeyRound, ShieldAlert, ArrowRight, Loader2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import adminService from '@/services/api/adminService';
import { usePagination } from '@/hooks/usePagination';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const AgenciesManagement = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { page, updatePaginationData, setPage } = usePagination(0, 10);
  const [selectedAgency, setSelectedAgency] = useState<unknown | null>(null);
  const [agencyToHide, setAgencyToHide] = useState<unknown | null>(null);
  const [agencyToReset, setAgencyToReset] = useState<unknown | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllAgencies(page, 10);
      setAgencies(data.content || []);
      updatePaginationData(data);
    } catch {
      toast.error("Failed to load agencies");
    } finally {
      setLoading(false);
    }
  }, [page, updatePaginationData]);

  useEffect(() => {
    fetchAgencies();
  }, [page, fetchAgencies]);

  const handleAddAgency = () => {
    navigate('/admin/agencies/create');
  };

  const handleOpenAgencyWallet = () => {
    navigate('/admin/wallets');
  };

  const handleToggleAgencyStatus = async () => {
    if (!selectedAgency?.id) return;
    const shouldSuspend = selectedAgency.status === 'ACTIVE';
    try {
      if (shouldSuspend) {
        await adminService.suspendAgency(selectedAgency.id, 'Suspended by super admin');
      } else {
        await adminService.activateAgency(selectedAgency.id);
      }
      const nextStatus = shouldSuspend ? 'SUSPENDED' : 'ACTIVE';
      setSelectedAgency((prev: unknown) => prev ? { ...prev, status: nextStatus } : prev);
      setAgencies(prev => prev.map(a => a.id === selectedAgency.id ? { ...a, status: nextStatus } : a));
      toast.success(shouldSuspend ? 'Agency suspended' : 'Agency reactivated');
    } catch {
      toast.error('Failed to update agency status');
    }
  };

  const handleOpenDrawer = (agency: unknown) => {
    navigate(`/admin/agencies/${agency.id}`);
  };


  const handleHideAgency = async () => {
    if (!agencyToHide?.id) return;
    try {
      await adminService.hideAgency(agencyToHide.id);
      setAgencies(prev => prev.filter(a => a.id !== agencyToHide.id));
        if (selectedAgency?.id === agencyToHide.id) setSelectedAgency(null);
      toast.success("Agency removed from list");
      setAgencyToHide(null);
    } catch {
      toast.error("Failed to remove agency");
    }
  };

  const handleResetPassword = async () => {
    if (!agencyToReset?.id) return;
    setIsResettingPassword(true);
    try {
      await adminService.resetAgencyPassword(agencyToReset.id);
      toast.success(`Temporary password sent to ${agencyToReset.email || 'agency admin'}`);
      setAgencyToReset(null);
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredAgencies = agencies.filter(a => {
    const city = a.city || a.address || '';
    const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) ||
                          city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agencies.length,
    active: agencies.filter(a => a.status === 'ACTIVE').length,
    pending: agencies.filter(a => a.status === 'PENDING').length,
    totalDrivers: agencies.reduce((acc, a) => acc + (a.driversCount || 0), 0)
  };

  const commissionDisplay = (rate: unknown) => {
    if (rate == null) return '—';
    return `${(Number(rate) * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-4 md:space-y-10 font-sans selection:bg-primary/30 relative z-10 pb-10">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] -right-[5%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Partner Network</p>
            </div>
          </div>
          <h1 className="text-2xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            Agency <span className="text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">Nexus</span>
          </h1>
          <p className="text-muted-foreground/40 mt-3 md:mt-6 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] flex items-center gap-2 md:gap-3">
            <Activity className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-400" /> Operational Control — {stats.total} Nodes Active
          </p>
        </motion.div>
        <Button
          onClick={handleAddAgency}
          className="rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest px-6 md:px-8 h-12 md:h-14 shadow-[0_20px_40px_rgba(79,70,229,0.25)] transition-all active:scale-95 border border-indigo-400/20 group w-full md:w-auto"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 md:mr-3 group-hover:rotate-90 transition-transform duration-300" /> Add New Agency
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        <StatHUD title="Total Agencies" value={stats.total} icon={Building2} color="indigo" delay={0.1} />
        <StatHUD title="Active Nodes" value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatHUD title="Total Fleet" value={stats.totalDrivers} icon={Truck} color="amber" delay={0.3} />
        <StatHUD title="Pending Requests" value={stats.pending} icon={AlertCircle} color="violet" delay={0.4} />
      </div>

      {/* Search & Filter */}
      {/* Search & Filter */}
      <Card className="border-none bg-accent/20 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[40px] p-4 md:p-6 border border-border/40 shadow-2xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-3.5 md:h-4 w-3.5 md:w-4 text-primary/40 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search by agency name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 md:h-14 pl-12 md:pl-14 pr-4 md:pr-6 rounded-xl md:rounded-3xl border-border/40 bg-accent/30 focus:border-indigo-500/50 focus:ring-0 transition-all font-bold text-xs md:text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 p-1 bg-accent/30 rounded-xl md:rounded-[20px] w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-[15px] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === status ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground/40 hover:text-foreground hover:bg-accent/30"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={fetchAgencies} className="h-14 w-14 rounded-2xl md:rounded-3xl border-border/40 bg-accent/30 hover:bg-accent/40 hidden md:flex shrink-0">
            <RefreshCw className={cn("w-4 h-4 text-foreground/40", loading && "animate-spin text-indigo-500")} />
          </Button>
        </div>
      </Card>

      {/* Table */}
      {/* Table Area */}
      <div className="relative z-10">
        {/* Mobile View: Card Stacking */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? (
             [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full bg-accent/10 rounded-[2.5rem]" />)
          ) : filteredAgencies.length === 0 ? (
            <div className="py-20 text-center bg-accent/5 rounded-[2.5rem] border border-dashed border-border/40">
               <Building2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No units detected</p>
            </div>
          ) : (
            filteredAgencies.map((agency) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleOpenDrawer(agency)}
                className="bg-card/60 dark:bg-card/40 backdrop-blur-3xl border border-border/50 dark:border-white/5 rounded-[2rem] p-5 md:p-6 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-[10px] md:text-xs border border-indigo-500/20 shadow-xl">
                    {agency.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-foreground uppercase tracking-tight text-base md:text-lg">{agency.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                       <Badge className={cn(
                          'px-1.5 py-0.5 rounded-md border-none font-black text-[7px] md:text-[8px] uppercase tracking-widest',
                          agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                       )}>
                          {agency.status}
                       </Badge>
                       <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground/40">{agency.city || 'Sector Delta'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-accent/20" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(agency); }}>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40 dark:border-white/5">
                   <div>
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Partnership</p>
                      <div className="flex items-center gap-2 font-black text-xs">
                         <span className="text-indigo-400">{commissionDisplay(agency.commissionRate)}</span>
                         <span className="text-muted-foreground/30 mx-1">|</span>
                         {agency.driversCount || 0} Fleet
                      </div>
                   </div>
                   <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setAgencyToReset(agency); }} className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedAgency(agency); handleToggleAgencyStatus(); }} className={cn("h-10 w-10 rounded-xl", agency.status === 'ACTIVE' ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400")}>
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <Card className="hidden lg:block border-none bg-card/40 backdrop-blur-3xl rounded-[40px] border border-border/40 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.01]">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agency Node</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Zone</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Protocol</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Rate</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Fleet Size</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40 dark:divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-10 py-8">
                        <Skeleton className="h-12 w-full bg-accent/30 rounded-2xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAgencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Building2 className="w-16 h-16" />
                        <p className="text-xs font-black uppercase tracking-widest">No agency nodes active</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgencies.map((agency) => (
                    <TableRow
                      key={agency.id}
                      className="hover:bg-accent/20 transition-all group cursor-pointer border-border/40"
                      onClick={() => handleOpenDrawer(agency)}
                    >
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-500/20 shadow-xl group-hover:scale-110 transition-transform">
                            {agency.name?.substring(0, 2).toUpperCase() || 'AG'}
                          </div>
                          <div>
                            <span className="font-black text-foreground uppercase tracking-tight text-sm block">{agency.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground/40 dark:text-muted-foreground/20 uppercase tracking-widest mt-1">{agency.adminAgencyName || '—'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-2 text-muted-foreground/40 font-bold text-xs uppercase tracking-tight">
                          <MapPin className="w-4 h-4 text-indigo-500/50 shrink-0" />
                          {agency.city || agency.address || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-center">
                        <Badge className={cn(
                          "border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg",
                          agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                          agency.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                          agency.status === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-accent/30 text-muted-foreground/30'
                        )}>
                          {agency.status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{commissionDisplay(agency.commissionRate)}</span>
                          <span className="text-[8px] font-bold text-muted-foreground/40 dark:text-muted-foreground/10 uppercase tracking-widest">Commission</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-foreground font-black text-xs">{agency.driversCount ?? 0}</span>
                          <span className="text-[8px] font-bold text-muted-foreground/40 dark:text-muted-foreground/10 uppercase tracking-widest">Active Units</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDrawer(agency)} className="h-9 w-9 rounded-xl hover:bg-indigo-500/10 text-indigo-400" title="Analysis">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setAgencyToReset(agency)} className="h-9 w-9 rounded-xl hover:bg-amber-500/10 text-amber-400" title="Credentials">
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedAgency(agency); handleToggleAgencyStatus(); }} className={cn("h-9 w-9 rounded-xl transition-colors", agency.status === 'ACTIVE' ? "hover:bg-rose-500/10 text-rose-400" : "hover:bg-emerald-500/10 text-emerald-400")} title={agency.status === 'ACTIVE' ? "Suspend" : "Activate"}>
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setAgencyToHide(agency)} className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-rose-400" title="Terminate">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={!!agencyToReset} onOpenChange={(open) => !open && setAgencyToReset(null)}>
        <DialogContent className="bg-background border-white/10 rounded-[2.5rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Reset <span className="text-amber-500">Password</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              A temporary password will be generated and sent to the agency admin's email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>
            <p className="text-lg font-black text-foreground">{agencyToReset?.name}</p>
            <p className="text-xs font-bold text-foreground/40">{agencyToReset?.email || 'No email on record'}</p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setAgencyToReset(null)} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-8 gap-2"
            >
              {isResettingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
              Send Temp Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Agency Dialog */}
      <Dialog open={!!agencyToHide} onOpenChange={(open) => !open && setAgencyToHide(null)}>
        <DialogContent className="bg-background border-white/10 rounded-[2.5rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Remove <span className="text-rose-500">Agency</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              This will hide the agency from the list but preserve all its history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <p className="text-lg font-black text-foreground">{agencyToHide?.name}</p>
            <p className="text-xs text-muted-foreground">{agencyToHide?.city || agencyToHide?.address || '—'}</p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setAgencyToHide(null)} className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleHideAgency} className="h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest px-8">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatHUD = ({ title, value, icon: Icon, color, delay }: unknown) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-4 md:p-8 rounded-2xl md:rounded-[40px] relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 shadow-xl"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 blur-[40px] md:blur-[60px] opacity-5 transition-opacity group-hover:opacity-15 ${
      color === 'indigo' ? 'bg-indigo-500' :
      color === 'emerald' ? 'bg-emerald-500' :
      color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
    }`} />
    <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${
        color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
        color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
        'bg-violet-500/10 text-violet-400 border border-violet-500/20'
      }`}>
        <Icon className="w-4 md:w-6 h-4 md:h-6" />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-foreground/20 mb-1 md:mb-2">{title}</p>
      <h3 className="text-xl md:text-3xl font-black tracking-tighter text-foreground">
        <AnimatedCounter value={value} />
      </h3>
    </div>
  </motion.div>
);


export default AgenciesManagement;
