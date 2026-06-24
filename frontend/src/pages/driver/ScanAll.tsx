/**
 * ScanAll.tsx
 * Spec: driver-ui-prompt-complet.md — PAGE 9 — SCAN CENTER (Batch Mode)
 *
 * Zones:
 *  1. Header HUD (dot, Batch Processing Unit, Scan Center)
 *  2. Status Hub (Sélecteur: Transit, Collecté, Livré, Échoué)
 *  3. Input Terminal (Search + Camera)
 *  4. Results Queue (Liste avec états OK/ERROR/PENDING)
 *  5. Floating Action (Confirmer si valides)
 */

import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, QrCode, Zap, Layers, CheckCircle2, XCircle,
  ScanLine, Search, Camera, Loader2, Package, AlertCircle, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/api/orderService';
import QRScanner from '@/components/orders/QRScanner';

// ── Feedback Helpers ────────────────────────────────────────────────────────
const triggerFeedback = (success: boolean) => {
  // Audio
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }

  // Haptic
  if ("vibrate" in navigator) {
    if (success) navigator.vibrate(50);
    else navigator.vibrate([100, 50, 100]);
  }
};

// ── Status Config ───────────────────────────────────────────────────────────
type LifecycleState = 'ON_THE_WAY' | 'PICKED_UP' | 'DELIVERED' | 'FAILED';

