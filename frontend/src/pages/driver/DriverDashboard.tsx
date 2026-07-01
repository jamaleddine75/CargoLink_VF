import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate, type Variants } from 'framer-motion';
import {
  User, Power, TrendingUp, TrendingDown, Package, History, Wallet, BarChart3, Activity,
  ArrowRight, MapPin, ChevronRight, Clock, AlertCircle, CheckCircle2,
  XCircle, Flame, Zap, QrCode, RefreshCw, Shield, Star, Trophy,
  Navigation, Banknote, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDriverDashboard } from '@/hooks/useDriverDashboard';
import { useAvailableOrders } from '@/hooks/useAvailableOrders';
import driverService from '@/services/api/driverService';
import orderService from '@/services/api/orderService';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const AnimatedNumber = ({ value, suffix = '', className }: { value: number | string, suffix?: string, className?: string }) => {
  const nodeRef = React.useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      node.textContent = `${value}${suffix}`;
      return;
    }

    const controls = animate(0, numValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(val) {
        node.textContent = `${Math.round(val)}${suffix}`;
      }
    });
    
    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={nodeRef} className={className} />;
};

// ── Offer card with per-offer countdown ──────────────────────────────────
interface OfferCardProps {
  offer: unknown;
  onAccept: () => void;
  onIgnore: () => void;
  disabled?: boolean;
}

