import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Navigation, 
  Activity,
  Globe,
  Building2,
  Search,
  RefreshCw,
  Filter,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import adminService from '@/services/api/adminService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CargoMap, { MapPoint, HeatmapPoint, CoverageGap } from "../../components/common/CargoMap";

export default function GlobalLiveMap() {
  const [center] = useState<[number, number]>([33.5731, -7.5898]); // Casablanca
  const [agencies, setAgencies] = useState<unknown[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [drivers, setDrivers] = useState<unknown[]>([]);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mapMode, setMapMode] = useState<'LIVE' | 'ZONES'>('LIVE');
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [coverageGaps, setCoverageGaps] = useState<CoverageGap[]>([]);

  const fetchAgencies = async () => {
    try {
      const data = await adminService.getAllAgencies(0, 100);
      setAgencies(data.content || []);
    } catch (error) {
      console.error("Failed to fetch agencies:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const agencyFilter = selectedAgency === 'all' ? undefined : selectedAgency;
      const [driversData, ordersData] = await Promise.all([
        adminService.getGlobalLiveDrivers(agencyFilter),
        adminService.getGlobalLiveOrders(agencyFilter)
      ]);
      setDrivers(driversData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to fetch live data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAgency]);

  useEffect(() => {
    if (orders.length > 0 || drivers.length > 0) {
      // Grid-based clustering for zones
      const gridSize = 0.01; // approx 1.1km
      const grid: Record<string, { lat: number, lng: number, demand: number, supply: number }> = {};

      orders.forEach(o => {
        const lat = o.deliveryLat || o.deliveryLatitude;
        const lng = o.deliveryLng || o.deliveryLongitude;
        if (lat && lng) {
          const x = Math.floor(lat / gridSize);
          const y = Math.floor(lng / gridSize);
          const key = `${x},${y}`;
          if (!grid[key]) grid[key] = { lat: (x + 0.5) * gridSize, lng: (y + 0.5) * gridSize, demand: 0, supply: 0 };
          grid[key].demand += 1;
        }
      });

      drivers.forEach(d => {
        const lat = d.latitude || d.currentLat;
        const lng = d.longitude || d.currentLng;
        if (lat && lng) {
          const x = Math.floor(lat / gridSize);
          const y = Math.floor(lng / gridSize);
          const key = `${x},${y}`;
          if (!grid[key]) grid[key] = { lat: (x + 0.5) * gridSize, lng: (y + 0.5) * gridSize, demand: 0, supply: 0 };
          grid[key].supply += 1;
        }
      });

      const hPoints: HeatmapPoint[] = [];
      const cGaps: CoverageGap[] = [];

      Object.values(grid).forEach(cell => {
        if (cell.demand > 0) {
          hPoints.push({ lat: cell.lat, lng: cell.lng, intensity: cell.demand });
        }
        if (cell.demand > cell.supply) {
          cGaps.push({ 
            lat: cell.lat, 
            lng: cell.lng, 
            demand: cell.demand, 
            supply: cell.supply,
            radius: 400 + (cell.demand - cell.supply) * 150
          });
        }
      });

      setHeatmapPoints(hPoints);
      setCoverageGaps(cGaps);
    }
  }, [orders, drivers]);

  const filteredDrivers = drivers.filter(d => 
    (d.firstName?.toLowerCase().includes(search.toLowerCase()) || 
     d.lastName?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDriverFocus = (driver: unknown) => {
    const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
    setSearch(fullName);
    toast.info(`Filtered map to ${fullName}`);
  };

  const handleRebalance = async () => {
    if (coverageGaps.length === 0) {
      toast.success("Network is balanced. No gaps detected.");
      return;
    }

    try {
      const topGap = [...coverageGaps].sort((a, b) => (b.demand - b.supply) - (a.demand - a.supply))[0];
      await adminService.broadcastNotification({
        title: "High Demand Alert",
        message: `High demand detected in Sector ${topGap.lat.toFixed(2)}, ${topGap.lng.toFixed(2)}. Idle drivers please rebalance to this zone.`,
        targetRoles: ['DRIVER']
      });
      toast.success("Rebalance broadcast sent to all drivers!");
    } catch (error) {
      toast.error("Failed to send rebalance alert.");
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 h-[calc(100vh-120px)] flex flex-col pb-4 md:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-600 border-none px-3 py-0.5 text-[8px] font-black uppercase tracking-widest">
              Live Monitoring Hub
            </Badge>
          </div>
          <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground dark:text-foreground uppercase leading-none italic">
            Global <span className="text-indigo-600">Live</span> Map
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-accent/10 backdrop-blur-3xl p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-border/40 w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex bg-white/5 p-1 rounded-lg">
                <Button 
                    onClick={() => setMapMode('LIVE')} 
                    variant="ghost"
                    className={cn(
                      "h-8 md:h-10 px-3 md:px-4 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                      mapMode === 'LIVE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted-foreground/40'
                    )}
                >
                    Live
                </Button>
                <Button 
                    onClick={() => setMapMode('ZONES')} 
                    variant="ghost"
                    className={cn(
                      "h-8 md:h-10 px-3 md:px-4 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                      mapMode === 'ZONES' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted-foreground/40'
                    )}
                >
                    Zones
                </Button>
            </div>
            
            <div className="h-5 md:h-6 w-px bg-white/5 mx-1 hidden md:block" />
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger className="w-[120px] md:w-[180px] h-8 md:h-10 rounded-lg md:rounded-xl border-none bg-white/5 font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                    <SelectValue placeholder="Agency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl md:rounded-2xl border-white/10 bg-[#0f172a] text-white">
                    <SelectItem value="all" className="font-bold text-[8px] md:text-[9px] uppercase">All Agencies</SelectItem>
                    {agencies.map(a => (
                        <SelectItem key={a.id} value={a.id} className="font-bold text-[8px] md:text-[9px] uppercase">{a.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button 
                onClick={fetchData} 
                variant="ghost" 
                className="rounded-lg md:rounded-xl h-8 md:h-10 w-8 md:w-10 p-0 text-muted-foreground/40 hover:text-indigo-600 hover:bg-white/5"
            >
                <RefreshCw className={cn("w-3.5 h-3.5 md:w-4 md:h-4", loading && "animate-spin text-indigo-500")} />
            </Button>
        </div>
      </div>

      <div className="flex-1 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-border/40 dark:border-border/60 shadow-2xl relative">
        <CargoMap
          mode={mapMode}
          heatmapPoints={heatmapPoints}
          coverageGaps={coverageGaps}
          points={[
            ...filteredDrivers.map(d => ({
              id: d.id,
              lat: (d.latitude || d.currentLat) ?? 33.5731,
              lng: (d.longitude || d.currentLng) ?? -7.5898,
              type: 'DRIVER' as const,
              label: d.firstName ? `${d.firstName} ${d.lastName || ''}` : d.name,
              data: d
            })),
            ...orders.filter(o => (o.deliveryLat || o.deliveryLatitude) && (o.deliveryLng || o.deliveryLongitude)).map(o => ({
              id: o.id,
              lat: (o.deliveryLat || o.deliveryLatitude)!,
              lng: (o.deliveryLng || o.deliveryLongitude)!,
              type: 'DELIVERY' as const,
              label: o.trackingNumber,
              trackingNumber: o.trackingNumber,
              data: o
            }))
          ]}
          center={center}
          zoom={12}
          className="rounded-none border-none"
        />

        {/* Map Overlay Stats: Desktop Only */}
        <div className="absolute top-8 left-8 z-[1000] w-72 space-y-4 hidden lg:block">
           <Card className="border-none shadow-2xl bg-[#0f172a]/80 backdrop-blur-3xl rounded-[2rem] overflow-hidden border border-white/5">
              <CardHeader className="p-6 border-b border-white/5">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" /> Network Matrix ({filteredDrivers.length})
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                 <div className="space-y-1">
                    {filteredDrivers.map(d => (
                       <button onClick={() => handleDriverFocus(d)} key={d.id} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${d.availability === 'AVAILABLE' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-indigo-500 shadow-indigo-500/50'}`} />
                             <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{d.firstName} {d.lastName}</p>
                                <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest mt-0.5">{d.agencyName || 'Independent'}</p>
                             </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                       </button>
                    ))}
                    {filteredDrivers.length === 0 && (
                        <div className="py-12 text-center">
                            <Truck className="w-8 h-8 mx-auto mb-3 text-white/5" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20">No units active</p>
                        </div>
                    )}
                 </div>
              </CardContent>
           </Card>

            <div className="relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
               <Input 
                 placeholder="Search unit ID..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-2xl pl-12 border-white/5 shadow-2xl h-14 font-black text-xs text-white focus:ring-indigo-500/20" 
               />
            </div>
        </div>

        {/* Legend: Responsive */}
        <div className="absolute bottom-6 md:bottom-10 left-4 right-4 md:top-8 md:right-8 md:bottom-auto md:left-auto z-[1000] flex flex-col gap-3 md:gap-4">
           <div className="bg-[#0f172a]/90 backdrop-blur-3xl text-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-2xl space-y-3 md:space-y-4 border border-white/10 flex flex-row md:flex-col items-center md:items-start justify-around md:justify-start gap-3 md:gap-4 md:min-w-[200px]">
              {mapMode === 'LIVE' ? (
                <div className="flex flex-row md:flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300">Idle</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300">Tasked</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-row md:flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300">Hot</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-amber-500 border-dashed rounded-full" />
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300">Gap</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 md:gap-3">
                 <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                 <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-300">Order</span>
              </div>
           </div>

           {mapMode === 'ZONES' && (
             <Button 
               onClick={handleRebalance}
               className="bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-2xl h-14 shadow-2xl group overflow-hidden relative"
             >
               <Zap className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
               <span className="font-black text-[10px] uppercase tracking-widest">Proactive Rebalance</span>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
             </Button>
           )}
        </div>
      </div>
    </div>
  );
}
