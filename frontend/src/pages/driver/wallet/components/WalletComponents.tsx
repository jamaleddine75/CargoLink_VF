import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, TrendingUp, CreditCard, Banknote, History,
  CheckCircle2, ChevronRight, Calendar, ArrowUpRight,
  ArrowDownRight, AlertTriangle, Clock, Target, Star,
  RefreshCw, Package, Truck, RotateCcw, Gift, Zap,
  ChevronDown, ChevronUp, Info, X, Building2, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import driverWalletService from '@/services/api/driverWalletService';
import { useAuth } from '@/context/AuthContext';
import { TRANSACTION_LABELS } from '@/lib/constants/walletConstants';

// ====================================================
// SUB-COMPONENTS
// ====================================================

// Carte solde principale
export const BalanceCard = ({ data }) => (
  <Card className="border border-border/60 bg-card shadow-card relative overflow-hidden rounded-[2rem] md:rounded-[3rem] mb-6 min-h-[350px] md:min-h-[420px] group transition-all duration-500 hover:shadow-card-hover">
    {/* Animated mesh background */}
    <div className="absolute inset-0 opacity-50 transition-opacity duration-1000 group-hover:opacity-70">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-sky-500/10" />
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px]"
      />
      <div className="absolute inset-0 grid-pattern opacity-30" />
    </div>

    <CardContent className="p-8 md:p-12 relative z-10 h-full flex flex-col justify-between">
      {/* Top Section */}
      <div className="flex justify-between items-start">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="bg-muted/50 p-5 rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-xl border border-border/40 shadow-xl"
        >
          <Wallet className="w-8 h-8 md:w-10 md:h-10 text-foreground" />
        </motion.div>
        <div className="flex flex-col items-end gap-3">
          <Badge className={`border-none font-black text-[10px] md:text-xs px-5 py-2 rounded-full backdrop-blur-md shadow-xl transition-all ${
            data?.accountStatus === 'VERIFIED'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-rose-500 text-white shadow-rose-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${data?.accountStatus === 'VERIFIED' ? 'bg-white' : 'bg-white/50'}`} />
              {data?.accountStatus === 'VERIFIED' ? 'NODAL SECURE' : 'ACTION REQUIRED'}
            </div>
          </Badge>
          <div className="flex items-center gap-2.5 bg-muted/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-border/60 shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Cycle: <span className="text-foreground">{data?.nextPayoutDate
                ? new Date(data.nextPayoutDate).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })
                : '---'
              }</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center Section: Main Balance */}
      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-4 ml-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            Withdrawable Balance
          </p>
          <div className="group/info relative ml-1">
            <Info className="w-3 h-3 text-muted-foreground/30 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover border border-border rounded-lg text-[9px] font-bold text-popover-foreground opacity-0 group-hover/info:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl">
              This is the money you have earned (commissions) and can transfer to your bank.
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none text-foreground"
          >
            {(data?.balance || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.h2>
          <span className="text-xl md:text-2xl font-black text-primary italic">MAD</span>
        </div>
      </div>

      {/* Bottom Stat Tiles */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-4 mt-10">
        <StatMini
          label="Cash in Hand"
          value={`${(data?.cashInHand || 0).toFixed(2)}`}
          icon={<Banknote className="w-3 h-3 text-amber-500" />}
          color="bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/25"
          textColor="text-amber-500"
          tooltip="Physical cash collected from customers (COD) to be remitted"
        />
        <StatMini
          label="Earnings"
          value={`+${(data?.todayEarnings || 0).toFixed(2)}`}
          icon={<TrendingUp className="w-3 h-3 text-emerald-500" />}
          color="bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25"
          textColor="text-emerald-500"
          tooltip="Your net earnings today"
        />
        <StatMini
          label="Debt"
          value={`${(data?.pendingCOD || 0).toFixed(2)}`}
          icon={<ArrowUpRight className="w-3 h-3 text-rose-500" />}
          color="bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/25"
          textColor="text-rose-500"
          tooltip="Amount you owe to the system (Unremitted COD)"
        />
        <StatMini
          label="Weekly"
          value={`+${(data?.weekEarnings || 0).toFixed(2)}`}
          icon={<Zap className="w-3 h-3 text-primary" />}
          color="bg-primary/10 hover:bg-primary/15 border-primary/25"
          textColor="text-primary"
          tooltip="Total of your earnings over the last 7 days."
        />
      </div>
    </CardContent>
  </Card>
);

export const StatMini = ({ label, value, icon, color, textColor, tooltip }) => (
  <motion.div
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.95 }}
    className={`${color} p-5 rounded-[2.2rem] backdrop-blur-2xl border h-full flex flex-col justify-center transition-all duration-300 shadow-xl group/stat relative`}
  >
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-popover border border-border rounded-lg text-[8px] font-bold text-popover-foreground opacity-0 group-hover/stat:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl text-center">
        {tooltip}
      </div>
    )}
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.1em] leading-none truncate">{label}</p>
    </div>
    <p className={`text-sm sm:text-base font-black ${textColor} leading-none truncate tracking-tight`}>
      {value}
    </p>
  </motion.div>
);

