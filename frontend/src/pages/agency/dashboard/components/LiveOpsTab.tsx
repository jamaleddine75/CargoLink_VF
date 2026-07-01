import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, Truck, User, Search, 
  RefreshCw, Box, AlertTriangle, Clock,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/common/StatusBadge';
import { formatTimestamp } from '@/lib/utils';
import { SearchFilters } from './SearchFilters';
import { ListSkeleton } from '@/pages/agency/shared';

interface LiveOpsTabProps {
  orders: unknown[];
  drivers: unknown[];
  onValidateDelivery: (orderId: string) => void;
  onConfirmPayment: (orderId: string) => void;
  loading: boolean;
  actionLoading: string | null;
}

export const LiveOpsTab: React.FC<LiveOpsTabProps> = ({
  orders,
  drivers,
  onValidateDelivery,
  onConfirmPayment,
  loading,
  actionLoading,
}) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.receiverName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = activeFilter === 'ALL' || order.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Orders Management */}
      <div className="lg:col-span-8 space-y-6">
        <SearchFilters 
          search={search}
          onSearchChange={setSearch}
          filters={['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          placeholder="Search missions by ID or Receiver..."
        />

        <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-border/40 shadow-2xl relative overflow-hidden">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <ListSkeleton />
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-3xl bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all group relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-black tracking-tight uppercase">{order.trackingNumber}</p>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
                            {order.receiverName} • {order.deliveryAddress} • {formatTimestamp(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {order.status === 'DELIVERED' && (
                          <Button
                            size="sm"
                            onClick={() => onValidateDelivery(order.id)}
                            disabled={!!actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-emerald-600/20"
                          >
                            {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Validate"}
                          </Button>
                        )}
                        {(order.paymentStatus === 'COLLECTED_BY_DRIVER') && order.codAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => onConfirmPayment(order.id)}
                            disabled={!!actionLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-primary-foreground rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-blue-600/20"
                          >
                            {actionLoading === order.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Confirm COD"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center bg-accent/10 rounded-[2rem] border-2 border-dashed border-border/40">
                  <Box className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No missions in queue</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Fleet Status */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-border/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Active Fleet</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">Driver performance HUB</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4">
            {drivers.slice(0, 6).map((driver, idx) => (
              <div key={driver.id} className="p-5 rounded-3xl bg-accent/10 border border-border/40 hover:bg-accent/20 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center text-muted-foreground/60">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm">{driver.firstName} {driver.lastName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{driver.status}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black leading-none">{driver.todayDeliveries || 0}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Today</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
