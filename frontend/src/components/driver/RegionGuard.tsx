/**
 * RegionGuard.tsx — Regional Access Security
 * Blocks access if driver is outside Northern Morocco.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinOff, ShieldAlert, Navigation, Lock, Globe, RefreshCcw } from 'lucide-react';
import { isInsideNorthMorocco, REGION_NAME } from '@/utils/regionUtils';
import { cn } from '@/lib/utils';

interface RegionGuardProps {
  children: React.ReactNode;
}

const RegionGuard: React.FC<RegionGuardProps> = ({ children }) => {
  const [status, setStatus] = useState<'LOADING' | 'AUTHORIZED' | 'DENIED'>('LOADING');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const checkLocation = () => {
    setStatus('LOADING');
    if (!navigator.geolocation) {
      setStatus('DENIED');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // Development bypass or Northern Morocco check
        const isDev = process.env.NODE_ENV === 'development';
        const isBypass = localStorage.getItem('CL_BYPASS_REGION') === 'true';

        if (isDev || isBypass || isInsideNorthMorocco(latitude, longitude)) {
          setStatus('AUTHORIZED');
        } else {
          setStatus('DENIED');
        }
      },
      () => {
        // Fallback for dev if geolocation fails
        if (process.env.NODE_ENV === 'development') {
          setStatus('AUTHORIZED');
        } else {
          setStatus('DENIED');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    checkLocation();
  }, []);

  if (status === 'LOADING') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#0A0A0A] z-[10000] flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="relative mb-10">
          <div className="w-32 h-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="text-primary animate-pulse" size={40} />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Vérification de Zone</h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
            Sécurisation de l'accès à la plateforme CargoLink...
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-primary/5 blur-[50px] rounded-full" />
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full" />
      </div>
    );
  }

  if (status === 'DENIED') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#050505] z-[10000] flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden">
        {/* Immersive background glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-[48px] p-10 space-y-10 max-w-md w-full shadow-2xl shadow-black/5 relative z-10"
        >
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-full h-full bg-rose-500/10 rounded-[28px] flex items-center justify-center border border-rose-500/20">
              <Lock size={40} className="text-rose-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
              Accès Restreint
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-white/40 leading-relaxed px-4">
              CargoLink est actuellement exclusif à la région du <span className="text-rose-500 font-black">Nord du Maroc</span>.
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-black/40 rounded-[32px] border border-slate-100 dark:border-white/5 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <MapPinOff size={16} className="text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position Actuelle</p>
                <p className="text-xs font-bold text-slate-600 dark:text-white/60">Hors de la zone de service</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Navigation size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone Autorisée</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">{REGION_NAME}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={checkLocation}
            className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          >
            <RefreshCcw size={16} />
            Réessayer la Localisation
          </button>

          {/* Developer Bypass Button */}
          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <button 
              onClick={() => {
                localStorage.setItem('CL_BYPASS_REGION', 'true');
                setStatus('AUTHORIZED');
              }}
              className="w-full h-12 bg-indigo-500/10 text-indigo-500 rounded-[20px] font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all mt-4"
            >
              <ShieldAlert size={14} />
              Bypass Région (Dev Mode)
            </button>
          )}
          
          <p className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-4">
            Assurez-vous que le GPS est activé
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RegionGuard;

