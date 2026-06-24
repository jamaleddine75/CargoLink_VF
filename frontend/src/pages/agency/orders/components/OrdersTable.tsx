import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, CheckCircle2, CheckCircle, RefreshCw, 
  User, MapPin, Calendar, Package, MoreHorizontal,
  Phone, Truck
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'PENDING': { label: 'Pending', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  'VALIDATED': { label: 'Validated', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'ASSIGNED': { label: 'Assigned', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'PICKUP_READY': { label: 'Ready for Pickup', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'ON_THE_WAY': { label: 'In Transit', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'DELIVERED': { label: 'Delivered', color: 'text-muted-foreground/60', bg: 'bg-accent/30' },
  'ISSUE': { label: 'Issue', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  'CANCELLED': { label: 'Cancelled', color: 'text-muted-foreground/40', bg: 'bg-accent/30' },
};

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onValidate: (id: string) => void;
}

export const OrdersTable = ({ orders, loading, onValidate }: OrdersTableProps) => {
  const navigate = useNavigate();

  if (loading && orders.length === 0) {
    return (
      <div className="rounded-3xl border border-border/40 bg-accent/5 overflow-hidden">
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-accent/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-3xl border border-border/40 bg-card/50 dark:bg-accent/5 backdrop-blur-3xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-accent/5 dark:bg-accent/10">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[180px] font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6 pl-8">Tracking ID</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">Timestamp</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">Customer</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">Route</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">Driver</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">Status</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6">COD Value</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 py-6 pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {orders.map((order, idx) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/agency/orders/${order.id}`)}
                  className="group cursor-pointer border-border/40 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Package className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="font-black tracking-tighter uppercase text-sm">{order.trackingNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground/80">{formatTimestamp(order.createdAt).split(' at ')[0]}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">{formatTimestamp(order.createdAt).split(' at ')[1]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground/80">{order.receiverName || '—'}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">{order.receiverPhone || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-accent/30 border border-border/40 text-muted-foreground/60 uppercase truncate">
                        {order.senderCity || order.pickupAddress?.split(',')[0] || 'Origin'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase truncate">
                        {order.receiverCity || order.deliveryAddress?.split(',')[0] || 'Dest'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    {order.driverName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-xs font-bold text-foreground/80">{order.driverName}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-rose-500/5 text-rose-400/60 border-rose-500/10 text-[9px] font-black uppercase tracking-tighter">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-5">
                    <StatusBadge status={order.validated ? 'VALIDATED' : order.status} />
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-blue-400">{order.codAmount || 0} <span className="text-[9px] opacity-40 ml-0.5">MAD</span></span>
                      <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">COD Amount</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 pr-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg bg-accent/20 border border-border/40 hover:bg-blue-500 hover:text-white transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/agency/orders/${order.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!order.validated && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onValidate(order.id);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#0f172a] border-border/40">
                          <DropdownMenuItem onClick={() => navigate(`/agency/orders/${order.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Print Label
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-400">
                            Report Issue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet List View */}
      <div className="md:hidden space-y-4">
        {orders.map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            onClick={() => navigate(`/agency/orders/${order.id}`)}
            className="p-5 rounded-2xl border border-border/40 bg-accent/10 backdrop-blur-3xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{order.trackingNumber}</h4>
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{formatTimestamp(order.createdAt)}</p>
                </div>
              </div>
              <StatusBadge status={order.validated ? 'VALIDATED' : order.status} className="scale-90" />
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/20">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Recipient</p>
                <p className="text-xs font-bold truncate">{order.receiverName}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">COD Value</p>
                <p className="text-xs font-black text-blue-400">{order.codAmount} MAD</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/30 border border-border/40 flex items-center justify-center">
                  {order.driverName ? <Truck className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-muted-foreground/40" />}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                  {order.driverName || 'No Driver'}
                </span>
              </div>
              <Button size="sm" className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-widest bg-blue-600">
                View Details
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
