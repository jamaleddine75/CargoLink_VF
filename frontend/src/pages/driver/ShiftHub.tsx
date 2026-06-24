import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, TrendingUp, Clock, MapPin, AlertCircle,
  CheckCircle2, Wallet, Activity, Award, Zap, Power, ChevronLeft, Loader2
} from 'lucide-react';
import { useShiftPerformance } from '@/hooks/useShiftPerformance';
import { format, differenceInSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ── Live elapsed timer ─────────────────────────────────────────────────────
function useLiveTimer(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(differenceInSeconds(new Date(), new Date(startedAt)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ShiftHub() {
  const navigate = useNavigate();
  const { shift, weekly, badges, goals, startShiftMutation, endShiftMutation, isLoading } = useShiftPerformance();
  const timer = useLiveTimer(shift.data?.startedAt);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (isLoading || badges.isLoading || goals.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Chargement Shift...</p>
        </div>
      </div>
    );
  }

  const shiftData = shift.data;
  const weeklyData = weekly.data;
  const badgesData = badges.data ?? [];
  const goalsData = goals.data ?? [];

  if (!shiftData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
        <div className="w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center">
          <Activity className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">
            Aucun shift actif
          </p>
          <p className="text-sm text-muted-foreground/60 max-w-[200px]">
            Démarrez un shift pour commencer à suivre vos performances en temps réel.
          </p>
        </div>
        <button
          onClick={() => startShiftMutation.mutate()}
          disabled={startShiftMutation.isPending}
          className="h-16 px-10 rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3"
        >
          {startShiftMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5 fill-current" />
          )}
          {startShiftMutation.isPending ? 'Démarrage...' : 'Démarrer mon Shift'}
        </button>
      </div>
    );
  }

  const handleEndShift = () => {
    if (shiftData?.shiftId) {
      endShiftMutation.mutate(shiftData.shiftId);
      setShowEndConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 font-sans selection:bg-primary/30 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-6 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/driver/dashboard')}
                className="w-11 h-11 rounded-2xl bg-muted border border-border flex items-center justify-center active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <Activity className="w-6 h-6 text-emerald-400" />
                  <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                    Shift Hub
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  Shift Actif · Démarré à {shiftData?.startedAt
                    ? format(new Date(shiftData.startedAt), 'HH:mm', { locale: fr })
                    : '--:--'}
                </p>
              </div>
            </div>

            {/* Live timer */}
            <div className="flex items-center gap-4">
              <div className="text-center bg-muted/50 rounded-2xl px-5 py-3 border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Durée</p>
                <p className="text-2xl font-black tabular-nums tracking-tighter text-foreground font-mono">{timer}</p>
              </div>
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={endShiftMutation.isPending}
                className="relative flex items-center justify-center gap-2 px-7 h-14 bg-rose-500 text-white rounded-[2rem] transition-all font-black text-[11px] uppercase tracking-[0.2em] overflow-hidden shadow-[0_10px_30px_-10px_rgba(244,63,94,0.5)] active:scale-95 disabled:opacity-60">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                />
                <Power className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{endShiftMutation.isPending ? 'Fin...' : 'Terminer'}</span>
              </button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: STATS + GOALS ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Live Performance KPIs */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Performance en Direct
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Livraisons', value: `${shiftData?.successfulDeliveries ?? 0}/${shiftData?.totalDeliveries ?? 0}`, icon: CheckCircle2, color: 'emerald' },
                  { label: 'Gains', value: `${shiftData?.totalEarnings ?? 0} DH`, icon: Wallet, color: 'indigo' },
                  { label: 'Distance', value: `${shiftData?.totalDistanceKm ?? 0} km`, icon: MapPin, color: 'cyan' },
                  { label: 'Tps Moyen', value: `${shiftData?.avgDeliveryTimeMin ?? 0} min`, icon: Clock, color: 'amber' },
                ].map(s => <StatCard key={s.label} {...s} />)}
              </div>
            </motion.section>

            {/* Goals */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card/40 border border-border rounded-3xl p-6">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Objectifs du Jour
              </h2>
              {goalsData.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aucun objectif défini</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {goalsData.map((goal: any, idx: number) => {
                    const goalKey = goal?.id ?? `${goal?.label ?? 'goal'}-${goal?.target ?? 'na'}-${idx}`;
                    return <GoalBar key={goalKey} goal={goal} />;
                  })}
                </div>
              )}
            </motion.section>
          </div>

          {/* ── RIGHT: WEEKLY + BADGES ── */}
          <div className="space-y-6">

            {/* Weekly Summary */}
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 mb-5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Cette Semaine
              </h2>
              <div className="flex items-end gap-4 mb-5">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Gains Totaux</p>
                  <p className="text-3xl font-black text-foreground tabular-nums">{weeklyData?.totalEarnings ?? 0} <span className="text-sm text-muted-foreground font-bold">DH</span></p>
                </div>
                <div className="h-10 w-px bg-border mx-1" />
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Livraisons</p>
                  <p className="text-3xl font-black text-foreground tabular-nums">{weeklyData?.totalDeliveries ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-3 border border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classement Agence</p>
                  <p className="font-bold text-foreground text-sm">
                    Top {weeklyData?.rank ?? '—'} <span className="text-muted-foreground text-xs font-normal">/ {weeklyData?.totalDrivers ?? '—'}</span>
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Badges */}
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="bg-card/40 border border-border rounded-3xl p-6">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 mb-5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Badges & Succès
              </h2>
              {badgesData.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-2xl">
                  <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Continuez pour débloquer</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {badgesData.map((badge: any, idx: number) => {
                    const badgeKey = badge?.id ?? `${badge?.name ?? 'badge'}-${badge?.icon ?? 'na'}-${idx}`;
                    return (
                    <div key={badgeKey}
                      className="flex flex-col items-center p-4 bg-muted/50 rounded-2xl border border-border hover:border-primary/30 transition-colors group cursor-default">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{badge.icon}</div>
                      <h3 className="font-black text-xs text-center text-foreground">{badge.name}</h3>
                      <p className="text-[9px] text-muted-foreground text-center mt-0.5 leading-snug">{badge.description}</p>
                    </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>

      {/* ── END SHIFT CONFIRMATION ── */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-[3rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                <Power className="w-10 h-10 text-rose-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Terminer le shift ?</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Durée : <span className="font-black text-foreground">{timer}</span>
                  <br />Vous ne recevrez plus de nouvelles missions.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 h-14 bg-muted rounded-2xl font-black text-xs uppercase tracking-widest border border-border active:scale-95 transition-all">
                  Continuer
                </button>
                <button onClick={handleEndShift} disabled={endShiftMutation.isPending}
                  className="flex-1 h-14 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50">
                  {endShiftMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Terminer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────── Sub-components ──────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    cyan:    'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={cn('p-5 rounded-3xl border backdrop-blur-sm flex flex-col justify-center', colorMap[color] ?? 'bg-card border-border')}>
      <div className="mb-3">
        <span className={cn('p-2 bg-background/50 rounded-xl border border-border inline-flex', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <h3 className="text-2xl font-black mb-0.5 text-foreground tabular-nums">{value}</h3>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}

function GoalBar({ goal }: { goal: any }) {
  const pct = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
  const done = pct >= 100;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-sm text-foreground">{goal.label}</span>
        <span className="text-sm font-black text-foreground">
          {goal.current} <span className="text-muted-foreground font-medium">/ {goal.target} {goal.unit}</span>
        </span>
      </div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
          className={cn('h-full rounded-full', done ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500')} />
      </div>
      {done && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Objectif atteint!</span>
        </div>
      )}
    </div>
  );
}



