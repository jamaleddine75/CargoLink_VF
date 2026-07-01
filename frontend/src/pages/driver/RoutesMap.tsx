import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Home, ChevronLeft, Phone, ChevronRight,
  MapPin, CheckCircle2, Navigation, Loader2,
  WifiOff, Banknote, RotateCcw, Volume2, VolumeX,
  ExternalLink, XCircle, AlertCircle, GripVertical, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useGPS } from '@/hooks/useGPS';
import { useOSRM } from '@/hooks/useOSRM';
import orderService from '@/services/api/orderService';
import routingService from '@/services/api/routingService';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDriverDashboard } from '@/hooks/useDriverDashboard';
import CargoMap, { MapPoint } from '@/components/common/CargoMap';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';
import { ENDPOINTS } from '@/api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavStep = 'TO_PICKUP' | 'AT_PICKUP' | 'CONFIRM_PICKUP' | 'TO_DELIVERY' | 'AT_DELIVERY' | 'COMPLETE_DELIVERY';

// Must match backend OrderStatus enum exactly — no ARRIVED / DELIVERY / IN_TRANSIT
const PICKUP_STATUSES = ['ASSIGNED', 'PICKUP_READY'];
const DELIVERY_STATUSES = ['PICKED_UP', 'ON_THE_WAY'];
const ACTIVE_STATUSES = [...PICKUP_STATUSES, ...DELIVERY_STATUSES];

// Two orders within this radius share the same pickup stop (batch collect)
const SAME_LOCATION_M = 100;
const PROXIMITY_THRESHOLD_M = 50;

// A physical stop the driver visits — may batch multiple orders at the same pickup location
interface TourStop {
  id: string;
  kind: 'PICKUP' | 'DELIVERY';
  orders: Order[];
  lat: number;
  lng: number;
  address: string;
  contactName?: string;
  phone?: string;
  codTotal: number;
}

const STEP_META: Record<NavStep, {
  label: string;
  btn: string;
  icon: React.ElementType;
  color: string;
  tag: string;
}> = {
  TO_PICKUP:         { label: 'En route vers la collecte',  btn: 'JE SUIS AU PICKUP',            icon: Package,      color: '#3B82F6', tag: 'NAVIGATION'   },
  AT_PICKUP:         { label: 'Sur place — Collecte',       btn: 'COLLECTER LES COLIS',           icon: Package,      color: '#F59E0B', tag: 'SUR PLACE'    },
  CONFIRM_PICKUP:    { label: 'Confirmer la réception',     btn: 'COLIS COLLECTÉ ✓',              icon: CheckCircle2, color: '#2563EB', tag: 'CONFIRMATION' },
  TO_DELIVERY:       { label: 'En route vers la livraison', btn: 'JE SUIS ARRIVÉ',                icon: Home,         color: '#6366F1', tag: 'NAVIGATION'   },
  AT_DELIVERY:       { label: 'Zone de livraison atteinte', btn: 'VALIDER & PREUVE DE LIVRAISON', icon: CheckCircle2, color: '#10B981', tag: 'LIVRAISON'    },
  COMPLETE_DELIVERY: { label: 'Prêt pour la preuve',        btn: 'SAISIR LA PREUVE →',            icon: CheckCircle2, color: '#059669', tag: 'FINALISER'    },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmt = {
  dist: (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`,
  eta:  (s: number) => { const m = Math.ceil(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`; },
  haversine: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
interface SortableStopProps {
  stop: TourStop;
  index: number;
  isCurrent: boolean;
  etaMin: number | null;
  onSelect: () => void;
}

const SortableStopItem: React.FC<SortableStopProps> = ({ stop, index, isCurrent, etaMin, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef} style={style}
      className={cn('p-4 rounded-2xl border transition-all mb-3 flex items-center gap-4', isCurrent ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/50')}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
        <GripVertical className="text-muted-foreground" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('px-2 py-0.5 text-[10px] font-black rounded uppercase', stop.kind === 'PICKUP' ? 'bg-blue-500/20 text-blue-500' : 'bg-primary/20 text-primary')}>
            {stop.kind === 'PICKUP' ? '📦 COLLECTE' : `🏠 LIVR. ${index + 1}`}
          </span>
          {stop.orders.length > 1 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded uppercase">
              x{stop.orders.length} colis
            </span>
          )}
          {stop.codTotal > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded uppercase">
              {stop.codTotal} MAD
            </span>
          )}
        </div>
        <p className="text-[11px] font-black text-foreground truncate uppercase">{stop.address}</p>
        {stop.orders.map(o => (
          <p key={o.id} className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{o.trackingNumber}</p>
        ))}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-black text-muted-foreground uppercase">ETA</p>
        <p className={cn('text-xs font-black', etaMin !== null && etaMin < 15 ? 'text-rose-500' : 'text-primary')}>
          {etaMin !== null ? `${etaMin} min` : '--:--'}
        </p>
      </div>
    </div>
  );
};

