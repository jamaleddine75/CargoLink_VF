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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';

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
      toast.success(`${driver.name} successfully assigned`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to assign driver");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border rounded-lg p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Assign to a Partner Agency
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Select a local agency for the orphan driver.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="font-semibold text-foreground">{driver.name}</p>
            <p className="text-muted-foreground mt-0.5">
              {driver.registrationCity
                ? `Registered in ${driver.registrationCity}`
                : 'No registration city registered'}
            </p>
            {driver.email && <p className="text-muted-foreground mt-1">{driver.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Choose Agency</Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger className="bg-card border border-border text-xs h-10">
                <SelectValue placeholder="Select an agency..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {agencies.map(a => (
                  <SelectItem key={a.agencyId} value={a.agencyId} className="text-xs">
                    <span className="font-semibold">{a.agencyName}</span>
                    {a.city && <span className="text-muted-foreground ml-2 text-xs">— {a.city}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedAgencyId || saving}
            size="sm"
            className="gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Confirm
          </Button>
        </DialogFooter>
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
      className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          <Building2 className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-sm">{region.agencyName}</h3>
            {region.city && (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {region.city}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {region.driverCount} livreurs
            </span>
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {region.activeDriverCount} actifs
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
              <span className="text-xs font-bold text-foreground">{occupancy}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Activity Rate</p>
          </div>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border bg-muted/20"
          >
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Total Drivers', value: region.driverCount, color: 'text-foreground' },
                { label: 'Active Drivers', value: region.activeDriverCount, color: 'text-emerald-600' },
                { label: 'City', value: region.city || '—', color: 'text-foreground' },
                { label: 'Activity Rate', value: `${occupancy}%`, color: 'text-foreground' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.label}</p>
                  <p className={cn('text-sm font-semibold', item.color)}>{item.value}</p>
                </div>
              ))}
              {region.email && (
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Contact</p>
                  <p className="text-xs font-semibold text-foreground">{region.email}</p>
                  {region.phone && <p className="text-xs text-muted-foreground">{region.phone}</p>}
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Region Management"
        description="Operational Hierarchy: Super Admin → Local Agencies (by city) → Drivers → Orders"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search region, city..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-48 pl-9 h-10 bg-card border-border text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stats HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Agencies" value={summary?.totalAgencies ?? 0} icon={Building2} loading={loading} />
        <StatCard title="Active Regions" value={regions.filter(r => r.city).length} icon={MapPin} loading={loading} />
        <StatCard title="Assigned Drivers" value={regions.reduce((s, r) => s + r.driverCount, 0)} icon={Users} loading={loading} />
        <StatCard title="Orphan Drivers" value={summary?.orphanDriverCount ?? 0} icon={AlertTriangle} loading={loading} />
      </div>

      {/* Hierarchy List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Regions and Partner Agencies
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (expandedRegions.size > 0) setExpandedRegions(new Set());
              else setExpandedRegions(new Set(regions.map(r => r.agencyId)));
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {expandedRegions.size > 0 ? 'Hide All' : 'Show All'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-border border-dashed rounded-lg bg-card/50">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
            <p className="text-sm font-semibold">No region found</p>
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
            className="flex items-center gap-2 text-left group"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Unassigned Drivers ({summary?.orphanDriverCount})
            </h2>
            {showOrphans
              ? <ChevronDown className="w-4 h-4 text-amber-500/60 ml-2" />
              : <ChevronRight className="w-4 h-4 text-amber-500/60 ml-2" />
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
                      className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <div className="w-10 h-10 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-amber-500">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{driver.name}</p>
                        {driver.registrationCity && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {driver.registrationCity}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignTarget(driver)}
                        className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 flex-shrink-0 text-xs gap-1 h-8"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
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