// Alerte COD urgent
export const CodUrgentAlert = ({ urgentOrders, onRemit }) => {
  if (!urgentOrders?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4 mb-4 flex items-center gap-3"
    >
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-red-600">
          {urgentOrders.length} COD en attente depuis +48h !
        </p>
        <p className="text-xs text-red-500/80">
          Remettez les espèces dès que possible pour éviter une déduction
        </p>
      </div>
      <Button
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs flex-shrink-0"
        onClick={onRemit}
      >
        Remettre
      </Button>
    </motion.div>
  );
};

// Carte COD résumé - Style Premium
export const CodSummaryCard = ({ pendingOrders, onRemit }) => {
  const [expanded, setExpanded] = useState(false);
  const total = pendingOrders.reduce((s, o) => s + (o.amount || 0), 0);
  if (!pendingOrders.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-[2.5rem] p-8 mb-8 relative overflow-hidden shadow-card border border-border/60 group hover:shadow-card-hover transition-all duration-500"
    >
      {/* Dynamic background accent */}
      <div className="absolute top-0 right-0 w-32 h-full bg-amber-500/8 skew-x-[-20deg] translate-x-16 group-hover:translate-x-8 transition-transform duration-700" />

      <div className="relative z-10 text-left">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight leading-none mb-1 text-foreground">Espèces en main</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">À remettre à l'agence</p>
          </div>
        </div>

        <div className="bg-muted/40 border border-border/60 rounded-3xl p-6 mb-6 backdrop-blur-xl">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Collecté</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-foreground tracking-tighter">{total.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-sm font-black text-amber-500">MAD</span>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-3 py-1 border-none rounded-lg">
                {pendingOrders.length} COLIS
              </Badge>
            </div>
          </div>
        </div>

        {/* Modèle de gain */}
        <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modèle de Gain</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cet argent appartient aux clients. Votre part est de <span className="text-foreground font-black">80%</span> des frais de livraison — le reste va à votre agence (15%) et à la plateforme (5%).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            variant="ghost"
            className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-widest transition-all"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Masquer' : 'Voir Détails'}
          </Button>
          <Button
            className="h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all border-none"
            onClick={onRemit}
          >
            Déclarer Remise
          </Button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 space-y-3 pt-6 border-t border-border/40"
            >
              {pendingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs">
                  <div>
                    <p className="font-black text-foreground mb-0.5">{order.trackingNumber}</p>
                    <p className="font-bold text-muted-foreground uppercase text-[9px] tracking-widest">{order.receiverName}</p>
                  </div>
                  <p className="font-black text-amber-500">{(order.amount || 0).toFixed(2)} MAD</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Action Buttons Section - Glass tiles
export const ActionButtonsSection = ({ onOpenPayout, balance }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
    <ActionButton 
      icon={<Building2 className="w-7 h-7" />} 
      label="Remise" 
      onClick={() => {}} 
      color="bg-amber-500 text-white shadow-[0_15px_30px_rgba(245,158,11,0.3)]" 
    />
    <ActionButton 
      icon={<CreditCard className="w-7 h-7" />} 
      label="Virement" 
      onClick={onOpenPayout}
      disabled={balance < 100}
      color="bg-primary text-white shadow-[0_15px_30px_rgba(59,130,246,0.3)]"
    />
    <ActionButton 
      icon={<History className="w-7 h-7" />} 
      label="Historique" 
      onClick={() => {}} 
      color="bg-muted text-foreground border border-muted-foreground/10"
    />
  </div>
);

export const ActionButton = ({ icon, label, onClick, disabled = false, color }: { icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean, color: string }) => (
  <motion.button
    whileHover={!disabled ? { y: -8, scale: 1.05 } : {}}
    whileTap={!disabled ? { scale: 0.92 } : {}}
    onClick={onClick}
    disabled={disabled}
    className={`${color} flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] transition-all duration-500 ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'shadow-2xl cursor-pointer hover:brightness-110'}`}
  >
    <div className="drop-shadow-2xl">{icon}</div>
    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] leading-none">{label}</span>
  </motion.button>
);

// Carte performance
export const PerformanceCard = ({ data }) => {
  const weekProgress = Math.min(100, ((data?.weekDeliveries || 0) / (data?.weeklyTarget || 60)) * 100);

  return (
    <Card className="border-none shadow-card bg-card/60 rounded-2xl mb-4">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-black flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-primary">{data?.todayDeliveries || 0}</p>
            <p className="text-[9px] font-black uppercase text-muted-foreground">Aujourd'hui</p>
          </div>
          <div className="text-center border-x border-muted">
            <p className="text-2xl font-black text-blue-500">{data?.weekDeliveries || 0}</p>
            <p className="text-[9px] font-black uppercase text-muted-foreground">Semaine</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-black ${
              (data?.successRate || 0) >= 95 ? 'text-green-500' :
              (data?.successRate || 0) >= 85 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {(data?.successRate || 0).toFixed(0)}%
            </p>
            <p className="text-[9px] font-black uppercase text-muted-foreground">Succès</p>
          </div>
        </div>

        {/* Objectif hebdomadaire */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-muted-foreground">Objectif semaine</span>
            <span className="text-primary">{data?.weekDeliveries}/{data?.weeklyTarget} livraisons</span>
          </div>
          <Progress value={weekProgress} className="h-2 rounded-full" />
          {weekProgress >= 100 && (
            <p className="text-xs text-green-500 font-black mt-1 flex items-center gap-1">
              <Gift className="w-3 h-3" /> Bonus débloqué ! +500 MAD
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Graphique hebdomaire - Style Premium
export const WeeklyChart = ({ data }) => {
  const normalizedData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      
      // Try to find matching day in data
      const existing = (data || []).find(item => item.day.toLowerCase() === dayLabel.toLowerCase());
      last7Days.push({
        day: dayLabel,
        gains: existing ? existing.gains : 0
      });
    }
    return last7Days;
  }, [data]);

  const gains = normalizedData.map(d => d.gains || 0);
  const maxGain = Math.max(...gains, 1);
  const total = gains.reduce((s, g) => s + g, 0);

  return (
    <Card className="border border-border/60 bg-card shadow-card rounded-[3rem] p-10 mt-8 relative overflow-hidden group hover:shadow-card-hover transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-sky-500/5 pointer-events-none" />
      <div className="relative z-10 text-left">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Volume 7 Derniers Jours</h3>
            <p className="text-4xl font-black text-foreground">{total.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-primary">MAD</span></p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 border border-primary/20">
            <TrendingUp className="w-3 h-3" /> 7 derniers jours
          </div>
        </div>

        <div className="flex items-end justify-between h-48 gap-3 sm:gap-4 relative px-2">
          {normalizedData.map((item, i) => {
            const val = item.gains || 0;
            const progress = (val / maxGain) * 100;
            const isLast = i === (data || []).length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                <div className="relative w-full h-full flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "backOut" }}
                    className={`w-full rounded-t-2xl relative transition-all duration-300 shadow-lg ${isLast ? 'bg-primary shadow-primary/20' : 'bg-border dark:bg-muted group-hover/bar:bg-primary/60'}`}
                  >
                    <AnimatePresence>
                      <motion.div
                        key={val}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card border border-border px-2 py-1 rounded-lg text-[9px] font-black text-foreground opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-md"
                      >
                        {val.toFixed(2)} MAD
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                  {isLast && (
                    <div className="absolute inset-0 bg-primary/15 blur-xl -z-10" />
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isLast ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// Item transaction individuel - Style Premium
export const TransactionItem = ({ tx }) => {
  const isLoss = ['DEDUCTION_INCIDENT', 'AVANCE', 'PAIEMENT', 'DEDUCTION_MATERIEL', 'PÉNALITÉ', 'DEDUCTION_EQUIPEMENT', 'COD_REMIS', 'WITHDRAWAL', 'DEBIT'].includes(tx.type);
  const isGain = ['GAIN', 'EARNING', 'BONUS', 'GAIN_LIVRAISON', 'GAIN_RAMASSAGE', 'GAIN_RETOUR', 'BONUS_PERFORMANCE', 'BONUS_WEEKEND', 'BONUS_WEEK_END', 'CREDIT'].includes(tx.type);
  const label = TRANSACTION_LABELS[tx.type] || tx.type.replace(/_/g, ' ');
  
  const getIcon = () => {
    switch (tx.type) {
      case 'GAIN':
      case 'EARNING':
      case 'GAIN_LIVRAISON': return <Package className="w-5 h-5" />;
      case 'COD_COLLECTE':
      case 'COD_COLLECTED': return <Banknote className="w-5 h-5" />;
      case 'COD_REMIS':
      case 'COD_SETTLED': return <Building2 className="w-5 h-5" />;
      case 'PAIEMENT':
      case 'WITHDRAWAL': return <CreditCard className="w-5 h-5" />;
      case 'BONUS':
      case 'BONUS_PERFORMANCE': 
      case 'BONUS_WEEKEND': return <Zap className="w-5 h-5" />;
      case 'DEDUCTION_INCIDENT': return <AlertTriangle className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const getLabelAndColor = () => {
    if (isGain) return { label: (tx.type.includes('BONUS') || tx.type === 'BONUS') ? 'Bonus' : (label || 'Gain'), color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (tx.type === 'COD_COLLECTE' || tx.type === 'COD_COLLECTED') return { label: 'Collecte', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (tx.type === 'COD_REMIS' || tx.type === 'COD_SETTLED') return { label: 'Remise', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    if (tx.type === 'PAIEMENT' || tx.type === 'WITHDRAWAL') return { label: 'Virement', color: 'bg-primary/10 text-primary border-primary/20' };
    return { label: label || 'Audit', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
  };

  const { label, color } = getLabelAndColor();

  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/30 transition-all border-b border-muted/30 last:border-none gap-4"
    >
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 ${isGain ? 'bg-emerald-500/10 text-emerald-500' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {getIcon()}
        </div>
        <div className="text-left">
          <p className="font-black text-sm tracking-tight mb-1 group-hover:text-primary transition-colors">{tx.description}</p>
          <div className="flex flex-wrap items-center gap-3">
             <Badge className={`border-none px-2 py-0 text-[10px] font-black uppercase tracking-widest ${color}`}>
               {label}
             </Badge>
             {(tx.type === 'COD_COLLECTE' || tx.type === 'COD_COLLECTED' || tx.type === 'COD_REMIS' || tx.type === 'COD_SETTLED') && (
               <Badge className="bg-amber-500/5 text-amber-500/40 border-none px-0 text-[10px] font-bold">Encaissement</Badge>
             )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
        <p className={`text-lg font-black tracking-tight ${isLoss ? 'text-red-500' : isGain ? 'text-emerald-500' : 'text-amber-600'}`}>
          {isLoss ? '-' : '+'}{(tx.amount || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-40">MAD</span>
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground opacity-30">
           <Clock className="w-3 h-3" />
           {new Date(tx.createdAt).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};
