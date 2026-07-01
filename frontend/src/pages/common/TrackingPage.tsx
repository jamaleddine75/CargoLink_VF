/**
 * Live Order Tracking Page
 * - Real-time driver location on map
 * - Countdown timer to estimated delivery
 * - Order details sidebar
 * - Driver info and contact
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  User,
  DollarSign,
  Package,
  ArrowLeft,
  MessageCircle,
  Navigation,
  Zap,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import orderService from '@/services/api/orderService';
import { STATUS_CONFIG } from '@/lib/statusConstants';
import CargoMap, { MapPoint } from '@/components/common/CargoMap';
import { useParams, useNavigate } from 'react-router-dom';

interface TrackingUpdate {
  orderId: string;
  driverLat: number;
  driverLng: number;
  status: string;
  estimatedArrival: string;
  driverName: string;
  vehicleNumber: string;
  driverPhone: string;
}

interface OrderData {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupContactName: string;
  receiverName: string;
  receiverPhone: string;
  codAmount?: number;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  createdAt: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  driverLat?: number;
  driverLng?: number;
}

const CountdownTimer = ({ targetTime }: { targetTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 15;

  return (
    <div className={`text-center p-6 rounded-2xl transition-all ${
      isUrgent 
        ? 'bg-red-500/10 border border-red-500/30' 
        : 'bg-emerald-500/10 border border-emerald-500/30'
    }`}>
      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-3">
        Estimated Arrival
      </p>
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className={`text-4xl font-black ${isUrgent ? 'text-red-600' : 'text-emerald-600'}`}>
            {String(timeLeft.hours).padStart(2, '0')}
          </p>
          <p className="text-xs font-bold text-muted-foreground mt-1">Hours</p>
        </div>
        <p className="text-3xl font-black text-muted-foreground">:</p>
        <div className="text-center">
          <p className={`text-4xl font-black ${isUrgent ? 'text-red-600' : 'text-emerald-600'}`}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </p>
          <p className="text-xs font-bold text-muted-foreground mt-1">Minutes</p>
        </div>
        <p className="text-3xl font-black text-muted-foreground">:</p>
        <div className="text-center">
          <p className={`text-4xl font-black ${isUrgent ? 'text-red-600' : 'text-emerald-600'}`}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </p>
          <p className="text-xs font-bold text-muted-foreground mt-1">Seconds</p>
        </div>
      </div>
      {isUrgent && (
        <p className="text-xs text-red-600 font-bold mt-4 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" /> Driver arriving soon!
        </p>
      )}
    </div>
  );
};

const TrackingPage = ({ orderId: propOrderId }: { orderId?: string }) => {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribe, connected } = useSocket();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingUpdate | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  // Determine if we are using an ID or a Tracking Number
  const identifier = propOrderId || paramOrderId || new URLSearchParams(window.location.search).get('orderId');
  const isTrackingNumber = identifier && (identifier.length > 15 || identifier.includes('-'));

  // Load order on mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        
        if (!identifier) {
          toast.error('Tracking identifier not found');
          return;
        }

        let orderData: unknown;
        if (isTrackingNumber || !user) {
          orderData = await orderService.getPublicTracking(identifier);
        } else {
          orderData = await orderService.getOrderById(identifier);
        }
        setOrder(orderData as unknown as OrderData);

        // Set initial tracking data from order if available
        if (orderData.driverLat && orderData.driverLng) {
          setTracking({
            orderId: orderData.id,
            driverLat: orderData.driverLat,
            driverLng: orderData.driverLng,
            status: orderData.status,
            estimatedArrival: orderData.estimatedDelivery || orderData.deadline || orderData.createdAt,
            driverName: orderData.driverName || 'Driver',
            vehicleNumber: orderData.vehicleNumber || 'N/A',
            driverPhone: orderData.driverPhone || ''
          });
        }
      } catch (error: unknown) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [identifier, user]);

  // Listen to real-time tracking updates via WebSocket
  useEffect(() => {
    if (!subscribe || !connected || !order) return;

    const topic = `/topic/tracking/${order.id}`;
    
    const subscription = subscribe(topic, (data: TrackingUpdate) => {
      setTracking(data);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [subscribe, connected, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground">The order you're looking for doesn't exist or has expired.</p>
            <Button onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
      case 'VALIDATED':
        return <Clock className="w-5 h-5" />;
      case 'ASSIGNED':
        return <Navigation className="w-5 h-5" />;
      case 'PICKUP_READY':
      case 'ON_THE_WAY':
        return <Truck className="w-5 h-5" />;
      case 'DELIVERED':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const config = STATUS_CONFIG[status?.toUpperCase()] || STATUS_CONFIG['PENDING'];
    return config.color;
  };

  const isDelivered = order.status?.toUpperCase() === 'DELIVERED';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Tracking</p>
            <p className="text-lg font-black font-mono">{order.trackingNumber}</p>
          </div>
          <Badge className={`${getStatusBadgeColor(order.status)} border font-bold`}>
            {getStatusIcon(order.status)}
            <span className="ml-2">{order.status}</span>
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl h-[500px] relative bg-[#020617]"
            >
              <CargoMap
                mode="LIVE"
                height="100%"
                points={([
                  { id: 'pickup', lat: order.pickupLat, lng: order.pickupLng, type: 'PICKUP' as const, label: 'Point de retrait' },
                  { id: 'delivery', lat: order.deliveryLat, lng: order.deliveryLng, type: 'DELIVERY' as const, label: 'Destination' }
                ] as MapPoint[]).filter(p => p.lat != null && p.lng != null)}
                driverPos={tracking ? { lat: tracking.driverLat, lng: tracking.driverLng } : undefined}
                activePointId="delivery"
                showRoute={order.status === 'ON_THE_WAY'}
                followDriver={order.status === 'ON_THE_WAY'}
                theme="dark"
                zoom={14}
              />
              
              {!tracking && !isDelivered && (
                <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
                      <Truck className="w-8 h-8 text-indigo-400" />
                   </div>
                   <h4 className="text-xl font-black uppercase tracking-tight text-white mb-2">Assigning Driver</h4>
                   <p className="text-sm text-white/50 max-w-xs">We're finding the best courier for your delivery. Tracking will begin shortly.</p>
                </div>
              )}
            </motion.div>

            {/* Countdown Timer */}
            {!isDelivered && order.estimatedDelivery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CountdownTimer targetTime={order.estimatedDelivery} />
              </motion.div>
            )}

            {/* Order Status Timeline */}
            <Card className="border-none shadow-card bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Created */}
                  <div className="flex gap-4 pb-4 border-b border-border/50">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="w-0.5 h-12 bg-border/50 mt-1" />
                    </div>
                    <div className="pt-1">
                      <p className="font-bold">Order Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Assigned */}
                  <div className="flex gap-4 pb-4 border-b border-border/50">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        order.status?.toUpperCase() === 'ASSIGNED'
                          ? 'bg-blue-500/20 border-blue-500'
                          : order.status?.toUpperCase() === 'PICKUP_READY' || order.status?.toUpperCase() === 'ON_THE_WAY' || isDelivered
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-muted border-border/50'
                      }`}>
                        <Truck className={`w-5 h-5 ${
                          order.status?.toUpperCase() === 'ASSIGNED' || 
                          order.status?.toUpperCase() === 'PICKUP_READY' || order.status?.toUpperCase() === 'ON_THE_WAY' || isDelivered
                          ? 'text-blue-600'
                          : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="w-0.5 h-12 bg-border/50 mt-1" />
                    </div>
                    <div className="pt-1">
                      <p className="font-bold">Driver Assigned</p>
                      <p className="text-sm text-muted-foreground">
                        {tracking ? `${tracking.driverName} - ${tracking.vehicleNumber}` : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* In Transit */}
                  <div className="flex gap-4 pb-4 border-b border-border/50">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        order.status?.toUpperCase() === 'PICKUP_READY' || order.status?.toUpperCase() === 'ON_THE_WAY' || isDelivered
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-muted border-border/50'
                      }`}>
                        <Navigation className={`w-5 h-5 ${
                          order.status?.toUpperCase() === 'PICKUP_READY' || order.status?.toUpperCase() === 'ON_THE_WAY' || isDelivered
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="w-0.5 h-12 bg-border/50 mt-1" />
                    </div>
                    <div className="pt-1">
                      <p className="font-bold">On the Way</p>
                      <p className="text-sm text-muted-foreground">
                        {(order.status?.toUpperCase() === 'PICKUP_READY' || order.status?.toUpperCase() === 'ON_THE_WAY') ? 'Driver en route' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Delivered */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isDelivered
                          ? 'bg-emerald-500/20 border-emerald-500'
                          : 'bg-muted border-border/50'
                      }`}>
                        <CheckCircle2 className={`w-5 h-5 ${
                          isDelivered
                          ? 'text-emerald-600'
                          : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                    <div className="pt-1">
                      <p className="font-bold">Delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {isDelivered ? 'Parcel delivered successfully' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order Details */}
          <div className="space-y-6">
            {/* Driver Info Card */}
            {tracking && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-none shadow-card bg-card/40 backdrop-blur-md overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-primary" />
                      Your Driver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Name</p>
                      <p className="font-bold text-lg">{tracking.driverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                      <Badge variant="outline" className="font-bold">{tracking.vehicleNumber}</Badge>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        onClick={() => {
                          if (tracking.driverPhone) {
                            window.location.href = `tel:${tracking.driverPhone}`;
                          }
                        }}
                        className="flex-1 h-10 rounded-lg gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        disabled={!tracking.driverPhone}
                      >
                        <Phone className="w-4 h-4" /> Call
                      </Button>
                      <Button
                        onClick={() => setContactOpen(!contactOpen)}
                        variant="outline"
                        className="flex-1 h-10 rounded-lg gap-2 font-bold"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Shipment Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-none shadow-card bg-card/40 backdrop-blur-md overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-blue-500" />
                    Shipment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">From</p>
                    <p className="font-bold text-sm">{order.pickupContactName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.pickupAddress}</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">To</p>
                    <p className="font-bold text-sm">{order.receiverName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.deliveryAddress}</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Amount to Collect</p>
                    <p className="text-2xl font-black text-amber-600">{order.codAmount} <span className="text-sm">MAD</span></p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Connection Status */}
            <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border/50 flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
              <p className="text-muted-foreground">
                {connected ? 'Live tracking active' : 'Reconnecting...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setContactOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-background p-6 space-y-4"
            >
              <h3 className="text-lg font-black">Contact Driver</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Driver: {tracking?.driverName}</p>
                <p className="text-sm text-muted-foreground">Phone: {tracking?.driverPhone || 'N/A'}</p>
              </div>
              <Button onClick={() => setContactOpen(false)} className="w-full">
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackingPage;
