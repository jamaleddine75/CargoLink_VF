import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Star, Wallet, ArrowRight, Check, Loader2,
  ChevronLeft, Camera, ShieldCheck, QrCode,
  Banknote, RotateCcw, Smartphone,
  MessageSquare, User, Info, CheckSquare, Square,
  Sparkles, Package
} from 'lucide-react';
import { Order } from '@/types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/api/orderService';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { ENDPOINTS } from '@/api/endpoints';
import { cn } from '@/lib/utils';

type ProofMode = 'PHOTO' | 'PIN' | 'QR_SCAN';

const proofMethodByMode: Record<ProofMode, 'photo' | 'pin' | 'qr_scan'> = {
  PHOTO: 'photo',
  PIN: 'pin',
  QR_SCAN: 'qr_scan',
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const UnifiedProof: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromRoutes = searchParams.get('from') === 'routes';
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { handleMutationError } = useOfflineQueue();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  const [mode, setMode] = useState<ProofMode>('PHOTO');
  const [photo, setPhoto] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [qrValidated, setQrValidated] = useState(false);
  const [notes, setNotes] = useState('');
  const [codConfirmed, setCodConfirmed] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerCleanupRef = useRef<Promise<void> | null>(null);
  const didAutoSelect = useRef(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-proof', orderId],
    queryFn: () => orderService.getOrderById(orderId!),
    enabled: !!orderId && isDriver,
  });

  useEffect(() => {
    if (order && !didAutoSelect.current) {
      didAutoSelect.current = true;
      setMode((order.codAmount ?? 0) > 0 ? 'PIN' : 'PHOTO');
    }
  }, [order]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('orderId', orderId!);
      fd.append('proofMethod', proofMethodByMode[mode]);
      fd.append('notes', notes);
      if (mode === 'PHOTO' && photo) {
        const res = await fetch(photo);
        if (!res.ok) throw new Error('Impossible de lire la photo capturée.');
        fd.append('photo', await res.blob(), 'proof.jpg');
      }
      if (mode === 'PIN') fd.append('pinCode', pin);
      return orderService.submitProofOfDelivery(fd);
    },
    onSuccess: (data) => {
      toast.success('Livraison validée avec succès !');
      ['driver-active-orders', ['driver','orders','active'], ['driver','dashboard'], 'driver-stats'].forEach(
        k => queryClient.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] })
      );
      setSubmittedOrder(data as Order);
    },
    onError: (error: unknown) => {
      const handled = handleMutationError(error, {
        orderId: orderId!, proofMethod: proofMethodByMode[mode],
        pinCode: mode === 'PIN' ? pin : undefined, notes,
      }, null, { url: ENDPOINTS.ORDERS.PROOF_OF_DELIVERY, method: 'POST' });
      if (handled) navigate('/driver/dashboard');
      else toast.error(error.response?.data?.message || 'Erreur lors de la validation.');
    },
  });

  /* ── Camera ── */
  useEffect(() => {
    if (mode === 'PHOTO' && !photo) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode, photo]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', aspectRatio: 4 / 3 },
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraReady(true); }
    } catch {
      toast.error("Impossible d'accéder à la caméra.");
    }
  };
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraReady(false);
    }
  };
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setPhoto(c.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  /* ── QR ── */
  useEffect(() => {
    let mounted = true, timer: number | null = null, cleaning = false;
    const clear = async () => {
      if (!scannerRef.current || cleaning) return;
      cleaning = true;
      try { await scannerRef.current.clear(); } catch { /* ignore */ }
      finally { scannerRef.current = null; cleaning = false; }
    };
    const init = () => {
      if (!mounted) return;
      const el = document.getElementById('qr-reader');
      if (!el) { timer = window.setTimeout(init, 50) as unknown as number; return; }
      try {
        const s = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 220 }, false);
        s.render(async (text) => {
          if (text === orderId || text === order?.trackingNumber) {
            await clear(); setQrValidated(true); toast.success('Code QR validé !');
          } else toast.error('Code QR invalide pour cette commande');
        }, () => {});
        scannerRef.current = s;
      } catch { /* ignore */ }
    };
    if (mode === 'QR_SCAN') { scannerCleanupRef.current = clear(); init(); }
    else scannerCleanupRef.current = clear();
    return () => { mounted = false; if (timer) clearTimeout(timer); scannerCleanupRef.current = clear(); };
  }, [mode, orderId, order?.trackingNumber]);

  if (isLoading) return <Skeleton />;
  if (submittedOrder) return <StepSuccess order={submittedOrder} fromRoutes={fromRoutes} />;

  const hasCOD = (order?.codAmount ?? 0) > 0;
  const valid = () => {
    if (hasCOD && !codConfirmed) return false;
    if (mode === 'PHOTO') return !!photo;
    if (mode === 'PIN') return pin.length === 4;
    return qrValidated;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 relative">

      {/* ── BG ── */}
      <div className="fixed inset-0 -z-10 mesh-gradient opacity-60 pointer-events-none" />
      <div className="fixed inset-0 -z-10 grid-pattern opacity-40 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] -translate-y-1/3 translate-x-1/4 rounded-full -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(210 100% 52% / 0.11) 0%, transparent 65%)' }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] translate-y-1/3 -translate-x-1/4 rounded-full -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(268 72% 62% / 0.09) 0%, transparent 65%)' }} />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-safe flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={() => navigate(-1)}
            className="group w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-accent/30 border border-border/60 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-90 shadow-card shrink-0"
          >
            <ChevronLeft size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <div className="text-center min-w-0 px-3">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 leading-none mb-1 hidden sm:block">
              Étape 3 / 3 — Preuve de livraison
            </p>
            <h1 className="text-xs sm:text-sm font-display font-bold tracking-widest uppercase text-foreground truncate">
              {order?.trackingNumber}
            </h1>
          </div>

          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-card shrink-0">
            <Package size={16} className="text-primary" />
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 pb-24 lg:pb-12">

        {/* Desktop: two-column | Mobile: single column */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 xl:gap-12 gap-5">

          {/* ══ LEFT — capture panel ══ */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-2 glass-card-premium p-2 shadow-card rounded-3xl">
              {(['PHOTO', 'PIN', 'QR_SCAN'] as ProofMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setPhoto(null); setPin(''); setQrValidated(false); }}
                  className={cn(
                    'py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex flex-col items-center gap-1.5 sm:gap-2',
                    mode === m ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
                  )}
                >
                  {mode === m && (
                    <motion.div layoutId="tab" className="absolute inset-0 bg-hero-gradient-soft border border-primary/20 rounded-2xl shadow-card" />
                  )}
                  <div className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all relative z-10 border',
                    mode === m
                      ? 'bg-hero-gradient text-white border-primary/30 shadow-[0_4px_14px_-4px_hsl(210_100%_52%/0.4)]'
                      : 'bg-accent/30 text-muted-foreground/50 border-border/40'
                  )}>
                    {m === 'PHOTO' && <Camera size={14} className="sm:w-4 sm:h-4" />}
                    {m === 'PIN'   && <Smartphone size={14} className="sm:w-4 sm:h-4" />}
                    {m === 'QR_SCAN' && <QrCode size={14} className="sm:w-4 sm:h-4" />}
                  </div>
                  <span className="relative z-10 leading-none">
                    {m === 'PHOTO' ? 'Photo' : m === 'PIN' ? 'Code PIN' : 'QR Code'}
                  </span>
                </button>
              ))}
            </div>

            {/* Capture content card */}
            <div className="glass-card-premium shadow-[0_8px_40px_-8px_hsl(210_100%_52%/0.13)] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 relative overflow-hidden flex flex-col flex-1">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-hero-gradient-soft rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, hsl(268 72% 62% / 0.07) 0%, transparent 70%)' }} />

              <AnimatePresence mode="wait">

                {/* PHOTO */}
                {mode === 'PHOTO' && (
                  <motion.div key="photo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex-1 flex flex-col">
                    <div className="relative w-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-border/50 bg-accent/10 shadow-card"
                      style={{ aspectRatio: '4/3', maxHeight: 'min(480px, 60vh)' }}>
                      {photo ? (
                        <>
                          <img src={photo} className="w-full h-full object-cover" alt="Proof" />
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                              className="bg-hero-gradient text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl flex items-center gap-2 sm:gap-3 shadow-[0_8px_30px_-4px_hsl(210_100%_52%/0.4)]">
                              <Check size={16} strokeWidth={3} />
                              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Image Validée</span>
                            </motion.div>
                          </div>
                          <button onClick={() => setPhoto(null)}
                            className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 h-12 sm:h-14 px-6 sm:px-8 glass border border-border/40 rounded-2xl flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest hover:border-primary/30 transition-all active:scale-95 text-foreground shadow-card whitespace-nowrap">
                            <RotateCcw size={14} /> Reprendre
                          </button>
                        </>
                      ) : (
                        <>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          <canvas ref={canvasRef} className="hidden" />
                          {!isCameraReady && (
                            <div className="absolute inset-0 flex items-center justify-center glass">
                              <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-6 sm:bottom-8 flex justify-center">
                            <button onClick={capturePhoto} disabled={!isCameraReady}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary/30 p-1 active:scale-90 transition-transform disabled:opacity-40">
                              <div className="w-full h-full rounded-full bg-hero-gradient shadow-[0_0_30px_hsl(210_100%_52%/0.4)] flex items-center justify-center">
                                <Camera size={26} className="sm:w-8 sm:h-8 text-white" />
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* PIN */}
                {mode === 'PIN' && (
                  <motion.div key="pin" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                    className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-hero-gradient-soft border border-primary/20 flex items-center justify-center mb-6 sm:mb-8 shadow-card">
                      <Smartphone size={28} className="sm:w-9 sm:h-9 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight mb-2 text-center text-foreground">
                      Code de Validation
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest text-center mb-8 sm:mb-10 max-w-[220px] leading-relaxed">
                      Saisissez le code du client
                    </p>

                    <InputOTP maxLength={4} value={pin} onChange={setPin}>
                      <InputOTPGroup className="gap-2 sm:gap-3">
                        {[0, 1, 2, 3].map((i) => (
                          <InputOTPSlot key={i} index={i}
                            className="!w-14 !h-16 sm:!w-[4.5rem] sm:!h-20 rounded-2xl sm:rounded-[1.5rem] bg-accent/20 border-2 border-border/60 text-2xl sm:text-3xl font-display font-bold text-foreground focus:border-primary focus:ring-0 transition-all shadow-card"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>

                    <div className="mt-8 flex items-start gap-2.5 px-4 py-3 bg-accent/20 rounded-2xl border border-border/40 max-w-xs">
                      <Info size={12} className="text-muted-foreground/40 shrink-0 mt-0.5" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 leading-relaxed">
                        Demandez ce code au destinataire lors de la remise
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* QR */}
                {mode === 'QR_SCAN' && (
                  <motion.div key="qr" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.03 }}
                    className="flex-1 flex flex-col">
                    <div id="qr-reader"
                      className="w-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-border/50 bg-accent/10 shadow-card relative"
                      style={{ minHeight: 'min(360px, 50vw + 120px)' }}>
                      {qrValidated && (
                        <div className="absolute inset-0 bg-hero-gradient z-50 flex flex-col items-center justify-center p-8 text-white">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center mb-4 shadow-lg">
                            <Check size={36} className="sm:w-11 sm:h-11" strokeWidth={3.5} />
                          </div>
                          <h4 className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight mb-1">QR Validé</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Preuve scannée avec succès</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest text-center leading-relaxed">
                      Positionnez le code QR du colis dans le cadre
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Notes — inline on desktop, stacked on mobile (will appear in right col via order) */}
            <div className="lg:hidden space-y-2">
              <NotesField notes={notes} setNotes={setNotes} />
            </div>
          </div>

          {/* ══ RIGHT — controls panel ══ */}
          <div className="flex flex-col gap-5">

            {/* COD Banner */}
            {hasCOD && (
              <motion.div initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 18 }}
                className="rounded-[2rem] overflow-hidden shadow-[0_10px_36px_-8px_hsl(210_100%_52%/0.22)] border border-primary/20">
                <div className="bg-hero-gradient px-6 sm:px-7 pt-6 sm:pt-7 pb-5 flex items-center gap-4 sm:gap-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-lg shrink-0 relative z-10">
                    <Banknote size={24} className="sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="relative z-10 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/70 mb-0.5">
                      Encaissement COD
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white truncate">
                      {order?.codAmount} <span className="text-base opacity-60">MAD</span>
                    </h3>
                  </div>
                  <div className="absolute -right-4 -top-4 opacity-10 z-0">
                    <ShieldCheck size={90} className="text-white" />
                  </div>
                </div>
                <button onClick={() => setCodConfirmed(v => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 sm:gap-4 px-6 sm:px-7 py-4 transition-all active:scale-[0.99]',
                    codConfirmed ? 'bg-primary/[0.07] border-t border-primary/20' : 'bg-background/80 border-t border-border/40'
                  )}>
                  <div className={cn('w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-colors', codConfirmed ? 'text-primary' : 'text-muted-foreground/30')}>
                    {codConfirmed ? <CheckSquare size={22} /> : <Square size={22} />}
                  </div>
                  <p className={cn('text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-left transition-colors',
                    codConfirmed ? 'text-primary' : 'text-muted-foreground/40')}>
                    J'ai collecté {order?.codAmount} MAD en espèces
                  </p>
                </button>
              </motion.div>
            )}

            {/* Order info summary (desktop only) */}
            <div className="hidden lg:block glass-card-premium rounded-3xl p-6 shadow-card space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/60">Détails de la livraison</p>
              <div className="space-y-3">
                {[
                  { label: 'Destinataire', value: order?.receiverName },
                  { label: 'Adresse', value: order?.deliveryAddress },
                  order?.receiverPhone ? { label: 'Téléphone', value: order.receiverPhone } : null,
                ].filter(Boolean).map((row: unknown) => (
                  <div key={row.label} className="flex justify-between gap-4 text-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">{row.label}</span>
                    <span className="font-semibold text-foreground text-right text-[13px] truncate">{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes — desktop only (hidden on mobile, shown above in left col) */}
            <div className="hidden lg:block space-y-2">
              <NotesField notes={notes} setNotes={setNotes} />
            </div>

            {/* COD hint */}
            <AnimatePresence>
              {hasCOD && !codConfirmed && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="text-center text-[10px] font-black uppercase tracking-widest text-amber-500/70 overflow-hidden">
                  Confirmez d'abord l'encaissement COD ↑
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !valid()}
              className={cn(
                'btn-premium w-full h-16 sm:h-[72px] rounded-[1.75rem] sm:rounded-[2rem] text-[11px] sm:text-[12px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-black flex items-center justify-center gap-4 sm:gap-6 transition-all mt-auto',
                'disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed',
                submitMutation.isPending && 'pointer-events-none',
              )}
              style={{ '--color': 'rgb(14 165 233)' } as React.CSSProperties}
            >
              {submitMutation.isPending ? (
                <span className="btn-text flex items-center gap-3">
                  <Loader2 className="animate-spin" size={18} />
                  Traitement en cours...
                </span>
              ) : (
                <>
                  <span className="btn-text">Confirmer la Livraison</span>
                  <div className="btn-icon w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </div>
                </>
              )}
            </button>

            <div className="h-1 lg:h-0" />
          </div>
        </div>
      </main>
    </div>
  );
};

/* ── Notes field (shared) ── */
const NotesField = ({ notes, setNotes }: { notes: string; setNotes: (v: string) => void }) => (
  <>
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <MessageSquare size={13} className="text-muted-foreground/40" />
        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Commentaires</label>
      </div>
      <span className={cn('text-[9px] font-bold uppercase tabular-nums', notes.length >= 270 ? 'text-destructive' : 'text-muted-foreground/30')}>
        {notes.length}/300
      </span>
    </div>
    <textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value.slice(0, 300))}
      maxLength={300}
      placeholder="Ex: Remis au concierge, colis en bon état..."
      className="w-full h-24 glass-card-premium rounded-2xl px-5 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/30 outline-none transition-all resize-none border border-border/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
    />
  </>
);

/* ─────────────────────────────────────────────────────────────
   SUCCESS SCREEN
───────────────────────────────────────────────────────────── */
const StepSuccess = ({ order, fromRoutes }: { order: Order; fromRoutes?: boolean }) => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background z-[2000] overflow-y-auto overflow-x-hidden">
      {/* BG */}
      <div className="absolute inset-0 mesh-gradient opacity-60 pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-[700px] h-[700px] -translate-x-1/3 -translate-y-1/3 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(210 100% 52% / 0.13) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] translate-x-1/4 translate-y-1/4 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(268 72% 62% / 0.10) 0%, transparent 65%)' }} />

      {/* Content centred vertically */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 py-16 text-center">

        {/* Desktop: side-by-side | Mobile: stack */}
        <div className="w-full max-w-4xl flex flex-col lg:flex-row lg:items-center lg:gap-16 gap-10">

          {/* ── Left / top: icon + heading ── */}
          <div className="flex flex-col items-center lg:items-start lg:text-left flex-shrink-0">
            <motion.div
              initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
              className="relative mb-8 sm:mb-10"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[3rem] sm:rounded-[3.5rem] bg-hero-gradient shadow-[0_30px_80px_-10px_hsl(210_100%_52%/0.4)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
                <div className="absolute inset-0 animate-ping bg-primary/20 rounded-[3.5rem]" style={{ animationDuration: '2.8s' }} />
                <Check size={70} className="sm:w-[80px] sm:h-[80px] text-white relative z-10" strokeWidth={3} />
              </div>
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55 }}
                className="absolute -top-3 -right-3 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-card">
                <Sparkles size={18} className="text-primary" />
              </motion.div>
            </motion.div>

            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tighter uppercase leading-none text-gradient mb-3">
              LIVRAISON<br />TERMINÉE !
            </motion.h2>
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xs font-black uppercase tracking-[0.4em] text-primary/60">
              Mission accomplie avec succès
            </motion.p>
          </div>

          {/* ── Right / bottom: stats + CTA ── */}
          <div className="flex flex-col gap-4 w-full lg:max-w-sm">

            {/* Earnings + Points */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div initial={{ x: -18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                className="glass-card-premium p-5 sm:p-6 flex flex-col items-center gap-3 shadow-card hover-lift">
                <div className="w-11 h-11 rounded-2xl bg-hero-gradient-soft border border-primary/20 flex items-center justify-center shadow-card">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Gains Mission</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-gradient">
                    +{(order?.driverEarnings ?? 25).toFixed(1)}
                    <span className="text-[10px] text-muted-foreground/40 ml-1 font-sans">MAD</span>
                  </p>
                </div>
              </motion.div>

              <motion.div initial={{ x: 18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                className="glass-card-premium p-5 sm:p-6 flex flex-col items-center gap-3 shadow-card hover-lift">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Points Bonus</p>
                  <p className="text-xl sm:text-2xl font-display font-bold text-amber-500">+{order?.pointsEarned ?? 150}</p>
                </div>
              </motion.div>
            </div>

            {/* Client row */}
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
              className="glass-card-premium p-4 sm:p-5 flex items-center justify-between shadow-card">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/30 border border-border/50 flex items-center justify-center shrink-0">
                  <User size={14} className="text-muted-foreground/50" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-wide truncate">{order?.receiverName}</p>
                  <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Signature Numérique OK</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 ml-2">
                <Check size={13} className="text-primary" strokeWidth={3} />
              </div>
            </motion.div>

            {/* CTA */}
            <div className="flex flex-col gap-3 pt-1">
              {fromRoutes && (
                <motion.button initial={{ y: 36, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}
                  onClick={() => navigate('/driver/routes')}
                  className="btn-premium w-full h-14 sm:h-16 rounded-[1.75rem] text-[11px] tracking-[0.25em] uppercase font-black flex items-center justify-center gap-4"
                  style={{ '--color': 'rgb(14 165 233)' } as React.CSSProperties}>
                  <span className="btn-text">Continuer la Tournée</span>
                  <div className="btn-icon"><ArrowRight size={17} strokeWidth={2.5} /></div>
                </motion.button>
              )}
              <motion.button initial={{ y: 36, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.82 }}
                onClick={() => navigate('/driver/dashboard')}
                className={cn(
                  'w-full h-12 sm:h-14 rounded-[1.75rem] font-black uppercase tracking-[0.25em] text-[11px] active:scale-95 transition-all flex items-center justify-center gap-3',
                  fromRoutes
                    ? 'glass border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary shadow-card'
                    : 'bg-hero-gradient text-white shadow-[0_8px_30px_-6px_hsl(210_100%_52%/0.4)]'
                )}>
                {fromRoutes ? 'Tableau de Bord' : <><span>Retour au Terminal</span><ArrowRight size={16} strokeWidth={2.5} /></>}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div className="absolute inset-0 mesh-gradient opacity-50 pointer-events-none" />
    {/* Header */}
    <div className="h-16 sm:h-20 glass border-b border-border/40 flex items-center justify-between px-6 sm:px-10">
      <div className="w-10 h-10 bg-accent/20 rounded-2xl animate-pulse" />
      <div className="space-y-1.5 text-center">
        <div className="h-2 bg-accent/20 rounded-full w-20 mx-auto animate-pulse" />
        <div className="h-3.5 bg-accent/20 rounded-full w-36 mx-auto animate-pulse" />
      </div>
      <div className="w-10 h-10 bg-accent/20 rounded-2xl animate-pulse" />
    </div>
    {/* Body */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-6">
      <div className="space-y-5">
        <div className="h-14 bg-accent/15 rounded-3xl animate-pulse" />
        <div className="h-[360px] sm:h-[420px] bg-accent/15 rounded-[2.5rem] animate-pulse" />
      </div>
      <div className="space-y-5">
        <div className="h-28 bg-accent/15 rounded-[2rem] animate-pulse" />
        <div className="h-32 bg-accent/15 rounded-3xl animate-pulse" />
        <div className="h-24 bg-accent/15 rounded-2xl animate-pulse" />
        <div className="h-16 bg-primary/10 rounded-[2rem] animate-pulse" />
      </div>
    </div>
  </div>
);

export default UnifiedProof;
