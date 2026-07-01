import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck, Star, Search, MapPin, RefreshCw, Users, Building2, AlertTriangle,
  MoreVertical, ArrowRightLeft, CheckCircle2, XCircle, Loader2, Wallet, Phone, Mail,
  ArrowUpRight, ShieldAlert, Activity, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '@/components/common/UserAvatar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';

interface DriverResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  phoneNumber: string;
  vehiclePlate: string;
  vehicleType: string;
  driverStatus: string;
  agencyId?: string;
  agencyName?: string;
  agencyCity?: string;
  registrationCity?: string;
  rating?: number;
  totalDeliveries?: number;
  verificationStatus?: string;
  disciplinaryStatus?: string;
}

interface AgencyOption {
  id: string;
  name: string;
  city: string;
}

const ReassignModal = ({
  driver,
  agencies,
  onClose,
  onSuccess,
}: {
  driver: DriverResponse;
  agencies: AgencyOption[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [selectedAgencyId, setSelectedAgencyId] = useState(driver.agencyId || '');
  const [saving, setSaving] = useState(false);

  const handleReassign = async () => {
    if (!selectedAgencyId) return;
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.ADMIN.REASSIGN_DRIVER(driver.id), { agencyId: selectedAgencyId });
      toast.success(`Driver reassigned successfully`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to reassign driver');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-white/10 rounded-[2.5rem] p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Reassign <span className="text-indigo-500">Driver</span>
          </DialogTitle>
          <DialogDescription>Move driver to a different agency.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/30 border border-border/40">
            <UserAvatar user={{ firstName: driver.firstName, lastName: driver.lastName, avatar: driver.avatarUrl } as unknown} className="h-12 w-12 rounded-xl" />
            <div>
              <p className="font-bold text-sm text-foreground">{driver.firstName} {driver.lastName}</p>
              <p className="text-xs text-foreground/50">{driver.vehiclePlate || 'No plate'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Agency</Label>
            <p className="text-sm font-medium text-foreground/70">
              {driver.agencyName ? `${driver.agencyName}${driver.agencyCity ? ` (${driver.agencyCity})` : ''}` : <span className="text-amber-500">No agency assigned</span>}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assign to Agency</Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger className="bg-accent/30 border-border rounded-2xl h-12">
                <SelectValue placeholder="Select agency..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {agencies.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>
                    <span className="font-medium">{agency.name}</span>
                    {agency.city && <span className="text-foreground/50 ml-2 text-xs">— {agency.city}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-3 pt-6">
          <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl border-border font-black text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedAgencyId || selectedAgencyId === driver.agencyId || saving}
            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Reassigning...' : 'Reassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DriversManagement = () => {
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('ALL');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<DriverResponse | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [driverWallet, setDriverWallet] = useState<unknown | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const [driversRes, agenciesRes] = await Promise.all([
        apiClient.get<DriverResponse[]>(ENDPOINTS.DRIVERS.BASE),
        apiClient.get<{ id: string; name: string; city: string }[]>(ENDPOINTS.AGENCIES.BASE),
      ]);
      setDrivers(driversRes.data);
      setAgencies(agenciesRes.data.map(a => ({ id: a.id, name: a.name, city: a.city })));
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleOpenDriverDetail = async (driver: DriverResponse) => {
    setSelectedDriver(driver);
    setIsDrawerOpen(true);
    setDriverWallet(null);
    setIsLoadingWallet(true);
    try {
      const wallet = await adminService.getDriverWallet(driver.id);
      setDriverWallet(wallet);
    } catch {
      setDriverWallet(null);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const nameMatch = `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      || d.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase())
      || d.registrationCity?.toLowerCase().includes(searchTerm.toLowerCase());
    const agencyMatch = agencyFilter === 'ALL' || d.agencyId === agencyFilter;
    const orphanMatch = !orphanOnly || !d.agencyId;
    return nameMatch && agencyMatch && orphanMatch;
  });

  const orphanCount = drivers.filter(d => !d.agencyId).length;
  const onlineCount = drivers.filter(d => d.driverStatus === 'ONLINE').length;

  return (
    <div className="space-y-4 md:space-y-10 font-sans selection:bg-primary/30 relative z-10 pb-10">
      {/* Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] -right-[5%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Fleet Management</p>
            </div>
          </div>
          <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] font-display">
            Drivers <span className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">Network</span>
          </h1>
          <p className="text-muted-foreground/40 mt-3 md:mt-6 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] flex items-center gap-2 md:gap-3">
            <Activity className="w-3 h-3 text-emerald-400" /> Operational Control — {drivers.length} Units
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        <StatCard title="Total Drivers" value={drivers.length} icon={Users} color="emerald" delay={0.1} />
        <StatCard title="Online Now" value={onlineCount} icon={CheckCircle2} color="emerald" delay={0.2} />
        <StatCard title="Agencies" value={agencies.length} icon={Building2} color="blue" delay={0.3} />
        <StatCard title="Unassigned" value={orphanCount} icon={AlertTriangle} color={orphanCount > 0 ? 'amber' : 'slate'} delay={0.4} />
      </div>

      {/* Search & Filter */}
      {/* Search & Filter */}
      <Card className="border-none bg-accent/20 backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-3 md:p-6 border border-border/40 shadow-2xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-3.5 md:h-4 w-3.5 md:h-4 text-primary/40 group-focus-within:text-emerald-500" />
            <Input
              placeholder="Search by name, plate, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 md:h-14 pl-12 md:pl-14 pr-5 md:pr-6 rounded-xl md:rounded-3xl border-border/40 bg-accent/30 focus:border-emerald-500/50 focus:ring-0 transition-all font-bold text-xs md:text-sm text-foreground"
            />
          </div>

          <div className="flex w-full lg:w-auto items-center gap-3">
            {orphanCount > 0 && (
              <Button
                variant={orphanOnly ? 'default' : 'outline'}
                onClick={() => setOrphanOnly(v => !v)}
                className={cn(
                  'h-11 md:h-14 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2 px-4 md:px-6 flex-1 lg:flex-none shrink-0',
                  orphanOnly ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' : 'bg-accent/30 text-amber-500 hover:bg-amber-500/10 border-border/40'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Orphans
              </Button>
            )}

            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="flex-1 lg:w-56 h-11 md:h-14 bg-accent/30 border-border/40 rounded-xl md:rounded-3xl text-xs md:text-sm font-bold text-foreground">
                <SelectValue placeholder="All agencies" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL">All Agencies</SelectItem>
                {agencies.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchDrivers} className="h-11 md:h-14 w-11 md:w-14 rounded-xl md:rounded-3xl border-border/40 bg-accent/30 hover:bg-accent/40 shrink-0">
              <RefreshCw className={cn("w-3.5 md:w-4 h-3.5 md:h-4 text-foreground/40", loading && "animate-spin text-emerald-500")} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      {/* List / Table Area */}
      <div className="relative z-10">
        {/* Mobile View: Card Stacking */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full bg-accent/10 rounded-[2.5rem]" />)
          ) : filteredDrivers.length === 0 ? (
            <div className="py-20 text-center bg-accent/5 rounded-[2.5rem] border border-dashed border-border/40">
               <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No units in range</p>
            </div>
          ) : (
            filteredDrivers.map((driver) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleOpenDriverDetail(driver)}
                className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <UserAvatar user={{ firstName: driver.firstName, lastName: driver.lastName, avatar: driver.avatarUrl } as unknown} className="h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl" />
                  <div className="flex-1">
                    <h3 className="font-black text-foreground uppercase tracking-tight text-base md:text-lg">{driver.firstName} {driver.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge className={cn(
                          'px-2 py-0.5 rounded-md border-none font-black text-[7px] md:text-[8px] uppercase tracking-widest',
                          driver.driverStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                       )}>
                          {driver.driverStatus}
                       </Badge>
                       <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground/40">{driver.vehiclePlate}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-accent/20" onClick={(e) => { e.stopPropagation(); handleOpenDriverDetail(driver); }}>
                    <ArrowUpRight className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-400" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                   <div>
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Performance</p>
                      <div className="flex items-center gap-2 font-black text-xs">
                         <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                         {driver.rating?.toFixed(1) || '0.0'}
                         <span className="text-muted-foreground/30 mx-1">|</span>
                         {driver.totalDeliveries || 0} Ops
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Affiliation</p>
                      <p className="text-[10px] font-bold text-foreground truncate">{driver.agencyName || 'Orphan Unit'}</p>
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
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Driver Unit</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Zone</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Affiliation</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Performance</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Connectivity</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-10 py-8">
                        <Skeleton className="h-12 w-full bg-accent/30 rounded-2xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Truck className="w-16 h-16" />
                        <p className="text-xs font-black uppercase tracking-widest">No active units detected</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="hover:bg-accent/20 transition-all group cursor-pointer border-border/40"
                      onClick={() => handleOpenDriverDetail(driver)}
                    >
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <UserAvatar user={{ firstName: driver.firstName, lastName: driver.lastName, avatar: driver.avatarUrl } as unknown} className="h-12 w-12 rounded-2xl" />
                          <div>
                            <p className="font-black text-foreground uppercase text-sm tracking-tight">{driver.firstName} {driver.lastName}</p>
                            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">{driver.vehiclePlate || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-2 text-muted-foreground/60 font-bold text-xs uppercase tracking-tight">
                          <MapPin className="w-4 h-4 text-emerald-500/50 shrink-0" />
                          {driver.registrationCity || 'Sector Delta'}
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        {driver.agencyId ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground uppercase tracking-tight">{driver.agencyName}</p>
                              {driver.agencyCity && <p className="text-[10px] font-bold text-muted-foreground/40">{driver.agencyCity}</p>}
                            </div>
                          </div>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] uppercase tracking-widest gap-1 px-3 py-1.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Orphan Unit
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-8">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Ops</p>
                            <p className="font-black text-foreground text-xs">{driver.totalDeliveries ?? 0}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">Rank</p>
                            <div className="flex items-center gap-1 font-black text-emerald-400 text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {driver.rating?.toFixed(1) || '0.0'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-center">
                        <Badge className={cn(
                          'px-3 py-1.5 rounded-full border-none font-black text-[9px] uppercase tracking-widest',
                          driver.driverStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' :
                          driver.driverStatus === 'OFFLINE' ? 'bg-red-500/10 text-red-400' :
                          'bg-accent/30 text-muted-foreground/40'
                        )}>
                          {driver.driverStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground/20 hover:text-primary">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-white/5 shadow-2xl bg-card/90 backdrop-blur-xl min-w-[180px] p-2">
                            <DropdownMenuItem onClick={() => handleOpenDriverDetail(driver)} className="rounded-xl cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary transition-colors">
                              <ArrowUpRight className="w-4 h-4" /> Analysis
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReassignTarget(driver)} className="rounded-xl cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary transition-colors">
                              <ArrowRightLeft className="w-4 h-4" /> Reassign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 my-2" />
                            {!driver.agencyId && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-amber-500 focus:bg-amber-500/10 transition-colors">
                                <AlertTriangle className="w-4 h-4" /> Fast Assign
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Driver Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[600px] bg-background border-sidebar-border text-foreground p-0 overflow-y-auto no-scrollbar">
          {selectedDriver && (
            <div className="flex flex-col h-full">
              <SheetHeader className="sr-only">
                <SheetTitle>Driver Details</SheetTitle>
              </SheetHeader>

              {/* Header */}
              <div className="p-10 bg-emerald-600 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 mb-4 rounded-full">
                      {selectedDriver.driverStatus || 'OFFLINE'}
                    </Badge>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">
                      {selectedDriver.firstName} {selectedDriver.lastName}
                    </h2>
                    <p className="text-emerald-100/60 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {selectedDriver.registrationCity || 'No city registered'}
                    </p>
                  </div>
                  <UserAvatar
                    user={{ firstName: selectedDriver.firstName, lastName: selectedDriver.lastName, avatar: selectedDriver.avatarUrl } as unknown}
                    className="h-20 w-20 rounded-3xl border-2 border-white/20"
                  />
                </div>
                <Truck className="absolute -right-20 -bottom-20 w-80 h-80 text-foreground/5 rotate-12" />
              </div>

              {/* Content */}
              <div className="p-10 space-y-10 flex-1">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <DrawerStat label="Deliveries" value={selectedDriver.totalDeliveries ?? '—'} icon={Truck} />
                  <DrawerStat
                    label="Rating"
                    value={selectedDriver.rating != null ? `${selectedDriver.rating.toFixed(1)} ⭐` : '—'}
                    icon={Star}
                  />
                  <DrawerStat label="Vehicle" value={selectedDriver.vehicleType || '—'} icon={Truck} />
                  <DrawerStat
                    label="Wallet Balance"
                    value={isLoadingWallet ? '…' : (driverWallet?.balance != null ? `${Number(driverWallet.balance).toLocaleString()} MAD` : '—')}
                    icon={Wallet}
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-8">
                  <SectionHeader title="Contact Information" />
                  <div className="grid grid-cols-1 gap-4">
                    <InfoRow icon={Phone} label="Phone" value={selectedDriver.phoneNumber || '—'} />
                    <InfoRow icon={Mail} label="Email" value={selectedDriver.email || '—'} />
                    <InfoRow icon={MapPin} label="Registration City" value={selectedDriver.registrationCity || '—'} />
                    <InfoRow icon={Truck} label="Vehicle Plate" value={selectedDriver.vehiclePlate || '—'} />
                  </div>

                  {/* Agency Info */}
                  <SectionHeader title="Agency Assignment" />
                  {selectedDriver.agencyId ? (
                    <div className="p-6 rounded-[32px] bg-accent/20 border border-border/40">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Current Agency</p>
                          <p className="text-lg font-black tracking-tight text-foreground">{selectedDriver.agencyName}</p>
                          {selectedDriver.agencyCity && <p className="text-xs text-foreground/40">{selectedDriver.agencyCity}</p>}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setReassignTarget(selectedDriver);
                        }}
                        className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" /> Reassign to Another Agency
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setReassignTarget(selectedDriver);
                      }}
                      className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg"
                    >
                      <AlertTriangle className="w-4 h-4" /> Assign to Agency
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reassign Modal */}
      <AnimatePresence>
        {reassignTarget && (
          <ReassignModal
            driver={reassignTarget}
            agencies={agencies}
            onClose={() => setReassignTarget(null)}
            onSuccess={fetchDrivers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, delay }: unknown) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-5 md:p-8 rounded-[2rem] md:rounded-[40px] relative overflow-hidden group hover:bg-white/[0.04] transition-all shadow-xl"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-5 transition-opacity group-hover:opacity-15 ${
      color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-slate-500'
    }`} />
    <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
        color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
        color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
      }`}>
        <Icon className="w-5 md:w-6 h-5 md:h-6" />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-1 md:mb-2">{title}</p>
      <h3 className="text-xl md:text-3xl font-black tracking-tighter text-foreground">{value}</h3>
    </div>
  </motion.div>
);

const DrawerStat = ({ label, value, icon: Icon }: unknown) => (
  <div className="p-6 rounded-[32px] bg-accent/20 border border-border/40 flex flex-col gap-4">
    <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center">
      <Icon className="w-5 h-5 text-emerald-400" />
    </div>
    <div>
      <p className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4">
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 shrink-0">{title}</h4>
    <div className="h-px bg-emerald-500/20 w-full" />
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: unknown) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
        <Icon className="w-4 h-4 text-foreground/40 group-hover:text-foreground" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{label}</span>
    </div>
    <span className="text-xs font-bold text-foreground tracking-tight">{value}</span>
  </div>
);

export default DriversManagement;
