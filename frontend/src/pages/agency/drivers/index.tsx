import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Activity,
  Plus, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { useAuth } from '@/context/AuthContext';
import { Driver } from '@/types';
import AddDriverModal from '@/components/modals/AddDriverModal';
import { getPermitStatus } from './utils/permitUtils';
import HistoryPanel from './components/HistoryPanel';
import { DriverCard } from './components/DriverCard';
import { FleetStatTile } from './components/FleetStatTile';
import { DriverFilters } from './components/DriverFilters';

// Shared Components
import PageHeader from '@/components/shared/PageHeader';

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
      toast.error('Failed to load driver fleet.');
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
      // Safely handle potentially null/undefined fields
      const fName = d.firstName || '';
      const lName = d.lastName || '';
      const nameMatch = `${fName} ${lName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const plateMatch = d.vehiclePlate ? d.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const phoneMatch = d.phoneNumber ? d.phoneNumber.includes(searchTerm) : false;

      const permit = getPermitStatus(d.workPermissionUntil);
      const statusMatch = filterStatus === 'ALL' || permit.status === filterStatus;
      const availabilityMatch = availabilityFilter === 'ALL' || d.driverStatus === availabilityFilter;

      // If searchTerm is empty, nameMatch will be true and the driver will be shown.
      return (nameMatch || plateMatch || phoneMatch) && statusMatch && availabilityMatch;
    });
  }, [drivers, searchTerm, filterStatus, availabilityFilter]);

  const stats = useMemo(() => ({
    total: drivers.length,
    online: drivers.filter((d) => d.driverStatus === 'ONLINE').length,
    permitWarning: drivers.filter((d) => getPermitStatus(d.workPermissionUntil).isExpired).length,
  }), [drivers]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Driver Management"
        description={`${stats.total} drivers registered for the agency.`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-3.5 h-3.5" /> Add Driver
            </Button>
          </div>
        }
      />

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
          label="Permit Alert"
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
              <div key={i} className="h-52 rounded-lg bg-muted/40 border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg text-center bg-card shadow-sm">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No drivers found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Adjust your filters or search terms.</p>
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
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDrivers.map((driver, i) => (
                <DriverCard
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
