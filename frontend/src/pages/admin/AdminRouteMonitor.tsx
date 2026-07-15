import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, AlertCircle, CheckCircle2, Clock, MapPin, 
  ChevronRight, Search, Filter, RotateCcw, User,
  TrendingUp, BarChart3, AlertTriangle, MoreVertical,
  ExternalLink, Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '@/services/api/adminService';
import routingService from '@/services/api/routingService';
import stompClient from '@/services/websocket/stompClient';
import CargoMap, { MapDriver, MapPoint } from '@/components/common/CargoMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Tanger': [35.7595, -5.8340],
  'Tetouan': [35.5889, -5.3626],
  'Fnideq': [35.8450, -5.3522],
  'Mdiq': [35.6858, -5.3239],
  'Martil': [35.6167, -5.2667],
  'Casablanca': [33.5731, -7.5898],
  'Rabat': [34.0209, -6.8416],
  'Marrakech': [31.6295, -7.9811],
  'Fes': [34.0181, -5.0078],
  'Agadir': [30.4278, -9.5981],
  'Kenitra': [34.2532, -6.5891],
  'Meknes': [33.8935, -5.5473],
  'Oujda': [34.6867, -1.9114],
  'Safi': [32.2994, -9.2372],
  'El Jadida': [33.2316, -8.5007],
  'Nador': [35.1681, -2.9335],
  'Mohammedia': [33.6835, -7.3847],
  'Khouribga': [32.8810, -6.9063],
  'Beni Mellal': [32.3373, -6.3498],
  'Taza': [34.2167, -4.0167],
  'Khemisset': [33.8167, -6.0667],
  'Errachidia': [31.9314, -4.4244],
  'Ouarzazate': [30.9189, -6.8934],
  'Settat': [33.0010, -7.6166],
  'Larache': [35.1932, -6.1557],
  'Ksar El Kebir': [35.0000, -5.9000],
  'Guelmim': [28.9870, -10.0573],
  'Tiznit': [29.6974, -9.7316],
  'Ifrane': [33.5272, -5.1067],
  'Laayoune': [27.1500, -13.2000],
  'Dakhla': [23.6844, -15.9579]
};

// --- Types Localized for Monitor ---
interface DriverMonitorData {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  tourStats?: unknown;
  routeStops?: unknown[];
  etaCascade?: unknown;
  lastUpdate: number;
}

const AdminRouteMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [citySearch, setCitySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<unknown[]>([]);
  const [driverPositions, setDriverPositions] = useState<Record<string, { lat: number, lng: number, ts: number }>>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reassignModal, setReassignModal] = useState<{ orderId: string, driverId: string } | null>(null);

  // 0. Fetch all agencies to get cities
  const { data: agencies = [] } = useQuery({
    queryKey: ['admin-agencies-all'],
    queryFn: async () => {
      const res = await adminService.getAllAgencies(0, 500);
      return res.content || [];
    }
  });

  const availableCities = useMemo(() => {
    const citiesMap: Record<string, number> = {};
    agencies.forEach((a: unknown) => {
      if (a.city) {
        citiesMap[a.city] = (citiesMap[a.city] || 0) + (a.driversCount || 0);
      }
    });
    return Object.entries(citiesMap)
      .map(([name, drivers]) => ({ name, drivers }))
      .filter(city => city.name.toLowerCase().includes(citySearch.toLowerCase()))
      .sort((a, b) => b.drivers - a.drivers);
  }, [agencies, citySearch]);

  // Set default city
  useEffect(() => {
    if (availableCities.length > 0 && !selectedCity) {
      setSelectedCity(availableCities[0].name);
    }
  }, [availableCities, selectedCity]);

  // 1. Fetch all live drivers
  const { data: liveDrivers = [], isLoading } = useQuery({
    queryKey: ['admin-live-drivers'],
    queryFn: () => adminService.getGlobalLiveDrivers(),
    refetchInterval: 15000,
  });

  // 2. WebSocket Subscriptions
  useEffect(() => {
    stompClient.connect(null, () => {
      // Subscribe to general order events (for alerts)
      stompClient.subscribe('/topic/orders', (msg: unknown) => {
        if (msg.event === 'DELAY_ALERT' || msg.slaStatus === 'EXCEEDED') {
          setActiveAlerts(prev => [msg, ...prev].slice(0, 5));
          toast.error(`Alerte SLA: Driver ${msg.driverName || 'Inconnu'}`, {
            description: msg.message || `Retard of l'ordre ${msg.trackingNumber}`
          });
        }
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['admin-live-drivers'] });
      });

      // Subscribe to driver positions
      liveDrivers.forEach((d: unknown) => {
        stompClient.subscribe(`/topic/tracking/driver/${d.id}`, (pos: unknown) => {
          setDriverPositions(prev => ({
            ...prev,
            [d.id]: { lat: pos.lat, lng: pos.lng, ts: Date.now() }
          }));
        });
      });
    });

    return () => stompClient.disconnect();
  }, [liveDrivers, queryClient]);

  // 3. Fetch specific driver data when selected
  const { data: selectedDriverRoute } = useQuery({
    queryKey: ['driver-route', selectedDriverId],
    queryFn: () => routingService.getDriverRoute(selectedDriverId!),
    enabled: !!selectedDriverId,
  });

  const { data: selectedDriverCascade } = useQuery({
    queryKey: ['driver-eta-cascade', selectedDriverId],
    queryFn: () => routingService.getETACascade(selectedDriverId!),
    enabled: !!selectedDriverId,
    refetchInterval: 30000,
  });

  const { data: selectedDriverStats } = useQuery({
    queryKey: ['driver-tour-stats', selectedDriverId],
    queryFn: () => routingService.getTourStats(selectedDriverId!),
    enabled: !!selectedDriverId,
  });

  // Filtered drivers based on city and search
  const filteredLiveDrivers = useMemo(() => {
    return liveDrivers.filter((d: unknown) => {
      // Find driver's city from agencies
      const agency = agencies.find((a: unknown) => a.id === (d.agencyId || d.agency?.id));
      const driverCity = agency?.city || d.city || d.registrationCity || '';
      
      const matchesCity = !selectedCity || driverCity === selectedCity;
      const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                           (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCity && matchesSearch;
    });
  }, [liveDrivers, selectedCity, searchQuery, agencies]);

  // 4. Computed Map Data
  const mapDrivers: MapDriver[] = useMemo(() => {
    return filteredLiveDrivers.map((d: unknown, idx: number) => {
      const livePos = driverPositions[d.id];
      const lat = livePos?.lat ?? d.latitude ?? 33.5731;
      const lng = livePos?.lng ?? d.longitude ?? -7.5898;
      
      // Calculate status based on SLA or ETA
      let status: 'on-time' | 'at-risk' | 'delayed' = 'on-time';
      if (d.slaStatus === 'EXCEEDED') status = 'delayed';
      else if (d.slaStatus === 'AT_RISK') status = 'at-risk';

      return {
        id: d.id,
        lat,
        lng,
        label: `D${idx + 1}`,
        status,
        color: selectedDriverId === d.id ? '#3B82F6' : undefined,
        route: selectedDriverId === d.id ? selectedDriverRoute?.stops?.map((s: unknown) => [s.lat, s.lng]) : undefined
      };
    });
  }, [filteredLiveDrivers, driverPositions, selectedDriverId, selectedDriverRoute]);

  const mapPoints: MapPoint[] = useMemo(() => {
    if (!selectedDriverId || !selectedDriverRoute) return [];
    return selectedDriverRoute.stops.map((stop: unknown, idx: number) => ({
      id: `${stop.orderId}-${stop.type}`,
      lat: stop.lat,
      lng: stop.lng,
      type: stop.type === 'PICKUP' ? 'PICKUP' : 'DELIVERY',
      label: stop.type === 'PICKUP' ? 'P' : `${idx + 1}`,
      trackingNumber: stop.trackingNumber
    }));
  }, [selectedDriverId, selectedDriverRoute]);

  // 5. Handlers
  const handleDriverClick = (driverId: string) => {
    setSelectedDriverId(driverId);
  };

  const reassignMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string, driverId: string }) => 
      adminService.reassignOrder(orderId, driverId),
    onSuccess: () => {
      toast.success('Order successfully reassigned');
      setReassignModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-live-drivers'] });
    }
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-theme(spacing.24))] w-full bg-transparent overflow-hidden">
      
      {/* ── TOP/LEFT PANEL: REAL-TIME MAP (Full on mobile, 60% on desktop) ── */}
      <div className="w-full lg:w-[60%] h-[50vh] lg:h-full relative shrink-0">
        <CargoMap
          mode="GLOBAL"
          multiDrivers={mapDrivers}
          points={mapPoints}
          onPointClick={(p) => {
            if (p.type === 'DRIVER') setSelectedDriverId(p.id);
          }}
          center={(() => {
            if (selectedDriverId) return undefined;
            const cityCoords = CITY_COORDINATES[selectedCity];
            if (cityCoords) return cityCoords;
            const firstDriver = filteredLiveDrivers[0];
            if (firstDriver && firstDriver.latitude != null && firstDriver.longitude != null) {
              return [firstDriver.latitude, firstDriver.longitude];
            }
            return [35.7595, -5.8340]; // Safe default: Tanger
          })()}
          zoom={12}
          theme={undefined} // Automatically follow system theme
        />
        
        {/* Map Overlay Stats */}
        <div className="absolute top-6 left-6 z-[400] flex gap-3">
          <div className="bg-background/80 dark:bg-[#020617]/40 backdrop-blur-2xl border border-border dark:border-white/5 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 transition-all duration-500 hover:border-emerald-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400/90">{filteredLiveDrivers.length} Active Drivers</span>
          </div>
          {activeAlerts.length > 0 && (
            <div className="bg-rose-500/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(244,63,94,0.3)] flex items-center gap-3 animate-bounce border border-white/10">
              <AlertTriangle size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{activeAlerts.length} SLA Alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM/RIGHT PANEL: DRIVER LIST & ALERTS (Full on mobile, 40% on desktop) ── */}
      <div className="w-full lg:w-[40%] h-full border-t lg:border-t-0 lg:border-l border-border/50 dark:border-white/5 bg-card/60 dark:bg-card/20 backdrop-blur-3xl flex flex-col min-h-0 overflow-hidden">
        
        {/* Header with Search */}
        <div className="p-4 md:p-6 bg-gradient-to-b from-primary/5 dark:from-white/[0.03] to-transparent border-b border-border/40 dark:border-white/5 space-y-4 md:space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter leading-none">Route <span className="text-primary">Monitor</span></h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-xl border-border/50 dark:border-white/5 bg-accent/20 dark:bg-white/[0.02] hover:bg-accent/30 dark:hover:bg-white/[0.05] transition-all" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-live-drivers'] })}>
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] px-1 opacity-70">Active Sector</p>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full h-14 bg-accent/20 dark:bg-white/[0.03] border-border/50 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-1 ring-primary/30 transition-all hover:bg-accent/30 dark:hover:bg-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin size={16} />
                  </div>
                  <SelectValue placeholder="Select a city" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card/90 border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl max-h-[400px]">
                <div className="p-3 sticky top-0 bg-background/90 backdrop-blur-md z-10 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={14} />
                    <Input 
                      placeholder="Chercher une zone..." 
                      className="h-10 text-[11px] font-bold bg-accent/20 dark:bg-white/[0.03] border-border/50 dark:border-white/5 rounded-xl pl-10 focus-visible:ring-primary/20"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {availableCities.map(city => (
                  <SelectItem 
                    key={city.name} 
                    value={city.name}
                    className="text-[12px] font-black uppercase py-4 px-4 hover:bg-accent/10 dark:hover:bg-white/5 rounded-xl transition-all m-1 focus:bg-accent/10 dark:focus:bg-white/5"
                  >
                    <div className="flex items-center justify-between w-full min-w-[240px]">
                      <span className={cn(selectedCity === city.name ? "text-primary" : "text-foreground/80 dark:text-white/80")}>{city.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                        <span className="text-[10px] font-black opacity-40 tabular-nums">
                          {city.drivers} UNITS
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search by driver or plate number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-accent/20 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-black uppercase tracking-widest focus:ring-1 ring-primary/30 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          
          {/* ALERTS SECTION */}
          {activeAlerts.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] px-1">Alertes prioritaires</p>
              {activeAlerts.map((alert, idx) => (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={idx}
                  className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-foreground flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-rose-900 uppercase">Driver {alert.driverName}</p>
                    <p className="text-[10px] font-bold text-rose-700 uppercase mt-0.5">{alert.trackingNumber} — Retard {alert.delayMin || '??'} min</p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[9px] font-black uppercase text-rose-600 hover:bg-rose-100 px-2"
                        onClick={() => setReassignModal({ orderId: alert.orderId, driverId: alert.driverId })}
                      >
                        Reassign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[9px] font-black uppercase text-rose-600 hover:bg-rose-100 px-2">Ignorer</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* DRIVERS LIST */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Driver Progress</p>
            {filteredLiveDrivers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 opacity-40">
                <Truck size={40} className="text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">No drivers available<br/>in this city</p>
              </div>
            ) : filteredLiveDrivers
              .map((driver: unknown) => {
                const isSelected = selectedDriverId === driver.id;
                const stats = isSelected ? selectedDriverStats : null;
                const cascade = isSelected ? selectedDriverCascade : null;

                return (
                  <motion.div
                    layout
                    key={driver.id}
                    onClick={() => handleDriverClick(driver.id)}
                    className={cn(
                      "group cursor-pointer rounded-[2rem] border transition-all duration-300 overflow-hidden",
                      isSelected 
                        ? "bg-white/[0.05] border-indigo-500/50 shadow-xl shadow-indigo-500/20 scale-[1.02]" 
                        : "bg-accent/10 border-border/40 hover:border-indigo-500/30"
                    )}
                  >
                    <div className="p-5 flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-accent/30 overflow-hidden border border-white/10">
                          {driver.avatar ? (
                            <img src={driver.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <User size={24} />
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          driver.driverStatus === 'ONLINE' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-black text-foreground uppercase truncate">
                            {driver.firstName} {driver.lastName}
                          </h4>
                          <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0">
                            {driver.completedStops || 0}/{driver.totalStops || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress 
                              value={((driver.completedStops || 0) / (driver.totalStops || 1)) * 100} 
                              className="h-1.5"
                            />
                          </div>
                          <p className="text-[10px] font-black text-muted-foreground">
                            {Math.round(((driver.completedStops || 0) / (driver.totalStops || 1)) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 border-t border-border/40 pt-4 bg-accent/10"
                        >
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase">Prochain Stop</p>
                              <p className="text-[11px] font-black text-foreground truncate">
                                {cascade?.nextStopAddress || 'Undefined'}
                              </p>
                              <p className="text-[10px] font-bold text-primary">
                                ETA: {cascade?.stops?.[1]?.eta ? format(new Date(cascade.stops[1].eta), 'HH:mm') : '--:--'}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase">COD Collected</p>
                              <p className="text-[11px] font-black text-emerald-600">{stats?.totalCodCollected || 0} MAD</p>
                              {stats?.slaViolations > 0 && (
                                <Badge variant="destructive" className="text-[8px] h-4 px-1.5 uppercase font-black">
                                  {stats.slaViolations} SLA DELAYS
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button 
                            className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDetailModal(true);
                            }}
                          >
                            View Full Details
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL: TIMELINE & STATS ──────────────────────────── */}
      <AnimatePresence>
        {showDetailModal && selectedDriverId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-accent/10 rounded-[2rem] shadow-2xl border border-border/40 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-border/40 bg-accent/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Truck size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                      {liveDrivers.find((d: unknown) => d.id === selectedDriverId)?.firstName} Route
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Active tour • {selectedDriverRoute?.stops?.length || 0} Stops
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-foreground">{selectedDriverStats?.slaRate || '100'}%</p>
                  <p className="text-[9px] font-black text-muted-foreground uppercase">SLA Compliance</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-0 relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-muted-foreground/20" />
                  
                  {selectedDriverRoute?.stops?.map((stop: unknown, idx: number) => {
                    const isCompleted = stop.status === 'PICKED_UP' || stop.status === 'DELIVERED';
                    const isCurrent = idx === selectedDriverCascade?.currentStopIndex;
                    const stopEta = selectedDriverCascade?.stops?.find((s: unknown) => s.orderId === stop.orderId && s.type === stop.type);
                    
                    return (
                      <div key={idx} className="relative pl-14 pb-8 group last:pb-0">
                        {/* Circle */}
                        <div className={cn(
                          "absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-card z-10",
                          isCompleted ? "bg-emerald-500" : isCurrent ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                        )} />
                        
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 h-4">
                                {stop.type === 'PICKUP' ? 'Pickup' : 'Delivery'}
                              </Badge>
                              <span className="text-[10px] font-bold text-muted-foreground">{stop.trackingNumber}</span>
                            </div>
                            <p className="text-sm font-black text-foreground uppercase">{stop.address || stop.deliveryAddress || stop.pickupAddress}</p>
                            {isCompleted ? (
                              <p className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Completed at {format(new Date(stop.completedAt || Date.now()), 'HH:mm')}
                              </p>
                            ) : (
                              <p className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock size={10} /> {stopEta ? `Estimated ${format(new Date(stopEta.eta), 'HH:mm')}` : 'Pending'}
                                {stopEta?.slaStatus === 'EXCEEDED' && <span className="text-rose-500 font-black ml-2 animate-pulse">(DELAY EXPECTED)</span>}
                              </p>
                            )}
                          </div>
                          
                          {isCurrent && (
                            <Badge className="bg-primary text-foreground text-[8px] font-black uppercase">In Progress</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Stats */}
              <div className="p-8 border-t border-border/40 bg-accent/10 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-lg font-black text-foreground">{selectedDriverStats?.totalDistance?.toFixed(1) || '--'} KM</p>
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Total Distance</p>
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{selectedDriverStats?.avgTimePerStop || '--'} MIN</p>
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Avg time / stop</p>
                </div>
                <div className="text-right">
                  <Button variant="ghost" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 h-12" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REASSIGN MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {reassignModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReassignModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-accent/10 rounded-[2rem] p-8 shadow-2xl border border-border/40"
            >
              <h3 className="text-xl font-black text-foreground uppercase mb-6">Reassign Order</h3>
              <p className="text-sm text-muted-foreground mb-6">Select a new driver to take over this delayed delivery.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar mb-8">
                {liveDrivers
                  .filter((d: unknown) => d.id !== reassignModal.driverId && d.status === 'ONLINE')
                  .map((driver: unknown) => (
                    <div
                      key={driver.id}
                      onClick={() => reassignMutation.mutate({ orderId: reassignModal.orderId, driverId: driver.id })}
                      className="p-4 rounded-2xl border border-border/40 hover:border-indigo-500/30 hover:bg-indigo-600/5 cursor-pointer flex items-center gap-4 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden">
                        {driver.avatar ? <img src={driver.avatar} alt="" /> : <User className="p-2 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-foreground uppercase">{driver.firstName} {driver.lastName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{driver.completedStops}/{driver.totalStops} missions</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  ))}
              </div>
              
              <Button variant="outline" className="w-full rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={() => setReassignModal(null)}>
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminRouteMonitor;
