import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { Order } from '@/types';

interface DriverOrderCardProps {
  order: Order;
  dragHandleProps?: any;
  routeBadge?: number;
}

const DriverOrderCard = React.forwardRef<HTMLDivElement, DriverOrderCardProps>(({ 
  order, 
  dragHandleProps, 
  routeBadge 
}, ref) => {
  const navigate = useNavigate();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="font-sans relative"
    >
      {/* Route Badge */}
      {routeBadge !== undefined && (
        <div className="absolute -left-2 -top-2 z-20 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-lg">
          <span className="text-white font-black text-xs">#{routeBadge}</span>
        </div>
      )}

      <Card className="mb-4 overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl transition-all bg-white/95 dark:bg-zinc-900 rounded-[2.5rem] group hover:border-primary/30">
        <CardContent className="p-6 flex gap-4">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div 
              {...dragHandleProps} 
              className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 dark:text-white/20 hover:text-primary transition-colors shrink-0"
            >
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                  {order.trackingNumber}
                </p>
                <StatusBadge status={order.status} />
              </div>
              {(order.codAmount || 0) > 0 && (
                <div className="text-right bg-primary/10 px-3 py-1.5 rounded-2xl border border-primary/20 shrink-0">
                  <p className="text-[8px] text-primary/60 font-black uppercase tracking-widest mb-0.5">Collect</p>
                  <p className="font-black text-sm text-primary">{order.codAmount} <span className="text-[9px]">MAD</span></p>
                </div>
              )}
            </div>

            <div className="relative pl-7 space-y-6 mb-4">
              <div className="absolute top-2 left-[11px] bottom-3 w-px bg-slate-100 dark:bg-white/5 rounded-full" />
              
              <div className="relative">
                <div className="absolute -left-[32px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-white dark:ring-zinc-900 z-10" />
                <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase font-black tracking-widest mb-1">Pickup</p>
                <p className="text-[12px] font-bold text-slate-700 dark:text-white/80 leading-snug line-clamp-1">{order.pickupAddress}</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-[32px] top-1 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-900 z-10" />
                <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase font-black tracking-widest mb-1">Delivery</p>
                <p className="text-[12px] font-bold text-slate-700 dark:text-white/80 leading-snug line-clamp-1">{order.deliveryAddress}</p>
              </div>
            </div>

            {!dragHandleProps && (
              <Button
                onClick={() => navigate(`/driver/delivery/${order.id}`)}
                className="w-full h-14 rounded-[1.8rem] bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-white/90 font-black text-xs uppercase tracking-widest shadow-xl group transition-all active:scale-95 mt-4"
              >
                <Navigation className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                Open Mission
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

DriverOrderCard.displayName = 'DriverOrderCard';

export default DriverOrderCard;