const ETACascadeHUD: React.FC<{ data: unknown }> = ({ data }) => {
  if (!data?.stops || data.stops.length <= 1) return null;
  const nextStops = data.stops.slice(1, 4);
  return (
    <div className="flex gap-6 px-4 py-2 border-t border-border mt-2 overflow-x-auto no-scrollbar">
      {nextStops.map((stop: unknown, idx: number) => {
        const diffMin = Math.round((new Date(stop.eta).getTime() - Date.now()) / 60000);
        return (
          <div key={idx} className="flex flex-col shrink-0">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em]">Arrêt {idx + 2}</p>
            <p className={cn('text-[11px] font-black', diffMin < 30 ? 'text-rose-500 animate-pulse' : 'text-foreground')}>{diffMin} min</p>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RoutesMap: React.FC = () => {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { handleMutationError } = useOfflineQueue();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';
  const { dashboard, profile } = useDriverDashboard();
  const driverId = profile.data?.id;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<NavStep>('TO_PICKUP');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showStopsList, setShowStopsList] = useState(false);
  const [showTourSummary, setShowTourSummary] = useState(false);
  const [cascadeData, setCascadeData] = useState<unknown>(null);
  const [tourStats, setTourStats] = useState<unknown>(null);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [driverHeading, setDriverHeading] = useState(0);
  const lastCascadePos = useRef<[number, number] | null>(null);
  const watchId = useRef<number | null>(null);

  // ── GPS ────────────────────────────────────────────────────────────────────
  const { driverPos } = useGPS();
  const { nextInstruction, fetchRoute, distanceKm, etaMin } = useOSRM();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: activeOrdersResponse, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['driver-active-orders'],
    queryFn: () => orderService.getDriverActiveOrders(),
    enabled: isDriver,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // All active orders sorted by sequenceIndex
  const orders = useMemo(() => {
    return (activeOrdersResponse || [])
      .filter(o => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => (a.sequenceIndex ?? 999) - (b.sequenceIndex ?? 999));
  }, [activeOrdersResponse]);

  // ── Smart Route: Tour Stops ────────────────────────────────────────────────
  // Phase 1 — PICKUP stops: group nearby orders for batch collection
  // Phase 2 — DELIVERY stops: one per order, already picked up
  const tourStops = useMemo((): TourStop[] => {
    const needsPickup = orders.filter(o => PICKUP_STATUSES.includes(o.status));
    const needsDelivery = orders.filter(o => DELIVERY_STATUSES.includes(o.status));

    // Group pickup orders that share the same physical location (within 100 m)
    const pickupGroups: TourStop[] = [];
    needsPickup.forEach(order => {
      if (!order.pickupLat || !order.pickupLng) return;
      const existing = pickupGroups.find(g =>
        fmt.haversine(g.lat, g.lng, order.pickupLat!, order.pickupLng!) < SAME_LOCATION_M
      );
      if (existing) {
        existing.orders.push(order);
      } else {
        pickupGroups.push({
          id: `pickup-${order.id}`,
          kind: 'PICKUP',
          orders: [order],
          lat: order.pickupLat,
          lng: order.pickupLng,
          address: order.pickupAddress || '',
          contactName: order.pickupContactName,
          phone: order.senderPhone,
          codTotal: 0,
        });
      }
    });

    // One delivery stop per order
    const deliveryStops: TourStop[] = needsDelivery
      .filter(o => o.deliveryLat && o.deliveryLng)
      .map(order => ({
        id: `delivery-${order.id}`,
        kind: 'DELIVERY' as const,
        orders: [order],
        lat: order.deliveryLat!,
        lng: order.deliveryLng!,
        address: order.deliveryAddress || '',
        contactName: order.receiverName,
        phone: order.receiverPhone,
        codTotal: order.codAmount ?? 0,
      }));

    return [...pickupGroups, ...deliveryStops];
  }, [orders]);

  const currentStop = tourStops[currentStopIndex] ?? tourStops[0] ?? null;
  const meta = currentStop ? STEP_META[step] : null;

  // ── Step Sync When Stop Changes ────────────────────────────────────────────
  // Reset to the correct initial step for each new stop
  useEffect(() => {
    if (!currentStop) return;
    setStep(currentStop.kind === 'PICKUP' ? 'TO_PICKUP' : 'TO_DELIVERY');
  }, [currentStop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp index if tourStops shrinks (e.g. after proof submission removes a stop)
  useEffect(() => {
    if (tourStops.length > 0 && currentStopIndex >= tourStops.length) {
      setCurrentStopIndex(tourStops.length - 1);
    }
  }, [tourStops.length, currentStopIndex]);

  // Show tour summary when all stops are done
  useEffect(() => {
    if (!ordersLoading && orders.length === 0 && !showTourSummary) {
      routingService.getTourStats(driverId!).then(s => {
        setTourStats(s);
        setShowTourSummary(true);
      }).catch(() => setShowTourSummary(true));
    }
  }, [orders.length, ordersLoading, driverId, showTourSummary]);

  // Sync stop to URL param
  useEffect(() => {
    if (paramOrderId && tourStops.length > 0) {
      const idx = tourStops.findIndex(s => s.orders.some(o => o.id === paramOrderId));
      if (idx !== -1 && idx !== currentStopIndex) setCurrentStopIndex(idx);
    }
  }, [paramOrderId, tourStops]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'fr-FR'; utt.rate = 1.1; utt.volume = 0.9;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  // ── GPS Watch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation || !currentStop) return;

    navigator.geolocation.getCurrentPosition(p => {
      fetchRoute([p.coords.latitude, p.coords.longitude], [currentStop.lat, currentStop.lng]);
    }, null, { enableHighAccuracy: true });

    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, heading } = pos.coords;
        if (heading !== null) setDriverHeading(heading);
        fetchRoute([latitude, longitude], [currentStop.lat, currentStop.lng]);

        const dist = fmt.haversine(latitude, longitude, currentStop.lat, currentStop.lng);
        if (dist < PROXIMITY_THRESHOLD_M) {
          if (step === 'TO_PICKUP') {
            setStep('AT_PICKUP');
            toast.info('📦 Arrivé au point de collecte !');
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            speak('Vous êtes arrivé au point de collecte');
          } else if (step === 'TO_DELIVERY') {
            setStep('AT_DELIVERY');
            toast.info('🏠 Destination atteinte !');
            if ('vibrate' in navigator) navigator.vibrate([500]);
            speak('Vous êtes arrivé à destination');
          }
        }
      },
      err => console.warn('GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );

    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [step, currentStop?.id, voiceEnabled, speak, fetchRoute]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ETA Cascade ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!driverId) return;
    const fetch = () => routingService.getETACascade(driverId).then(setCascadeData).catch(() => {});
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [driverId]);

  useEffect(() => {
    if (!driverPos || !driverId) return;
    if (!lastCascadePos.current) { lastCascadePos.current = driverPos; return; }
    const dist = fmt.haversine(driverPos[0], driverPos[1], lastCascadePos.current[0], lastCascadePos.current[1]);
    if (dist > 200) {
      lastCascadePos.current = driverPos;
      routingService.getETACascade(driverId).then(setCascadeData);
    }
  }, [driverPos, driverId]);

  // ── Advance to Next Stop ───────────────────────────────────────────────────
  const advanceToNextStop = useCallback(() => {
    if (currentStopIndex < tourStops.length - 1) {
      const nextStop = tourStops[currentStopIndex + 1];
      setCurrentStopIndex(prev => prev + 1);
      setStep(nextStop.kind === 'PICKUP' ? 'TO_PICKUP' : 'TO_DELIVERY');
    }
    // If no more stops, the useEffect above will trigger tour summary
  }, [currentStopIndex, tourStops]);

  // ── Step Handler ───────────────────────────────────────────────────────────
  const handleNextStep = useCallback(async () => {
    if (!currentStop || isAdvancing) return;
    setIsAdvancing(true);

    try {
      const coords = {
        lat: driverPos?.[0] ?? currentStop.lat,
        lng: driverPos?.[1] ?? currentStop.lng,
      };

      const stepActions: Partial<Record<NavStep, () => Promise<void>>> = {

        AT_PICKUP: async () => {
          // Mark all orders in this pickup group as PICKUP_READY
          await Promise.all(currentStop.orders.map(o =>
            orderService.updateOrderStatus(o.id, { status: 'PICKUP_READY' }),
          ));
          queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
        },

        CONFIRM_PICKUP: async () => {
          // Batch-confirm pickup for all orders at this stop.
          // completePickup already suppresses the global 401 interceptor via validateStatus.
          // Any failure (including auth issues on the routing endpoint) falls back to the
          // plain status update so the driver is never logged out by this action.
          await Promise.all(currentStop.orders.map(o =>
            routingService.completePickup(o.id, coords).catch(() =>
              orderService.updateOrderStatus(o.id, { status: 'PICKED_UP' }),
            ),
          ));
          queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
          queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });

          const count = currentStop.orders.length;
          toast.success(`📦 ${count} colis collecté${count > 1 ? 's' : ''} !`);
          speak(count > 1
            ? `${count} colis collectés. En route vers la livraison.`
            : 'Colis collecté. En route vers la livraison.');

          // Advance to the next stop (delivery phase begins)
          advanceToNextStop();
          return; // Skip the automatic step transition below
        },

        TO_DELIVERY: async () => {
          // Officially mark order as ON_THE_WAY when navigation starts
          await orderService.updateOrderStatus(currentStop.orders[0].id, { status: 'ON_THE_WAY' });
          queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
        },

        AT_DELIVERY: async () => {
          // Driver confirmed arrival — navigate to proof submission
          // The proof page handles DELIVERED status via completeDelivery
          navigate(`/driver/delivery/${currentStop.orders[0].id}/proof?from=routes`);
          return; // Don't auto-advance step
        },

        COMPLETE_DELIVERY: async () => {
          navigate(`/driver/delivery/${currentStop.orders[0].id}/proof?from=routes`);
          return;
        },
      };

      if (stepActions[step]) {
        await stepActions[step]!();
        // CONFIRM_PICKUP and AT/COMPLETE_DELIVERY manage their own flow — don't fall through
        if (['CONFIRM_PICKUP', 'AT_DELIVERY', 'COMPLETE_DELIVERY'].includes(step)) return;
      }

      // Normal step progression
      const nextStep: Record<NavStep, NavStep> = {
        TO_PICKUP:         'AT_PICKUP',
        AT_PICKUP:         'CONFIRM_PICKUP',
        CONFIRM_PICKUP:    'TO_DELIVERY',
        TO_DELIVERY:       'AT_DELIVERY',
        AT_DELIVERY:       'COMPLETE_DELIVERY',
        COMPLETE_DELIVERY: 'COMPLETE_DELIVERY',
      };
      setStep(nextStep[step]);

    } catch (err: unknown) {
      console.error('handleNextStep error:', err);
      const handled = handleMutationError(err, {}, null, {
        url: ENDPOINTS.ORDERS.UPDATE_STATUS(currentStop.orders[0]?.id ?? ''),
        method: 'PUT',
      });
      if (!handled) toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsAdvancing(false);
    }
  }, [currentStop, step, isAdvancing, driverPos, advanceToNextStop, navigate, speak, queryClient, handleMutationError]);

  // ── Cancel Mission ─────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => orderService.updateOrderStatus(orderId, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      setShowCancelConfirm(false);
      toast.success('Mission annulée');
      if (orders.length <= 1) navigate('/driver/dashboard');
      else { setCurrentStopIndex(0); setStep('TO_PICKUP'); }
    },
    onError: (err: unknown) => toast.error(err?.response?.data?.message || 'Erreur lors de l\'annulation'),
  });

  // ── Reorder (DnD) ─────────────────────────────────────────────────────────
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => routingService.reorderRoute(driverId!, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
      toast.success('Ordre de tournée mis à jour');
    },
  });

  const reoptimizeMutation = useMutation({
    mutationFn: () => routingService.reoptimizeRoute(driverId!, {
      orderIds: orders.map(o => o.id),
      currentLat: driverPos?.[0] || 0,
      currentLng: driverPos?.[1] || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
      toast.success('Itinéraire optimisé par l\'IA');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tourStops.findIndex(s => s.id === active.id);
    const newIdx = tourStops.findIndex(s => s.id === over.id);
    const newStops = arrayMove(tourStops, oldIdx, newIdx);
    // Flatten to order IDs for backend
    reorderMutation.mutate(newStops.flatMap(s => s.orders.map(o => o.id)));
  };

  // ── Map Points ────────────────────────────────────────────────────────────
  const effectiveDriverPos = useMemo(() =>
    driverPos ? { lat: driverPos[0], lng: driverPos[1] } : undefined,
  [driverPos]);

  const points: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];
    tourStops.forEach((stop, idx) => {
      pts.push({
        id: stop.id,
        lat: stop.lat,
        lng: stop.lng,
        type: stop.kind === 'PICKUP' ? 'PICKUP' : 'DELIVERY',
        label: stop.kind === 'PICKUP' ? `P${idx + 1}` : `${idx + 1}`,
        trackingNumber: stop.orders[0]?.trackingNumber,
      });
    });
    return pts.filter(p => p.lat && p.lng);
  }, [tourStops]);

  const activePointId = currentStop?.id;

  // ─── Loading / Empty ───────────────────────────────────────────────────────
  if (ordersLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chargement des missions...</p>
        </div>
      </div>
    );
  }

  if (!currentStop || !meta) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-accent/30 rounded-full flex items-center justify-center mb-6">
          <Package size={40} className="text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-black uppercase mb-3 text-foreground">Aucune mission active</h3>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-8 max-w-xs">
          Acceptez une mission dans l'onglet Offres pour commencer.
        </p>
        <button onClick={() => navigate('/driver/orders')}
          className="px-8 h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
          Voir les offres
        </button>
        <button onClick={() => navigate('/driver/dashboard')}
          className="mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest underline underline-offset-4">
          Retour au dashboard
        </button>
      </div>
    );
  }

  // ─── Tour progress (pickup stops done = tourStops before first delivery stop)
  const pickupStopsTotal = tourStops.filter(s => s.kind === 'PICKUP').length;
  const deliveryStopsTotal = tourStops.filter(s => s.kind === 'DELIVERY').length;
  const isPickupPhase = currentStop.kind === 'PICKUP';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden bg-background">

      {/* ── MAP ── */}
      <div className="absolute inset-0 z-0">
        <CargoMap
          points={points}
          driverPos={effectiveDriverPos}
          driverHeading={driverHeading}
          followDriver={followMode}
          showRoute
          activePointId={activePointId}
          onRouteUpdate={setRouteInfo}
          onManualInteraction={() => setFollowMode(false)}
          height="100%" zoom={16} theme="light"
        />
      </div>

      {/* ── BATCH PROGRESS BAR ── */}
      <div className="absolute top-0 inset-x-0 z-20 pt-safe">
        <div className="flex gap-1 px-4 pt-2">
          {tourStops.map((s, idx) => (
            <div key={s.id} className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-500',
              idx < currentStopIndex  ? (s.kind === 'PICKUP' ? 'bg-blue-500' : 'bg-emerald-500') :
              idx === currentStopIndex ? 'bg-primary animate-pulse' : 'bg-muted/50 backdrop-blur-sm',
            )} />
          ))}
        </div>
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 inset-x-0 z-30 px-4 pt-safe mt-6">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/driver/dashboard')}
            className="w-12 h-12 rounded-2xl bg-card/90 backdrop-blur-xl shadow-lg border border-border flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronLeft size={22} className="text-foreground" />
          </button>

          <div className="flex-1 bg-card/90 backdrop-blur-xl shadow-lg rounded-2xl flex flex-col divide-y divide-border overflow-hidden border border-border">
            <div className="flex divide-x divide-border">
              <div className="flex-1 py-3 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Distance</p>
                <p className="text-xl font-black text-foreground tabular-nums">
                  {routeInfo.distance > 0 ? fmt.dist(routeInfo.distance) : distanceKm ? `${distanceKm} km` : '—'}
                </p>
              </div>
              <div className="flex-1 py-3 text-center bg-primary">
                <p className="text-[9px] font-black text-primary-foreground/70 uppercase tracking-widest">ETA</p>
                <p className="text-xl font-black text-primary-foreground tabular-nums">
                  {routeInfo.duration > 0 ? fmt.eta(routeInfo.duration) : etaMin ? `${etaMin} min` : '—'}
                </p>
              </div>
            </div>
            <ETACascadeHUD data={cascadeData} />
          </div>

          <button onClick={() => setVoiceEnabled(v => !v)}
            className={cn('w-12 h-12 rounded-2xl shadow-lg border flex items-center justify-center shrink-0 transition-all active:scale-90',
              voiceEnabled ? 'bg-primary border-primary text-primary-foreground' : 'bg-card/90 backdrop-blur-xl border-border text-muted-foreground')}>
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {voiceEnabled && nextInstruction && nextInstruction !== 'Continue on route' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="max-w-lg mx-auto mt-3">
              <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
                <Navigation size={14} className="text-primary shrink-0" />
                <p className="text-[11px] font-bold text-foreground leading-snug">{nextInstruction}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOLLOW / MAPS BUTTONS ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
        <button onClick={() => setFollowMode(f => !f)}
          className={cn('w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all active:scale-90',
            followMode ? 'bg-primary border-primary text-primary-foreground' : 'bg-card/90 backdrop-blur-xl border-border text-muted-foreground')}>
          <Navigation size={18} className={cn(followMode && 'animate-pulse')} style={{ transform: 'rotate(45deg)' }} />
        </button>
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.lat},${currentStop.lng}&travelmode=driving`, '_blank')}
          className="mt-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border bg-card/90 backdrop-blur-xl border-border text-muted-foreground active:scale-90 transition-all">
          <ExternalLink size={16} />
        </button>
      </div>

      {/* ── OFFLINE BANNER ── */}
      <AnimatePresence>
        {!navigator.onLine && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 inset-x-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center pt-safe">
            <div className="flex items-center justify-center gap-2">
              <WifiOff size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">Hors ligne — Actions enregistrées localement</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM PANEL ── */}
      <div className="absolute bottom-0 inset-x-0 z-40 pb-safe pb-4 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step}-${currentStop.id}`}
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="max-w-lg mx-auto bg-card rounded-[2.5rem] shadow-2xl p-6 border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}40` }}>
                  {meta.tag}
                </span>
                {/* Phase badge */}
                <span className={cn('px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest',
                  isPickupPhase ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500')}>
                  {isPickupPhase
                    ? `📦 COLLECTE ${pickupStopsTotal > 1 ? `${currentStopIndex + 1}/${pickupStopsTotal}` : ''}`
                    : `🏠 LIVR. ${deliveryStopsTotal > 1 ? `${currentStopIndex - pickupStopsTotal + 1}/${deliveryStopsTotal}` : ''}`
                  }
                </span>
                {currentStop.orders.length > 1 && (
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg text-[9px] font-black text-amber-500 uppercase tracking-widest">
                    {currentStop.orders.length} colis
                  </span>
                )}
                {currentStop.orders.some(o => o.urgent) && (
                  <span className="px-3 py-1 bg-rose-500 rounded-lg text-[9px] font-black text-white uppercase tracking-widest animate-pulse">URGENT</span>
                )}
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {currentStop.orders[0]?.trackingNumber}
              </p>
            </div>

            {/* Address + Contact */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` }}>
                <MapPin size={26} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  {isPickupPhase ? 'Point de collecte' : 'Adresse de livraison'}
                </p>
                <p className="text-sm font-black text-foreground truncate leading-tight">
                  {currentStop.address || 'Adresse non disponible'}
                </p>
                <p className="text-[11px] font-bold text-muted-foreground truncate mt-1 uppercase tracking-tight">
                  {currentStop.contactName || '—'}
                </p>
              </div>
              {currentStop.phone && (
                <a href={`tel:${currentStop.phone}`}
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border active:scale-90 transition-transform"
                  style={{ backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` }}>
                  <Phone size={20} style={{ color: meta.color }} />
                </a>
              )}
            </div>

            {/* COD reminder (delivery only) */}
            {!isPickupPhase && currentStop.codTotal > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5">
                <Banknote size={18} className="text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Encaissement COD requis</p>
                  <p className="text-lg font-black text-amber-500">{currentStop.codTotal} MAD</p>
                </div>
              </div>
            )}

            {/* Batch pickup info */}
            {isPickupPhase && currentStop.orders.length > 1 && (
              <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-5">
                <Layers size={18} className="text-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Collecte groupée</p>
                  <p className="text-sm font-black text-blue-500">{currentStop.orders.length} colis au même point</p>
                </div>
              </div>
            )}

            {/* Stops list button */}
            <button onClick={() => setShowStopsList(true)}
              className="w-full h-12 mb-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] text-muted-foreground uppercase tracking-[0.12em] bg-accent/30 border border-border transition-all active:scale-[0.98]">
              <Package size={14} />
              <span>📋 Voir tous les arrêts ({tourStops.length})</span>
            </button>

            {/* CTA button */}
            <button onClick={handleNextStep} disabled={isAdvancing}
              className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-sm text-white transition-all active:scale-[0.98] shadow-xl uppercase tracking-[0.12em] disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: meta.color, boxShadow: `0 8px 30px -5px ${meta.color}60` }}>
              {isAdvancing ? <Loader2 size={20} className="animate-spin" /> : (
                <><meta.icon size={18} /><span>{meta.btn}</span><ChevronRight size={18} /></>
              )}
            </button>

            {/* Cancel */}
            <button onClick={() => setShowCancelConfirm(true)}
              className="w-full h-12 mt-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] text-rose-500 uppercase tracking-[0.12em] bg-rose-500/10 border border-rose-500/20 transition-all active:scale-[0.98]">
              <XCircle size={14} /><span>Abandonner cette mission</span>
            </button>

            {/* Cancel confirm overlay */}
            <AnimatePresence>
              {showCancelConfirm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/85 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 z-50">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 border border-rose-500/30">
                    <AlertCircle size={32} className="text-rose-500" />
                  </div>
                  <h4 className="text-base font-black text-foreground mb-2 uppercase tracking-tight">Abandonner la mission ?</h4>
                  <p className="text-[11px] font-bold text-muted-foreground text-center mb-6 max-w-[220px] leading-relaxed">
                    La commande {currentStop.orders[0]?.trackingNumber} sera libérée et réattribuée.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 h-12 bg-muted text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest border border-border active:scale-95">
                      Retour
                    </button>
                    <button onClick={() => cancelMutation.mutate(currentStop.orders[0].id)}
                      disabled={cancelMutation.isPending}
                      className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50 active:scale-95">
                      {cancelMutation.isPending ? 'Annulation...' : 'Confirmer'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── STOPS LIST BOTTOM SHEET ── */}
      <AnimatePresence>
        {showStopsList && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowStopsList(false)}
              className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 z-[70] bg-card rounded-t-[3rem] shadow-2xl border-t border-border flex flex-col max-h-[85vh]">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-6 shrink-0" />
              <div className="px-6 mb-6 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Tournée</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    {pickupStopsTotal} collectes · {deliveryStopsTotal} livraisons · {cascadeData?.totalRemainingKm?.toFixed(1) || '--'} km restant
                  </p>
                </div>
                <button onClick={() => reoptimizeMutation.mutate()} disabled={reoptimizeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20 active:scale-95">
                  <RotateCcw size={14} className={reoptimizeMutation.isPending ? 'animate-spin' : ''} />
                  <span>Ré-optimiser</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-12 custom-scrollbar">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={tourStops.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {tourStops.map((stop, idx) => {
                      const cascadeStop = cascadeData?.stops?.find((s: unknown) =>
                        stop.orders.some(o => o.id === s.orderId)
                      );
                      const etaMinVal = cascadeStop?.eta
                        ? Math.max(0, Math.round((new Date(cascadeStop.eta).getTime() - Date.now()) / 60000))
                        : null;
                      return (
                        <SortableStopItem key={stop.id} stop={stop} index={idx}
                          isCurrent={idx === currentStopIndex} etaMin={etaMinVal}
                          onSelect={() => { setCurrentStopIndex(idx); setShowStopsList(false); }} />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOUR SUMMARY ── */}
      <AnimatePresence>
        {showTourSummary && (
          <div className="absolute inset-0 z-[110] bg-background flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl font-black text-foreground uppercase mb-2">Tournée terminée !</h2>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] mb-12">Félicitations pour votre mission</p>
              <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-card border border-border rounded-3xl p-6">
                  <p className="text-3xl font-black text-primary">{tourStats?.completedOrders ?? orders.length}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Livraisons</p>
                </div>
                <div className="bg-card border border-border rounded-3xl p-6">
                  <p className="text-3xl font-black text-primary">{tourStats?.totalDistanceCovered?.toFixed(1) ?? '--'}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">KM Parcourus</p>
                </div>
                <div className="bg-card border border-border rounded-3xl p-6 col-span-2">
                  <p className="text-3xl font-black text-emerald-500">
                    {orders.reduce((acc, o) => acc + (o.codAmount || 0), 0)} MAD
                  </p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">COD Collectés</p>
                </div>
              </div>
              <button onClick={() => navigate('/driver/dashboard')}
                className="w-full h-16 bg-foreground text-background rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                Retour au dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoutesMap;