const OfferCard = React.forwardRef<HTMLDivElement, OfferCardProps>(function OfferCard(
  { offer, onAccept, onIgnore, disabled },
  ref
) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) { onIgnore(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, onIgnore]);

  const urgent = !!offer.urgent;
  const cod = offer.codAmount ?? 0;
  const earnings = offer.driverEarnings ?? offer.deliveryFee ?? 0;
  const distance = offer.distance ?? 0;
  const isUrgent = urgent || timeLeft < 10;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      layout
      className={cn(
        'rounded-[2rem] border bg-card p-5 shadow-xl overflow-hidden relative',
        isUrgent ? 'border-rose-500/30 bg-rose-500/5' : 'border-border'
      )}
    >
      {/* countdown bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-muted/40 rounded-t-[2rem]">
        <motion.div
          className={cn('h-full rounded-t-[2rem] origin-left', timeLeft < 10 ? 'bg-rose-500' : 'bg-primary')}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: timeLeft / 30 }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Nouvelle offre</p>
          <p className="text-[11px] font-black text-foreground tracking-widest">{offer.trackingNumber}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {urgent && (
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse">
              Urgent
            </span>
          )}
          {cod > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
              <Banknote size={10} /> COD
            </span>
          )}
          <div className={cn(
            'text-base font-black tabular-nums w-8 text-center',
            timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'
          )}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* addresses */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <MapPin size={10} className="text-primary" />
          </div>
          <p className="text-[11px] font-bold text-foreground truncate">{offer.pickupAddress || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Navigation size={10} className="text-emerald-500" />
          </div>
          <p className="text-[11px] font-bold text-foreground truncate">{offer.deliveryAddress || '—'}</p>
        </div>
      </div>

      {/* stats row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-emerald-500/10 rounded-xl px-3 py-2 text-center">
          <p className="text-[8px] font-black text-muted-foreground uppercase">Gain</p>
          <p className="text-sm font-black text-emerald-500">{earnings > 0 ? `${earnings.toFixed(0)} MAD` : '—'}</p>
        </div>
        <div className="flex-1 bg-primary/10 rounded-xl px-3 py-2 text-center">
          <p className="text-[8px] font-black text-muted-foreground uppercase">Distance</p>
          <p className="text-sm font-black text-primary">{distance > 0 ? `${distance.toFixed(1)} km` : '—'}</p>
        </div>
        {cod > 0 && (
          <div className="flex-1 bg-amber-500/10 rounded-xl px-3 py-2 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase">COD</p>
            <p className="text-sm font-black text-amber-500">{cod} MAD</p>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex gap-3">
        <button
          onClick={onIgnore}
          disabled={disabled}
          className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 shrink-0"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
        <button
          onClick={onAccept}
          disabled={disabled}
          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-40"
        >
          <CheckCircle2 size={14} /> Accepter
        </button>
      </div>
    </motion.div>
  );
});

OfferCard.displayName = 'OfferCard';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { dashboard, profile, activeOrders, accessDenied } = useDriverDashboard();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [greeting, setGreeting] = useState('Bonjour');
  const [forcedOnline, setForcedOnline] = useState<boolean | null>(null);

  const stats = dashboard.data;
  const isOnline = forcedOnline ?? !!stats?.isOnline;
  const activeOrder = activeOrders.data?.[0];
  const verificationStatus = stats?.verificationStatus ?? profile.data?.verificationStatus;

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 18) setGreeting('Bonsoir');
    else if (h >= 12) setGreeting('Bon après-midi');
    else setGreeting('Bonjour');
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('driver_forced_online');
    if (raw === 'true') setForcedOnline(true);
    if (raw === 'false') setForcedOnline(false);
  }, []);

  useEffect(() => {
    if (accessDenied) {
      navigate('/suspended', { replace: true });
    }
  }, [accessDenied, navigate]);

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => orderService.updateOrderStatus(orderId, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'orders', 'active'] });
      setShowCancelConfirm(false);
      toast.success('Mission annulée');
    },
    onError: (e: unknown) => toast.error(e.response?.data?.message || 'Erreur annulation'),
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['driver', 'dashboard'] }),
        queryClient.refetchQueries({ queryKey: ['driver', 'profile'] }),
        queryClient.refetchQueries({ queryKey: ['driver', 'orders', 'active'] }),
      ]);
      toast.success('Synchronisé');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleMutation = useMutation({
    mutationFn: (status: string) => driverService.updateStatus('me', status),
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey: ['driver', 'dashboard'] });
      const prev = queryClient.getQueryData(['driver', 'dashboard']);
      queryClient.setQueryData(['driver', 'dashboard'], (old: unknown) =>
        old ? { ...old, isOnline: req.toUpperCase() === 'ONLINE' } : old
      );
      return { prev };
    },
    onSuccess: (_d, req) => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      const next = req.toUpperCase() === 'ONLINE';
      setForcedOnline(next);
      localStorage.setItem('driver_forced_online', String(next));
      toast.success(next ? '🟢 En ligne' : '⚫ Hors ligne');
    },
    onError: (_e, _r, ctx: unknown) => {
      if (ctx?.prev) queryClient.setQueryData(['driver', 'dashboard'], ctx.prev);
      toast.error('Erreur statut');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] }),
  });

  // Available offers
  const availableOrdersQuery = useAvailableOrders();
  const offers: unknown[] = Array.isArray(availableOrdersQuery.data)
    ? availableOrdersQuery.data
    : (availableOrdersQuery.data as unknown)?.content ?? [];

  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const visibleOffers = offers.filter(o => !ignoredIds.has(o.id)).slice(0, 3);

  const acceptOfferMutation = useMutation({
    mutationFn: (id: string) => orderService.acceptOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'orders', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'orders', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      toast.success('Mission acceptée !');
      navigate('/driver/routes');
    },
    onError: () => toast.error("Impossible d'accepter cette offre"),
  });

  const ignoreOffer = useCallback((id: string) => {
    setIgnoredIds(prev => new Set(prev).add(id));
    orderService.refuseOrder(id).catch((err) => {
      console.warn('[DriverDashboard] refuseOrder failed silently:', err?.response?.status);
    });
  }, []);

  const todayEarnings = stats?.todayEarnings ?? 0;
  const completedToday = stats?.todayDelivered ?? 0;
  const successRate = stats?.successRate ?? 100;
  const loyaltyPoints = stats?.loyaltyPoints ?? 0;
  const earningsTrend = stats?.earningsTrend ?? 'Stable';

  const quickActions = [
    { label: 'Missions', icon: Package, path: '/driver/orders', color: 'sky' },
    { label: 'Carte', icon: MapPin, path: '/driver/routes', color: 'emerald' },
    { label: 'Scanner', icon: QrCode, path: '/driver/scan', color: 'amber' },
    { label: 'Wallet', icon: Wallet, path: '/driver/wallet', color: 'violet' },
    { label: 'Historique', icon: History, path: '/driver/history', color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500/10 text-sky-500 group-hover:bg-gradient-to-br group-hover:from-sky-500 group-hover:to-indigo-600 group-hover:text-white',
    emerald: 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white',
    amber: 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white',
    violet: 'bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white',
    rose: 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white',
    slate: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 group-hover:bg-slate-500 group-hover:text-white',
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-500/10 border border-rose-500/20">
            <Shield className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Accès suspendu</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Votre compte chauffeur n&apos;est pas autorisé à accéder au tableau de bord pour le moment.
            Redirection vers l&apos;écran de statut en cours.
          </p>
          <button
            type="button"
            onClick={() => navigate('/suspended', { replace: true })}
            className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            Ouvrir la page de statut
          </button>
        </div>
      </div>
    );
  }

  if (dashboard.isLoading || profile.isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-7 w-40 rounded-full" />
          </div>
          <Skeleton className="h-12 w-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-[3rem]" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Erreur Critique</h2>
          <p className="text-muted-foreground text-sm mt-2">Connexion interrompue au serveur.</p>
        </div>
        <button onClick={handleSync} className="h-14 px-8 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-40 font-sans overflow-x-hidden selection:bg-primary/30 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-sky-500/8 to-transparent pointer-events-none -z-10 blur-3xl" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="max-w-md lg:max-w-2xl mx-auto px-5 pt-8 space-y-8">

        {/* ── HEADER ── */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {isOnline && (
                <motion.div animate={{ scale: [1,1.3,1], opacity: [0.4,0.1,0.4] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="absolute -inset-2 bg-emerald-500 rounded-[22px] blur-xl -z-10" />
              )}
              <div className="relative w-14 h-14 rounded-[22px] bg-card flex items-center justify-center shadow-2xl border border-border overflow-hidden">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-muted-foreground" />}
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-3 border-background rounded-full" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">{greeting}</p>
              <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none">{user?.firstName || 'Chauffeur'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WSS Indicator */}
            <div className="flex items-center gap-1.5 px-3 h-11 bg-card border border-border rounded-[18px] mr-1">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden sm:inline-block">Live</span>
            </div>

            <button onClick={handleSync} disabled={isSyncing}
              className="w-11 h-11 rounded-[18px] bg-card border border-border flex items-center justify-center active:scale-95 transition-all">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isSyncing && 'animate-spin text-primary')} />
            </button>
            <button onClick={() => toggleMutation.mutate(isOnline ? 'OFFLINE' : 'ONLINE')}
              disabled={toggleMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-4 h-11 rounded-2xl border-2 transition-all duration-500 active:scale-95',
                isOnline ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-muted border-border text-muted-foreground',
                toggleMutation.isPending && 'opacity-60'
              )}>
              <div className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground')} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {toggleMutation.isPending ? '...' : isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── VERIFICATION WARNING ── */}
        <AnimatePresence>
          {verificationStatus && verificationStatus !== 'VERIFIED' && (
            <motion.div key="verif" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                {verificationStatus === 'PENDING'
                  ? 'Compte en attente de vérification — fonctionnalités limitées.'
                  : 'Compte refusé — contactez votre agence.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EARNINGS HERO CARD ── */}
        <motion.div variants={itemVariants} onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            navigate('/driver/wallet');
          }}
          className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-primary/15 rounded-[3rem] blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-gradient-to-br from-sky-500 via-indigo-600 to-indigo-700 rounded-[3rem] p-8 shadow-2xl border border-white/10 group-hover:scale-[1.01] transition-all duration-500 overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10">
                  <Wallet className="w-3.5 h-3.5 text-white" />
                  <p className="text-[9px] font-black text-white uppercase tracking-[0.25em]">Earnings Today</p>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Zap className="w-5 h-5 text-yellow-300" />
                </div>
              </div>
              <div>
                <span className="text-6xl font-black tracking-tighter text-white tabular-nums">
                  {todayEarnings.toLocaleString('fr-MA')}
                </span>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xl font-black text-white/40">MAD</span>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border",
                    earningsTrend === 'UP' ? "bg-emerald-500/20 border-emerald-500/30" : 
                    earningsTrend === 'DOWN' ? "bg-rose-500/20 border-rose-500/30" :
                    "bg-white/10 border-white/10"
                  )}>
                    {earningsTrend === 'UP' ? (
                      <TrendingUp className="w-3 h-3 text-emerald-300" />
                    ) : earningsTrend === 'DOWN' ? (
                      <TrendingDown className="w-3 h-3 text-rose-300" />
                    ) : (
                      <Activity className="w-3 h-3 text-white/60" />
                    )}
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      earningsTrend === 'UP' ? "text-emerald-100" :
                      earningsTrend === 'DOWN' ? "text-rose-100" :
                      "text-white/60"
                    )}>
                      {completedToday} livraisons
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Flame className="w-56 h-56 rotate-12" />
            </div>
          </div>
        </motion.div>

        {/* ── KPI GRID 2×2 ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          {[
            { label: 'Livrées', value: completedToday, suffix: '', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Gains jour', value: `${todayEarnings.toFixed(0)}`, suffix: ' MAD', icon: Wallet, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Taux succès', value: `${successRate}`, suffix: '%', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Points', value: loyaltyPoints, suffix: ' pts', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-card border border-border rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', kpi.bg)}>
                <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className={cn('text-3xl font-black tabular-nums tracking-tight', kpi.color)}>
                <AnimatedNumber value={kpi.value} />
                <span className="text-sm font-bold opacity-50">{kpi.suffix}</span>
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── ACTIVE MISSION BANNER ── */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Mission Active</h2>
          </div>

          <AnimatePresence mode="wait">
            {activeOrder ? (
              <motion.div key="active" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.02, opacity: 0 }}
                className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-6 relative overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/driver/orders/${activeOrder.id}`)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Mission En Cours</p>
                      <p className="text-sm font-black text-foreground">{activeOrder.trackingNumber}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3 mb-4 border border-amber-500/10">
                  <div className="flex-1 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs font-bold text-foreground/80 line-clamp-1">{activeOrder.deliveryAddress}</p>
                  </div>
                  <div className="shrink-0 bg-amber-500/10 px-2 py-1 rounded-lg">
                    <p className="text-[10px] font-black text-amber-500">{activeOrder.distance ? `${activeOrder.distance.toFixed(1)} km` : '2.4 km'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={e => { e.stopPropagation(); setShowCancelConfirm(true); }}
                    className="h-12 px-5 bg-rose-500/10 text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0">
                    Annuler
                  </button>
                  <button onClick={e => { e.stopPropagation(); navigate(`/driver/routes`); }}
                    className="flex-1 h-12 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
                    Naviguer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Cancel overlay */}
                <AnimatePresence>
                  {showCancelConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-0 bg-background/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 z-50 text-center">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-2">Annuler la mission ?</h4>
                      <p className="text-[11px] text-muted-foreground mb-6 max-w-[200px]">La commande sera réattribuée à un autre chauffeur.</p>
                      <div className="flex gap-3 w-full">
                        <button onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 h-12 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest border border-border">Retour</button>
                        <button onClick={() => activeOrder && cancelMutation.mutate(activeOrder.id)}
                          disabled={cancelMutation.isPending}
                          className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
                          {cancelMutation.isPending ? '...' : 'Confirmer'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-[2.5rem] p-10 border-2 border-dashed flex flex-col items-center text-center space-y-4 transition-all duration-700',
                  isOnline ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border'
                )}>
                <div className={cn('w-20 h-20 rounded-[28px] flex items-center justify-center relative',
                  isOnline ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-muted text-muted-foreground/30')}>
                  {isOnline && (
                    <motion.div animate={{ scale: [1,1.5,1], opacity: [0.3,0,0.3] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="absolute -inset-3 bg-emerald-500 rounded-[32px] -z-10" />
                  )}
                  <Package className="w-10 h-10 relative z-10" />
                </div>
                <div>
                  <h3 className={cn('text-xl font-black uppercase tracking-tighter',
                    isOnline ? 'text-emerald-400' : 'text-muted-foreground/40')}>
                    {isOnline ? 'En attente de mission' : 'Hors service'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 opacity-60">
                    {isOnline ? 'Algorithme en cours d\'analyse...' : 'Activez votre statut pour recevoir des missions.'}
                  </p>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── AVAILABLE OFFERS ── */}
        {isOnline && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between px-1 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Offres Disponibles</h2>
                {visibleOffers.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[9px] font-black rounded-full border border-emerald-500/20">
                    {visibleOffers.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/driver/orders')}
                className="text-[9px] font-black text-primary uppercase tracking-widest underline underline-offset-4"
              >
                Voir tout
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {visibleOffers.length === 0 ? (
                <motion.div
                  key="empty-offers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[2rem] border border-dashed border-border bg-muted/20 p-6 text-center"
                >
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Aucune offre disponible
                  </p>
                </motion.div>
              ) : (
                visibleOffers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={() => acceptOfferMutation.mutate(offer.id)}
                    onIgnore={() => ignoreOffer(offer.id)}
                    disabled={acceptOfferMutation.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── QUICK ACTIONS 2×3 GRID ── */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 px-1 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Accès Rapide</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(btn => (
              <button key={btn.label} onClick={() => navigate(btn.path)}
                className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-card border border-border active:scale-95 transition-all hover:border-primary/30 group shadow-xl shadow-black/5">
                <div className={cn('w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300', colorMap[btn.color])}>
                  <btn.icon className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{btn.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── PERFORMANCE FOOTER ── */}
        <motion.div variants={itemVariants}
          className="relative overflow-hidden bg-card/80 backdrop-blur-xl rounded-[2.5rem] p-6 border border-border shadow-xl flex items-center gap-4 group">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute -inset-20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" 
          />
          <div className="relative w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Shield className="w-6 h-6 text-primary relative z-10" />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 rounded-2xl border border-primary/30" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              Terminal Vérifié 
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
            </p>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Connecté à {profile.data?.agencyName || 'HUB Central'} · Opérations stabilisées
            </p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default DriverDashboard;



