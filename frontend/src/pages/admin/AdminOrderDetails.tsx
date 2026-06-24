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
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  return STATUS_ORDER.map((s, i) => {
    const historyEntry = order.trackingHistory?.find((h: any) => h.status === s);
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
  const latestIncident = supportIncidents[0];

  return (
    <div className="space-y-6 md:space-y-10 relative">
      {/* Background Decor */}
      <div className="absolute -top-24 -left-24 w-96 h-96 glow-orb opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/admin/orders')}
            className="group p-4 bg-accent/20 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/[0.05] hover:text-foreground transition-all duration-300 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none">Order {order.trackingNumber || order.id}</h1>
               <Badge className={cn("rounded-xl px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none shadow-sm", STATUS_COLORS[order.status] || "bg-slate-100 text-muted-foreground/70")}>
                  {(order.status || '').replace(/_/g, ' ')}
               </Badge>
            </div>
            <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.2em]">
               Created on <span className="text-foreground">{createdAt}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button
            onClick={() => navigate('/admin/map')}
            variant="outline"
            className="flex-1 md:flex-none rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 bg-accent/20 backdrop-blur-sm border border-white/10 transition-all"
          >
            <MapPin className="w-4 h-4 mr-2" /> View Map
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex-1 md:flex-none rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 bg-accent/20 backdrop-blur-sm border border-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          {order.status === 'VALIDATED' && (
            <Button
                onClick={() => setIsReassignDialogOpen(true)}
                className="flex-1 md:flex-none rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 bg-blue-600 hover:bg-blue-700 text-foreground shadow-xl shadow-blue-600/30 transition-all active:scale-95">
              Assign Driver
            </Button>
          )}
          {(driverData || order.status === 'ON_THE_WAY') && (
            <Button onClick={() => setIsReassignDialogOpen(true)} variant="outline" className="flex-1 md:flex-none rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 bg-accent/20 backdrop-blur-sm border border-white/10 transition-all">
              Reassign Driver
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

        <div className="lg:col-span-8 space-y-8">

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 flex items-center gap-6 border-none shadow-xl bg-accent/20 backdrop-blur-sm rounded-[2rem]">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-foreground shadow-lg shadow-rose-600/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1">Support Incidents</p>
              <p className="text-2xl font-black text-foreground tracking-tight">{supportIncidents.length}</p>
            </div>
          </div>
          <div className="glass-card p-8 flex items-center gap-6 border-none shadow-xl bg-accent/20 backdrop-blur-sm rounded-[2rem]">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center text-foreground shadow-lg shadow-amber-600/20">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1">Open Queue</p>
              <p className="text-2xl font-black text-foreground tracking-tight">{openIncidents.length}</p>
            </div>
          </div>
          <div className="glass-card p-8 flex items-center gap-6 border-none shadow-xl bg-accent/20 backdrop-blur-sm rounded-[2rem]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-foreground shadow-lg shadow-emerald-600/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1">Resolved</p>
              <p className="text-2xl font-black text-foreground tracking-tight">{Math.max(0, supportIncidents.length - openIncidents.length)}</p>
            </div>
          </div>
         </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-8 flex items-center gap-6 border-none shadow-xl bg-accent/20 backdrop-blur-sm">
               <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-foreground shadow-lg shadow-blue-600/20">
                  <Package className="w-8 h-8" />
               </div>
               <div>
                   <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1">Weight</p>
                <p className="text-2xl font-black text-foreground tracking-tight">{orderWeightLabel}</p>
               </div>
            </div>
            <div className="glass-card p-8 flex items-center gap-6 border-none shadow-xl bg-accent/20 backdrop-blur-sm">
               <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-foreground shadow-lg shadow-emerald-600/20">
                  <Banknote className="w-8 h-8" />
               </div>
               <div>
                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1">COD</p>
                <p className="text-2xl font-black text-foreground tracking-tight">{orderCodLabel}</p>
               </div>
            </div>
          </div>

          <Card className="glass-card overflow-hidden bg-accent/20 backdrop-blur-sm border-none shadow-xl">
             <div className="p-8 border-b border-border/40 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">Logistics Details</h3>
                   <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mt-2">Waypoints and contacts</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-foreground/40">
                   <MapPin className="w-5 h-5" />
                </div>
             </div>

             <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                <div className="hidden md:block absolute left-1/2 top-16 bottom-16 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full opacity-10"></div>

                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Pickup Point</span>
                   </div>
                   <div className="pl-6 space-y-4">
                      <h4 className="text-2xl font-black text-foreground leading-tight uppercase">{senderName}</h4>
                      <p className="text-sm font-bold text-muted-foreground/70 leading-relaxed uppercase">{pickupAddr}</p>

                      <div className="pt-4 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-muted-foreground">
                            <Phone className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Customer Contact</p>
                            <p className="text-sm font-black text-foreground dark:text-slate-300">{senderPhone}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Delivery Point</span>
                   </div>
                   <div className="pl-6 space-y-4">
                      <h4 className="text-2xl font-black text-foreground leading-tight uppercase">{recipientName}</h4>
                      <p className="text-sm font-bold text-muted-foreground/70 leading-relaxed uppercase">{deliveryAddr}</p>

                      <div className="pt-4 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-muted-foreground">
                            <Phone className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Recipient Contact</p>
                            <p className="text-sm font-black text-foreground dark:text-slate-300">{recipientPhone}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </Card>

          <Card className="glass-card overflow-hidden bg-accent/20 backdrop-blur-sm border-none shadow-xl">
             <div className="p-8 border-b border-border/40 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">Support Notes</h3>
                   <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mt-2">Linked incident context for this order</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-foreground/40">
                   <MessageSquare className="w-5 h-5" />
                </div>
             </div>
             <div className="p-8 space-y-4">
                {isLoadingIncidents ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 rounded-2xl bg-accent/20" />
                    <div className="h-20 rounded-2xl bg-accent/20" />
                  </div>
                ) : supportIncidents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/50 bg-background/40 p-6 text-center">
                    <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No incidents logged for this order</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportIncidents.slice(0, 3).map((incident: any) => (
                      <div key={incident.id} className="rounded-2xl border border-border/40 bg-background/50 p-5">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-black uppercase tracking-widest text-foreground/70">{incident.title || incident.type || 'Incident'}</p>
                          <Badge className={cn('rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none', STATUS_COLORS[incident.status] || STATUS_COLORS.OPEN)}>
                            {incident.status?.replace(/_/g, ' ') || 'OPEN'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground/70 leading-relaxed">{incident.description || 'No description provided.'}</p>
                        {incident.resolution && (
                          <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Resolution</p>
                            <p className="text-xs font-medium text-foreground/80">{incident.resolution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {latestIncident?.updatedAt && (
                  <div className="rounded-2xl bg-background/40 border border-border/40 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-1">Last support update</p>
                    <p className="text-sm font-bold text-foreground/70">{new Date(latestIncident.updatedAt).toLocaleString('fr-MA')}</p>
                  </div>
                )}
             </div>
          </Card>

          <div className="glass-card overflow-hidden h-64 relative border-none shadow-2xl group bg-accent/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
             <div className="text-center space-y-3">
               <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto">
                 <Navigation className="w-7 h-7 text-blue-400" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Live tracking available on map</p>
               <Button onClick={() => navigate('/admin/map')} variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest h-10 px-6">
                 Open Live Map
               </Button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">

           <Card className="glass-card p-8 border-none shadow-xl bg-accent/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Assigned Driver</h3>
                 {driverData && (
                    <button onClick={() => setIsReassignDialogOpen(true)} className="text-blue-600 hover:text-blue-700 transition-colors">
                       <RefreshCw className="w-4 h-4" />
                    </button>
                 )}
              </div>

              {driverData ? (
                 <div className="space-y-8">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 rounded-2xl bg-accent/30 border-2 border-white/10 flex items-center justify-center text-foreground/40">
                          <User className="w-8 h-8" />
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-foreground uppercase leading-none mb-2">
                            {driverData.firstName && driverData.lastName ? `${driverData.firstName} ${driverData.lastName}` : driverData.name || '—'}
                          </h4>
                          <Badge className="bg-emerald-500/10 text-emerald-600 rounded-lg px-2 py-0.5 font-black text-[8px] uppercase tracking-widest border-none">
                             ACTIVE
                          </Badge>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{driverData.phoneNumber || driverData.phone || '—'}</span>
                       </div>
                       <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                            {driverData.vehicleType || 'Vehicle'} — {driverData.vehiclePlate || driverData.vehicle || 'N/A'}
                          </span>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="py-10 text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-accent/30 border-2 border-dashed border-white/10 flex items-center justify-center text-foreground/30 mx-auto">
                       <Truck className="w-10 h-10" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No driver assigned</p>
                    <Button onClick={() => setIsReassignDialogOpen(true)} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-foreground font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                       Assign now
                    </Button>
                 </div>
              )}
           </Card>

           {/* Timeline History */}
           <Card className="glass-card p-8 border-none shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-10">Status History</h3>
              <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                 {timeline.map((event: any, idx: number) => (
                    <div key={idx} className="relative flex items-start gap-8 group">
                       <div className={cn(
                          "w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 z-10 transition-transform duration-500 group-hover:scale-125 shadow-sm",
                          event.completed ? "bg-emerald-500 shadow-emerald-500/30" : "bg-slate-200 dark:bg-slate-700"
                       )} />
                       <div>
                          <p className={cn(
                             "text-sm font-black uppercase tracking-tight leading-none mb-2 transition-colors",
                             event.completed ? "text-foreground" : "text-muted-foreground"
                          )}>{event.status}</p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                             <Clock className="w-3 h-3" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">{event.time !== '--' ? event.time : 'Pending'}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>

      {/* Reassign Dialog Integrated with Premium Styling */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-[#020617] rounded-[2.5rem] border-none shadow-2xl">
          <div className="p-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Assign Driver</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Select an available fleet member</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Driver Search</label>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-16 justify-between rounded-2xl border-2 border-white/10 bg-accent/30 font-black text-xs uppercase tracking-widest px-6 text-foreground"
                  >
                    {selectedDriverId
                      ? `${drivers.find((d) => d.id === selectedDriverId)?.firstName} ${drivers.find((d) => d.id === selectedDriverId)?.lastName}`
                      : "Choose a driver..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
                  <Command className="dark:bg-slate-950">
                    <CommandInput placeholder="Search by name..." className="h-14 font-bold border-none" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">No drivers found</CommandEmpty>
                      <CommandGroup className="p-2">
                        {drivers.map((driver) => (
                          <CommandItem
                            key={driver.id}
                            onSelect={() => {
                              setSelectedDriverId(driver.id);
                              setIsPopoverOpen(false);
                            }}
                            className="rounded-xl h-14 px-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-muted-foreground group-hover:bg-blue-600 group-hover:text-foreground transition-all">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-sm uppercase tracking-tight">{driver.firstName} {driver.lastName}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{driver.vehicleType || "Van"} • {driver.isActive ? "Online" : "Offline"}</span>
                                </div>
                            </div>
                            <Check className={cn("h-4 w-4 text-blue-600", selectedDriverId === driver.id ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-4">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-slate-50" onClick={() => setIsReassignDialogOpen(false)}>
                  Cancel
               </Button>
               <Button 
                 onClick={handleAssignDriver}
                 disabled={!selectedDriverId || isAssigning}
                 className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-foreground font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/30 transition-all active:scale-95"
               >
                 {isAssigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

