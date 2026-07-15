import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Truck,
  Search,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import { useDebounce } from '@/hooks/useDebounce';

type AgencyRecord = {
  id: string;
  name?: string;
  city?: string;
  address?: string;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | string;
  commissionRate?: number | string | null;
  driversCount?: number;
  email?: string;
  adminAgencyName?: string;
};

const statusOptions = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const;

type StatusFilter = (typeof statusOptions)[number];

const AgenciesManagement = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<AgencyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [listPage, setListPage] = useState(0);
  const listPageSize = 10;
  const { page, updatePaginationData } = usePagination(0, 10);
  const debouncedSearch = useDebounce(search, 350);
  const [selectedAgency, setSelectedAgency] = useState<AgencyRecord | null>(null);
  const [agencyToHide, setAgencyToHide] = useState<AgencyRecord | null>(null);
  const [agencyToReset, setAgencyToReset] = useState<AgencyRecord | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [drawerAgency, setDrawerAgency] = useState<AgencyRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = (agency: AgencyRecord) => {
    setDrawerAgency(agency);
    setIsDrawerOpen(true);
  };

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await adminService.getAllAgencies(page, 10);
      const content = (data?.content || []) as AgencyRecord[];
      setAgencies(content);
      updatePaginationData(data);
    } catch {
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, [page, updatePaginationData]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const filteredAgencies = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return agencies.filter((agency) => {
      const name = (agency.name || '').toLowerCase();
      const city = (agency.city || agency.address || '').toLowerCase();
      const matchesSearch = !term || name.includes(term) || city.includes(term);
      const matchesStatus = statusFilter === 'ALL' || agency.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agencies, debouncedSearch, statusFilter]);

  const paginatedAgencies = useMemo(() =>
    filteredAgencies.slice(listPage * listPageSize, (listPage + 1) * listPageSize),
  [filteredAgencies, listPage]);

  const totalListPages = Math.max(1, Math.ceil(filteredAgencies.length / listPageSize));

  const stats = {
    total: agencies.length,
    active: agencies.filter((agency) => agency.status === 'ACTIVE').length,
    pending: agencies.filter((agency) => agency.status === 'PENDING').length,
    totalDrivers: agencies.reduce((sum, agency) => sum + (agency.driversCount || 0), 0),
  };

  const commissionDisplay = (rate: unknown) => {
    if (rate === null || rate === undefined || rate === '') return '—';
    return `${(Number(rate) * 100).toFixed(0)}%`;
  };

  const handleAddAgency = () => navigate('/admin/agencies/create');
  const handleOpenAgency = (agency: AgencyRecord) => navigate(`/admin/agencies/${agency.id}`);
  const handleViewInDrawer = (agency: AgencyRecord) => handleOpenDrawer(agency);

  const handleToggleAgencyStatus = async (agency: AgencyRecord) => {
    if (!agency.id) return;
    const shouldSuspend = agency.status === 'ACTIVE';
    try {
      if (shouldSuspend) {
        await adminService.suspendAgency(agency.id, 'Suspended by super admin');
      } else {
        await adminService.activateAgency(agency.id);
      }
      const nextStatus = shouldSuspend ? 'SUSPENDED' : 'ACTIVE';
      setAgencies((prev) => prev.map((item) => (item.id === agency.id ? { ...item, status: nextStatus } : item)));
      setSelectedAgency((prev) => (prev?.id === agency.id ? { ...prev, status: nextStatus } : prev));
      toast.success(shouldSuspend ? 'Agency suspended' : 'Agency reactivated');
    } catch {
      toast.error('Failed to update agency status');
    }
  };

  const handleHideAgency = async () => {
    if (!agencyToHide?.id) return;
    try {
      await adminService.hideAgency(agencyToHide.id);
      setAgencies((prev) => prev.filter((agency) => agency.id !== agencyToHide.id));
      if (selectedAgency?.id === agencyToHide.id) setSelectedAgency(null);
      toast.success('Agency removed from list');
      setAgencyToHide(null);
    } catch {
      toast.error('Failed to remove agency');
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
      toast.error('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <AdminBreadcrumb items={[{ label: 'Administration' }, { label: 'Agencies' }]} />

      {/* Page Header */}
      <PageHeader
        title="Management des Agencies"
        description="Consultez, filtrez et gérez les agences partenaires logistiques de la plateforme CargoLink."
        action={
          <div className="flex items-center gap-2">
            <Button onClick={fetchAgencies} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={handleAddAgency} size="sm" className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              Nouvelle Agency
            </Button>
          </div>
        }
      />

      {/* Stats HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Agencies" value={stats.total} icon={Building2} loading={loading} />
        <StatCard title="Agencies Actives" value={stats.active} icon={ShieldCheck} loading={loading} />
        <StatCard title="Flotte Partenaire" value={stats.totalDrivers} suffix=" livreurs" icon={Truck} loading={loading} />
        <StatCard title="Demandes en Attente" value={stats.pending} icon={AlertCircle} loading={loading} />
      </div>

      {/* Filter HUD */}
      <div className="border border-border bg-card p-4 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 border-border bg-card text-xs w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg w-full lg:w-auto overflow-x-auto no-scrollbar border border-border">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all whitespace-nowrap',
                  statusFilter === status ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {status === 'ALL' ? 'Toutes' : status === 'ACTIVE' ? 'Actives' : status === 'PENDING' ? 'Pending' : 'Suspendedes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-muted/40 rounded-lg animate-pulse" />)
        ) : paginatedAgencies.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border border-dashed rounded-lg">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No agency found</p>
          </div>
        ) : (
          paginatedAgencies.map((agency) => (
            <div
              key={agency.id}
              onClick={() => handleOpenAgency(agency)}
              className="bg-card border border-border rounded-lg p-5 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                  {agency.name?.substring(0, 2).toUpperCase() || 'AG'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground uppercase tracking-tight text-sm">{agency.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn('px-2 py-0.5 rounded-full border-none font-semibold text-[8px] uppercase tracking-wider', agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                      {agency.status || '—'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{agency.city || '—'}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 border border-border" onClick={(e) => { e.stopPropagation(); handleOpenAgency(agency); }}>
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <div>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Commission & Drivers</p>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className="text-primary">{commissionDisplay(agency.commissionRate)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-foreground">{agency.driversCount || 0} livreurs</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setAgencyToReset(agency); }} className="h-8 w-8 text-amber-500 hover:text-amber-600">
                    <KeyRound className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedAgency(agency); void handleToggleAgencyStatus(agency); }} className={cn('h-8 w-8', agency.status === 'ACTIVE' ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600')}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden lg:block border border-border bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Agency</TableHead>
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">City</TableHead>
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Commission</TableHead>
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Drivers</TableHead>
                <TableHead className="px-6 py-3.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-10 w-full bg-muted/40 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Building2 className="w-10 h-10 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider">No agency found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAgencies.map((agency) => (
                  <TableRow key={agency.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleOpenAgency(agency)}>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                          {agency.name?.substring(0, 2).toUpperCase() || 'AG'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground block text-sm">{agency.name}</span>
                          <span className="text-[10px] text-muted-foreground">{agency.adminAgencyName || '—'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {agency.city || agency.address || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge variant="outline" className={cn(
                        'border-none font-semibold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full',
                        agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                        agency.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        agency.status === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-accent/30 text-muted-foreground'
                      )}>
                        {agency.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center font-bold text-xs text-primary">{commissionDisplay(agency.commissionRate)}</TableCell>
                    <TableCell className="px-6 py-4 text-center font-semibold text-xs">{agency.driversCount ?? 0}</TableCell>
                    <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenAgency(agency)} className="h-8 w-8 text-primary" title="Ouvrir">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setAgencyToReset(agency)} className="h-8 w-8 text-amber-500" title="Reset mot de passe">
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedAgency(agency); void handleToggleAgencyStatus(agency); }} className={cn('h-8 w-8', agency.status === 'ACTIVE' ? 'text-rose-500' : 'text-emerald-500')} title={agency.status === 'ACTIVE' ? 'Suspend' : 'Activer'}>
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setAgencyToHide(agency)} className="h-8 w-8 text-rose-500" title="Masquer">
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border border-border rounded-lg bg-card">
        <p className="text-[11px] text-muted-foreground">
          {filteredAgencies.length} result{(filteredAgencies.length > 1 ? 's' : '')}
          {filteredAgencies.length !== agencies.length && ` (filtered of ${agencies.length})`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border bg-card"
            disabled={listPage === 0}
            onClick={() => setListPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(totalListPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(listPage - 2, totalListPages - 5));
            const pageNum = start + i;
            if (pageNum >= totalListPages) return null;
            return (
              <Button
                key={pageNum}
                variant={pageNum === listPage ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 min-w-[32px] px-2 text-xs', pageNum === listPage ? '' : 'border-border bg-card')}
                onClick={() => setListPage(pageNum)}
              >
                {pageNum + 1}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border bg-card"
            disabled={listPage >= totalListPages - 1}
            onClick={() => setListPage(p => Math.min(totalListPages - 1, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!agencyToReset} onOpenChange={(open) => !open && setAgencyToReset(null)}>
        <DialogContent className="bg-card border border-border rounded-lg p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Reset le mot de passe</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Un mot de passe temporaire sera généré et envoyé to l'adresse e-mail de l'agence.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">{agencyToReset?.name}</p>
            <p className="text-xs text-muted-foreground">{agencyToReset?.email || 'Pas d\'email enregistré'}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAgencyToReset(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleResetPassword} disabled={isResettingPassword} className="gap-2 bg-amber-600 hover:bg-amber-500 text-white">
              {isResettingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!agencyToHide} onOpenChange={(open) => !open && setAgencyToHide(null)}>
        <DialogContent className="bg-card border border-border rounded-lg p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Masquer l'agence</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Cette agence sera masquée de la liste principale. Son historique reste enregistré.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-center">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">{agencyToHide?.name}</p>
            <p className="text-xs text-muted-foreground">{agencyToHide?.city || agencyToHide?.address || '—'}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAgencyToHide(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleHideAgency} className="bg-rose-600 hover:bg-rose-500 text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[500px] bg-card border-l border-border text-foreground p-6 overflow-y-auto">
          {drawerAgency && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg font-black">Details de l'agence</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Informations complètes
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 mb-4">
                  {drawerAgency.name?.substring(0, 2).toUpperCase() || 'AG'}
                </div>
                <h3 className="text-lg font-bold">{drawerAgency.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {drawerAgency.city || drawerAgency.address || '—'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                  <Badge variant="outline" className={cn(
                    'border-none font-semibold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full',
                    drawerAgency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                    drawerAgency.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-rose-500/10 text-rose-600'
                  )}>
                    {drawerAgency.status || '—'}
                  </Badge>
                </div>
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commission</span>
                  <span className="text-xs font-bold text-primary">{commissionDisplay(drawerAgency.commissionRate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drivers</span>
                  <span className="text-xs font-semibold">{drawerAgency.driversCount ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                  <span className="text-xs font-semibold">{drawerAgency.email || '—'}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button className="flex-1 gap-2" size="sm" onClick={() => handleOpenAgency(drawerAgency)}>
                  <ArrowUpRight className="w-3.5 h-3.5" /> View Details
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgenciesManagement;
