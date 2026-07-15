import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Truck, Star, Search, MapPin, RefreshCw, Users, Building2, AlertTriangle,
  MoreVertical, ArrowRightLeft, CheckCircle2, XCircle, Loader2, Wallet, Phone, Mail,
  ArrowUpRight, ShieldAlert, Activity, Calendar, ChevronLeft, ChevronRight, Shield,
  FileCheck, Ban
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
import adminService from '@/services/api/adminService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import { useDebounce } from '@/hooks/useDebounce';

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
      await adminService.assignDriverToAgency(driver.id, selectedAgencyId);
      toast.success('Driver successfully reassigned');
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to reassign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border rounded-lg p-6 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">Réaffecter le livreur</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Select the new partner agency for {driver.firstName} {driver.lastName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agency Partenaire</label>
          <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
            <SelectTrigger className="h-10 border-border bg-card text-xs">
              <SelectValue placeholder="Select an agency..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  {a.name} ({a.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleReassign} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [driverWallet, setDriverWallet] = useState<any>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<DriverResponse | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllDrivers();
      setDrivers(data || []);
      const agencyData = await adminService.getAllAgencies(0, 100);
      const opt = (agencyData?.content || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        city: a.city,
      }));
      setAgencies(opt);
    } catch {
      toast.error("Failed to load driver roster");
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

  const filteredDrivers = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return drivers.filter(d => {
      const nameMatch = !term || `${d.firstName} ${d.lastName}`.toLowerCase().includes(term)
        || d.vehiclePlate?.toLowerCase().includes(term)
        || d.registrationCity?.toLowerCase().includes(term)
        || d.phoneNumber?.toLowerCase().includes(term);
      const agencyMatch = agencyFilter === 'ALL' || d.agencyId === agencyFilter;
      const statusMatch = statusFilter === 'ALL' || d.driverStatus === statusFilter;
      const verifMatch = verificationFilter === 'ALL' || d.verificationStatus === verificationFilter;
      const orphanMatch = !orphanOnly || !d.agencyId;
      return nameMatch && agencyMatch && statusMatch && verifMatch && orphanMatch;
    });
  }, [drivers, debouncedSearch, agencyFilter, statusFilter, verificationFilter, orphanOnly]);

  const paginatedDrivers = useMemo(() =>
    filteredDrivers.slice(page * pageSize, (page + 1) * pageSize),
  [filteredDrivers, page]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));

  const orphanCount = drivers.filter(d => !d.agencyId).length;
  const onlineCount = drivers.filter(d => d.driverStatus === 'ONLINE').length;
  const verifiedCount = drivers.filter(d => d.verificationStatus === 'VERIFIED').length;
  const suspendedCount = drivers.filter(d => d.driverStatus === 'SUSPENDED' || d.disciplinaryStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Management de la Flotte"
        description="Monitor connected drivers, update their affiliations and review their logistics performance."
        action={
          <Button onClick={fetchDrivers} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Stats HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Drivers" value={drivers.length} icon={Users} loading={loading} />
        <StatCard title="Online" value={onlineCount} icon={CheckCircle2} loading={loading} />
        <StatCard title="Verified" value={verifiedCount} icon={Shield} loading={loading} />
        <StatCard title="Suspendeds" value={suspendedCount} icon={Ban} loading={loading} />
      </div>

      {/* Filter HUD */}
      <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, plate, phone or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 border-border bg-card text-xs w-full"
            />
          </div>

          <div className="flex w-full flex-wrap lg:w-auto items-center gap-3">
            {orphanCount > 0 && (
              <Button
                variant={orphanOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setOrphanOnly(v => !v); setPage(0); }}
                className={cn(
                  'h-10 flex-1 lg:flex-none gap-1.5 font-semibold text-xs',
                  orphanOnly ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'border-border bg-card text-amber-500'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Orphelins
              </Button>
            )}

            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="flex-1 lg:w-36 h-10 border-border bg-card text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={v => { setVerificationFilter(v); setPage(0); }}>
              <SelectTrigger className="flex-1 lg:w-40 h-10 border-border bg-card text-xs">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNVERIFIED">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agencyFilter} onValueChange={v => { setAgencyFilter(v); setPage(0); }}>
              <SelectTrigger className="flex-1 lg:w-48 h-10 border-border bg-card text-xs">
                <SelectValue placeholder="Filtrer par agence" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="ALL" className="text-xs">All Agencies</SelectItem>
                {agencies.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {/* List / Table Area */}
      <div className="relative z-10">
        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-muted/40 rounded-lg animate-pulse" />)
          ) : paginatedDrivers.length === 0 ? (
            <div className="py-16 text-center bg-card border border-border border-dashed rounded-lg">
               <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
               <p className="text-xs text-muted-foreground">No driver found</p>
            </div>
          ) : (
            paginatedDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => handleOpenDriverDetail(driver)}
                className="bg-card border border-border rounded-lg p-5 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar user={{ firstName: driver.firstName, lastName: driver.lastName, avatar: driver.avatarUrl } as any} className="h-11 w-11 rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground uppercase tracking-tight text-sm">{driver.firstName} {driver.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className={cn(
                          'px-2 py-0.5 rounded-full border-none font-semibold text-[8px] uppercase tracking-wider',
                          driver.driverStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                       )}>
                          {driver.driverStatus}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground">{driver.vehiclePlate}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 border border-border" onClick={(e) => { e.stopPropagation(); handleOpenDriverDetail(driver); }}>
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                   <div>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Performance</p>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                         <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                         {driver.rating?.toFixed(1) || '0.0'}
                         <span className="text-muted-foreground">•</span>
                         <span>{driver.totalDeliveries || 0} exp.</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Affiliation</p>
                      <p className="text-xs font-bold text-foreground truncate">{driver.agencyName || 'Not assigned'}</p>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block border border-border bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Driver</TableHead>
                  <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Region</TableHead>
          <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Affiliation</TableHead>
          <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Performance</TableHead>
          <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Verification</TableHead>
          <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-6 py-4">
                        <Skeleton className="h-10 w-full bg-muted/40 rounded-lg animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Truck className="w-10 h-10 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wider">Aucun livreur actif détecté</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenDriverDetail(driver)}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={{ firstName: driver.firstName, lastName: driver.lastName, avatar: driver.avatarUrl } as any} className="h-10 w-10 rounded-lg" />
                          <div>
                            <p className="font-semibold text-foreground text-sm tracking-tight">{driver.firstName} {driver.lastName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{driver.vehiclePlate || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold uppercase">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {driver.registrationCity || 'Not provided'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {driver.agencyId ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase">{driver.agencyName}</p>
                              {driver.agencyCity && <p className="text-[9px] text-muted-foreground">{driver.agencyCity}</p>}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-none font-semibold text-[9px] uppercase tracking-wider gap-1 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Not assigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-6">
                          <div className="space-y-0.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Courses</p>
                            <p className="font-bold text-foreground text-xs">{driver.totalDeliveries ?? 0}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Rating</p>
                            <div className="flex items-center gap-1 font-bold text-xs text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {driver.rating?.toFixed(1) || '0.0'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge variant="outline" className={cn(
                          'px-2.5 py-0.5 rounded-full border-none font-semibold text-[9px] uppercase tracking-wider',
                          driver.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600' :
                          driver.verificationStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-rose-500/10 text-rose-600'
                        )}>
                          {driver.verificationStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge variant="outline" className={cn(
                          'px-2.5 py-0.5 rounded-full border-none font-semibold text-[9px] uppercase tracking-wider',
                          driver.driverStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-600' :
                          driver.driverStatus === 'OFFLINE' ? 'bg-rose-500/10 text-rose-600' :
                          'bg-accent/30 text-muted-foreground'
                        )}>
                          {driver.driverStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg border border-border shadow-md bg-popover min-w-[150px] p-1">
                            <DropdownMenuItem onClick={() => handleOpenDriverDetail(driver)} className="rounded cursor-pointer gap-2 p-2 text-xs font-semibold hover:bg-muted transition-colors">
                              <ArrowUpRight className="w-4 h-4 text-primary" /> Fiche Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReassignTarget(driver)} className="rounded cursor-pointer gap-2 p-2 text-xs font-semibold hover:bg-muted transition-colors">
                              <ArrowRightLeft className="w-4 h-4 text-primary" /> Réaffecter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border border-border rounded-lg bg-card">
        <p className="text-[11px] text-muted-foreground">
          {filteredDrivers.length} result{(filteredDrivers.length > 1 ? 's' : '')}
          {filteredDrivers.length !== drivers.length && ` (filtered of ${drivers.length})`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border bg-card"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 2, totalPages - 5));
            const pageNum = start + i;
            if (pageNum >= totalPages) return null;
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 min-w-[32px] px-2 text-xs', pageNum === page ? '' : 'border-border bg-card')}
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border bg-card"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {/* Mobile Pagination */}
        <div className="flex items-center justify-between px-2">
          <p className="text-[11px] text-muted-foreground">
            {filteredDrivers.length} result{(filteredDrivers.length > 1 ? 's' : '')}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border bg-card"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground min-w-[40px] text-center">
              {page + 1}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-border bg-card"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Driver Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[500px] bg-card border-l border-border text-foreground p-6 overflow-y-auto no-scrollbar">
          {selectedDriver && (
            <div className="flex flex-col h-full space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={{ firstName: selectedDriver.firstName, lastName: selectedDriver.lastName, avatar: selectedDriver.avatarUrl } as any}
                    className="h-14 w-14 rounded-lg border border-border shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-foreground text-base uppercase tracking-tight">{selectedDriver.firstName} {selectedDriver.lastName}</h3>
                    <Badge variant="outline" className={cn(
                      'px-2.5 py-0.5 rounded-full border-none font-semibold text-[8px] uppercase tracking-wider mt-1.5',
                      selectedDriver.driverStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    )}>
                      {selectedDriver.driverStatus || 'OFFLINE'}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DrawerStat label="Livraisons" value={selectedDriver.totalDeliveries ?? '0'} icon={Truck} />
                <DrawerStat
                  label="Rating"
                  value={selectedDriver.rating != null ? `${selectedDriver.rating.toFixed(1)} ⭐` : '0.0 ⭐'}
                  icon={Star}
                />
                <DrawerStat label="Vehicle" value={selectedDriver.vehicleType || 'N/A'} icon={Truck} />
                <DrawerStat
                  label="Balance Portefeuille"
                  value={isLoadingWallet ? 'Chargement...' : (driverWallet?.balance != null ? `${Number(driverWallet.balance).toLocaleString()} MAD` : '0.00 MAD')}
                  icon={Wallet}
                />
              </div>

              {/* Information Row List */}
              <div className="space-y-4 pt-2">
                <SectionHeader title="Informations Personnelles" />
                <div className="space-y-3">
                  <InfoRow icon={Phone} label="Phone" value={selectedDriver.phoneNumber || '—'} />
                  <InfoRow icon={Mail} label="E-mail" value={selectedDriver.email || '—'} />
                  <InfoRow icon={MapPin} label="City de Service" value={selectedDriver.registrationCity || '—'} />
                  <InfoRow icon={Truck} label="Matricule Vehicle" value={selectedDriver.vehiclePlate || '—'} />
                </div>

                <div className="pt-4">
                  <SectionHeader title="Affiliation" />
                  {selectedDriver.agencyId ? (
                    <div className="p-4 rounded-lg bg-muted/40 border border-border mt-3">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Agency Actuelle</p>
                          <p className="text-sm font-bold text-foreground">{selectedDriver.agencyName}</p>
                          {selectedDriver.agencyCity && <p className="text-[10px] text-muted-foreground">{selectedDriver.agencyCity}</p>}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setReassignTarget(selectedDriver);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" /> Réaffecter le livreur
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setReassignTarget(selectedDriver);
                      }}
                      size="sm"
                      className="w-full gap-2 mt-3"
                    >
                      <AlertTriangle className="w-4 h-4" /> Assigner to une agence
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

const DrawerStat = ({ label, value, icon: Icon }: any) => (
  <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-3">
    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3">
    <h4 className="text-[9px] font-bold uppercase tracking-wider text-primary shrink-0">{title}</h4>
    <div className="h-px bg-border w-full" />
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between py-1 border-b border-border/40">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-xs font-bold text-foreground">{value}</span>
  </div>
);

export default DriversManagement;
