import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, ExternalLink, MapPin,
  Banknote, MessageSquare, Navigation, Zap, PhoneCall, AlertCircle
} from 'lucide-react';
import { useActiveDelivery } from '@/hooks/useActiveDelivery';
import CargoMap from '@/components/common/CargoMap';
import { cn } from '@/lib/utils';
import { Order } from '@/types';

// ─────────────────── STEP 1: NAVIGATION MAP ──────────────────────────────────
const StepNavigation: React.FC<{
  order: Order | undefined;
  onArrived: () => void;
}> = ({ order, onArrived }) => {
  const navigate = useNavigate();
  // Provide default coordinates for Morocco so the map always renders
  const lat = order?.deliveryLat || 33.5731;
  const lng = order?.deliveryLng || -7.5898;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0A0A0A]">
      {/* Full-screen map */}
      <div className="flex-1 relative overflow-hidden">
        <CargoMap
          points={[{ id: 'dest', lat, lng, type: 'DELIVERY', label: 'DESTINATION' }]}
          height="100%" showRoute theme="dark" activePointId="dest"
          className="rounded-none border-none" />

        {/* Floating header */}
        <div className="absolute top-8 left-5 right-5 z-[900] flex justify-between items-center pointer-events-none">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-md bg-[#0A0A0A] border border-white/10 flex items-center justify-center pointer-events-auto hover:bg-white/5 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex gap-1 bg-[#0A0A0A] border border-white/10 p-1 rounded-md">
              <div className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
                1. Trajet
              </div>
              <div className="px-3 py-1.5 rounded-sm text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center">
                2. Sur Place
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="bg-[#0A0A0A] border-t border-white/10 p-6 pb-8 space-y-6 relative z-[900]">
        {/* Address + COD */}
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Destination</p>
            </div>
            <p className="text-sm font-bold text-white line-clamp-2">{order?.deliveryAddress || '—'}</p>
          </div>
          {(order?.codAmount ?? 0) > 0 && (
            <div className="text-right space-y-1 shrink-0">
              <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest">Collecte</p>
              <p className="text-xl font-black text-amber-500">{order?.codAmount} <span className="text-[10px] opacity-50">MAD</span></p>
            </div>
          )}
        </div>

        {/* Recipient contact row */}
        {(order?.receiverPhone || order?.customerPhone) && (
          <div className="flex gap-3">
            <a href={`tel:${order?.receiverPhone || order?.customerPhone}`}
              className="flex-1 h-10 bg-white/5 border border-white/10 rounded-md flex items-center justify-center gap-2 font-black text-[10px] text-white tracking-widest uppercase hover:bg-white/10 transition-all">
              <PhoneCall className="w-4 h-4 text-emerald-400" /> Appeler
            </a>
            <a href={`sms:${order?.receiverPhone || order?.customerPhone}`}
              className="flex-1 h-10 bg-white/5 border border-white/10 rounded-md flex items-center justify-center gap-2 font-black text-[10px] text-white tracking-widest uppercase hover:bg-white/10 transition-all">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> SMS
            </a>
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-3">
          <button onClick={() => navigate(`/driver/incident/${order?.id}`)}
            className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shrink-0">
            <AlertCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank')}
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-md font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-all">
            <ExternalLink className="w-4 h-4 text-indigo-400" /> Itinéraire
          </button>
          <button onClick={onArrived}
            className="flex-1 h-12 bg-indigo-600 text-white rounded-md font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
            <Navigation className="w-4 h-4" /> Arrivé
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────── STEP 2: ARRIVED ────────────────────────────────────────
const StepArrived: React.FC<{
  order: Order | undefined;
  orderId: string;
  onBack: () => void;
}> = ({ order, orderId, onBack }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-10 pb-4">
        <button onClick={onBack}
          className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-md">
            <div className="px-3 py-1.5 rounded-sm text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center">
              1. Trajet
            </div>
            <div className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
              2. Sur Place
            </div>
          </div>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-sm mx-auto w-full">
        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <MapPin className="w-10 h-10 text-white" />
        </motion.div>

        <div className="text-center space-y-3 w-full">
          <h2 className="text-2xl font-black uppercase tracking-widest">Vous êtes arrivé</h2>
          <div className="p-4 bg-white/5 rounded-md border border-white/10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Adresse de livraison</p>
            <p className="text-sm font-medium text-white leading-snug">{order?.deliveryAddress || '—'}</p>
          </div>
        </div>

        {(order?.codAmount ?? 0) > 0 && (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-md p-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
              <Banknote className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">À collecter (COD)</span>
            </div>
            <p className="text-4xl font-black text-amber-500">{order?.codAmount} <span className="text-sm opacity-60">MAD</span></p>
          </div>
        )}

        <div className="w-full space-y-3">
          <button 
            disabled={order?.status === 'DELIVERED'}
            onClick={() => navigate(`/driver/proof/${orderId}`)}
            className={cn(
              "w-full h-12 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              order?.status === 'DELIVERED' 
                ? "bg-emerald-500 text-white opacity-60 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}>
            {order?.status === 'DELIVERED' ? (
              <><CheckCircle2 className="w-4 h-4" /> Livraison Terminée</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Confirmer la Livraison</>
            )}
          </button>
          <button onClick={onBack}
            className="w-full h-10 bg-white/5 border border-white/10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-white/60 hover:bg-white/10 transition-all">
            <ChevronLeft className="w-4 h-4" /> Retour navigation
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────── STEP 3: SUCCESS ────────────────────────────────────────
const StepSuccess: React.FC<{
  order: Order | undefined;
  orderId: string;
}> = ({ order, orderId }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0A0A0A] text-white px-6 space-y-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}
        className="w-24 h-24 rounded-md bg-emerald-600 flex items-center justify-center shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>
      <div className="text-center space-y-2">
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-2xl font-black uppercase tracking-widest text-white">Livraison Réussie!</motion.h2>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-slate-400 text-xs">La preuve a été soumise avec succès.</motion.p>
      </div>
      {(order?.driverEarnings ?? 0) > 0 && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-6 text-center w-full max-w-xs">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
            <Zap className="w-4 h-4" />
            <p className="text-[9px] font-black uppercase tracking-widest">Commission Gagnée</p>
          </div>
          <p className="text-3xl font-black text-emerald-400">+{order?.driverEarnings} <span className="text-sm opacity-50">MAD</span></p>
        </motion.div>
      )}
      <div className="w-full max-w-xs space-y-3">
        <button onClick={() => navigate('/driver/orders')}
          className="w-full h-12 bg-indigo-600 text-white rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">
          Nouvelle Mission
        </button>
        <button onClick={() => navigate('/driver/dashboard')}
          className="w-full h-10 bg-white/5 border border-white/10 rounded-md font-black text-[10px] uppercase tracking-widest text-white/50 hover:bg-white/10 transition-all">
          Tableau de Bord
        </button>
      </div>
    </div>
  );
};

// ─────────────────── MAIN ────────────────────────────────────────────────────
const DeliveryFlow: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useActiveDelivery(orderId);

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem(`delivery_step_${orderId}`);
    if (saved) return parseInt(saved) as 1 | 2 | 3;
    if (order?.status === 'ARRIVED') return 2;
    if (order?.status === 'DELIVERED') return 3;
    return 1;
  });

  useEffect(() => {
    if (orderId) {
      localStorage.setItem(`delivery_step_${orderId}`, step.toString());
    }
  }, [step, orderId]);

  const handleArrived = async () => {
    // ARRIVED is not a valid backend status — just advance the UI step.
    // The DELIVERED transition happens on proof submission.
    setStep(2);
  };

  if (isLoading) return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-600/20" />
      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white overflow-hidden relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {step === 1 && (
          <motion.div key="nav" 
            initial={{ opacity: 0, x: '-50%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '-50%', filter: 'blur(10px)' }} 
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            className="absolute inset-0">
            <StepNavigation order={order} onArrived={handleArrived} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="arrived" 
            initial={{ opacity: 0, x: '50%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '50%', filter: 'blur(10px)' }} 
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            className="absolute inset-0">
            <StepArrived order={order} orderId={orderId || order?.id || ''} onBack={() => setStep(1)} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="success" 
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }} 
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
            transition={{ type: 'spring', bounce: 0.2, duration: 0.7 }}
            className="absolute inset-0">
            <StepSuccess order={order} orderId={orderId || order?.id || ''} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryFlow;



