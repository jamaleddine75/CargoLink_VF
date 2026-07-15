import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  User, 
  CheckCircle, 
  Navigation, 
  Truck, 
  AlertCircle, 
  Clock,
  Phone,
  Check,
  ChevronsUpDown,
  Search,
  RefreshCw,
  Loader2,
  Banknote,
  MessageSquare
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import apiClient from '@/api/client';
import adminService from '@/services/api/adminService';
import { toast } from 'sonner';
import { Driver } from '@/types';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';

const STATUS_ORDER = ['PENDING', 'VALIDATED', 'ASSIGNED', 'PICKUP_READY', 'ON_THE_WAY', 'DELIVERED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ordered',
  VALIDATED: 'Validated',
  ASSIGNED: 'Assigned',
  PICKUP_READY: 'Pickup Ready',
  ON_THE_WAY: 'In Delivery',
  DELIVERED: 'Delivered',
};

function buildTimeline(order: any) {
  const currentIdx = STATUS_ORDER.indexOf(order?.status);
  return STATUS_ORDER.map((s, i) => {
    const historyEntry = order?.trackingHistory?.find((h: any) => h.status === s);
    return {
      status: STATUS_LABELS[s] || s,
      time: historyEntry?.timestamp
        ? new Date(historyEntry.timestamp).toLocaleString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '--',
      completed: i <= currentIdx,
    };
  });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-accent/30 text-foreground/40 border-border/40",
  VALIDATED: "bg-blue-600/10 text-blue-400 border-blue-500/20",
  ASSIGNED: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20",
  PICKUP_READY: "bg-orange-600/10 text-orange-400 border-orange-500/20",
  ON_THE_WAY: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20",
  DELIVERED: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20",
  ISSUE: "bg-red-600/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-accent/30 text-foreground/40 border-border/40"
};

