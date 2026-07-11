import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, QrCode, Hash, CheckCircle2, XCircle,
  Loader2, Package, MapPin, ArrowRight, RotateCcw, Flashlight, ZoomIn
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '@/services/api/orderService';
import { cn } from '@/lib/utils';

type ScanMode = 'camera' | 'manual';
type ScanResult = { order: unknown; status: 'success' | 'error'; message?: string } | null;

// Simple audio beep via Web Audio API
const playBeep = (success: boolean) => {
  // 1. Audio Feedback
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* silently fail */ }

  // 2. Haptic Feedback (Vibration)
  if ("vibrate" in navigator) {
    if (success) {
      navigator.vibrate(50); // Short tap for success
    } else {
      navigator.vibrate([100, 50, 100]); // Double buzz for error
    }
  }
};

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const html5QrRef = useRef<unknown>(null);
  const isScannerRunningRef = useRef(false);

  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  // ── Lookup mutation ──────────────────────────────────────────────────────
  const lookupMutation = useMutation({
    mutationFn: (tracking: string) => orderService.getOrderByTracking(tracking),
    onSuccess: (order) => {
      playBeep(true);
      setScanResult({ order, status: 'success' });
    },
    onError: () => {
      playBeep(false);
      setScanResult({ order: null, status: 'error', message: 'Commande introuvable' });
    },
  });

  // ── Status update mutation ───────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ id, status, codCollected }: { id: string; status: string; codCollected?: boolean }) =>
      orderService.updateOrderStatus(id, { status, codCollected }),
    onSuccess: (_, { id, status }) => {
      setActionStatus(prev => ({ ...prev, [id]: status }));
      queryClient.invalidateQueries({ queryKey: ['driver-orders-active'] });
      toast.success(`Statut mis à jour: ${status.replace('_', ' ')}`);
    },
    onError: () => toast.error('Erreur mise à jour statut'),
  });

  // ── Camera via html5-qrcode ──────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera') return;
    let qrScanner: unknown = null;
    let isCleanedUp = false;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        qrScanner = new Html5Qrcode('qr-reader-div');
        html5QrRef.current = qrScanner;
        await qrScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (lookupMutation.isPending || scanResult) return;
            lookupMutation.mutate(decodedText.trim());
          },
          () => { /* QR not found frame — ignore */ }
        );
        if (!isCleanedUp) {
          isScannerRunningRef.current = true;
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: unknown) {
        if (!isCleanedUp) {
          setCameraError('Caméra inaccessible. Vérifiez les permissions.');
          setCameraActive(false);
          isScannerRunningRef.current = false;
        }
      }
    };

    startCamera();

    return () => {
      isCleanedUp = true;
      isScannerRunningRef.current = false;
      if (qrScanner) {
        try {
          qrScanner.stop();
          qrScanner.clear();
        } catch { /* ignore */ }
      }
      html5QrRef.current = null;
      setCameraActive(false);
    };
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = manualInput.trim();
    if (!v) return toast.error('Entrez un numéro de tracking');
    setScanResult(null);
    lookupMutation.mutate(v);
  };

  const handleReset = useCallback(() => {
    setScanResult(null);
    setManualInput('');
    lookupMutation.reset();
  }, []);

  const order = scanResult?.order;
  const statusColor: Record<string, string> = {
    ASSIGNED: 'text-blue-400',
    PICKUP: 'text-amber-400',
    PICKED_UP: 'text-indigo-400',
    ON_THE_WAY: 'text-indigo-400',
    DELIVERED: 'text-emerald-400',
    RETURNED: 'text-rose-400',
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden pb-32">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/driver/dashboard')}
            className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight">Scanner</h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Identifier un colis</p>
          </div>
          <button onClick={() => navigate('/driver/scan-all')}
            className="h-9 px-4 rounded-md bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors">
            Batch
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 mt-6 space-y-6">

        {/* ── MODE TABS ── */}
        <div className="flex bg-muted p-1 rounded-md border border-border">
          {([{ key: 'camera', label: '📷 Caméra', icon: QrCode }, { key: 'manual', label: '⌨️ Manuel', icon: Hash }] as const).map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); handleReset(); }}
              className={cn(
                'flex-1 py-2 rounded-sm font-black text-[10px] tracking-widest uppercase transition-colors',
                mode === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SCANNER AREA ── */}
        <AnimatePresence mode="wait">
          {!scanResult ? (
            <motion.div key="scanner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {mode === 'camera' ? (
                <div className="relative">
                  {/* QR reader container */}
                  <div id="qr-reader-div"
                    className="w-full rounded-md overflow-hidden bg-black border border-border" style={{ minHeight: 300 }}>
                    {!cameraActive && !cameraError && (
                      <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4 bg-card">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Initialisation caméra...</p>
                      </div>
                    )}
                    {cameraError && (
                      <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4 bg-card px-8 text-center">
                        <XCircle className="w-10 h-10 text-rose-500" />
                        <p className="text-sm font-bold text-rose-500">{cameraError}</p>
                        <button onClick={() => { setCameraError(null); setMode('manual'); }}
                          className="h-9 px-5 bg-primary text-primary-foreground rounded-md font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors">
                          Mode Manuel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scan line overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none rounded-md overflow-hidden">
                      <motion.div
                        animate={{ y: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-primary/80" />
                      {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-6 h-6 border-primary/60`}
                          style={{
                            borderTopWidth: i < 2 ? 2 : 0,
                            borderBottomWidth: i >= 2 ? 2 : 0,
                            borderLeftWidth: i % 2 === 0 ? 2 : 0,
                            borderRightWidth: i % 2 === 1 ? 2 : 0,
                            borderStyle: 'solid',
                          }} />
                      ))}
                    </div>
                  )}

                  {lookupMutation.isPending && (
                    <div className="absolute inset-0 bg-background/90 rounded-md flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Recherche en cours...</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Manual input mode */
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-6 space-y-5">
                    <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                      <Hash className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">
                        Numéro de Tracking
                      </label>
                      <input
                        type="text"
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value.toUpperCase())}
                        placeholder="CL-XXXXXXXX"
                        autoFocus
                        className="w-full h-14 bg-muted border border-border rounded-md px-4 text-xl font-black text-foreground uppercase tracking-widest focus:border-primary/50 outline-none transition-colors placeholder:text-muted-foreground text-center"
                      />
                    </div>
                    <button type="submit" disabled={lookupMutation.isPending || !manualInput.trim()}
                      className="w-full h-12 bg-primary text-primary-foreground rounded-md font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {lookupMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><QrCode className="w-4 h-4" /> Rechercher</>}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            /* ── RESULT CARD ── */
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }} className="space-y-4">

              {scanResult.status === 'error' ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-md bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                    <XCircle className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-rose-500">Introuvable</h3>
                  <p className="text-sm text-muted-foreground">{scanResult.message}</p>
                  <button onClick={handleReset}
                    className="w-full h-11 bg-muted border border-border rounded-md font-black text-xs uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Scanner à nouveau
                  </button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
                  {/* Success header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Colis Identifié</p>
                      <h3 className="text-base font-black tracking-tight">{order?.trackingNumber}</h3>
                    </div>
                    <div className="ml-auto">
                      <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border', statusColor[order?.status] ? statusColor[order?.status].replace('text-', 'border-').replace('400','500/20') + ' bg-muted' : 'text-muted-foreground border-border bg-muted')}>
                        {order?.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Address info */}
                  <div className="space-y-3 bg-muted rounded-md p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Collecte</p>
                        <p className="text-xs font-medium text-foreground">{order?.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Livraison</p>
                        <p className="text-xs font-medium text-foreground">{order?.deliveryAddress}</p>
                      </div>
                    </div>
                    {(order?.codAmount ?? 0) > 0 && (
                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">COD à collecter</p>
                        <p className="text-base font-black text-amber-500">{order.codAmount} MAD</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['PICKED_UP', 'DELIVERED'] as const).map(status => {
                      const done = actionStatus[order?.id] === status || order?.status === status;
                      return (
                        <button key={status}
                          onClick={() => {
                            if (!done) {
                              statusMutation.mutate({ 
                                id: order.id, 
                                status,
                                codCollected: status === 'DELIVERED' ? (order.codAmount > 0) : undefined
                              });
                            }
                          }}
                          disabled={statusMutation.isPending || done}
                          className={cn(
                            'h-11 rounded-md font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors',
                            done
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                              : status === 'PICKED_UP'
                                ? 'bg-amber-500 text-black hover:bg-amber-600'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : null}
                          {status === 'PICKED_UP' ? 'Collecté' : 'Livré'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation + reset */}
                  <div className="flex gap-3">
                    <button onClick={() => navigate(`/driver/orders/${order?.id}`)}
                      className="flex-1 h-11 bg-muted border border-border rounded-md font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent transition-colors">
                      Détails <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleReset}
                      className="w-11 h-11 bg-muted border border-border rounded-md flex items-center justify-center hover:bg-accent transition-colors">
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HINT ── */}
        {!scanResult && mode === 'camera' && cameraActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Pointez la caméra sur le QR code du colis
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ScanPage;



