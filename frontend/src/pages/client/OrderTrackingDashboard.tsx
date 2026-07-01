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

const TimelineItem = ({ step, title, status, isActive, isCompleted }: unknown) => (
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

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Fetch Route Geometry from OSRM
  useEffect(() => {
    if (selectedOrder && selectedOrder.pickupLat && selectedOrder.deliveryLat) {
      const fetchRoute = async () => {
        try {
          const profile = routingProfile === 'car' ? 'driving' : 'cycling';
          const url = `https://router.project-osrm.org/route/v1/${profile}/${selectedOrder.pickupLng},${selectedOrder.pickupLat};${selectedOrder.deliveryLng},${selectedOrder.deliveryLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: unknown) => [c[1], c[0]]);
            setRouteGeometry(coords);
          } else {
            setRouteGeometry([
              [selectedOrder.pickupLat!, selectedOrder.pickupLng!],
              [selectedOrder.deliveryLat!, selectedOrder.deliveryLng!]
            ]);
          }
        } catch (error) {
          console.error('Failed to fetch route:', error);
        }
      };
      fetchRoute();
    }
  }, [selectedOrder, routingProfile]);

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

    const subscriptions: unknown[] = [];

    orders.forEach(order => {
      if (['ASSIGNED', 'PICKUP_READY', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status)) {
        const sub = subscribe(`/topic/tracking/${order.id}`, (update: unknown) => {
          setDriverLocations(prev => ({
            ...prev,
            [update.orderId]: { lat: update.driverLat, lng: update.driverLng }
          }));
        });
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
    if (!selectedOrder || !selectedOrder.pickupLat || !selectedOrder.deliveryLat) return null;
    const bounds = L.latLngBounds(
      [selectedOrder.pickupLat, selectedOrder.pickupLng!],
      [selectedOrder.deliveryLat, selectedOrder.deliveryLng!]
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
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground">LIVE TRACKING</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
            Global Logistics Network
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              placeholder="Search tracking #..."
              className="pl-10 bg-accent/20 border-border/60 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-border/60 bg-accent/20">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
        {/* Left Panel: Orders List */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background border border-border/40 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg font-black text-[10px]">ALL</TabsTrigger>
              <TabsTrigger value="active" className="flex-1 rounded-lg font-black text-[10px]">ACTIVE</TabsTrigger>
              <TabsTrigger value="delivered" className="flex-1 rounded-lg font-black text-[10px]">HISTORY</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-3 pb-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <Card className={`cursor-pointer transition-all duration-300 border-none relative overflow-hidden group rounded-2xl ${
                      selectedOrderId === order.id
                        ? 'bg-primary/20 shadow-[inset_0_0_30px_rgba(59,130,246,0.15)] border-l-4 border-l-primary'
                        : 'bg-accent/10 hover:bg-accent/20'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${
                              order.status === 'ON_THE_WAY' ? 'bg-accent/20 text-primary/70' : 'bg-muted text-muted-foreground/50'
                            }`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">TRACKING</p>
                              <div className="mt-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-lg w-fit">
                                <p className="text-[10px] font-mono font-black text-foreground/90 tracking-[0.1em]">{order.trackingNumber}</p>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`font-black text-[10px] py-1 px-3 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-4 relative">
                          <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] bg-muted" />
                          
                          <div className="flex items-start gap-4 pl-6 relative">
                            <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-cyan-500" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Pickup</p>
                              <p className="text-xs text-muted-foreground/60 line-clamp-1 font-bold">{order.pickupAddress}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-4 pl-6 relative">
                            <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-rose-500" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Delivery</p>
                              <p className="text-xs text-muted-foreground/60 line-clamp-1 font-bold">{order.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>

                        {selectedOrderId === order.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {order.driverName ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-primary/20">
                                    <User className="w-4 h-4 text-primary/70" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Driver</p>
                                    <p className="text-[11px] font-black text-foreground">{order.driverName}</p>
                                  </div>
                                </>
                              ) : (
                                <p className="text-[10px] text-muted-foreground/50 italic font-bold">Awaiting Driver Dispatch...</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-primary/70 hover:bg-primary/10">
                              MONITOR <ChevronRight className="w-4 h-4 ml-1" />
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
          <div className="flex-1 rounded-[3rem] overflow-hidden border-[10px] border-background shadow-2xl relative group">
            {selectedOrder && selectedOrder.pickupLat && selectedOrder.deliveryLat ? (
              <>
                <MapContainer 
                  center={[selectedOrder.pickupLat, selectedOrder.pickupLng!]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Vehicle Selector Overlay */}
                  <div className="absolute top-8 left-8 z-[1000] flex gap-2 pointer-events-auto">
                    <div className="bg-accent/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-border/60 flex gap-1">
                      <Button 
                        size="sm" 
                        variant={routingProfile === 'car' ? 'default' : 'ghost'}
                        onClick={() => setRoutingProfile('car')}
                        className={`rounded-full font-black text-[10px] px-5 h-9 ${routingProfile === 'car' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                      >
                        🚗 CAR
                      </Button>
                      <Button 
                        size="sm" 
                        variant={routingProfile === 'bicycle' ? 'default' : 'ghost'}
                        onClick={() => setRoutingProfile('bicycle')}
                        className={`rounded-full font-black text-[10px] px-5 h-9 ${routingProfile === 'bicycle' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                      >
                        🚲 BIKE
                      </Button>
                    </div>
                  </div>
                  
                  {/* Markers */}
                  <Marker position={[selectedOrder.pickupLat, selectedOrder.pickupLng!]} icon={pickupIcon}>
                    <Popup className="custom-popup">
                      <div className="p-2 font-bold text-xs">PICKUP: {selectedOrder.pickupAddress}</div>
                    </Popup>
                  </Marker>
                  
                  <Marker position={[selectedOrder.deliveryLat, selectedOrder.deliveryLng!]} icon={deliveryIcon}>
                    <Popup className="custom-popup">
                      <div className="p-2 font-bold text-xs">DELIVERY: {selectedOrder.deliveryAddress}</div>
                    </Popup>
                  </Marker>

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
                        <div className="p-2 font-bold text-xs">DRIVER: {selectedOrder.driverName}</div>
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
                <div className="absolute bottom-6 left-6 right-6 z-[400] flex flex-col md:flex-row gap-4 pointer-events-none">
                  {/* Driver Info Overlay */}
                  {selectedOrder.driverName && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-background/90 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-2xl flex-1 pointer-events-auto"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                          <User className="text-primary-foreground w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Current Driver</p>
                          <h3 className="font-bold text-foreground text-lg">{selectedOrder.driverName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-secondary/70 font-bold flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> 2.4 km away
                            </span>
                            <span className="text-xs text-muted-foreground/50 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ETA: {selectedOrder.currentEta ? new Date(selectedOrder.currentEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {selectedOrder.slaStatus === 'EXCEEDED' && (
                            <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-500 uppercase">RETARD PRÉVU</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="rounded-xl border-border/60 bg-muted/50 text-secondary/70" onClick={() => window.location.href = `tel:${selectedOrder.driverPhone}`}>
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Status Timeline Overlay */}
                  <div className="bg-muted/90 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-2xl md:w-[400px] pointer-events-auto">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-4">Delivery Progress</p>
                    <div className="flex justify-between items-start gap-1">
                      <TimelineItem step={1} title="Created" isCompleted={getStatusStep(selectedOrder.status) > 1} isActive={getStatusStep(selectedOrder.status) === 1} />
                      <TimelineItem step={2} title="Assigned" isCompleted={getStatusStep(selectedOrder.status) > 2} isActive={getStatusStep(selectedOrder.status) === 2} />
                      <TimelineItem step={3} title="Picked" isCompleted={getStatusStep(selectedOrder.status) > 3} isActive={getStatusStep(selectedOrder.status) === 3} />
                      <TimelineItem step={4} title="Transit" isCompleted={getStatusStep(selectedOrder.status) > 4} isActive={getStatusStep(selectedOrder.status) === 4} />
                      <TimelineItem step={5} title="Done" isCompleted={getStatusStep(selectedOrder.status) === 5} isActive={false} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-background">
                <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6 border border-border/60">
                  <MapPin className="w-10 h-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-bold text-foreground/80 mb-2">Initialize Map View</h3>
                <p className="text-muted-foreground/50 max-w-xs text-sm">Select an order from the left panel to begin real-time logistics tracking and view route diagnostics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingDashboard;
