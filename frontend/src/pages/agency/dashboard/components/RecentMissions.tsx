import React from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Order } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { formatTimestamp } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface RecentMissionsProps {
  orders: Order[];
  loading: boolean;
}

export const RecentMissions = ({ orders, loading }: RecentMissionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 md:p-10 border border-border/40 shadow-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Recent Missions</h3>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Live operational feed
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/agency/orders')}
          className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-2 group/btn"
        >
          View All <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-accent/30 animate-pulse" />
          ))
        ) : orders.length > 0 ? (
          orders.slice(0, 5).map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/agency/orders/${order.id}`)}
              className="flex items-center justify-between p-5 rounded-2xl bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all cursor-pointer group/item"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover/item:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-primary-foreground/90 uppercase">{order.trackingNumber}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                    {order.receiverName} • {order.receiverCity || 'Direct'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                   <p className="text-[10px] font-black text-muted-foreground/60 uppercase">{formatTimestamp(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-primary-foreground/5 mx-auto mb-4" />
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">No recent missions</p>
          </div>
        )}
      </div>
    </div>
  );
};
