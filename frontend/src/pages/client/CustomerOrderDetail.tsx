import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Package, MapPin, Phone, Clock,
  CheckCircle2, Truck, AlertTriangle, CreditCard,
  RefreshCw, ExternalLink, User, Calendar, Navigation,
  ShieldCheck, ArrowRight, Share2, Printer, Star,
  KeyRound, Gift, Zap, Activity, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import orderService from '@/services/api/orderService';
import ShippingLabel from '@/components/orders/ShippingLabel';
import { printShippingLabel } from '@/utils/printUtils';
import { useSocket } from '@/context/SocketContext';
import CargoMap from '@/components/common/CargoMap';
import { cn } from '@/lib/utils';

// --- Sub-components ---

const TimelineHUD = ({ title, subtitle, active, completed, last }: {
  title: string; subtitle?: string; active?: boolean; completed?: boolean; last?: boolean;
}) => (
  <div className="flex gap-6 relative pb-10 group">
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-6 h-6 rounded-full border-4 z-10 transition-all duration-700",
        completed ? "bg-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        : active ? "bg-primary border-primary/20 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        : "bg-accent/20 border-white/5"
      )} />
      {!last && <div className={cn("w-0.5 flex-1 mt-2 transition-colors duration-500", completed ? "bg-emerald-500/30" : "bg-white/5")} />}
    </div>
    <div className="pt-0.5">
      <p className={cn(
        "text-sm font-black uppercase tracking-widest transition-colors duration-500",
        active ? "text-primary" : completed ? "text-foreground" : "text-muted-foreground/30"
      )}>
        {title}
      </p>
      {subtitle && <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-1.5 italic">{subtitle}</p>}
    </div>
  </div>
);

const statusOrder = [
  'PENDING', 'VALIDATED', 'ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY', 'DELIVERED'
];

