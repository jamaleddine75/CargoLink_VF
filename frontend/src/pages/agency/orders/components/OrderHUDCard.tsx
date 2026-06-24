import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Calendar, User, MapPin, 
  CheckCircle2, CheckCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const statusConfig: Record<string, { label: string; color: string; glow: string }> = {
  'PENDING': { label: 'Pending', color: 'text-zinc-400', glow: 'bg-zinc-500/10' },
  'VALIDATED': { label: 'Validated', color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
  'ASSIGNED': { label: 'Assigned', color: 'text-blue-400', glow: 'bg-blue-500/10' },
  'PICKUP_READY': { label: 'Ready for Pickup', color: 'text-amber-400', glow: 'bg-amber-500/10' },
  'ON_THE_WAY': { label: 'In Transit', color: 'text-purple-400', glow: 'bg-purple-500/10' },
  'DELIVERED': { label: 'Delivered', color: 'text-muted-foreground/60', glow: 'bg-accent/30' },
  'ISSUE': { label: 'Issue', color: 'text-rose-400', glow: 'bg-rose-500/10' },
  'CANCELLED': { label: 'Cancelled', color: 'text-muted-foreground/40', glow: 'bg-accent/30' },
};

interface OrderHUDCardProps {
  order: Order;
  idx: number;
  onValidate: (id: string) => void;
}

export const OrderHUDCard = ({ order, idx, onValidate }: OrderHUDCardProps) => {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || statusConfig['PENDING'];
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.validated || isValidating) return;
    
    setIsValidating(true);
    try {
      await onValidate(order.id);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="group"
    >
      <Card 
        onClick={() => navigate(`/agency/orders/${order.id}`)}
        className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] overflow-hidden hover:bg-accent/20 hover:border-blue-500/30 transition-all duration-500 cursor-pointer relative group shadow-2xl"
      >
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${config.glow} flex items-center justify-center border border-border/40 group-hover:scale-110 transition-transform`}>
                <Package className={`w-7 h-7 ${config.color}`} />
              </div>
              <div>
                <h4 className="font-black tracking-tighter text-lg uppercase leading-none">{order.trackingNumber}</h4>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                   <Calendar className="w-3 h-3" /> {formatTimestamp(order.createdAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={order.validated ? 'VALIDATED' : order.status} />
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Recipient</p>
                  <p className="text-sm font-bold text-foreground/80 truncate">{order.receiverName || '—'}</p>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-foreground/80 truncate">{order.deliveryAddress || '—'}</p>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">COD Value</span>
              <span className="text-xl font-black text-blue-400 tracking-tight">{order.codAmount || 0} <span className="text-[10px] ml-1 opacity-40">MAD</span></span>
            </div>
            
            <Button
              size="sm"
              disabled={order.validated || isValidating}
              onClick={handleValidateClick}
              className={`rounded-xl px-4 font-black text-[10px] uppercase tracking-widest transition-all ${
                order.validated 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-accent/30 hover:bg-blue-600 text-muted-foreground/60 hover:text-foreground border border-border/40 hover:border-blue-400'
              }`}
            >
              {isValidating ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-2" />
              ) : order.validated ? (
                <CheckCircle2 className="w-3 h-3 mr-2" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-2" />
              )}
              {order.validated ? 'Validated' : 'Validate Delivery'}
            </Button>
          </div>
        </CardContent>
        {/* Hover Glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity ${config.glow}`} />
      </Card>
    </motion.div>
  );
};
