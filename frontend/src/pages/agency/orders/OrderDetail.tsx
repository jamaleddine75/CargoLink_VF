import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, MapPin, User, Truck, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import agencyService from '@/services/api/agencyService';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const AgencyOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await agencyService.getOrderById(id);
        setOrder(data);
      } catch (err: any) {
        const message = err?.response?.data?.message || 
                       err?.message || 
                       'Failed to load order details';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-black uppercase tracking-tight">Order Details</h1>
        </div>
        <div className="bg-accent/30 rounded-[40px] p-10 border border-border/40 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-accent/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-black uppercase tracking-tight">Order Details</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-40 bg-accent/10 rounded-[40px] border-2 border-dashed border-border/40">
          <div className="w-24 h-24 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center mb-8 border border-rose-500/20">
            <AlertCircle className="w-10 h-10 text-rose-500 opacity-40" />
          </div>
          <h3 className="text-2xl font-black tracking-tight uppercase">Failed to Load Order</h3>
          <p className="text-muted-foreground/40 mt-2 font-bold uppercase text-[10px] tracking-widest max-w-sm text-center">{error}</p>
          <Button 
            onClick={() => navigate(-1)}
            className="mt-8 rounded-xl border-border/40 text-[10px] uppercase font-black tracking-widest px-6"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-black uppercase tracking-tight">Order Details</h1>
      </div>

      {/* Order Card */}
      <div className="bg-accent/10 rounded-[40px] p-8 md:p-10 border border-border/40 space-y-8">
        
        {/* Tracking & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Tracking ID</p>
              <p className="text-2xl font-black tracking-tight">{order.trackingNumber}</p>
              <p className="text-[10px] text-muted-foreground/40 font-bold mt-1">{formatTimestamp(order.createdAt)}</p>
            </div>
          </div>
          <StatusBadge status={order.validated ? 'VALIDATED' : order.status} />
        </div>

        <div className="border-t border-border/40" />

        {/* Pickup & Delivery */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pickup */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Pickup Location</p>
              </div>
            </div>
            <div className="ml-14 space-y-2">
              <p className="text-sm font-bold text-foreground/80">{order.pickupAddress || '—'}</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium">{order.senderCity || 'City not specified'}</p>
              {order.pickupContactName && (
                <p className="text-[10px] text-muted-foreground/60 font-medium">Contact: {order.pickupContactName}</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Delivery Location</p>
              </div>
            </div>
            <div className="ml-14 space-y-2">
              <p className="text-sm font-bold text-foreground/80">{order.deliveryAddress || '—'}</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium">{order.receiverCity || 'City not specified'}</p>
              {order.receiverName && (
                <p className="text-[10px] text-muted-foreground/60 font-medium">Recipient: {order.receiverName}</p>
              )}
              {order.receiverPhone && (
                <p className="text-[10px] text-muted-foreground/60 font-medium">Phone: {order.receiverPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Driver & Financial */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Driver */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Assigned Driver</p>
            </div>
            <div className="ml-14">
              {order.driverName ? (
                <>
                  <p className="text-sm font-bold text-foreground/80">{order.driverName}</p>
                  {order.driverPhone && (
                    <p className="text-[10px] text-muted-foreground/60 font-medium">{order.driverPhone}</p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground/60 font-medium">Not assigned yet</p>
              )}
            </div>
          </div>

          {/* COD Value */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/20">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">COD Amount</p>
            </div>
            <div className="ml-14">
              <p className="text-2xl font-black text-blue-400">{order.codAmount || 0} <span className="text-[10px] opacity-40">MAD</span></p>
              {order.deliveryFee && (
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-2">Fee: {order.deliveryFee} MAD</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Timestamps */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-2">Created</p>
            <p className="text-xs font-bold text-foreground/80">{formatTimestamp(order.createdAt)}</p>
          </div>
          {order.deliveredAt && (
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-2">Delivered</p>
              <p className="text-xs font-bold text-foreground/80">{formatTimestamp(order.deliveredAt)}</p>
            </div>
          )}
          {order.validatedAt && (
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-2">Validated</p>
              <p className="text-xs font-bold text-foreground/80">{formatTimestamp(order.validatedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyOrderDetail;
