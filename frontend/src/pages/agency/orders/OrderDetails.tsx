import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Truck, 
  MapPin, 
  Clock, 
  CreditCard, 
  Phone, 
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  QrCode,
  Map as MapIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { Order } from '@/types';
import { useAuth } from '@/context/AuthContext';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAgency = user?.role === 'AGENCY' || user?.role === 'AGENCY_ADMIN';
  const endpoint = isAgency ? ENDPOINTS.AGENCY_ADMIN.ORDERS_BY_ID(id!) : ENDPOINTS.ORDERS.BY_ID(id!);

  const { data: order, isLoading, isError, error } = useQuery<Order>({
    queryKey: ['order', id, isAgency],
    queryFn: async () => {
      const response = await apiClient.get(endpoint);
      return response.data;
    },
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'RETURNED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold">Failed to load order details</h2>
        <p className="text-muted-foreground">{(error as any)?.message || 'Something went wrong while fetching the order.'}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <motion.div 
      className="p-6 space-y-8 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-accent/30 border-border/40 hover:bg-accent/40"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight uppercase">Order Details</h1>
              <Badge className={`${getStatusColor(order.status)} border px-3 py-1 font-bold text-[10px] tracking-widest`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <span className="font-mono text-foreground/60">{order.trackingNumber}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Created on {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-border/40 bg-accent/30" onClick={() => toast.info('Tracking feature coming soon')}>
            <MapIcon className="w-4 h-4 mr-2" />
            Live Track
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border/40 bg-accent/30">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 bg-[#0f172a]">
              <DropdownMenuItem onClick={() => window.print()}>Print Receipt</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">Cancel Order</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Summary Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[32px] border-border/40 bg-accent/10 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-500/10">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                  </div>
                  {order.urgent && (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter">
                      High Priority
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pickup Location</p>
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{order.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Delivery Destination</p>
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-accent/30" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Distance</p>
                    <p className="text-lg font-bold">{order.distance?.toFixed(1) || '0'} KM</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">COD Amount</p>
                    <p className="text-lg font-bold">{order.codAmount?.toLocaleString() || '0'} DA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Delivery Fee</p>
                    <p className="text-lg font-bold text-blue-400">{order.deliveryFee?.toLocaleString() || '0'} DA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Payment</p>
                    <Badge variant="outline" className={order.codCollected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500'}>
                      {order.codCollected ? 'Paid' : 'Pending COD'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold">Tracking Timeline</h2>
            </div>
            
            <div className="relative space-y-8 pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-transparent">
              {/* Order Created */}
              <div className="relative">
                <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-blue-500 bg-background z-10" />
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-tight">Order Created</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd, yyyy · HH:mm')}</p>
                </div>
              </div>

              {/* Order Assigned */}
              {order.assignedAt && (
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-purple-500 bg-background z-10" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-tight">Driver Assigned</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.assignedAt), 'MMM dd, yyyy · HH:mm')}</p>
                  </div>
                </div>
              )}

              {/* Delivery Started */}
              {order.deliveryStartedDate && (
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-amber-500 bg-background z-10" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-tight">Delivery in Progress</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.deliveryStartedDate), 'MMM dd, yyyy · HH:mm')}</p>
                  </div>
                </div>
              )}

              {/* Delivered */}
              {order.deliveredDate && (
                <div className="relative">
                  <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-emerald-500 bg-background z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-tight text-emerald-400">Successfully Delivered</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.deliveredDate), 'MMM dd, yyyy · HH:mm')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Side Info Column */}
        <div className="space-y-8">
          {/* Customer Info */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[32px] border-border/40 bg-accent/10 h-full">
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-md font-bold">Customer Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/30 border border-border/40 flex items-center justify-center text-xl font-black">
                      {order.receiverName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{order.receiverName}</p>
                      <p className="text-xs text-muted-foreground">Recipient</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-accent/30 border border-border/40">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-mono">{order.receiverPhone}</p>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 rounded-xl hover:bg-emerald-500/20" asChild>
                      <a href={`tel:${order.receiverPhone}`}>
                        <Phone className="w-3 h-3 text-emerald-400" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-accent/30" />
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Client / Sender</p>
                  <p className="text-sm font-medium">{order.clientName || 'Standard Client'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Driver Info */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[32px] border-border/40 bg-accent/10 h-full overflow-hidden">
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10">
                    <Truck className="w-5 h-5 text-amber-400" />
                  </div>
                  <CardTitle className="text-md font-bold">Driver Assigned</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {order.driverName ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      {order.driverAvatarUrl ? (
                        <img src={order.driverAvatarUrl} alt={order.driverName} className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-amber-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold">{order.driverName}</p>
                        <p className="text-xs text-muted-foreground">{order.vehicleNumber || 'Vehicle info N/A'}</p>
                      </div>
                    </div>
                    <Button className="w-full rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Driver
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto">
                      <Truck className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-400">No Driver Assigned</p>
                      <p className="text-xs text-slate-500 px-4">This order is currently waiting for driver assignment.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-border/40 bg-accent/30 w-full">
                      Assign Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions / Proof */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[32px] border-border/40 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  <p className="text-sm font-bold">Proof of Delivery</p>
                </div>
                {order.deliveryProofPhotoUrl ? (
                  <div className="aspect-video rounded-2xl border border-border/40 overflow-hidden relative group">
                    <img src={order.deliveryProofPhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="rounded-xl font-bold">View Full</Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-border/40 rounded-2xl">
                    <p className="text-xs text-muted-foreground">No proof uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetails;
