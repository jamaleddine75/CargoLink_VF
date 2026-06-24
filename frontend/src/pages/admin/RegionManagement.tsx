import React, { useEffect, useState } from 'react';
import {
  Building2, Users, MapPin, ChevronDown, ChevronRight,
  AlertTriangle, RefreshCw, Globe, ArrowRightLeft,
  CheckCircle2, Loader2, XCircle, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RegionEntry {
  agencyId: string;
  agencyName: string;
  city: string;
  country?: string;
  email?: string;
  phone?: string;
  driverCount: number;
  activeDriverCount: number;
}

interface RegionSummary {
  regions: RegionEntry[];
  orphanDriverCount: number;
  totalAgencies: number;
}

interface OrphanDriver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  registrationCity?: string;
  verificationStatus?: string;
  avatarUrl?: string;
}

const AssignOrphanModal = ({
  driver,
  agencies,
  onClose,
  onSuccess,
}: {
  driver: OrphanDriver;
  agencies: RegionEntry[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!selectedAgencyId) return;
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.ADMIN.REASSIGN_DRIVER(driver.id), { agencyId: selectedAgencyId });
      toast.success(`${driver.name} assigned successfully`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to assign driver');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Assign to Agency
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="font-bold text-sm text-foreground">{driver.name}</p>
            <p className="text-xs text-foreground/50">
              {driver.registrationCity
                ? `Registered in ${driver.registrationCity}`
                : 'No registration city recorded'}
            </p>
            {driver.email && <p className="text-xs text-foreground/40 mt-1">{driver.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Agency</Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger className="bg-accent/30 border-border rounded-xl">
                <SelectValue placeholder="Choose agency..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {agencies.map(a => (
                  <SelectItem key={a.agencyId} value={a.agencyId}>
                    <span className="font-medium">{a.agencyName}</span>
                    {a.city && <span className="text-foreground/50 ml-2 text-xs">— {a.city}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              <XCircle className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedAgencyId || saving}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RegionCard = ({
  region,
  isExpanded,
  onToggle,
}: {
  region: RegionEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const occupancy = region.driverCount > 0
    ? Math.round((region.activeDriverCount / region.driverCount) * 100)
    : 0;

  return (
    <motion.div
      layout
      className="bg-card/50 border border-border/60 rounded-2xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 hover:bg-accent/20 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{region.agencyName}</h3>
            {region.city && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary/80 gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {region.city}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-foreground/40 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {region.driverCount} drivers
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {region.activeDriverCount} active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 justify-end">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <span className="text-xs font-bold text-foreground/60">{occupancy}%</span>
            </div>
            <p className="text-xs text-foreground/30 mt-0.5">active rate</p>
          </div>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-foreground/40" />
            : <ChevronRight className="w-4 h-4 text-foreground/40" />
          }
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/40"
          >
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Drivers', value: region.driverCount, color: 'text-blue-400' },
                { label: 'Active Drivers', value: region.activeDriverCount, color: 'text-emerald-400' },
                { label: 'City', value: region.city || '—', color: 'text-violet-400' },
                { label: 'Active Rate', value: `${occupancy}%`, color: 'text-amber-400' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-foreground/40 uppercase tracking-widest font-bold">{item.label}</p>
                  <p className={cn('text-lg font-black', item.color)}>{item.value}</p>
                </div>
              ))}
              {region.email && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-foreground/40 uppercase tracking-widest font-bold">Contact</p>
                  <p className="text-sm font-medium text-foreground/70">{region.email}</p>
                  {region.phone && <p className="text-xs text-foreground/40">{region.phone}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RegionManagement = () => {
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const [orphans, setOrphans] = useState<OrphanDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [assignTarget, setAssignTarget] = useState<OrphanDriver | null>(null);
  const [showOrphans, setShowOrphans] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regionsRes, orphansRes] = await Promise.all([
        apiClient.get<RegionSummary[]>(ENDPOINTS.ADMIN.REGIONS),
        apiClient.get<OrphanDriver[]>(ENDPOINTS.ADMIN.ORPHAN_DRIVERS),
      ]);
      setSummary(regionsRes.data[0] ?? null);
      setOrphans(orphansRes.data);
    } catch {
      toast.error('Failed to load region data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleRegion = (agencyId: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(agencyId)) next.delete(agencyId);
      else next.add(agencyId);
      return next;
    });
  };

  const regions = summary?.regions ?? [];
  const filteredRegions = regions.filter(r =>
    r.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrphans = orphans.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.registrationCity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Region Management</h1>
            </div>
            <p className="text-sm text-foreground/40">
              Hierarchy: Super Admin → Agencies (by city) → Drivers → Orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
              <Input
                placeholder="Search region or agency..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-56 pl-10 h-10 bg-accent/30 border-border rounded-xl text-sm"
              />
            </div>
            <Button variant="outline" onClick={fetchData} className="h-10 px-3 border-border">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-indigo-500')} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Agencies',
              value: summary?.totalAgencies ?? '—',
              icon: Building2,
              color: 'text-blue-400',
              bg: 'bg-blue-400/10',
            },
            {
              label: 'Total Regions',
              value: regions.filter(r => r.city).length,
              icon: MapPin,
              color: 'text-violet-400',
              bg: 'bg-violet-400/10',
            },
            {
              label: 'Assigned Drivers',
              value: regions.reduce((s, r) => s + r.driverCount, 0),
              icon: Users,
              color: 'text-emerald-400',
              bg: 'bg-emerald-400/10',
            },
            {
              label: 'Unassigned Drivers',
              value: summary?.orphanDriverCount ?? '—',
              icon: AlertTriangle,
              color: (summary?.orphanDriverCount ?? 0) > 0 ? 'text-amber-400' : 'text-foreground/30',
              bg: (summary?.orphanDriverCount ?? 0) > 0 ? 'bg-amber-400/10' : 'bg-accent/20',
            },
          ].map(stat => (
            <div key={stat.label} className={cn('p-4 rounded-2xl border border-border/50', stat.bg)}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn('w-4 h-4', stat.color)} />
                <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">{stat.label}</span>
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Hierarchy: Agency → Region cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-widest text-foreground/60">
              Agency Regions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (expandedRegions.size > 0) setExpandedRegions(new Set());
                else setExpandedRegions(new Set(regions.map(r => r.agencyId)));
              }}
              className="text-xs text-foreground/40 hover:text-foreground"
            >
              {expandedRegions.size > 0 ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="text-center py-16 text-foreground/30">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No regions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRegions.map(region => (
                <RegionCard
                  key={region.agencyId}
                  region={region}
                  isExpanded={expandedRegions.has(region.agencyId)}
                  onToggle={() => toggleRegion(region.agencyId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Unassigned (Orphan) Drivers */}
        {(summary?.orphanDriverCount ?? 0) > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setShowOrphans(v => !v)}
              className="flex items-center gap-3 w-full text-left group"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black uppercase tracking-widest text-amber-500">
                Unassigned Drivers ({summary?.orphanDriverCount})
              </h2>
              {showOrphans
                ? <ChevronDown className="w-4 h-4 text-amber-500/60 ml-auto" />
                : <ChevronRight className="w-4 h-4 text-amber-500/60 ml-auto" />
              }
            </button>

            <AnimatePresence>
              {showOrphans && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredOrphans.map(driver => (
                      <div
                        key={driver.id}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-sm font-black text-amber-500">
                          {driver.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{driver.name}</p>
                          {driver.registrationCity && (
                            <p className="text-xs text-foreground/40 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> {driver.registrationCity}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignTarget(driver)}
                          className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 flex-shrink-0 text-xs gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {assignTarget && (
          <AssignOrphanModal
            driver={assignTarget}
            agencies={regions}
            onClose={() => setAssignTarget(null)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionManagement;
