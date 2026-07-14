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
  Info,
  LocateFixed
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Custom Map Icons - Premium SVG Markers (CargoLink Design System)
const createSvgMarker = (color: string) => {
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        transform: translate(-16px, -32px);
      ">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const pickupIcon = createSvgMarker('#2563EB'); // Primary Blue
const deliveryIcon = createSvgMarker('#EA580C'); // Accent Orange
const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: #16A34A; /* Success Green */
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      transform: translate(-16px, -16px);
      color: white;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
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
    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-200 border-2 ${
      isCompleted ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-sm' :
      isActive ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm' :
      'bg-muted/50 border-border text-muted-foreground/70'
    }`}>
      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
       <span className="text-xs font-semibold">{step}</span>}
    </div>
    <p className={`text-[10px] mt-2 font-semibold uppercase tracking-wider text-center ${
      isActive ? 'text-[#2563EB]' : isCompleted ? 'text-[#16A34A]' : 'text-muted-foreground/60'
    }`}>
      {title}
    </p>
    {step < 5 && (
      <div className={`absolute left-1/2 top-4 w-full h-[2px] -z-0 ${
        isCompleted ? 'bg-[#16A34A]/30' : 'bg-border'
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
          <Card className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-primary" />
                Localisation sur la carte
              </CardTitle>
              {selectedOrder && (
                <div className="flex gap-1 bg-muted p-1 rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => setRoutingProfile('car')}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all duration-200 ${
                      routingProfile === 'car' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Voiture
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutingProfile('bicycle')}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase transition-all duration-200 ${
                      routingProfile === 'bicycle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Vélo
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 relative">
              {selectedOrder ? (
                <MapContainer 
                  center={effectiveLocations.pickup ? effectiveLocations.pickup : [31.7917, -7.0926]} 
                  zoom={effectiveLocations.pickup ? 13 : 6} 
                  style={{ height: '300px', width: '100%', background: '#f8fafc' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
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
                    color="#2563EB"
                    weight={8}
                    opacity={0.15}
                    lineJoin="round"
                    lineCap="round"
                  />
                  <Polyline 
                    positions={routeGeometry}
                    color="#2563EB"
                    weight={4}
                    opacity={0.85}
                    lineJoin="round"
                    lineCap="round"
                  />
                  
                  {mapBounds && <RecenterMap bounds={mapBounds} />}
                </MapContainer>
              ) : (
                <div className="h-[300px] w-full flex flex-col items-center justify-center text-center p-6 bg-muted/10">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 border border-border">
                    <MapPin className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-1">Visualisation de la carte</h3>
                  <p className="text-muted-foreground max-w-xs text-[11px]">Sélectionnez une expédition dans le volet de gauche pour démarrer le suivi en temps réel.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details & Progress widgets below map */}
          {selectedOrder && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Driver Info Panel */}
              {selectedOrder.driverName && (
                <motion.div 
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm flex-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="text-primary w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Livreur en charge</p>
                      <h3 className="font-bold text-foreground text-sm">{selectedOrder.driverName}</h3>
                      <div className="flex items-center gap-3 mt-1">
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
                        <div className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1">
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

              {/* Status Timeline Panel */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm md:w-[400px]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Progression livraison</p>
                <div className="flex justify-between items-start gap-1">
                  <TimelineItem step={1} title="Créé" isCompleted={getStatusStep(selectedOrder.status) > 1} isActive={getStatusStep(selectedOrder.status) === 1} />
                  <TimelineItem step={2} title="Assigné" isCompleted={getStatusStep(selectedOrder.status) > 2} isActive={getStatusStep(selectedOrder.status) === 2} />
                  <TimelineItem step={3} title="Pris" isCompleted={getStatusStep(selectedOrder.status) > 3} isActive={getStatusStep(selectedOrder.status) === 3} />
                  <TimelineItem step={4} title="Transit" isCompleted={getStatusStep(selectedOrder.status) > 4} isActive={getStatusStep(selectedOrder.status) === 4} />
                  <TimelineItem step={5} title="Livré" isCompleted={getStatusStep(selectedOrder.status) === 5} isActive={false} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingDashboard;
