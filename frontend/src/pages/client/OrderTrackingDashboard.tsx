import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Phone, 
  User, 
  Package,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import orderService from '@/services/api/orderService';
import { Order } from '@/types';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';

// Custom Map Icons - Premium Badge Style (Matching Screenshot)
const createBadgeIcon = (label: string, color: string, icon: string) => {
  return L.divIcon({
    className: 'custom-badge-icon',
    html: `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        position: relative;
        transform: translate(-50%, -100%);
        filter: drop-shadow(0 12px 24px rgba(0,0,0,0.3));
      ">
        <div style="
          background: ${color}; 
          color: white; 
          padding: 8px 16px; 
          border-radius: 100px; 
          font-weight: 900; 
          font-size: 14px; 
          display: flex; 
          align-items: center; 
          gap: 10px;
          border: 3px solid white;
          white-space: nowrap;
        ">
          <div style="
            background: white; 
            border-radius: 8px; 
            width: 28px; 
            height: 28px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: ${color};
            font-size: 16px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          ">${icon}</div>
          <span style="letter-spacing: -0.02em;">${label}</span>
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 12px solid transparent; 
          border-right: 12px solid transparent; 
          border-top: 15px solid white;
          margin-top: -3px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const pickupIcon = createBadgeIcon('Pickup', '#06b6d4', '📦');
const deliveryIcon = createBadgeIcon('Delivery', '#f43f5e', '📍');
const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `
    <div style="
      width: 48px; 
      height: 48px; 
      background: #3b82f6; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 4px solid white; 
      box-shadow: 0 12px 30px rgba(59, 130, 246, 0.6);
      transform: translate(-50%, -50%);
      font-size: 24px;
    ">
      🚚
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

// Helper component to center map on bounds
const RecenterMap = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [120, 120], animate: true, duration: 1.5 });
    }
  }, [bounds, map]);
  return null;
};

