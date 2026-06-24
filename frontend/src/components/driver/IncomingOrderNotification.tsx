import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Truck, 
  Clock, 
  DollarSign, 
  X, 
  Check, 
  Navigation,
  Package,
  AlertCircle,
  Zap,
  Weight,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface IncomingOrderNotificationProps {
  order: any;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  timeoutSeconds?: number;
  variant?: 'fullscreen' | 'sheet';
}

const IncomingOrderNotification: React.FC<IncomingOrderNotificationProps> = ({
  order,
  onAccept,
  onReject,
  timeoutSeconds = 30,
  variant = 'fullscreen'
}) => {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [progress, setProgress] = useState(100);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sound & Vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    // Play notification sound
    const audio = new Audio('/notification-alert.mp3');
    audio.loop = true;
    audio.play().catch(e => console.log('Audio play failed', e));
    audioRef.current = audio;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(order.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const progressTimer = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - (100 / (timeoutSeconds * 10))));
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [order.id, onReject, timeoutSeconds]);

  if (!order) return null;

  const isFullscreen = variant === 'fullscreen';

  const Content = (
    <div className={cn(
      "flex flex-col h-full w-full mx-auto font-sans relative",
      isFullscreen ? "p-6 md:p-8 max-w-2xl" : "p-8"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[20px] bg-primary flex items-center justify-center shadow-[0_8px_20px_rgba(var(--primary-rgb),0.3)] animate-bounce-slow">
              <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nouvelle Mission</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">{order.trackingNumber || 'Mission de Livraison'}</p>
          </div>
        </div>
        
        <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-slate-100 dark:text-white/5"
                />
                <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175.93}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 175.93 * (1 - progress / 100) }}
                    className={cn(
                        "transition-colors duration-300",
                        timeLeft < 10 ? "text-rose-500" : "text-primary"
                    )}
                />
            </svg>
            <div className={cn(
                "absolute inset-0 flex items-center justify-center text-xl font-black tabular-nums",
                timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-slate-900 dark:text-white"
            )}>
                {timeLeft}
            </div>
        </div>
      </div>

      {/* Map Preview Container */}
      <div className={cn(
        "rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl relative",
        isFullscreen ? "flex-1 min-h-[300px]" : "h-48 mb-6"
      )}>
         <MapContainer 
          center={[order.pickupLat || 33.5731, order.pickupLng || -7.5898]} 
          zoom={12} 
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
         >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" className="dark:hidden" />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" className="hidden dark:block" />
            
            {order.pickupLat && order.pickupLng && (
              <Marker position={[order.pickupLat, order.pickupLng]} />
            )}
            {order.deliveryLat && order.deliveryLng && (
              <Marker position={[order.deliveryLat, order.deliveryLng]} />
            )}
            
            {order.pickupLat && order.deliveryLat && (
              <Polyline 
                positions={[[order.pickupLat, order.pickupLng], [order.deliveryLat, order.deliveryLng]]} 
                pathOptions={{ color: 'hsl(var(--primary))', weight: 5, dashArray: '1, 10', lineCap: 'round' }}
              />
            )}
         </MapContainer>
         
         {/* Stats Overlay */}
         <div className="absolute top-4 left-4 right-4 flex gap-3">
              <div className="flex-1 bg-white/90 dark:bg-black/80 backdrop-blur-xl p-3 rounded-2xl border border-white dark:border-white/10 shadow-xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">Gain</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{(order.driverEarnings || order.earnings || 0).toFixed(2)} MAD</p>
                  </div>
              </div>
              <div className="flex-1 bg-white/90 dark:bg-black/80 backdrop-blur-xl p-3 rounded-2xl border border-white dark:border-white/10 shadow-xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">Distance</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{(order.distance || 0).toFixed(1)} KM</p>
                  </div>
              </div>
         </div>
      </div>

      {/* Details Section */}
      <div className={cn("mt-8 space-y-6", !isFullscreen && "mt-0")}>
          <div className="space-y-6 relative">
              <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500 via-primary to-primary/30" />
              
              <div className="flex items-start gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-black border-[6px] border-emerald-500 shrink-0 shadow-lg z-10" />
                  <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ramassage</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{order.pickupAddress || 'Adresse de ramassage'}</p>
                  </div>
              </div>

              <div className="flex items-start gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-black border-[6px] border-primary shrink-0 shadow-lg z-10" />
                  <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Livraison</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{order.deliveryAddress || 'Adresse de livraison'}</p>
                  </div>
              </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
              {order.codAmount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 font-black text-[9px] uppercase tracking-wider">
                      <DollarSign size={12} className="animate-pulse" /> COD: {order.codAmount} MAD
                  </div>
              )}
              {order.urgent && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 font-black text-[9px] uppercase tracking-wider">
                      <Zap size={12} className="fill-current" /> Urgent
                  </div>
              )}
              {order.heavy && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-500 font-black text-[9px] uppercase tracking-wider">
                      <Weight size={12} /> Colis Lourd
                  </div>
              )}
          </div>
      </div>

      {/* Action Buttons */}
      <div className={cn("mt-auto pt-10 flex gap-4", !isFullscreen && "pt-6")}>
          <Button 
              onClick={() => onReject(order.id)}
              variant="outline"
              className="flex-1 h-16 rounded-[20px] border-slate-200 dark:border-white/10 font-black uppercase text-xs tracking-[0.2em] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
              <X className="w-5 h-5 mr-2" /> Ignorer
          </Button>
          <Button 
              onClick={() => onAccept(order.id)}
              className="flex-[2.5] h-16 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/40 transition-all active:scale-95 group"
          >
              <Check className="w-6 h-6 mr-3 group-hover:scale-125 transition-transform" /> Accepter la Mission
          </Button>
      </div>

      {/* Footer Warning */}
      {isFullscreen && (
          <div className="mt-6 flex items-center justify-center gap-3 py-3 px-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500/80 uppercase tracking-tight">Répondez rapidement pour sécuriser cette mission</p>
          </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={isFullscreen ? { opacity: 0, scale: 0.9, y: 100 } : { y: '100%' }}
        animate={isFullscreen ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
        exit={isFullscreen ? { opacity: 0, scale: 0.9, y: 100 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed z-[9999] bg-white dark:bg-[#050505] overflow-hidden shadow-2xl",
          isFullscreen 
            ? "inset-0 flex flex-col" 
            : "bottom-0 left-0 right-0 rounded-t-[40px] border-t border-slate-200 dark:border-white/10 max-w-2xl mx-auto"
        )}
      >
        {isFullscreen && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/10 blur-[100px] pointer-events-none" />}
        {!isFullscreen && <div className="w-12 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mx-auto mt-4 shrink-0" />}
        {Content}
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingOrderNotification;
