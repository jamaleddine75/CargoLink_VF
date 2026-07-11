import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Package, MapPin, User, Clock,
  Printer, ExternalLink, Activity, KeyRound, Info, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import orderService from '@/services/api/orderService';
import { printShippingLabel } from '@/utils/printUtils';
import { useSocket } from '@/context/SocketContext';
import CargoMap from '@/components/common/CargoMap';
import { cn, formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';

const TimelineHUD = ({ title, subtitle, active, completed, last }: {
  title: string; subtitle?: string; active?: boolean; completed?: boolean; last?: boolean;
}) => (
  <div className="flex gap-4 relative pb-6 group">
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-5 h-5 rounded-full border-2 z-10 transition-all duration-300",
        completed ? "bg-emerald-500 border-emerald-500 text-white"
        : active ? "bg-primary border-primary animate-pulse"
        : "bg-background border-border"
      )} />
      {!last && <div className={cn("w-0.5 flex-1 mt-1 transition-colors duration-300", completed ? "bg-emerald-500/50" : "bg-border")} />}
    </div>
    <div className="pt-0.5">
      <p className={cn(
        "text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
        active ? "text-primary" : completed ? "text-foreground" : "text-muted-foreground/60"
      )}>
        {title}
      </p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
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
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { subscribe, connected } = useSocket();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
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
      if ((err instanceof Error && err.name === 'AbortError') || (signal && signal.aborted)) return;
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
    const sub = subscribe(topic, (updated: any) => {
      setOrder(updated);
      toast.success(`Statut mis à jour : ${updated.status}`);
    });
    return () => (sub as any)?.unsubscribe?.();
  }, [subscribe, connected, id]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-10 w-48 bg-muted rounded-lg" />
      <Skeleton className="h-32 w-full bg-muted rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[300px] lg:col-span-2 bg-muted rounded-lg" />
        <Skeleton className="h-[300px] bg-muted rounded-lg" />
      </div>
    </div>
  );

  if (!order) return null;

  const isDelivered = order.status === 'DELIVERED';
  const isIssue = ['ISSUE', 'CANCELLED', 'FAILED', 'RETURNED'].includes(order.status);

  return (
    <div className="space-y-6 pb-8">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" size="icon" 
            onClick={() => navigate('/client/orders')}
            className="w-9 h-9 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Détails Mission <span className="text-primary">#{order.trackingNumber}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Dossier Logistique Client</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => printShippingLabel(order)} className="gap-2">
            <Printer className="w-4 h-4" /> Étiquette
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/tracking/${order.trackingNumber}`)} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Live Tracking
          </Button>
        </div>
      </div>

      {/* Hero Status Card */}
      <Card className="border border-border bg-card shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">{order.trackingNumber}</span>
                <StatusBadge status={order.status} />
                {order.isRated && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold">Évalué</Badge>}
             </div>
             <p className="text-xs text-muted-foreground">Créé le {formatTimestamp(order.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
             <div className="p-4 rounded-lg bg-muted/40 border border-border min-w-[140px]">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Paiement COD</p>
                <p className="text-lg font-bold text-foreground">{order.codAmount || 0} MAD</p>
             </div>
             <div className="p-4 rounded-lg bg-muted/40 border border-border min-w-[140px]">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Destinataire</p>
                <p className="text-sm font-semibold text-foreground truncate">{order.receiverName}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{order.receiverCity}</p>
             </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline & Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                 <div>
                    <h3 className="text-base font-semibold text-foreground">Cycle de vie de la mission</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Audit logistique en temps réel</p>
                 </div>
                 <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="px-2 pt-2">
                 <TimelineHUD title="Mission Créée" subtitle={formatTimestamp(order.createdAt)} completed={true} />
                 <TimelineHUD title="Validée" subtitle={getStepState(order.status, ['VALIDATED']) === 'completed' ? 'Confirmation logistique' : ''} active={getStepState(order.status, ['VALIDATED']) === 'active'} completed={getStepState(order.status, ['VALIDATED']) === 'completed'} />
                 <TimelineHUD title="Coursier Assigné" subtitle={order.driverName ? `Livreur : ${order.driverName}` : ''} active={getStepState(order.status, ['ASSIGNED']) === 'active'} completed={getStepState(order.status, ['ASSIGNED']) === 'completed'} />
                 <TimelineHUD title="Ramassage" subtitle={order.pickupDate ? formatTimestamp(order.pickupDate) : ''} active={getStepState(order.status, ['PICKUP_READY']) === 'active'} completed={getStepState(order.status, ['PICKUP_READY']) === 'completed'} />
                 <TimelineHUD title="En Cours" subtitle={order.deliveryStartedDate ? "Sorti pour livraison" : ""} active={getStepState(order.status, ['ON_THE_WAY']) === 'active'} completed={getStepState(order.status, ['ON_THE_WAY']) === 'completed'} />
                 <TimelineHUD title="Livré" subtitle={formatTimestamp(order.deliveredAt)} active={isDelivered} completed={isDelivered} last />
              </div>
           </Card>

           {/* Delivery Map */}
           {['ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY'].includes(order.status) && (
              <Card className="h-[350px] rounded-lg overflow-hidden border border-border relative group shadow-sm">
                <CargoMap
                  mode="LIVE"
                  height="100%"
                  points={[
                    { id: 'pickup', lat: order.pickupLat, lng: order.pickupLng, type: 'PICKUP' as const, label: 'Retrait' },
                    { id: 'delivery', lat: order.deliveryLat, lng: order.deliveryLng, type: 'DELIVERY' as const, label: 'Cible' }
                  ].filter(p => p.lat != null)}
                  driverPos={driverLocation || undefined}
                  theme="light"
                  followDriver={true}
                />
                <div className="absolute top-4 left-4 z-[50]">
                   <Badge className="bg-primary text-primary-foreground border-none text-[9px] font-semibold uppercase tracking-wider px-3 py-1">
                      Live Tracking
                   </Badge>
                </div>
              </Card>
           )}
        </div>

        {/* Sidebar Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           {/* PIN CODE — SECURITY */}
           {order.status === 'ON_THE_WAY' && order.deliveryPinCode && (
              <Card className="border border-amber-500/20 bg-amber-500/10 p-6 shadow-sm">
                 <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-5 h-5 text-amber-500" />
                    <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">PIN de Livraison</h4>
                 </div>
                 <p className="text-xs text-muted-foreground mb-4">Veuillez communiquer ce code de sécurité au livreur à l'arrivée.</p>
                 <div className="flex gap-2 justify-center">
                    {order.deliveryPinCode.split('').map((d: string, i: number) => (
                       <div key={i} className="w-10 h-14 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-amber-600">{d}</span>
                       </div>
                    ))}
                 </div>
              </Card>
           )}

           {/* Address HUD */}
           <Card className="border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Coordonnées de livraison</p>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                       <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Adresse</p>
                       <p className="text-xs font-semibold text-foreground leading-relaxed uppercase">{order.deliveryAddress || order.receiverAddress}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                       <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Destinataire</p>
                       <p className="text-xs font-semibold text-foreground uppercase">{order.receiverName}</p>
                       <p className="text-[10px] font-semibold text-primary mt-0.5">{order.receiverPhone}</p>
                    </div>
                 </div>
                 {order.receiverPhone && (
                    <Button onClick={() => window.location.href = `tel:${order.receiverPhone}`} className="w-full mt-2" size="sm" variant="outline">
                       Appeler le Destinataire
                    </Button>
                 )}
              </div>
           </Card>

           {/* Quick Support Widget */}
           <Card className="border border-border bg-muted/30 p-6 shadow-sm">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Besoin d'aide ?</h5>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">Un problème avec cette mission ? Nos agents sont à votre disposition.</p>
              <Button onClick={() => navigate('/client/support')} className="w-full text-xs font-semibold" size="sm" variant="outline">
                 Ouvrir un ticket support
              </Button>
           </Card>
        </div>
      </div>
      
      {/* RATING WIDGET */}
      {isDelivered && !order.isRated && (
        <Card className="border border-primary/20 bg-primary/5 p-6 shadow-sm max-w-xl mx-auto mt-6">
           <div className="flex items-center gap-3 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div>
                 <h4 className="text-sm font-semibold text-foreground">Mission Terminée avec Succès !</h4>
                 <p className="text-xs text-muted-foreground">Évaluez votre coursier pour nous aider à nous améliorer</p>
              </div>
           </div>
           <Button onClick={() => setIsRatingModalOpen(true)} className="w-full" size="sm">
              Donner mon avis
           </Button>
        </Card>
      )}

      {/* Modal Rating */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-lg">
           <DialogHeader>
              <DialogTitle className="text-lg font-bold">Évaluation du service</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                 Votre avis nous aide à maintenir la qualité du service logistique.
              </DialogDescription>
           </DialogHeader>
           <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex gap-1">
                 {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110 active:scale-95 p-1">
                       <Star className={cn("w-8 h-8", (rating >= s) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    </button>
                 ))}
              </div>
              <Textarea 
                placeholder="Un commentaire à ajouter ? (Optionnel)" 
                value={comment} onChange={e => setComment(e.target.value)}
                className="rounded-lg h-20 text-xs resize-none"
              />
              <Button onClick={async () => {
                 try {
                    setIsSubmittingRating(true);
                    await orderService.rateDriver(order.id, rating, comment);
                    toast.success("Merci pour votre retour !");
                    setOrder({...order, isRated: true});
                    setIsRatingModalOpen(false);
                 } catch {
                    toast.error("Impossible d'enregistrer votre note.");
                 } finally { 
                    setIsSubmittingRating(false); 
                 }
              }} disabled={rating === 0 || isSubmittingRating} className="w-full">
                 Envoyer l'évaluation
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOrderDetail;
