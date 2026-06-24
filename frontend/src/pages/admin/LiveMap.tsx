import React, { useState, useEffect } from 'react';
import { 
  Truck, Star, Activity, MapPin, Navigation, 
  Globe, Search, Filter, Layers, Zap,
  Crosshair, Shield, CheckCircle2, AlertCircle,
  MoreHorizontal, ChevronRight, X, Maximize2,
  Compass, Satellite, Radar, Wifi, Signal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const LiveMap = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Mock data for the HUD
  const drivers = [
    { id: '1', name: 'Yassine El-Amrani', status: 'ON_MISSION', lat: '33.5731', lng: '-7.5898', load: 85, color: 'indigo' },
    { id: '2', name: 'Sami Al-Fassi', status: 'AVAILABLE', lat: '33.5892', lng: '-7.6015', load: 0, color: 'emerald' },
    { id: '3', name: 'Omar Bennani', status: 'ON_MISSION', lat: '33.5521', lng: '-7.6321', load: 92, color: 'blue' },
    { id: '4', name: 'Karim Tazi', status: 'ISSUE', lat: '33.5910', lng: '-7.5432', load: 45, color: 'rose' },
  ];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden font-sans selection:bg-primary/30">
      {/* Background Map Placeholder */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=100&w=2400')] bg-cover bg-center grayscale opacity-20 transition-all duration-1000 scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-[#020617]/80" />
        
        {/* Dynamic Scan Lines / Radar Effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/10 rounded-full animate-[ping_10s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-indigo-500/5 rounded-full animate-[ping_15s_linear_infinite]" />
      </div>

      {/* Driver Markers (UI Only Placeholder) */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {drivers.map((driver, idx) => (
          <motion.div
            key={driver.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.2 }}
            style={{ 
              top: `${20 + idx * 15}%`, 
              left: `${30 + idx * 12}%` 
            }}
            className="absolute cursor-pointer group"
            onClick={() => setSelectedDriver(driver.id)}
          >
             <div className="relative">
                {/* Status Pulse */}
                <div className={cn(
                  "absolute -inset-4 rounded-full animate-ping opacity-20",
                  driver.status === 'ON_MISSION' ? "bg-indigo-500" : 
                  driver.status === 'AVAILABLE' ? "bg-emerald-500" : "bg-rose-500"
                )} />
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-2xl relative z-10 transition-transform group-hover:scale-125",
                  driver.status === 'ON_MISSION' ? "bg-indigo-600" : 
                  driver.status === 'AVAILABLE' ? "bg-emerald-600" : "bg-rose-600"
                )}>
                   <Truck className="w-4 h-4 text-foreground" />
                </div>
                
                {/* Marker Info Label */}
                <div className="absolute top-0 left-10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                   <div className="bg-background/90 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-2 whitespace-nowrap">
                      <p className="text-[10px] font-black uppercase text-foreground tracking-widest">{driver.name}</p>
                      <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-[0.2em] mt-0.5">
                        Status: <span className={cn(
                          driver.status === 'ON_MISSION' ? "text-indigo-400" : 
                          driver.status === 'AVAILABLE' ? "text-emerald-400" : "text-rose-400"
                        )}>{driver.status.replace('_', ' ')}</span>
                      </p>
                   </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Top HUD: Global Pulse */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-6">
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-border/40 rounded-[32px] p-2 flex items-center justify-between shadow-2xl">
           <div className="flex items-center gap-6 px-6">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em]">Missions Active</span>
                 <p className="text-xl font-black text-foreground"><AnimatedCounter value={142} /></p>
              </div>
              <div className="w-px h-10 bg-accent/30" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em]">Fleet Deployment</span>
                 <p className="text-xl font-black text-emerald-400"><AnimatedCounter value={98} />%</p>
              </div>
              <div className="w-px h-10 bg-accent/30" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em]">Critical Latency</span>
                 <p className="text-xl font-black text-rose-500">2.4<span className="text-xs">ms</span></p>
              </div>
           </div>
           
           <div className="flex items-center gap-2 pr-2">
              <div className="px-4 py-2 rounded-[18px] bg-indigo-600/10 border border-indigo-500/20 flex items-center gap-2">
                 <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Live Stream</span>
              </div>
              <Button size="icon" className="h-12 w-12 rounded-[18px] bg-accent/30 hover:bg-white/10 text-foreground border border-border/40">
                 <Layers className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </div>

      {/* Left HUD: Mission Control */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-8 top-32 bottom-8 z-30 w-80 pointer-events-auto"
          >
            <Card className="h-full border-none bg-white/[0.02] backdrop-blur-3xl rounded-[40px] p-8 border border-border/40 shadow-2xl flex flex-col gap-10 overflow-hidden relative">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Radar className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/40">Mission Control</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative group">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                       <Input 
                         placeholder="Trace Mission ID..." 
                         className="h-14 pl-14 pr-6 rounded-3xl border-border/40 bg-accent/30 focus:border-indigo-500/50 transition-all font-bold text-sm"
                       />
                    </div>
                    
                    <div className="space-y-4">
                       <StatusMetric label="Transit Priority" value={42} color="indigo" />
                       <StatusMetric label="Validated Ready" value={86} color="emerald" />
                       <StatusMetric label="Signal Disrupt" value={12} color="rose" />
                    </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">Active Streams</h3>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-3xl bg-white/[0.02] border border-border/40 hover:bg-accent/30 transition-all group cursor-pointer">
                       <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">CL-{842 + i}</span>
                          <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Sector 0{i}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                             <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase tracking-tight text-foreground/80">Cargo Delivery</p>
                             <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-0.5">3.2km to Drop</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="relative z-10">
                  <Button className="w-full h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-foreground font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all">
                     Global Fleet Reset
                  </Button>
               </div>

               {/* Design Glow */}
               <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-600/10 blur-[60px] rounded-full" />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right HUD: Live Registry */}
      <div className="absolute right-8 top-32 bottom-8 z-30 w-80 pointer-events-auto flex flex-col gap-6">
         <Card className="flex-1 border-none bg-white/[0.02] backdrop-blur-3xl rounded-[40px] p-8 border border-border/40 shadow-2xl overflow-hidden flex flex-col relative">
            <div className="relative z-10 mb-8 flex items-center justify-between">
               <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/40">Unit Registry</h2>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 space-y-2">
               {drivers.map((driver) => (
                 <div 
                   key={driver.id} 
                   onClick={() => setSelectedDriver(driver.id)}
                   className={cn(
                     "p-4 rounded-[24px] border transition-all cursor-pointer group flex items-center justify-between",
                     selectedDriver === driver.id 
                      ? "bg-indigo-600 border-indigo-500 shadow-xl" 
                      : "bg-white/[0.02] border-border/40 hover:bg-accent/30"
                   )}
                 >
                    <div className="flex items-center gap-4">
                       <Avatar className="h-10 w-10 rounded-xl border border-border/40 group-hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-white/10 text-[10px] font-black">
                             {driver.name.charAt(0)}
                          </AvatarFallback>
                       </Avatar>
                       <div>
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-tight transition-colors",
                            selectedDriver === driver.id ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                          )}>{driver.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={cn(
                               "w-1.5 h-1.5 rounded-full",
                               driver.status === 'ON_MISSION' ? "bg-indigo-400" : 
                               driver.status === 'AVAILABLE' ? "bg-emerald-400" : "bg-rose-400"
                             )} />
                             <span className={cn(
                               "text-[8px] font-black uppercase tracking-widest",
                               selectedDriver === driver.id ? "text-foreground/60" : "text-foreground/20"
                             )}>{driver.status.replace('_', ' ')}</span>
                          </div>
                       </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all",
                      selectedDriver === driver.id ? "text-foreground" : "text-foreground/10 group-hover:translate-x-1 group-hover:text-foreground"
                    )} />
                 </div>
               ))}
            </div>

            <div className="relative z-10 mt-8">
               <div className="p-6 rounded-[24px] bg-indigo-600/20 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Network Health</span>
                     <Signal className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[92%] rounded-full" />
                     </div>
                     <span className="text-[10px] font-black text-foreground">92%</span>
                  </div>
               </div>
            </div>
         </Card>
      </div>

      {/* Floating Controls: Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
         <div className="bg-white/[0.02] backdrop-blur-3xl border border-border/40 rounded-full p-2 flex items-center gap-2 shadow-2xl">
            <Button size="icon" className="h-12 w-12 rounded-full bg-accent/30 hover:bg-white/10 text-foreground border border-border/40">
               <Filter className="w-5 h-5" />
            </Button>
            <div className="w-px h-8 bg-accent/30 mx-2" />
            <Button size="icon" className="h-12 w-12 rounded-full bg-accent/30 hover:bg-white/10 text-foreground border border-border/40">
               <Maximize2 className="w-5 h-5" />
            </Button>
            <Button size="icon" className="h-12 w-12 rounded-full bg-accent/30 hover:bg-white/10 text-foreground border border-border/40">
               <Compass className="w-5 h-5" />
            </Button>
            <div className="w-px h-8 bg-accent/30 mx-2" />
            <Button className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-foreground font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
               Scan Sector
            </Button>
         </div>
      </div>

      {/* Bottom Information HUD */}
      <div className="absolute bottom-10 left-10 z-30">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-border/40 flex items-center justify-center">
                  <Satellite className="w-6 h-6 text-foreground/40" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.3em]">Satellite Feed</p>
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">Geo-Sync: Stable</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatusMetric = ({ label, value, color }: any) => (
  <div className="space-y-2">
     <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-foreground">{value} Units</span>
     </div>
     <div className="h-1 rounded-full bg-accent/30 overflow-hidden">
        <div className={cn(
          "h-full rounded-full",
          color === 'indigo' ? "bg-indigo-600" : color === 'emerald' ? "bg-emerald-600" : "bg-rose-600"
        )} style={{ width: `${(value / 150) * 100}%` }} />
     </div>
  </div>
);

export default LiveMap;
