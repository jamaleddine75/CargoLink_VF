import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Activity,
  Plus, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Driver } from '@/types';
import AddDriverModal from '@/components/modals/AddDriverModal';
import { getPermitStatus } from './utils/permitUtils';
import HistoryPanel from './components/HistoryPanel';
import { DriverHUDCard } from './components/DriverHUDCard';
import { FleetStatTile } from './components/FleetStatTile';
import { DriverFilters } from './components/DriverFilters';

export default function ManageDrivers() {
  const { user } = useAuth();
  const agencyId = user?.agencyId || '';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  // History panel state
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<{ id: string; name: string } | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agencyService.getAdminDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load fleet command.', {
        description: 'Connection to driver database interrupted.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleViewHistory = (driver: Driver) => {
    setSelectedDriverForHistory({ id: driver.id, name: `${driver.firstName} ${driver.lastName}` });
    setIsHistoryPanelOpen(true);
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const nameMatch = `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const plateMatch = d.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = d.phoneNumber?.includes(searchTerm);

      const permit = getPermitStatus(d.workPermissionUntil);
      const statusMatch = filterStatus === 'ALL' || permit.status === filterStatus;
      const availabilityMatch = availabilityFilter === 'ALL' || d.status === availabilityFilter;

      return (nameMatch || plateMatch || phoneMatch) && statusMatch && availabilityMatch;
    });
  }, [drivers, searchTerm, filterStatus, availabilityFilter]);

  const stats = useMemo(() => ({
    total: drivers.length,
    online: drivers.filter((d) => d.status === 'ONLINE').length,
    permitWarning: drivers.filter((d) => getPermitStatus(d.workPermissionUntil).isExpired).length,
  }), [drivers]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.total} drivers in {user?.agencyName || 'your agency'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Driver
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FleetStatTile
          label="Total Fleet"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <FleetStatTile
          label="Online"
          value={stats.online}
          icon={Activity}
          color="emerald"
          onClick={() => setAvailabilityFilter('ONLINE')}
        />
        <FleetStatTile
          label="Permit Warning"
          value={stats.permitWarning}
          icon={AlertTriangle}
          color="rose"
          onClick={() => setFilterStatus('EXPIRED')}
        />
      </div>

      <AddDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDriverAdded={fetchDrivers}
        agencyId={agencyId}
      />

      {/* Filters */}
      <DriverFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        availabilityFilter={availabilityFilter}
        setAvailabilityFilter={setAvailabilityFilter}
      />

      {/* Driver Grid */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-xl bg-muted/40 border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl text-center">
            <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No drivers found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Adjust your filters or search term</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setAvailabilityFilter('ALL');
              }}
              className="mt-2 text-xs"
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDrivers.map((driver, i) => (
                <DriverHUDCard
                  key={driver.id}
                  driver={driver}
                  idx={i}
                  onUpdate={fetchDrivers}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals / Panels */}
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
        driverId={selectedDriverForHistory?.id || null}
        driverName={selectedDriverForHistory?.name || null}
      />
    </div>
  );
}