const LIFECYCLE_CONFIG: Record<LifecycleState, { label: string; icon: any; color: string; bg: string; hex: string }> = {
  ON_THE_WAY: { label: 'Transit',  icon: Zap,          color: 'text-blue-500',   bg: 'bg-blue-500', hex: '#3B82F6' },
  PICKED_UP:  { label: 'Collecté', icon: Layers,       color: 'text-amber-500',  bg: 'bg-amber-500', hex: '#F59E0B' },
  DELIVERED:  { label: 'Livré',    icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500', hex: '#10B981' },
  FAILED:     { label: 'Échoué',   icon: XCircle,      color: 'text-rose-500',    bg: 'bg-rose-500', hex: '#F43F5E' },
};

type ScanItem = {
  trackingNumber: string;
  status: 'OK' | 'ERROR' | 'PENDING';
  error?: string;
  id?: string;
};

// ── Page ────────────────────────────────────────────────────────────────────
const ScanAll: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  React.useEffect(() => {
    if (isAuthenticated && !isDriver) {
      toast.error('Accès réservé aux livreurs');
      navigate('/login');
    }
  }, [isAuthenticated, isDriver, navigate]);

  const [selectedStatus, setSelectedStatus] = useState<LifecycleState>('ON_THE_WAY');
  const [scanned,        setScanned]        = useState<ScanItem[]>([]);
  const [inputValue,     setInputValue]     = useState('');
  const [isScannerOpen,  setScannerOpen]    = useState(false);
  const [isProcessing,   setIsProcessing]   = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (tracking: string) => {
      const order = await orderService.getOrderByTracking(tracking);
      if (!order) throw new Error('Commande introuvable');
      if (order.driverId !== user?.id) throw new Error('Non assigné à vous');
      return order;
    },
    onSuccess: (data, tracking) => {
      triggerFeedback(true);
      setScanned((prev) => prev.map((item) =>
        item.trackingNumber === tracking
          ? { ...item, status: 'OK', id: data.id }
          : item
      ));
    },
    onError: (err: any, tracking) => {
      triggerFeedback(false);
      setScanned((prev) => prev.map((item) =>
        item.trackingNumber === tracking
          ? { ...item, status: 'ERROR', error: err.message || 'Erreur inconnue' }
          : item
      ));
    },
  });

  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannedRef = useRef(scanned);
  scannedRef.current = scanned;

  const handleScan = (tracking: string) => {
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      if (!tracking.trim()) return;
      const clean = tracking.trim().toUpperCase();
      if (scannedRef.current.find((s) => s.trackingNumber === clean)) {
        toast.error('Déjà scanné');
        setInputValue('');
        return;
      }
      setScanned((prev) => [{ trackingNumber: clean, status: 'PENDING' }, ...prev]);
      setInputValue('');
      verifyMutation.mutate(clean);
    }, 300);
  };

  const handleRemove = (tracking: string) => {
    setScanned((prev) => prev.filter((s) => s.trackingNumber !== tracking));
  };

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!isDriver) throw new Error('Driver access required');
      const trackingNumbers = scanned.filter((s) => s.status === 'OK').map((s) => s.trackingNumber);
      await orderService.batchUpdateStatus({ trackingNumbers, status: selectedStatus });
    },
    onSuccess: () => {
      toast.success('Batch confirmé !');
      setScanned([]);
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
    onError: () => toast.error('Erreur lors du traitement par lot'),
  });

  const validItems = scanned.filter((s) => s.status === 'OK');

  return (
    // Spec: min-h-screen bg-[#020617] text-white flex flex-col font-sans
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* ── Zone 1 — Header HUD ──────────────────────────────── */}
      {/* Spec: px-6 pt-10 pb-6 relative overflow-hidden */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-6 relative overflow-hidden shrink-0 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-card border border-border text-muted-foreground hover:text-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Batch Processing Unit</p>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-primary">
              Scan <span className="text-muted-foreground/30">Center</span>
            </h1>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center ml-auto">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex-1 w-full max-w-7xl space-y-8 overflow-y-auto px-4 pb-32 sm:px-6 lg:px-8">
        {/* ── Zone 2 — Status Hub ────────────────────────────── */}
        {/* Spec: space-y-4 */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 px-2">Lifecycle State</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(LIFECYCLE_CONFIG) as [LifecycleState, typeof LIFECYCLE_CONFIG[LifecycleState]][]).map(([key, cfg]) => {
              const isActive = selectedStatus === key;
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedStatus(key)}
                  className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                    isActive
                      ? 'bg-primary/5 border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.1)]'
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-status-bg"
                      className="absolute inset-0 bg-primary opacity-10"
                    />
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative z-10 transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground border-white/20 shadow-xl' : 'bg-accent/30 text-muted-foreground border-border group-hover:text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                    {cfg.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Zone 3 — Input Terminal ────────────────────────── */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">Input Terminal</p>
          {/* Spec: bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden */}
            <div className="bg-white dark:bg-slate-900 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 relative overflow-hidden sm:p-8 shadow-sm">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <ScanLine className="w-20 h-20 text-primary" />
            </div>

            <div className="flex flex-col gap-3 relative z-10 sm:flex-row">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(inputValue)}
                  placeholder="Scannez ou saisissez un numéro..."
                  autoFocus
                  className="w-full bg-accent/30 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-3xl pl-12 pr-4 h-16 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setScannerOpen(true)}
                className="h-16 w-full rounded-[1.5rem] bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0 shadow-xl shadow-primary/20 active:scale-95 transition-all sm:w-16"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            {/* Spec: Loader motion.div opacity:0→1 */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 mt-6 text-[10px] font-black uppercase tracking-widest text-primary"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Zone 4 — Results Queue ─────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
              Nexus Queue — {scanned.length} Items
            </p>
            {scanned.length > 0 && (
              <button
                onClick={() => setScanned([])}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-destructive transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {scanned.length === 0 ? (
              /* Spec: LISTE VIDE py-20 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-[2.5rem] border-2 border-dashed border-white/5 */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center justify-center text-center bg-accent/10 rounded-[2.5rem] border-2 border-dashed border-border"
              >
                <Package className="w-12 h-12 text-muted-foreground/10 mb-4" />
                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Prêt pour le scan</p>
              </motion.div>
            ) : (
              scanned.map((item) => (
                // Spec: ITEM SCAN motion.div layout flex items-center gap-5 bg-white/[0.03] border border-white/5 rounded-3xl p-5 group
                <motion.div
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  key={item.trackingNumber}
                  className="flex items-center gap-5 bg-card border border-border rounded-3xl p-5 group"
                >
                  {/* Spec: Icône-box w-12 h-12 rounded-2xl flex items-center justify-center border */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                    item.status === 'OK'      ? 'bg-success/10 text-success border-success/20' :
                    item.status === 'ERROR'   ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                'bg-accent/30 text-muted-foreground/30 border-border animate-pulse'
                  }`}>
                    {item.status === 'OK'      ? <CheckCircle2 className="w-6 h-6" /> :
                     item.status === 'ERROR'   ? <AlertCircle className="w-6 h-6" /> :
                                                 <Loader2 className="w-6 h-6 animate-spin" />}
                  </div>

                  {/* Spec: Texte flex-1 */}
                  <div className="flex-1 min-w-0">
                    <div className="px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-lg w-fit">
                      <p className="text-[10px] font-black tracking-[0.2em] uppercase truncate">{item.trackingNumber}</p>
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                      item.status === 'ERROR' ? 'text-destructive' : 'text-slate-400'
                    }`}>
                      {item.status === 'ERROR'   ? item.error :
                       item.status === 'OK'      ? 'Prêt pour validation' :
                                                   'Vérification...'}
                    </p>
                  </div>

                  {/* Spec: Suppression w-10 h-10 rounded-xl text-white/10 hover:text-red-400 hover:bg-red-500/10 */}
                  <button
                    onClick={() => handleRemove(item.trackingNumber)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground/10 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Zone 5 — Floating Action ─────────────────────────── */}
      {/* Spec: Condition: validItems.length > 0 */}
      <AnimatePresence>
        {validItems.length > 0 && (
          // Spec: fixed bottom-0 left-0 right-0 p-8 z-50
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-8 z-50"
          >
            {/* Spec: max-w-md mx-auto bg-zinc-950/90 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] */}
            <div className="max-w-md mx-auto bg-white/95 dark:bg-zinc-950/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-4 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.5)] text-slate-900 dark:text-white">
              {/* Spec: Bouton w-full rounded-2xl py-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 */}
              <button
                onClick={() => batchMutation.mutate()}
                disabled={batchMutation.isPending || !isDriver}
                className={`w-full rounded-2xl py-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all hover:brightness-110 disabled:opacity-50 ${LIFECYCLE_CONFIG[selectedStatus].bg}`}
                style={{ 
                  boxShadow: `0 12px 40px -8px ${LIFECYCLE_CONFIG[selectedStatus].hex}88` // 50% opacity glow
                }}
              >
                {batchMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Confirmer {validItems.length} Colis → {LIFECYCLE_CONFIG[selectedStatus].label}</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(data) => handleScan(data)}
      />
    </div>
  );
};

export default ScanAll;