export default function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [supportIncidents, setSupportIncidents] = useState<any[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setIsLoadingOrder(true);
      try {
        const data = await adminService.getOrderById(id);
        setOrder(data);
      } catch {
        toast.error('Failed to load order details');
      } finally {
        setIsLoadingOrder(false);
      }
    };
    const fetchDrivers = async () => {
      try {
        const data = await adminService.getDrivers();
        setDrivers(data);
      } catch { /* silent */ }
    };

    const fetchIncidents = async () => {
      setIsLoadingIncidents(true);
      try {
        const res = await apiClient.get(`/incidents/order/${id}`);
        setSupportIncidents(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSupportIncidents([]);
      } finally {
        setIsLoadingIncidents(false);
      }
    };

    fetchOrder();
    fetchDrivers();
    fetchIncidents();
  }, [id]);

  const handleAssignDriver = async () => {
    if (!selectedDriverId || !id) return;
    
    setIsAssigning(true);
    try {
        await adminService.assignDriverToOrder(id, selectedDriverId);
        
        const selectedDriver = drivers.find(d => d.id === selectedDriverId);
        if (selectedDriver) {
            setOrder({
                ...order,
                driver: {
                    id: selectedDriver.id,
                    name: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
                    phone: selectedDriver.phoneNumber || "No phone",
                    vehicle: `${selectedDriver.vehicleType || "Vehicle"} - ${selectedDriver.vehiclePlate || "N/A"}`,
                    status: selectedDriver.isActive ? "ACTIVE" : "INACTIVE"
                }
            });
        }
        
        toast.success("Driver reassigned successfully");
        setIsReassignDialogOpen(false);
    } catch (error) {
        toast.error("Error during reassignment");
    } finally {
        setIsAssigning(false);
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="space-y-6 md:space-y-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-accent/20 rounded-xl animate-pulse" />
            <div className="h-3 w-32 bg-accent/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="h-28 rounded-2xl bg-accent/20 animate-pulse" />
              <div className="h-28 rounded-2xl bg-accent/20 animate-pulse" />
            </div>
            <div className="h-64 rounded-2xl bg-accent/20 animate-pulse" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-48 rounded-2xl bg-accent/20 animate-pulse" />
            <div className="h-64 rounded-2xl bg-accent/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="w-20 h-20 rounded-3xl bg-accent/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Order Not Found</h2>
          <p className="text-sm text-muted-foreground">The order you are looking for does not exist or was removed.</p>
        </div>
        <Button onClick={() => navigate('/admin/orders')} variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest h-12 px-8">
          Back to Orders
        </Button>
      </div>
    );
  }

  const pickupAddr = order.pickupAddress
    ? (typeof order.pickupAddress === 'string' ? order.pickupAddress : [order.pickupAddress.street, order.pickupAddress.city].filter(Boolean).join(', '))
    : '—';
  const deliveryAddr = order.deliveryAddress
    ? (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : [order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(', '))
    : '—';
  const senderName = order.clientName || order.senderName || order.client?.firstName || '—';
  const senderPhone = order.clientPhone || order.client?.phoneNumber || '—';
  const recipientName = order.recipientName || order.recipient?.name || '—';
  const recipientPhone = order.recipientPhone || order.recipient?.phone || '—';
  const itemWeight = Array.isArray(order.items)
    ? order.items.reduce((sum: number, item: any) => {
        const quantity = Number(item?.quantity || 1);
        const weight = Number(item?.weight || 0);
        return sum + (weight * quantity);
      }, 0)
    : 0;
  const orderWeight = Number(order.weight ?? order.packageWeight ?? itemWeight);
  const orderCod = order.codAmount ?? order.totalCod ?? order.price ?? 0;
  const orderWeightLabel = orderWeight > 0 ? `${orderWeight.toFixed(2)} kg` : '—';
  const orderCodLabel = orderCod != null ? `${Number(orderCod).toFixed(2)} MAD` : '—';
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('fr-MA') : '—';
  const driverData = order.driver || order.assignedDriver || null;
  const timeline = buildTimeline(order);
  const openIncidents = supportIncidents.filter((incident) => incident.status !== 'CLOSED' && incident.status !== 'RESOLVED');
  const paymentTimeline = [
    { label: 'Deliverede', date: order.paymentTimeline?.deliveredAt || order.deliveredAt, done: !!(order.paymentTimeline?.deliveredAt || order.deliveredAt) },
    { label: 'Cash Collected', date: order.paymentTimeline?.codCollectedAt, done: !!order.paymentTimeline?.codCollectedAt },
    { label: 'Remittance Declared', date: order.paymentTimeline?.remittedToAgencyAt, done: !!order.paymentTimeline?.remittedToAgencyAt },
    { label: 'Agency Confirmed', date: order.paymentTimeline?.confirmedByAgencyAt, done: !!order.paymentTimeline?.confirmedByAgencyAt },
    { label: 'Merchant Settled', date: order.paymentTimeline?.settledToClientAt, done: !!order.paymentTimeline?.settledToClientAt },
  ];
  const merchantNet = Math.max(Number(order.codAmount || 0) - Number(order.deliveryFee || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Order #${order.trackingNumber || order.id}`}
        description={`Created on ${createdAt}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate('/admin/orders')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={() => navigate('/admin/map')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <MapPin className="w-4 h-4" /> Carte
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingOrder && "animate-spin")} /> Refresh
            </Button>
            {order.status === 'VALIDATED' && (
              <Button
                onClick={() => setIsReassignDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                Assigner Driver
              </Button>
            )}
            {(driverData || order.status === 'ON_THE_WAY') && (
              <Button
                onClick={() => setIsReassignDialogOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                Reassign Driver
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-border bg-card shadow-sm rounded-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Claims</p>
                <p className="text-xl font-bold text-foreground">{supportIncidents.length}</p>
              </div>
            </Card>
            <Card className="border border-border bg-card shadow-sm rounded-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-foreground">{openIncidents.length}</p>
              </div>
            </Card>
            <Card className="border border-border bg-card shadow-sm rounded-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Resolved</p>
                <p className="text-xl font-bold text-foreground">{Math.max(0, supportIncidents.length - openIncidents.length)}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border border-border bg-card shadow-sm rounded-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Estimated Weight</p>
                <p className="text-xl font-bold text-foreground">{orderWeightLabel}</p>
              </div>
            </Card>
            <Card className="border border-border bg-card shadow-sm rounded-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">COD Amount</p>
                <p className="text-xl font-bold text-foreground">{orderCodLabel}</p>
              </div>
            </Card>
          </div>

          <Card className="border border-border bg-card rounded-lg shadow-sm">
             <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-semibold text-foreground">Finance de la commande</h3>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Cash flow, agency remittance and merchant settlement</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                   <Banknote className="w-4 h-4" />
                </div>
             </div>
             <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">COD</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{Number(order.codAmount || 0).toFixed(2)} MAD</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Frais livraison</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{Number(order.deliveryFee || 0).toFixed(2)} MAD</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gain driver</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">{Number(order.driverEarnings || 0).toFixed(2)} MAD</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net marchand</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{merchantNet.toFixed(2)} MAD</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {paymentTimeline.map((step) => (
                    <div key={step.label} className="rounded-lg border border-border p-4 bg-card">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{step.label}</p>
                        <span className={cn("w-2.5 h-2.5 rounded-full", step.done ? "bg-emerald-500" : "bg-border")} />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {step.date ? new Date(step.date).toLocaleString('fr-MA') : 'Pending'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
                  Status paiement actuel : <span className="font-semibold text-foreground">{order.paymentStatus || 'PENDING'}</span>
                </div>
             </div>
          </Card>

          <Card className="border border-border bg-card rounded-lg shadow-sm">
             <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-semibold text-foreground">Shipment Details</h3>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Points de passage et contacts</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                   <MapPin className="w-4 h-4" />
                </div>
             </div>

             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Origin</span>
                   </div>
                   <div className="pl-4 space-y-2">
                      <h4 className="text-sm font-bold text-foreground uppercase">{senderName}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed uppercase">{pickupAddr}</p>

                      <div className="pt-2 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                         </div>
                         <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Phone client</p>
                            <p className="text-xs font-semibold text-foreground">{senderPhone}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Destination</span>
                   </div>
                   <div className="pl-4 space-y-2">
                      <h4 className="text-sm font-bold text-foreground uppercase">{recipientName}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed uppercase">{deliveryAddr}</p>

                      <div className="pt-2 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                         </div>
                         <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Recipient Phone</p>
                            <p className="text-xs font-semibold text-foreground">{recipientPhone}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </Card>

          <Card className="border border-border bg-card rounded-lg shadow-sm">
             <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-semibold text-foreground">Support & Claims</h3>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Logistics incident history</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                   <MessageSquare className="w-4 h-4" />
                </div>
             </div>
             <div className="p-6 space-y-4">
                {isLoadingIncidents ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-16 rounded-lg bg-muted" />
                    <div className="h-16 rounded-lg bg-muted" />
                  </div>
                ) : supportIncidents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">No incident reported for this mission</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportIncidents.slice(0, 3).map((incident: any) => (
                      <div key={incident.id} className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">{incident.title || incident.type || 'Incident'}</p>
                          <Badge variant="outline" className={cn('rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider', STATUS_COLORS[incident.status] || STATUS_COLORS.OPEN)}>
                            {incident.status?.replace(/_/g, ' ') || 'OPEN'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{incident.description || 'No description.'}</p>
                        {incident.resolution && (
                          <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Resolution</p>
                            <p className="text-xs text-foreground/80 font-medium">{incident.resolution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-border bg-card rounded-lg shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Driver</h3>
                {driverData && (
                   <button onClick={() => setIsReassignDialogOpen(true)} className="text-primary hover:text-primary/80 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                   </button>
                )}
             </div>

             {driverData ? (
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                         <User className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-foreground uppercase">
                           {driverData.firstName && driverData.lastName ? `${driverData.firstName} ${driverData.lastName}` : driverData.name || '—'}
                         </h4>
                         <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full px-2 py-0.5 text-[8px] font-bold mt-1">
                            ACTIF
                         </Badge>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center gap-3">
                         <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                         <span className="text-xs font-semibold text-foreground">{driverData.phoneNumber || driverData.phone || '—'}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center gap-3">
                         <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                         <span className="text-xs font-semibold text-foreground uppercase tracking-tight">
                           {driverData.vehicleType || 'Vehicle'} — {driverData.vehiclePlate || driverData.vehicle || 'N/A'}
                         </span>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="py-8 text-center space-y-4">
                   <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
                      <Truck className="w-8 h-8" />
                   </div>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No driver assigned</p>
                   <Button onClick={() => setIsReassignDialogOpen(true)} size="sm" className="w-full">
                      Assigner maintenant
                   </Button>
                </div>
             )}
          </Card>

          <Card className="border border-border bg-card rounded-lg shadow-sm p-6">
             <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-6">Historique des Statuss</h3>
             <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {timeline.map((event: any, idx: number) => (
                   <div key={idx} className="relative flex items-start gap-5 group">
                      <div className={cn(
                         "w-6 h-6 rounded-full border-4 border-card z-10 transition-transform duration-300 shadow-sm",
                         event.completed ? "bg-emerald-500 shadow-emerald-500/20" : "bg-muted"
                      )} />
                      <div>
                         <p className={cn(
                            "text-xs font-bold uppercase tracking-wider leading-none mb-1.5",
                            event.completed ? "text-foreground" : "text-muted-foreground"
                         )}>{event.status}</p>
                         <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider">{event.time !== '--' ? event.time : 'Pending'}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </Card>
        </div>
      </div>

      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 bg-card border border-border rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Affecter un Driver</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">Select an available driver for this shipment.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 justify-between border-border bg-card font-medium text-xs text-foreground px-3"
                >
                  {selectedDriverId
                    ? `${drivers.find((d) => d.id === selectedDriverId)?.firstName} ${drivers.find((d) => d.id === selectedDriverId)?.lastName}`
                    : "Select a driver..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 rounded-lg border border-border shadow-md overflow-hidden bg-card" align="start">
                <Command>
                  <CommandInput placeholder="Search by name..." className="h-10 text-xs border-none" />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-6 text-center text-xs font-medium text-muted-foreground">No driver found.</CommandEmpty>
                    <CommandGroup className="p-1">
                      {drivers.map((driver) => (
                        <CommandItem
                          key={driver.id}
                          onSelect={() => {
                            setSelectedDriverId(driver.id);
                            setIsPopoverOpen(false);
                          }}
                          className="rounded-md h-10 px-3 flex items-center justify-between hover:bg-muted cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                  <span className="font-bold text-xs">{driver.firstName} {driver.lastName}</span>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{driver.vehicleType || "Bike/Moto"} • {driver.isActive ? "Online" : "Offline"}</span>
                              </div>
                          </div>
                          <Check className={cn("h-3.5 w-3.5 text-primary", selectedDriverId === driver.id ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2">
             <Button variant="ghost" size="sm" onClick={() => setIsReassignDialogOpen(false)}>
                Cancel
             </Button>
             <Button 
               size="sm"
               onClick={handleAssignDriver}
               disabled={!selectedDriverId || isAssigning}
               className="gap-2"
             >
               {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm l'affectation"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
