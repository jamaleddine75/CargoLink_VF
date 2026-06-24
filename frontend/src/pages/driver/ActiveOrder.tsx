import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, MapPin, Phone, Clock, Banknote, AlertTriangle,
  Navigation, CheckCircle2, Loader2, ShieldAlert, ArrowRight,
  PhoneCall, MessageSquare, Copy, CopyCheck, ExternalLink, Package, MoreVertical, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import orderService from '@/services/api/orderService';
import routingService from '@/services/api/routingService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PICKUP: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PICKED_UP: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ON_THE_WAY: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const ActiveOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [incidentNote, setIncidentNote] = useState('');
  const [showRefuseConfirm, setShowRefuseConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-details', id],
    queryFn: () => orderService.getOrderDetails(id!),
    enabled: !!id,
  });

  const { data: etaData, isLoading: isEtaLoading } = useQuery({
    queryKey: ['order-eta', order?.id],
    queryFn: () => routingService.getETA(order!.pickupLat, order!.pickupLng, order!.deliveryLat, order!.deliveryLng),
    enabled: !!order?.pickupLat && !!order?.deliveryLat,
  });

  const refuseMutation = useMutation({
    mutationFn: () => orderService.refuseOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders-active'] });
      toast.info('Mission annulée');
      navigate('/driver/orders');
    },
    onError: () => toast.error('Erreur annulation'),
  });

  const incidentMutation = useMutation({
    mutationFn: (note: string) => orderService.reportProblem(id!, 'INCIDENT', note),
    onSuccess: () => {
      toast.success('Incident signalé');
      setShowIncident(false);
      setIncidentNote('');
    },
    onError: () => toast.error('Erreur signalement'),
  });

  const copyToClipboard = (text: string, label: string, fieldKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copié`);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  if (isLoading) return <OrderSkeleton />;
  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8 text-center">
      <Package className="w-16 h-16 text-muted-foreground/20" />
      <h2 className="text-2xl font-black uppercase tracking-tighter">Mission introuvable</h2>
      <button onClick={() => navigate('/driver/orders')}
        className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest">
        Retour aux missions
      </button>
    </div>
  );

  const isPickup = order.status === 'ASSIGNED' || order.status === 'PICKUP';
  const isDelivery = order.status === 'PICKED_UP' || order.status === 'ON_THE_WAY';
  const isPriority = order.priority === 'URGENT' || order.urgent;
  const statusClass = STATUS_COLOR[order.status] ?? 'bg-muted text-muted-foreground border-border';

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-40 overflow-x-hidden">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl border-b border-border px-5 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">Mission</p>
            <h1 className="text-sm font-black tracking-widest uppercase">{order.trackingNumber}</h1>
          </div>
          <div className="flex items-center gap-2 relative">
            {isPriority && (
              <span className="px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse">
                URGENT
              </span>
            )}
            <div className={cn('px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border', statusClass)}>
              {order.status?.replace('_', ' ')}
            </div>
            <button onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center relative active:scale-95">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()}
                  className="absolute top-10 right-0 bg-card border border-border rounded-2xl shadow-2xl p-2 w-48 z-50">
                  <button onClick={() => { setShowIncident(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-bold text-amber-500 transition-colors text-left">
                    <ShieldAlert className="w-4 h-4" /> Signaler incident
                  </button>
                  {isPickup && (
                    <button onClick={() => { setShowRefuseConfirm(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-bold text-rose-500 transition-colors text-left">
                      <X className="w-4 h-4" /> Refuser mission
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto px-5 mt-6 space-y-5">

        {/* ── RECIPIENT CARD ── */}
        <motion.div variants={itemVariants}
          className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Destinataire</p>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight">{order.receiverName || order.customerName || 'N/D'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{order.receiverPhone || order.customerPhone || 'N/D'}</p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${order.receiverPhone || order.customerPhone}`}
                className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                <PhoneCall className="w-5 h-5 text-white" />
              </a>
              <a href={`sms:${order.receiverPhone || order.customerPhone}`}
                className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center active:scale-95 transition-all">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* ── ETA & INFO GRID ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-3xl p-5 shadow-xl text-center">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">ETA</p>
            {isEtaLoading
              ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-1" />
              : <p className="text-2xl font-black tabular-nums">
                  {Math.round(etaData?.durationMinutes || 15)}
                  <span className="text-xs font-bold text-muted-foreground ml-1">MIN</span>
                </p>
            }
          </div>
          {(order.codAmount ?? 0) > 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 shadow-xl text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Banknote className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-1">COD</p>
              <p className="text-2xl font-black text-amber-400 tabular-nums">
                {order.codAmount}<span className="text-xs font-bold opacity-50 ml-1">MAD</span>
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-5 shadow-xl text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Paiement</p>
              <p className="text-lg font-black text-emerald-400 uppercase">Prépayé</p>
            </div>
          )}
        </motion.div>

        {/* ── ADDRESSES ── */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl space-y-4">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Collecte</p>
              <p className="text-sm font-bold text-foreground/80 leading-snug">{order.pickupAddress}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => copyToClipboard(order.pickupAddress, 'Adresse collecte', 'pickup')}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-all">
                {copiedField === 'pickup'
                  ? <CopyCheck className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <a href={`https://maps.google.com/?q=${order.pickupLat},${order.pickupLng}`} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-all">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>

          <div className="w-px h-6 bg-border ml-5" />

          {/* Delivery */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Livraison</p>
              <p className="text-sm font-bold text-foreground/80 leading-snug">{order.deliveryAddress}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => copyToClipboard(order.deliveryAddress, 'Adresse livraison', 'delivery')}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-all">
                {copiedField === 'delivery'
                  ? <CopyCheck className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <a href={`https://maps.google.com/?q=${order.deliveryLat},${order.deliveryLng}`} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-all">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* ── NOTES ── */}
        {order.deliveryNotes && (
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-[2rem] p-5 shadow-xl">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Instructions</p>
            <p className="text-sm font-bold text-muted-foreground leading-relaxed italic border-l-4 border-primary/30 pl-4 line-clamp-6">
              {order.deliveryNotes}
            </p>
          </motion.div>
        )}
          </div>
        </main>
      </motion.div>

      {/* ── INCIDENT DIALOG ── */}
      <AnimatePresence>
        {showIncident && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="w-full bg-card border-t border-border rounded-t-[3rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter">Signaler un Incident</h3>
                <button onClick={() => setShowIncident(false)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <textarea value={incidentNote} onChange={e => setIncidentNote(e.target.value.slice(0, 500))}
                  placeholder="Décrivez le problème (colis endommagé, client absent, adresse incorrecte...)"
                  rows={4} maxLength={500}
                  className="w-full bg-muted border border-border rounded-2xl p-4 text-sm font-bold resize-none outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50" />
                <span className={cn('absolute bottom-3 right-4 text-[9px] font-bold tabular-nums',
                  incidentNote.length >= 450 ? 'text-rose-400' : 'text-muted-foreground/40')}>
                  {incidentNote.length}/500
                </span>
              </div>
              <button onClick={() => incidentNote.trim() && incidentMutation.mutate(incidentNote)}
                disabled={incidentMutation.isPending || !incidentNote.trim()}
                className="w-full h-14 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40">
                {incidentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '⚠️ Soumettre le Signalement'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REFUSE DIALOG ── */}
      <AnimatePresence>
        {showRefuseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-[3rem] p-8 max-w-sm w-full text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Annuler mission ?</h3>
                <p className="text-sm text-muted-foreground mt-2">Cette action libérera la commande pour un autre chauffeur.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRefuseConfirm(false)}
                  className="flex-1 h-14 bg-muted rounded-2xl font-black text-xs uppercase tracking-widest border border-border">
                  Retour
                </button>
                <button onClick={() => refuseMutation.mutate()} disabled={refuseMutation.isPending}
                  className="flex-1 h-14 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 disabled:opacity-50">
                  {refuseMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY CTA ── */}
      <div className="fixed bottom-0 inset-x-0 p-6 pt-12 bg-gradient-to-t from-background via-background/90 to-transparent z-[60]">
        <div className="max-w-2xl mx-auto">
          {isPickup && (
            <button onClick={() => navigate(`/driver/delivery/${id}`)}
              className="w-full h-18 bg-primary text-primary-foreground rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all group">
              <Navigation className="w-5 h-5" />
              Démarrer la Livraison
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {isDelivery && (
            <button onClick={() => navigate(`/driver/proof/${id}`)}
              className="w-full h-18 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
              <CheckCircle2 className="w-5 h-5" />
              Confirmer la Livraison
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderSkeleton = () => (
  <div className="min-h-screen bg-background p-6 space-y-6">
    <Skeleton className="h-14 w-full rounded-2xl" />
    <Skeleton className="h-28 w-full rounded-[2.5rem]" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
    </div>
    <Skeleton className="h-40 w-full rounded-[2.5rem]" />
  </div>
);

export default ActiveOrder;



