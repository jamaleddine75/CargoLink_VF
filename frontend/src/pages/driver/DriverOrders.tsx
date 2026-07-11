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
      <div className="sticky top-0 z-50 bg-background border-b border-border px-6 pt-8 pb-4">
        <div className="max-w-md lg:max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/driver/dashboard')} 
                className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
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
              className="w-10 h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all"
            >
              <ScanLine size={18} />
            </button>
          </div>

          {/* SECTION: SEARCH BAR */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher tracking, ville..."
              className="w-full h-10 bg-card border border-border rounded-md pl-9 pr-4 text-sm font-medium focus:outline-none focus:border-primary/50 transition-all text-foreground"
            />
          </div>

          {/* SECTION: TAB BAR */}
          <div className="flex bg-muted/50 p-1 rounded-md border border-border">
            {(['ACTIVE', 'OFFERS', 'COMPLETED'] as const).map((t) => {
              const isActive = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "relative flex-1 py-2 rounded-sm font-black text-[10px] tracking-widest transition-all duration-300 overflow-hidden",
                    isActive ? "text-foreground bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
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
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] tracking-[0.2em] rounded-md border-none group"
                >
                  {optimizeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
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
              <Skeleton key={i} className="h-56 w-full rounded-lg bg-muted border border-border" />
            ))
          ) : filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 text-center flex flex-col items-center bg-card border border-dashed border-border rounded-lg"
            >
              <div className="w-16 h-16 rounded-md bg-accent flex items-center justify-center mb-6 border border-border">
                {activeTab === 'ACTIVE' ? (
                  <Navigation className="w-8 h-8 text-muted-foreground" />
                ) : activeTab === 'OFFERS' ? (
                  <Package className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h4 className="text-sm font-black text-foreground mb-2 uppercase tracking-widest">
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
                  className="mt-8 rounded-md font-black text-[10px] tracking-widest uppercase"
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
                    "bg-card border border-border rounded-lg p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-primary/50",
                    isOutOfRange && "opacity-50"
                  )}
                >
                  {/* Header: Tracking & Status */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                          order.status === 'PICKUP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          'bg-primary/10 text-primary border-primary/20'
                        )}>
                          {order.status?.replace('_', ' ') || (isOffers ? 'OFFRE' : 'LIVRÉ')}
                        </div>
                        {order.urgent && (
                          <div className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                            URGENT
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-foreground tracking-widest uppercase">{order.trackingNumber}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Gains Estimés</p>
                      <p className="text-xl font-black text-foreground tracking-tighter">
                        {order.driverEarnings ? order.driverEarnings.toFixed(2) : '25.00'} <span className="text-[10px] font-bold text-muted-foreground">MAD</span>
                      </p>
                    </div>
                  </div>

                  {/* SECTION: PICKUP→DELIVERY TIMELINE */}
                  <div className="relative pl-8 space-y-6 mb-6 relative z-10">
                    {/* The Visual Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border" />
                    
                    {/* Pickup Point */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-md border-2 border-card bg-amber-500" />
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Collecte</p>
                          {distance !== null && isOffers && (
                            <span className="text-[9px] font-black text-amber-500">{distance.toFixed(1)} km</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-foreground line-clamp-1">
                          {order.senderCity && <span className="text-muted-foreground">{order.senderCity} • </span>}
                          {order.pickupAddress}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Point */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-md border-2 border-card bg-primary" />
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Livraison</p>
                        <p className="text-xs font-bold text-foreground line-clamp-1">
                          {order.receiverCity && <span className="text-muted-foreground">{order.receiverCity} • </span>}
                          {order.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parcel Details Mini-Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                    <div className="bg-muted rounded-md p-3 flex items-center gap-3 border border-border">
                      <div className="w-8 h-8 rounded-md bg-accent text-muted-foreground flex items-center justify-center border border-border">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Poids/Type</p>
                        <p className="text-[10px] font-black text-foreground truncate uppercase">{order.parcelType || 'Standard'}</p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-md p-3 flex items-center gap-3 border border-border">
                      <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Encaissement</p>
                        <p className="text-[10px] font-black text-foreground truncate uppercase">{order.codAmount || 0} MAD</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION: ACTION BUTTONS */}
                  <div className="flex gap-3 relative z-10">
                    {isOffers ? (
                      <>
                        <button 
                          onClick={() => !isOutOfRange && refuseMutation.mutate(order.id)}
                          disabled={refuseMutation.isPending || isOutOfRange}
                          className="w-10 h-10 bg-accent text-muted-foreground rounded-md flex items-center justify-center border border-border hover:bg-muted transition-all duration-300 shrink-0"
                        >
                          {refuseMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle size={18} />}
                        </button>
                        <button 
                          onClick={() => !isOutOfRange && acceptMutation.mutate(order.id)}
                          disabled={acceptMutation.isPending || isOutOfRange}
                          className={cn(
                            "flex-1 h-10 rounded-md font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all",
                            isOutOfRange 
                              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' 
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}
                        >
                          {isOutOfRange ? 'HORS ZONE' : (
                            acceptMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : 'ACCEPTER LA MISSION'
                          )}
                        </button>
                      </>
                    ) : !isCompleted ? (
                        <div className="flex w-full gap-3">
                          <button 
                            onClick={() => setCancelingOrderId(order.id)}
                            className="w-10 h-10 bg-accent text-muted-foreground rounded-md flex items-center justify-center border border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all duration-300 shrink-0"
                          >
                            <XCircle size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/driver/routes/${order.id}`)}
                            className="flex-1 h-10 bg-primary text-primary-foreground rounded-md font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                          >
                            <Navigation size={14} /> OUVRIR LE GPS
                          </button>
                        </div>
                    ) : (
                      <button 
                        onClick={() => navigate(`/driver/orders/${order.id}`)}
                        className="w-full h-10 bg-muted border border-border text-foreground rounded-md font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-muted/80 transition-all"
                      >
                        VOIR LE RÉCAPITULATIF <ArrowRight size={14} className="text-muted-foreground" />
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
                        className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center p-6 z-50"
                      >
                        <div className="w-12 h-12 rounded-md bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                          <AlertTriangle className="w-6 h-6 text-rose-500" />
                        </div>
                        <h4 className="text-sm font-black text-foreground mb-1 uppercase tracking-widest">Annuler cette mission ?</h4>
                        <p className="text-[10px] font-bold text-muted-foreground text-center mb-4 tracking-widest uppercase">{order.trackingNumber}</p>
                        <p className="text-[9px] font-bold text-muted-foreground text-center mb-6 max-w-[220px] leading-relaxed uppercase">
                          La commande sera libérée et réattribuée à un autre chauffeur.
                        </p>
                        <div className="flex gap-3 w-full">
                          <button
                            onClick={() => setCancelingOrderId(null)}
                            className="flex-1 h-10 bg-accent text-foreground rounded-md font-black text-[10px] uppercase tracking-widest border border-border hover:bg-muted transition-colors"
                          >
                            Retour
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                            className="flex-1 h-10 bg-rose-600 text-white rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-colors disabled:opacity-50"
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



