import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { cn } from '@/lib/utils';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { queueCount, isReplaying } = useOfflineQueue();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showBanner = !isOnline || queueCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] px-6 py-3 flex items-center justify-between shadow-2xl backdrop-blur-md transition-colors duration-500",
            !isOnline 
                ? "bg-rose-500/95 text-white" 
                : "bg-amber-500/95 text-white"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              {!isOnline ? (
                <WifiOff className="w-5 h-5" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            
            <div className="flex flex-col">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] leading-none mb-1">
                {!isOnline ? "📡 Mode Hors Ligne" : "🔄 Synchronisation en cours"}
              </p>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
                {!isOnline 
                  ? "Vos actions seront synchronisées au retour de la connexion" 
                  : "Traitement des actions en attente..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {queueCount > 0 && (
              <div className="px-3 py-1 bg-white/20 rounded-full border border-white/20 flex items-center gap-2">
                <span className="text-[10px] font-black">{queueCount}</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Actions</span>
              </div>
            )}
            
            {isReplaying && (
              <RefreshCw className="w-4 h-4 animate-spin opacity-60" />
            )}
          </div>

          {/* Progress bar for background effect */}
          <motion.div 
            className="absolute bottom-0 left-0 h-0.5 bg-white/30"
            initial={{ width: 0 }}
            animate={isReplaying ? { width: '100%' } : { width: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
