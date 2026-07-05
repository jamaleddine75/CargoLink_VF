import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { usePagination } from '@/hooks/usePagination';
import AnimatedCounter from '@/components/common/AnimatedCounter';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const { page, updatePaginationData } = usePagination(0, 10);
  const [selectedAgency, setSelectedAgency] = useState<AgencyRecord | null>(null);
  const [agencyToHide, setAgencyToHide] = useState<AgencyRecord | null>(null);
  const [agencyToReset, setAgencyToReset] = useState<AgencyRecord | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
    const term = search.trim().toLowerCase();
    return agencies.filter((agency) => {
      const name = (agency.name || '').toLowerCase();
      const city = (agency.city || agency.address || '').toLowerCase();
      const matchesSearch = !term || name.includes(term) || city.includes(term);
      const matchesStatus = statusFilter === 'ALL' || agency.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agencies, search, statusFilter]);

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
    <div className="space-y-4 md:space-y-8 relative z-10 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur-xl">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Agency management</p>
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Agencies <span className="text-primary">Overview</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
            Search agencies, review status, and manage access from a clean operational view.
          </p>
        </div>

        <Button
          onClick={handleAddAgency}
          className="rounded-full border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 md:px-6 h-11 md:h-12 shadow-sm transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> New agency
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatHUD title="Agencies" value={stats.total} icon={Building2} color="indigo" delay={0.1} />
        <StatHUD title="Active" value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatHUD title="Fleet" value={stats.totalDrivers} icon={Truck} color="amber" delay={0.3} />
        <StatHUD title="Pending" value={stats.pending} icon={AlertCircle} color="violet" delay={0.4} />
      </div>

      <Card className="border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] p-4 md:p-5">
        <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-5">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name or city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 md:h-12 pl-11 pr-4 rounded-full border-border/60 bg-background/80 focus:border-primary/40 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-full w-full lg:w-auto overflow-x-auto no-scrollbar">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                  statusFilter === status ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'
                )}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={fetchAgencies} className="h-11 w-11 rounded-full border-border/60 bg-background/80 hover:bg-accent/10 hidden md:flex shrink-0">
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin text-primary')} />
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 w-full bg-accent/10 rounded-[2rem]" />)
        ) : filteredAgencies.length === 0 ? (
          <div className="py-20 text-center bg-card/60 rounded-[2rem] border border-dashed border-border/60">
            <Building2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">No agencies found</p>
          </div>
        ) : (
          filteredAgencies.map((agency) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleOpenAgency(agency)}
              className="bg-card/70 backdrop-blur-2xl border border-border/60 rounded-[1.75rem] p-5 shadow-sm relative overflow-hidden active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/15">
                  {agency.name?.substring(0, 2).toUpperCase() || 'AG'}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-foreground uppercase tracking-tight text-base">{agency.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn('px-2 py-0.5 rounded-full border-none font-black text-[8px] uppercase tracking-widest', agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
                      {agency.status || '—'}
                    </Badge>
                    <span className="text-[10px] font-medium text-muted-foreground">{agency.city || '—'}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-accent/20" onClick={(e) => { e.stopPropagation(); handleOpenAgency(agency); }}>
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Commission</p>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="text-primary">{commissionDisplay(agency.commissionRate)}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{agency.driversCount || 0} drivers</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setAgencyToReset(agency); }} className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500">
                    <KeyRound className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedAgency(agency); void handleToggleAgencyStatus(agency); }} className={cn('h-10 w-10 rounded-full', agency.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500')}>
                    <ShieldAlert className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Card className="hidden lg:block border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background/60">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agency</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Commission</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Drivers</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-8 py-8">
                      <Skeleton className="h-12 w-full bg-accent/20 rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-28 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Building2 className="w-12 h-12" />
                      <p className="text-xs font-bold uppercase tracking-widest">No agencies found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgencies.map((agency) => (
                  <TableRow key={agency.id} className="hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleOpenAgency(agency)}>
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/15">
                          {agency.name?.substring(0, 2).toUpperCase() || 'AG'}
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{agency.name}</span>
                          <span className="text-xs text-muted-foreground">{agency.adminAgencyName || '—'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/50 shrink-0" />
                        {agency.city || agency.address || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-center">
                      <Badge className={cn(
                        'border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full',
                        agency.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                        agency.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        agency.status === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-accent/30 text-muted-foreground'
                      )}>
                        {agency.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-center font-semibold text-primary">{commissionDisplay(agency.commissionRate)}</TableCell>
                    <TableCell className="px-8 py-6 text-center font-semibold">{agency.driversCount ?? 0}</TableCell>
                    <TableCell className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenAgency(agency)} className="h-9 w-9 rounded-full hover:bg-primary/10 text-primary" title="Open">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setAgencyToReset(agency)} className="h-9 w-9 rounded-full hover:bg-amber-500/10 text-amber-500" title="Reset password">
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedAgency(agency); void handleToggleAgencyStatus(agency); }} className={cn('h-9 w-9 rounded-full', agency.status === 'ACTIVE' ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-emerald-500/10 text-emerald-500')} title={agency.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setAgencyToHide(agency)} className="h-9 w-9 rounded-full hover:bg-rose-500/10 text-rose-500" title="Hide">
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

      <Dialog open={!!agencyToReset} onOpenChange={(open) => !open && setAgencyToReset(null)}>
        <DialogContent className="bg-background border-border/60 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Reset password</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A temporary password will be sent to the agency admin email.
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
            <Button variant="ghost" onClick={() => setAgencyToReset(null)} className="h-12 rounded-full text-sm font-medium text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isResettingPassword} className="h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold px-8 gap-2">
              {isResettingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
              Send temporary password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!agencyToHide} onOpenChange={(open) => !open && setAgencyToHide(null)}>
        <DialogContent className="bg-background border-border/60 rounded-[2rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Hide agency</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              The agency will disappear from this list, but its history stays intact.
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
            <Button variant="ghost" onClick={() => setAgencyToHide(null)} className="h-12 rounded-full text-sm font-medium text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleHideAgency} className="h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold px-8">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatHUD = ({ title, value, icon: Icon, color, delay }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: 'indigo' | 'emerald' | 'amber' | 'violet'; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card/70 backdrop-blur-2xl border border-border/60 p-4 md:p-6 rounded-2xl relative overflow-hidden group hover:bg-card transition-all duration-300 shadow-sm"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] opacity-10 transition-opacity group-hover:opacity-20 ${
      color === 'indigo' ? 'bg-indigo-500' :
      color === 'emerald' ? 'bg-emerald-500' :
      color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
    }`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl ${
        color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/15' :
        color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' :
        color === 'amber' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
        'bg-violet-500/10 text-violet-500 border border-violet-500/15'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</p>
      <h3 className="text-xl md:text-3xl font-black tracking-tight text-foreground">
        <AnimatedCounter value={value} />
      </h3>
    </div>
  </motion.div>
);

export default AgenciesManagement;
