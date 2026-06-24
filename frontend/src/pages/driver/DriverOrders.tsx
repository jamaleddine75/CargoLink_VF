import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Search, ScanLine, MapPin, Package, 
  ArrowRight, RefreshCw, Loader2, Info, AlertTriangle,
  Navigation, CheckCircle2, Clock, XCircle, Filter,
  Sparkles, Zap, Smartphone, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import orderService from '@/services/api/orderService';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateDistance } from '@/utils/geoUtils';
import routingService from '@/services/api/routingService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MissionTab = 'ACTIVE' | 'OFFERS' | 'COMPLETED';

const MAX_RADIUS_KM = 50;

const DriverOrders: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';
  const [activeTab, setActiveTab] = useState<MissionTab>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  // SECTION: GEOLOCATION
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoading(false);
        },
        (error) => {
          console.warn("Location error:", error.message);
          setLocationLoading(false);
          // Only toast if it's not a denial, or show a more helpful message
          if (error.code !== 1) {
            toast.error("Veuillez activer la localisation pour voir les offres à proximité.");
          }
        },
        { timeout: 5000 }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  // SECTION: DATA FETCHING
  const { data: activeOrders, isLoading: loadingActive } = useQuery({
    queryKey: ['driver-orders-active'],
    queryFn: () => orderService.getDriverActiveOrders(),
    enabled: isDriver && activeTab === 'ACTIVE',
  });

  const { data: offersOrdersResponse, isLoading: loadingOffers } = useQuery({
    queryKey: ['driver-orders-offers', currentPos],
    queryFn: () => orderService.getAvailableOrders({ 
      page: 0, 
      size: 30,
      ...(currentPos ? { lat: currentPos.lat, lng: currentPos.lng, radius: MAX_RADIUS_KM } : {})
    }),
    enabled: isDriver && activeTab === 'OFFERS',
  });

  const { data: completedOrders, isLoading: loadingCompleted } = useQuery({
    queryKey: ['driver-orders-completed'],
    queryFn: () => orderService.getDriverHistory({ status: 'DELIVERED', page: 0, size: 20 }),
    enabled: isDriver && activeTab === 'COMPLETED',
  });

  const isLoading = loadingActive || loadingOffers || loadingCompleted;

  // SECTION: MUTATIONS
  const acceptMutation = useMutation({
    mutationFn: (id: string) => orderService.acceptOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders-active'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders-offers'] });
      toast.success('Mission acceptée !');
      setActiveTab('ACTIVE');
    },
    onError: () => toast.error('Erreur lors de l\'acceptation')
  });

  const refuseMutation = useMutation({
    mutationFn: (id: string) => orderService.refuseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders-offers'] });
      toast.info('Offre ignorée');
    },
    onError: () => toast.error('Erreur lors du refus')
  });
  
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrders || activeOrders.length < 2) return;
      const orderIds = activeOrders.map(o => o.id);
      return routingService.optimizeDriverRoute(user!.id, orderIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders-active'] });
      toast.success('Itinéraire optimisé par l\'IA ! 🚀');
    },
    onError: () => toast.error('Échec de l\'optimisation')
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.updateOrderStatus(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders-active'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      setCancelingOrderId(null);
      toast.success('Mission annulée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  });

  // Filter Logic
  const orders = activeTab === 'ACTIVE' ? activeOrders : 
                 activeTab === 'OFFERS' ? offersOrdersResponse?.content : 
                 completedOrders?.content;

  const filteredOrders = (orders || []).filter(o => 
    o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.receiverCity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32 overflow-x-hidden selection:bg-primary/30">
      
      {/* SECTION: STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border px-6 pt-8 pb-4">
        <div className="max-w-md lg:max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/driver/dashboard')} 
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight">Mission Center</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Gérez vos livraisons</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/driver/scan')} 
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <ScanLine size={18} />
            </button>
          </div>

          {/* SECTION: SEARCH BAR */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher tracking, ville..."
              className="w-full h-12 bg-card border border-border rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/50 transition-all shadow-inner text-foreground"
            />
          </div>

          {/* SECTION: TAB BAR */}
          <div className="flex bg-card p-1 rounded-2xl border border-border">
            {(['ACTIVE', 'OFFERS', 'COMPLETED'] as const).map((t) => {
              const isActive = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "relative flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all duration-300 overflow-hidden",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-indigo-600 shadow-lg shadow-indigo-600/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'ACTIVE' ? 'EN COURS' : t === 'OFFERS' ? 'OFFRES' : 'TERMINÉES'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* AI OPTIMIZE BUTTON (ONLY FOR ≥2 ACTIVE) */}
          <AnimatePresence>
            {activeTab === 'ACTIVE' && activeOrders && activeOrders.length >= 2 && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <Button 
                  onClick={() => optimizeMutation.mutate()} 
                  disabled={optimizeMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 border-none group"
                >
                  {optimizeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-3" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
                  )}
                  OPTIMISER LA ROUTE PAR IA
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SECTION: ORDER CARDS GRID */}
      <div className="max-w-md lg:max-w-2xl mx-auto px-6 mt-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-[2.5rem] bg-muted border border-border" />
            ))
          ) : filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 text-center flex flex-col items-center bg-card/30 border border-dashed border-border rounded-[2.5rem]"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                {activeTab === 'ACTIVE' ? (
                  <Navigation className="w-12 h-12 text-indigo-500/50" />
                ) : activeTab === 'OFFERS' ? (
                  <Package className="w-12 h-12 text-amber-500/50" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/50" />
                )}
              </div>
              <h4 className="text-base font-black text-foreground mb-2 uppercase tracking-tight">
                {activeTab === 'ACTIVE' ? 'Aucune mission en cours' : 
                 activeTab === 'OFFERS' ? 'Aucune offre disponible' : 
                 'Historique vide'}
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] leading-relaxed">
                {activeTab === 'ACTIVE' ? 'Consultez l\'onglet "OFFRES" pour trouver de nouvelles missions à proximité.' : 
                 activeTab === 'OFFERS' ? 'Toutes les missions ont été attribuées. Revenez dans quelques instants.' : 
                 'Vos missions livrées apparaîtront ici une fois terminées.'}
              </p>
              {activeTab === 'ACTIVE' && (
                <Button 
                  onClick={() => setActiveTab('OFFERS')}
                  variant="outline"
                  className="mt-8 rounded-xl font-black text-[10px] tracking-widest uppercase border-primary/20 hover:bg-primary/10"
                >
                  Voir les offres
                </Button>
              )}
            </motion.div>
          ) : (
            filteredOrders.map((order) => {
              const isOffers = activeTab === 'OFFERS';
              const isCompleted = activeTab === 'COMPLETED';
              
              const distance = (currentPos && order.pickupLat != null && order.pickupLng != null)
                ? calculateDistance(currentPos.lat, currentPos.lng, order.pickupLat, order.pickupLng)
                : null;
              
              const isOutOfRange = isOffers && distance !== null && distance > MAX_RADIUS_KM;

              return (
                <motion.div
                  key={order.id}
                  variants={itemVariants}
                  className={cn(
                    "bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:bg-card/80",
                    isOutOfRange && "opacity-50"
                  )}
                >
                  {/* Card Glow Effect */}
                  <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all" />

                  {/* Header: Tracking & Status */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          order.status === 'PICKUP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                        )}>
                          {order.status?.replace('_', ' ') || (isOffers ? 'OFFRE' : 'LIVRÉ')}
                        </div>
                        {order.urgent && (
                          <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse">
                            URGENT
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-foreground/90 tracking-widest uppercase">{order.trackingNumber}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gains Estimés</p>
                      <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                        {order.driverEarnings ? order.driverEarnings.toFixed(2) : '25.00'} <span className="text-xs font-bold opacity-50">MAD</span>
                      </p>
                    </div>
                  </div>

                  {/* SECTION: PICKUP→DELIVERY TIMELINE */}
                  <div className="relative pl-8 space-y-8 mb-8 relative z-10">
                    {/* The Visual Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-amber-500/50 to-primary/50 rounded-full" />
                    
                    {/* Pickup Point */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-background bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Collecte</p>
                          {distance !== null && isOffers && (
                            <span className="text-[9px] font-black text-amber-500/70">{distance.toFixed(1)} km</span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-200 uppercase tracking-tight line-clamp-1">
                          {order.senderCity && <span className="text-amber-500">{order.senderCity} • </span>}
                          {order.pickupAddress}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Point */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-background bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Livraison</p>
                        <p className="text-[11px] font-bold text-slate-200 uppercase tracking-tight line-clamp-1">
                          {order.receiverCity && <span className="text-indigo-500">{order.receiverCity} • </span>}
                          {order.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parcel Details Mini-Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                    <div className="bg-muted rounded-2xl p-4 flex items-center gap-4 border border-border">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Poids/Type</p>
                        <p className="text-[10px] font-black text-white truncate uppercase">{order.parcelType || 'Standard'}</p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-2xl p-4 flex items-center gap-4 border border-border">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Encaissement</p>
                        <p className="text-[10px] font-black text-emerald-400 truncate uppercase">{order.codAmount || 0} MAD</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: ACTION BUTTONS */}
                  <div className="flex gap-4 relative z-10">
                    {isOffers ? (
                      <>
                        <button 
                          onClick={() => !isOutOfRange && refuseMutation.mutate(order.id)}
                          disabled={refuseMutation.isPending || isOutOfRange}
                          className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-300 shrink-0"
                        >
                          {refuseMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <XCircle size={24} />}
                        </button>
                        <button 
                          onClick={() => !isOutOfRange && acceptMutation.mutate(order.id)}
                          disabled={acceptMutation.isPending || isOutOfRange}
                          className={cn(
                            "flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-white flex items-center justify-center gap-3 transition-all active:scale-95",
                            isOutOfRange 
                              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' 
                              : 'bg-indigo-600 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
                          )}
                        >
                          {isOutOfRange ? 'HORS ZONE (50KM)' : (
                            acceptMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : 'ACCEPTER LA MISSION'
                          )}
                        </button>
                      </>
                    ) : !isCompleted ? (
                        <div className="flex w-full gap-3">
                          <button 
                            onClick={() => setCancelingOrderId(order.id)}
                            className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300 shrink-0 active:scale-95"
                          >
                            <XCircle size={22} />
                          </button>
                          <button 
                            onClick={() => navigate(`/driver/routesmap/${order.id}`)}
                            className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-primary/90 transition-all active:scale-95"
                          >
                            <Navigation size={18} className="text-indigo-600" /> OUVRIR LE GPS
                          </button>
                        </div>
                    ) : (
                      <button 
                        onClick={() => navigate(`/driver/orders/${order.id}`)}
                        className="w-full h-14 bg-muted border border-border text-foreground rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-muted/80 transition-all active:scale-95"
                      >
                        VOIR LE RÉCAPITULATIF <ArrowRight size={18} className="text-emerald-500" />
                      </button>
                    )}
                  </div>

                  {/* Cancel confirmation overlay */}
                  <AnimatePresence>
                    {cancelingOrderId === order.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 z-50"
                      >
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 border border-rose-500/30">
                          <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h4 className="text-base font-black text-white mb-2 uppercase tracking-tight">Annuler cette mission ?</h4>
                        <p className="text-[11px] font-bold text-slate-400 text-center mb-2 tracking-widest uppercase">{order.trackingNumber}</p>
                        <p className="text-[10px] font-bold text-slate-500 text-center mb-6 max-w-[220px] leading-relaxed">
                          La commande sera libérée et réattribuée à un autre chauffeur.
                        </p>
                        <div className="flex gap-3 w-full">
                          <button
                            onClick={() => setCancelingOrderId(null)}
                            className="flex-1 h-12 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors active:scale-95"
                          >
                            Retour
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-colors disabled:opacity-50 active:scale-95"
                          >
                            {cancelMutation.isPending ? 'Annulation...' : 'Confirmer'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DriverOrders;