const TimelineItem = ({ step, title, isActive, isCompleted }: { step: number, title: string, isActive: boolean, isCompleted: boolean }) => (
  <div className="flex flex-col items-center flex-1 relative">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-2 ${
      isCompleted ? 'bg-secondary border-secondary/70 text-foreground shadow-[0_0_20px_rgba(16,185,129,0.4)]' :
      isActive ? 'bg-primary border-primary/70 text-primary-foreground animate-pulse shadow-[0_0_25px_rgba(59,130,246,0.6)]' :
      'bg-muted border-border text-muted-foreground'
    }`}>
      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
       <span className="text-sm font-black">{step}</span>}
    </div>
    <p className={`text-[11px] mt-3 font-black uppercase tracking-[0.1em] text-center ${
      isActive ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-muted-foreground/50'
    }`}>
      {title}
    </p>
    {step < 5 && (
      <div className={`absolute left-1/2 top-5 w-full h-[3px] -z-0 ${
        isCompleted ? 'bg-secondary/50' : 'bg-border'
      }`} />
    )}
  </div>
);

const OrderTrackingDashboard = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [routingProfile, setRoutingProfile] = useState<'car' | 'bicycle'>('car');
  const [routeGeometry, setRouteGeometry] = useState<L.LatLngExpression[]>([]);
  
  // Real-time tracking state
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number, lng: number }>>({});

  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedOrderId), 
    [orders, selectedOrderId]
  );

  const getCityCoords = (address: string | undefined): [number, number] | null => {
    if (!address) return null;
    const addr = address.toUpperCase();
    if (addr.includes('TANGER')) return [35.7595, -5.8340];
    if (addr.includes('TETOUAN') || addr.includes('TÉTOUAN')) return [35.5784, -5.3684];
    if (addr.includes('FNIDEQ')) return [35.8456, -5.3219];
    if (addr.includes('MDIQ')) return [35.6858, -5.3253];
    if (addr.includes('CHAOUEN') || addr.includes('CHEFCHAOUEN')) return [35.1716, -5.2697];
    if (addr.includes('CASABLANCA') || addr.includes('CASA')) return [33.5731, -7.5898];
    if (addr.includes('RABAT')) return [34.0209, -6.8416];
    return null;
  };

  const effectiveLocations = useMemo(() => {
    if (!selectedOrder) return { pickup: null, delivery: null };
    
    const pickup: [number, number] | null = selectedOrder.pickupLat && selectedOrder.pickupLng 
      ? [selectedOrder.pickupLat, selectedOrder.pickupLng] 
      : getCityCoords(selectedOrder.pickupAddress);
      
    const delivery: [number, number] | null = selectedOrder.deliveryLat && selectedOrder.deliveryLng 
      ? [selectedOrder.deliveryLat, selectedOrder.deliveryLng] 
      : getCityCoords(selectedOrder.deliveryAddress);
      
    return { pickup, delivery };
  }, [selectedOrder]);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Fetch Route Geometry from OSRM
  useEffect(() => {
    if (selectedOrder && effectiveLocations.pickup && effectiveLocations.delivery) {
      const fetchRoute = async () => {
        try {
          const profile = routingProfile === 'car' ? 'driving' : 'cycling';
          const url = `https://router.project-osrm.org/route/v1/${profile}/${effectiveLocations.pickup[1]},${effectiveLocations.pickup[0]};${effectiveLocations.delivery[1]},${effectiveLocations.delivery[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: unknown) => [c[1], c[0]]);
            setRouteGeometry(coords);
          } else {
            setRouteGeometry([
              effectiveLocations.pickup!,
              effectiveLocations.delivery!
            ]);
          }
        } catch (error) {
          console.error('Failed to fetch route:', error);
        }
      };
      fetchRoute();
    }
  }, [selectedOrder, routingProfile, effectiveLocations]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await orderService.getOrders({ 
        page: 0, 
        size: 50 
      });
      const clientOrders = response.content;
      setOrders(clientOrders);
      
      const inTransit = clientOrders.find(o => o.status === 'ON_THE_WAY' || o.status === 'PICKED_UP');
      if (inTransit) setSelectedOrderId(inTransit.id);
      else if (clientOrders.length > 0) setSelectedOrderId(clientOrders[0].id);

    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket Subscription
  useEffect(() => {
    if (!connected || !subscribe) return;

    const subscriptions: { unsubscribe: () => void }[] = [];

    orders.forEach(order => {
      if (['ASSIGNED', 'PICKUP_READY', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status)) {
        const sub = subscribe(`/topic/tracking/${order.id}`, (update: any) => {
          setDriverLocations(prev => ({
            ...prev,
            [update.orderId]: { lat: update.driverLat, lng: update.driverLng }
          }));
        }) as { unsubscribe: () => void };
        subscriptions.push(sub);
      }
    });

    return () => {
      subscriptions.forEach(sub => sub?.unsubscribe());
    };
  }, [orders, connected, subscribe]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && o.status === 'PENDING';
    if (activeTab === 'active') return matchesSearch && ['ASSIGNED', 'PICKUP_READY', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status);
    if (activeTab === 'delivered') return matchesSearch && o.status === 'DELIVERED';
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-accent/10 text-muted-foreground/60 border-slate-500/20';
      case 'ASSIGNED': return 'bg-primary/10 text-primary/70 border-primary/20';
      case 'PICKUP_READY': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PICKED_UP':
      case 'ON_THE_WAY': return 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'DELIVERED': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'ASSIGNED': return 2;
      case 'PICKUP_READY':
      case 'PICKED_UP': return 3;
      case 'ON_THE_WAY': return 4;
      case 'DELIVERED': return 5;
      default: return 1;
    }
  };

  const mapBounds = useMemo(() => {
    if (!selectedOrder || !effectiveLocations.pickup || !effectiveLocations.delivery) return null;
    const bounds = L.latLngBounds(
      effectiveLocations.pickup,
      effectiveLocations.delivery
    );
    const driverPos = driverLocations[selectedOrder.id] || 
                     (selectedOrder.driverLat ? { lat: selectedOrder.driverLat, lng: selectedOrder.driverLng } : null);
    
    if (driverPos) {
      bounds.extend([driverPos.lat, driverPos.lng]);
    }
    return bounds;
  }, [selectedOrder, driverLocations]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-muted-foreground/60 font-bold animate-pulse">Initializing Tracking Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* Page Header */}
      <PageHeader
        title="Suivi en direct"
        description="Suivez l'état de livraison de vos colis en temps réel sur la carte."
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un numéro de suivi..."
                className="pl-9 h-9 border-border bg-card text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
        {/* Left Panel: Orders List */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-muted border border-border p-1 rounded-lg">
              <TabsTrigger value="all" className="flex-1 rounded-md text-xs font-semibold">Tous</TabsTrigger>
              <TabsTrigger value="active" className="flex-1 rounded-md text-xs font-semibold">Actifs</TabsTrigger>
              <TabsTrigger value="delivered" className="flex-1 rounded-md text-xs font-semibold">Historique</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-3 pb-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <Card className={`cursor-pointer transition-all duration-300 border relative overflow-hidden group rounded-lg ${
                      selectedOrderId === order.id
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${
                              order.status === 'ON_THE_WAY' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SUIVI</p>
                              <p className="text-xs font-mono font-bold text-foreground mt-0.5">{order.trackingNumber}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-semibold py-0.5 px-2 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-3 relative">
                          <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[1px] bg-border" />
                          
                          <div className="flex items-start gap-3 pl-5 relative">
                            <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Départ</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{order.pickupAddress}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3 pl-5 relative">
                            <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-rose-500/10 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Destination</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{order.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>

                        {selectedOrderId === order.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-3 border-t border-border flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {order.driverName ? (
                                <>
                                  <div className="w-6.5 h-6.5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Livreur</p>
                                    <p className="text-[11px] font-bold text-foreground">{order.driverName}</p>
                                  </div>
                                </>
                              ) : (
                                <p className="text-[10px] text-muted-foreground italic font-medium">En attente d'affectation livreur...</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold uppercase text-primary hover:bg-primary/10">
                              Détails <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Map & Details */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          <div className="flex-1 rounded-lg overflow-hidden border border-border bg-card shadow-sm relative group">
            {selectedOrder ? (
              <>
                <MapContainer 
                  center={effectiveLocations.pickup ? effectiveLocations.pickup : [31.7917, -7.0926]} 
                  zoom={effectiveLocations.pickup ? 13 : 6} 
                  style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Vehicle Selector Overlay */}
                  <div className="absolute top-4 left-4 z-[1000] flex gap-2 pointer-events-auto">
                    <div className="bg-card p-1 rounded-md shadow-sm border border-border flex gap-1">
                      <Button 
                        size="sm" 
                        variant={routingProfile === 'car' ? 'default' : 'ghost'}
                        onClick={() => setRoutingProfile('car')}
                        className={`rounded-sm text-[10px] font-semibold px-3 h-8 ${routingProfile === 'car' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        🚗 Voiture
                      </Button>
                      <Button 
                        size="sm" 
                        variant={routingProfile === 'bicycle' ? 'default' : 'ghost'}
                        onClick={() => setRoutingProfile('bicycle')}
                        className={`rounded-sm text-[10px] font-semibold px-3 h-8 ${routingProfile === 'bicycle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        🚲 Vélo
                      </Button>
                    </div>
                  </div>
                  
                  {/* Markers */}
                  {effectiveLocations.pickup && (
                    <Marker position={effectiveLocations.pickup} icon={pickupIcon}>
                      <Popup className="custom-popup">
                        <div className="p-2 font-bold text-xs">Départ: {selectedOrder.pickupAddress}</div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {effectiveLocations.delivery && (
                    <Marker position={effectiveLocations.delivery} icon={deliveryIcon}>
                      <Popup className="custom-popup">
                        <div className="p-2 font-bold text-xs">Arrivée: {selectedOrder.deliveryAddress}</div>
                      </Popup>
                    </Marker>
                  )}
 
                  {/* Driver Marker */}
                  {(driverLocations[selectedOrder.id] || (selectedOrder.driverLat && { lat: selectedOrder.driverLat, lng: selectedOrder.driverLng })) && (
                    <Marker 
                      position={[
                        driverLocations[selectedOrder.id]?.lat || selectedOrder.driverLat!,
                        driverLocations[selectedOrder.id]?.lng || selectedOrder.driverLng!
                      ]} 
                      icon={driverIcon}
                    >
                      <Popup>
                        <div className="p-2 font-bold text-xs">Livreur: {selectedOrder.driverName}</div>
                      </Popup>
                    </Marker>
                  )}
 
                  {/* Enhanced Route Polyline with Glow */}
                  <Polyline
                    positions={routeGeometry}
                    color="#06b6d4"
                    weight={12}
                    opacity={0.2}
                    lineJoin="round"
                    lineCap="round"
                  />
                  <Polyline 
                    positions={routeGeometry}
                    color="#06b6d4"
                    weight={5}
                    opacity={0.9}
                    lineJoin="round"
                    lineCap="round"
                  />
 
                  {mapBounds && <RecenterMap bounds={mapBounds} />}
                </MapContainer>
 
                {/* Floating Map Controls / Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-col md:flex-row gap-4 pointer-events-none">
                  {/* Driver Info Overlay */}
                  {selectedOrder.driverName && (
                    <motion.div 
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-card border border-border rounded-lg p-4 shadow-md flex-1 pointer-events-auto"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="text-primary w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Livreur en charge</p>
                          <h3 className="font-bold text-foreground text-sm">{selectedOrder.driverName}</h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> 2.4 km
                            </span>
                            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {selectedOrder.currentEta ? new Date(selectedOrder.currentEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {selectedOrder.slaStatus === 'EXCEEDED' && (
                            <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span className="text-[9px] font-bold text-rose-500 uppercase">Retard</span>
                            </div>
                          )}
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-border bg-card" onClick={() => window.location.href = `tel:${selectedOrder.driverPhone}`}>
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
 
                  {/* Status Timeline Overlay */}
                  <div className="bg-card border border-border rounded-lg p-4 shadow-md md:w-[400px] pointer-events-auto">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Progression livraison</p>
                    <div className="flex justify-between items-start gap-1">
                      <TimelineItem step={1} title="Créé" isCompleted={getStatusStep(selectedOrder.status) > 1} isActive={getStatusStep(selectedOrder.status) === 1} />
                      <TimelineItem step={2} title="Assigné" isCompleted={getStatusStep(selectedOrder.status) > 2} isActive={getStatusStep(selectedOrder.status) === 2} />
                      <TimelineItem step={3} title="Pris" isCompleted={getStatusStep(selectedOrder.status) > 3} isActive={getStatusStep(selectedOrder.status) === 3} />
                      <TimelineItem step={4} title="Transit" isCompleted={getStatusStep(selectedOrder.status) > 4} isActive={getStatusStep(selectedOrder.status) === 4} />
                      <TimelineItem step={5} title="Livré" isCompleted={getStatusStep(selectedOrder.status) === 5} isActive={false} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-background">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-4 border border-border">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">Visualisation de la carte</h3>
                <p className="text-muted-foreground max-w-xs text-xs">Sélectionnez une expédition dans le volet de gauche pour démarrer le suivi en temps réel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingDashboard;
