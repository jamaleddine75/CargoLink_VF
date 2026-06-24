import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Navigation, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types';

interface AvailableOrderCardProps {
  order: Order;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onTimeout?: (id: string) => void;
}

const AvailableOrderCard = React.forwardRef<HTMLDivElement, AvailableOrderCardProps>(
  ({ order, onAccept, onRefuse, onTimeout }, ref) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
      if (timeLeft > 0) {
        const timer = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => window.clearTimeout(timer);
      }

      onTimeout?.(order.id);
    }, [timeLeft, onTimeout, order.id]);

    const progress = (timeLeft / 30) * 100;
    const fee = order.deliveryFee ?? order.codAmount ?? 25;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        layout
        className="font-sans"
      >
        <Card className="mb-4 overflow-hidden rounded-[2.5rem] border-2 border-primary/20 bg-white/90 shadow-xl backdrop-blur-md dark:bg-card/60">
          <div className="h-1.5 w-full bg-muted/30">
            <motion.div
              className={`h-full ${timeLeft < 10 ? 'bg-red-500' : 'bg-primary'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    🚀 New Delivery Offer
                  </p>
                </div>
                <div className="mt-1 px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-lg w-fit">
                  <span className="text-[11px] font-black tracking-[0.15em] text-foreground">{order.trackingNumber}</span>
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground opacity-60">
                  Tap accept to open the route map
                </p>
              </div>

              <div className="text-right">
                <Badge className="mb-1 border-none bg-primary/10 font-bold text-primary">
                  💰 {fee} MAD
                </Badge>
                <motion.div 
                  animate={timeLeft < 10 ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`flex items-center justify-end gap-1.5 text-sm font-black ${timeLeft < 10 ? 'text-red-500' : 'text-primary'}`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timeLeft}s</span>
                </motion.div>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Pickup</p>
                  <p className="line-clamp-1 text-sm font-bold leading-tight">{order.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <Navigation className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Delivery</p>
                  <p className="line-clamp-1 text-sm font-bold leading-tight">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRefuse(order.id)}
                className="flex items-center justify-center h-14 rounded-2xl border-2 border-muted font-black text-xs uppercase tracking-widest gap-2 hover:bg-muted/50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                👋 Ignore
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAccept(order.id)}
                className="flex items-center justify-center h-14 rounded-2xl bg-primary font-black text-xs uppercase tracking-widest gap-2 text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                ✅ Accept
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

AvailableOrderCard.displayName = 'AvailableOrderCard';

export default AvailableOrderCard;