function getStepState(currentStatus: string, stepStatuses: string[]) {
  const currentStatusIdx = statusOrder.indexOf(currentStatus);
  const stepMaxIdx = Math.max(...stepStatuses.map(s => statusOrder.indexOf(s)));
  
  if (stepStatuses.includes(currentStatus)) return 'active';
  if (currentStatusIdx > stepMaxIdx) return 'completed';
  return 'pending';
}

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const { subscribe, connected } = useSocket();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);

  const fetchOrder = async (signal?: AbortSignal) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await orderService.getOrderById(id);
      if (signal && signal.aborted) return;
      setOrder(data);
      if (data.driverLat && data.driverLng) {
        setDriverLocation({ lat: data.driverLat, lng: data.driverLng });
      }
    } catch (err: unknown) {
      if (err?.name === 'AbortError' || (signal && signal.aborted)) return;
      toast.error('Mission introuvable');
      navigate('/client/orders');
    } finally {
      if (!(signal && signal.aborted)) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    const interval = setInterval(() => fetchOrder(controller.signal), 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (!subscribe || !connected || !id) return;
    const topic = `/topic/orders/${id}`;
    const sub = subscribe(topic, (updated: unknown) => {
      setOrder(updated);
      toast.success(`Statut mis à jour : ${updated.status}`);
    });
    return () => sub?.unsubscribe();
  }, [subscribe, connected, id]);

  if (loading) return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-12 animate-pulse">
      <Skeleton className="h-14 w-48 bg-white/5 rounded-2xl" />
      <Skeleton className="h-64 w-full bg-white/5 rounded-[2.5rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] bg-white/5 rounded-[2.5rem]" />
        <Skeleton className="h-[400px] bg-white/5 rounded-[2.5rem]" />
      </div>
    </div>
  );

  if (!order) return null;

  const isDelivered = order.status === 'DELIVERED';
  const isIssue = ['ISSUE', 'CANCELLED', 'FAILED', 'RETURNED'].includes(order.status);

  return (
    <div className="min-h-screen bg-background text-foreground space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" size="icon" 
              onClick={() => navigate('/client/orders')}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Dossier Logistique</p>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">Détails <span className="text-primary">Mission</span></h1>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => printShippingLabel(order)} className="h-10 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest gap-2">
            <Printer className="w-3.5 h-3.5" /> Étiquette
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/tracking/${order.trackingNumber}`)} className="h-10 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Live
          </Button>
        </div>
      </div>

      {/* Hero Status HUD */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={cn(
          "border-none rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5",
          isIssue ? "bg-gradient-to-br from-rose-950 to-rose-900" :
          isDelivered ? "bg-gradient-to-br from-emerald-950 to-emerald-900" :
          "bg-gradient-to-br from-indigo-950 to-slate-900"
        )}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-40 translate-x-40 blur-[100px] pointer-events-none" />
          <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Tracking Global</p>
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white italic">{order.trackingNumber}</h2>
                </div>
                <div className="flex items-center gap-3">
                   <Badge className="bg-white/10 text-white border-white/10 px-4 py-1 font-black text-[9px] uppercase tracking-widest">
                      {order.status.replace(/_/g, ' ')}
                   </Badge>
                   {order.isRated && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20 px-3 py-1 font-black text-[9px] uppercase">Évalué</Badge>}
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[200px]">
                   <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-2">Paiement COD</p>
                   <p className="text-2xl font-black text-white">{order.codAmount || 0} <span className="text-xs opacity-30 italic">MAD</span></p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                   <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-2">Destinataire</p>
                   <p className="text-sm font-black text-white uppercase truncate">{order.receiverName}</p>
                   <p className="text-[9px] text-white/30 font-bold uppercase">{order.receiverCity}</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
           <Card className="border-none bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Cycle de vie</h3>
                    <p className="text-[10px] font-black text-muted-foreground/40 dark:text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">Audit en temps réel</p>
                 </div>
                 <Activity className="w-8 h-8 text-primary/40" />
              </div>
              <div className="px-4">
                 <TimelineHUD title="Mission Créée" subtitle={formatTimestamp(order.createdAt)} completed={true} />
                 <TimelineHUD title="Validée" subtitle={getStepState(order.status, ['VALIDATED']) === 'completed' ? 'Confirmation logistique' : ''} active={getStepState(order.status, ['VALIDATED']) === 'active'} completed={getStepState(order.status, ['VALIDATED']) === 'completed'} />
                 <TimelineHUD title="Coursier Assigné" subtitle={order.driverName ? `Livreur : ${order.driverName}` : ''} active={getStepState(order.status, ['ASSIGNED']) === 'active'} completed={getStepState(order.status, ['ASSIGNED']) === 'completed'} />
                 <TimelineHUD title="Ramassage" subtitle={order.pickupDate ? formatTimestamp(order.pickupDate) : ''} active={getStepState(order.status, ['PICKUP_READY']) === 'active'} completed={getStepState(order.status, ['PICKUP_READY']) === 'completed'} />
                 <TimelineHUD title="En Cours" subtitle={order.deliveryStartedDate ? "Sorti pour livraison" : ""} active={getStepState(order.status, ['ON_THE_WAY']) === 'active'} completed={getStepState(order.status, ['ON_THE_WAY']) === 'completed'} />
                 <TimelineHUD title="Livreé" subtitle={formatTimestamp(order.deliveredAt)} active={isDelivered} completed={isDelivered} last />
              </div>
           </Card>

           {/* Delivery Map (Full width in col) */}
           {['ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY'].includes(order.status) && (
              <Card className="h-[400px] rounded-[3rem] overflow-hidden border border-white/5 relative group">
                <CargoMap
                  mode="LIVE"
                  height="100%"
                  points={[
                    { id: 'pickup', lat: order.pickupLat, lng: order.pickupLng, type: 'PICKUP', label: 'Retrait' },
                    { id: 'delivery', lat: order.deliveryLat, lng: order.deliveryLng, type: 'DELIVERY', label: 'Cible' }
                  ].filter(p => p.lat != null)}
                  driverPos={driverLocation || undefined}
                  theme="dark"
                  followDriver={true}
                />
                <div className="absolute top-6 left-6 z-[1000]">
                   <Badge className="bg-primary/80 backdrop-blur-md border-none text-[8px] font-black uppercase tracking-widest px-4 py-1.5">
                      Live Tracking
                   </Badge>
                </div>
              </Card>
           )}
        </div>

        {/* Sidebar Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           {/* PIN CODE — CRITICAL HUD */}
           {order.status === 'ON_THE_WAY' && order.deliveryPinCode && (
              <Card className="border-none bg-amber-500 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                 <KeyRound className="absolute -right-6 -top-6 w-32 h-32 text-black/10 group-hover:rotate-12 transition-transform" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 mb-2">Code de Sécurité</p>
                 <h4 className="text-xl font-black text-black uppercase mb-6 leading-tight">PIN de Livraison</h4>
                 <div className="flex gap-2 justify-center">
                    {order.deliveryPinCode.split('').map((d: string, i: number) => (
                       <div key={i} className="w-12 h-16 bg-black/20 border border-white/20 rounded-2xl flex items-center justify-center">
                          <span className="text-3xl font-black text-white italic">{d}</span>
                       </div>
                    ))}
                 </div>
              </Card>
           )}

           {/* Address HUD */}
           <Card className="border-none bg-card/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Point de Chute</p>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                       <MapPin className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Destination</p>
                       <p className="text-xs font-bold text-foreground leading-relaxed uppercase">{order.deliveryAddress || order.receiverAddress}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                       <User className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Contact</p>
                       <p className="text-xs font-black text-foreground uppercase">{order.receiverName}</p>
                       <p className="text-[10px] font-bold text-primary mt-1">{order.receiverPhone}</p>
                    </div>
                 </div>
                 {order.receiverPhone && (
                    <Button onClick={() => window.location.href = `tel:${order.receiverPhone}`} className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-black uppercase text-[9px] tracking-widest border border-primary/20">
                       Appeler le client
                    </Button>
                 )}
              </div>
           </Card>

           {/* Quick Support Widget */}
           <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                 <Info className="w-12 h-12" />
              </div>
              <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">Besoin d'aide ?</h5>
              <p className="text-[10px] font-bold text-foreground/60 leading-relaxed italic mb-4">Un problème avec cette mission ? Nos agents sont à votre disposition.</p>
              <Button variant="link" onClick={() => navigate('/client/support')} className="p-0 h-auto text-[9px] font-black uppercase tracking-widest text-primary hover:gap-3 transition-all flex items-center gap-2">
                 Ouvrir un ticket <ArrowRight className="w-3.5 h-3.5" />
              </Button>
           </div>
        </div>
      </div>
      
      {/* RATING DRAWER (Success state) */}
      {isDelivered && !order.isRated && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 z-50 pointer-events-none">
           <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="max-w-xl mx-auto pointer-events-auto">
              <Card className="bg-slate-900 border-primary/30 border-2 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(var(--primary),0.3)]">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-tight text-white">Mission Terminée avec Succès !</h4>
                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Évaluez votre expérience</p>
                    </div>
                 </div>
                 <Button onClick={() => setIsRatingModalOpen(true)} className="w-full h-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20">
                    Donner mon avis
                 </Button>
              </Card>
           </motion.div>
        </div>
      )}

      {/* Modal Rating */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-8 max-w-md">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">Évaluation</DialogTitle>
              <DialogDescription className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">Votre avis nous aide à maintenir la qualité du service</DialogDescription>
           </DialogHeader>
           <div className="flex flex-col items-center gap-8 py-6">
              <div className="flex gap-2">
                 {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                       <Star className={cn("w-10 h-10", (rating >= s) ? "fill-amber-400 text-amber-400" : "text-white/10")} />
                    </button>
                 ))}
              </div>
              <Textarea 
                placeholder="Un commentaire ? (Optionnel)" 
                value={comment} onChange={e => setComment(e.target.value)}
                className="bg-white/5 border-white/10 rounded-2xl h-24 text-[11px] font-medium resize-none"
              />
              <Button onClick={async () => {
                 try {
                    setIsSubmittingRating(true);
                    await orderService.rateDriver(order.id, rating, comment);
                    toast.success("Merci pour votre retour !");
                    setOrder({...order, isRated: true});
                    setIsRatingModalOpen(false);
                 } finally { setIsSubmittingRating(false); }
              }} disabled={rating === 0 || isSubmittingRating} className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-xl">
                 Envoyer l'évaluation
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const formatTimestamp = (date: string | null | undefined) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  } catch { return '—'; }
};

export default CustomerOrderDetail;
