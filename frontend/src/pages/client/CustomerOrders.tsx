import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, Filter, PlusCircle, MapPin,
  Clock, ChevronRight, CheckCircle2, AlertCircle,
  Truck, RefreshCw, Loader2, XCircle, ArrowUpRight,
  TrendingUp, Box, Navigation, Globe, MoreVertical,
  Printer, Download, Edit, Eye, FileText, ChevronLeft,
  Calendar, User, CreditCard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import customerService from '@/services/api/customerService';
import StatusBadge from '@/components/common/StatusBadge';
import ShippingLabel from '@/components/orders/ShippingLabel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Components ---

const OrderRow = React.forwardRef<HTMLTableRowElement, { order: any; onPrint: (o: any) => void }>(
  ({ order, onPrint }, ref) => {
    const navigate = useNavigate();
    return (
      <TableRow 
        ref={ref}
        className="group border-border/30 hover:bg-primary/[0.02] cursor-pointer transition-colors hidden md:table-row"
        onClick={() => navigate(`/client/orders/${order.id}`)}
      >
        <TableCell className="py-4 pl-6">
          <p className="font-mono text-[11px] font-black text-foreground/80">{order.trackingNumber}</p>
          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
          </p>
        </TableCell>
        <TableCell>
          <p className="text-xs font-bold text-foreground/70">{order.receiverName}</p>
          <p className="text-[9px] font-medium text-muted-foreground/40 uppercase">{order.receiverCity}</p>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <p className="text-[10px] font-medium text-muted-foreground/50 truncate max-w-[200px]">
            {order.deliveryAddress || '—'}
          </p>
        </TableCell>
        <TableCell>
          <StatusBadge status={order.status} className="scale-75 origin-left" />
        </TableCell>
        <TableCell className="text-right">
          <p className="font-black text-sm text-foreground">{order.codAmount || 0} <span className="text-[9px] opacity-30">MAD</span></p>
        </TableCell>
        <TableCell className="text-right pr-6" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                <MoreVertical className="w-4 h-4 text-muted-foreground/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background border-border/50 rounded-xl p-2 shadow-2xl">
              <DropdownMenuItem onClick={() => navigate(`/client/orders/${order.id}`)} className="rounded-lg gap-2 text-[9px] font-black uppercase">
                <Eye className="w-3.5 h-3.5" /> Détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(order)} className="rounded-lg gap-2 text-[9px] font-black uppercase">
                <Printer className="w-3.5 h-3.5" /> Étiquette
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }
);
OrderRow.displayName = 'OrderRow';

const OrderCard = React.forwardRef<HTMLDivElement, { order: any; onPrint: (o: any) => void }>(
  ({ order, onPrint }, ref) => {
    const navigate = useNavigate();
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="block md:hidden bg-card/60 dark:bg-card/40 border border-border/50 dark:border-white/5 rounded-3xl p-5 space-y-4 hover:border-primary/30 transition-all active:scale-[0.98]"
        onClick={() => navigate(`/client/orders/${order.id}`)}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">Suivi Mission</p>
            <p className="font-mono text-xs font-black tracking-tighter">{order.trackingNumber}</p>
          </div>
          <StatusBadge status={order.status} className="scale-90 origin-right" />
        </div>

        <div className="flex items-center gap-4 py-2 border-y border-border/40 dark:border-white/5">
           <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
           </div>
           <div className="min-w-0">
              <p className="text-xs font-black truncate">{order.receiverName}</p>
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase truncate">{order.receiverCity}</p>
           </div>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground/30" />
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">
                 {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
              </span>
           </div>
           <p className="font-black text-sm italic">{order.codAmount || 0} <span className="text-[9px] opacity-30">MAD</span></p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
           <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/client/orders/${order.id}`); }} className="h-9 rounded-xl bg-white/5 text-[8px] font-black uppercase tracking-widest">
              <Eye className="w-3 h-3 mr-2" /> Détails
           </Button>
           <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onPrint(order); }} className="h-9 rounded-xl bg-white/5 text-[8px] font-black uppercase tracking-widest">
              <Printer className="w-3 h-3 mr-2" /> Étiquette
           </Button>
        </div>
      </motion.div>
    );
  }
);
OrderCard.displayName = 'OrderCard';

const TabTrigger = ({ value, label, count }: { value: string; label: string; count: number }) => (
  <TabsTrigger
    value={value}
    className="rounded-lg md:rounded-xl px-2 md:px-8 font-black text-[7px] md:text-[10px] uppercase tracking-normal md:tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full transition-all flex items-center gap-1"
  >
    {label}
    <span className="bg-accent/10 rounded-md px-1 py-0.5 text-[6px] md:text-[9px] min-w-[14px]">{count}</span>
  </TabsTrigger>
);

// --- Main Page ---

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getRecentOrders(0, 100);
      setOrders(data.content || []);
    } catch (err) {
      setError('Impossible de synchroniser vos missions.');
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => { window.print(); setPrintOrder(null); }, 500);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.receiverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.receiverCity || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'in_transit') return matchesSearch && ['PICKUP_READY', 'ON_THE_WAY', 'ASSIGNED', 'VALIDATED'].includes(order.status);
    if (activeTab === 'delivered') return matchesSearch && order.status === 'DELIVERED';
    if (activeTab === 'issue') return matchesSearch && ['CANCELLED', 'ISSUE'].includes(order.status);
    return matchesSearch;
  });

  const getCount = (tab: string) => {
    if (tab === 'all') return orders.length;
    if (tab === 'in_transit') return orders.filter(o => ['PICKUP_READY', 'ON_THE_WAY', 'ASSIGNED', 'VALIDATED'].includes(o.status)).length;
    if (tab === 'delivered') return orders.filter(o => o.status === 'DELIVERED').length;
    if (tab === 'issue') return orders.filter(o => ['CANCELLED', 'ISSUE'].includes(o.status)).length;
    return 0;
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-background text-foreground space-y-4 md:space-y-8 p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {printOrder && (
        <div className="print-only hidden">
          <ShippingLabel order={printOrder} isPrintMode={true} />
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-10 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            <p className="text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.3em] text-primary/80">Logistique Intelligente</p>
          </div>
          <h1 className="text-xl md:text-5xl font-black tracking-tight uppercase italic text-foreground leading-tight">
            Suivi des <span className="text-primary">Expéditions</span>
          </h1>
        </motion.div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={fetchOrders}
            className="h-8 md:h-10 px-2.5 md:px-4 rounded-lg md:rounded-xl bg-accent/10 dark:bg-white/[0.03] border border-border/50 dark:border-white/5 text-[7.5px] md:text-[9px] font-black uppercase tracking-widest gap-1"
          >
            <RefreshCw className={cn("w-3 h-3 md:w-3.5 md:h-3.5", loading && "animate-spin")} /> Sync
          </Button>
          <Button
            onClick={() => navigate('/client/create-order')}
            className="h-8 md:h-10 px-3.5 md:px-6 bg-primary text-white font-black text-[7.5px] md:text-[9px] uppercase tracking-widest rounded-lg md:rounded-xl shadow-xl shadow-primary/20 gap-1 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3 h-3 md:w-4 md:h-4" /> Créer une Mission
          </Button>
        </div>
      </header>

      {/* Filters HUD */}
      <div className="flex flex-col xl:flex-row items-center gap-4 relative z-10">
        <div className="w-full xl:w-80 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher (N°, Nom, Ville)..."
            className="h-10 md:h-12 pl-10 md:pl-12 rounded-lg md:rounded-2xl bg-card/60 dark:bg-card/40 border-border/50 dark:border-white/5 focus-visible:ring-primary/20 font-bold text-[9px] md:text-[11px] uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full xl:flex-1 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-card/60 dark:bg-card/40 border border-border/50 dark:border-white/5 p-1 rounded-lg md:rounded-2xl h-9 md:h-12 w-full justify-start gap-0.5">
              <TabTrigger value="all" label="Tout" count={getCount('all')} />
              <TabTrigger value="in_transit" label="Transit" count={getCount('in_transit')} />
              <TabTrigger value="delivered" label="Livré" count={getCount('delivered')} />
              <TabTrigger value="issue" label="Alerte" count={getCount('issue')} />
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Grid/Table */}
      <div className="relative z-10">
        {error ? (
          <div className="flex flex-col items-center justify-center py-32 bg-rose-500/5 rounded-[3rem] border border-rose-500/10">
            <AlertCircle className="w-16 h-16 text-rose-500/30 mb-6" />
            <p className="font-black text-[10px] uppercase tracking-[0.4em] text-rose-500/60 mb-8">{error}</p>
            <Button onClick={fetchOrders} className="rounded-2xl bg-white/5 border border-white/10 px-8 h-12 font-black uppercase text-[10px] tracking-widest">Réessayer</Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card/60 dark:bg-card/40 backdrop-blur-3xl border border-border/50 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-primary/5 dark:bg-white/[0.02]">
                  <TableRow className="border-border/40 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="py-4 pl-6 font-black text-[10px] uppercase tracking-widest text-foreground/40">Expédition</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40">Destinataire</TableHead>
                    <TableHead className="hidden lg:table-cell font-black text-[10px] uppercase tracking-widest text-muted-foreground/40">Adresse</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/40">Statut</TableHead>
                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground/40">Montant</TableHead>
                    <TableHead className="w-[80px] pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order) => (
                        <OrderRow key={order.id} order={order} onPrint={handlePrint} />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-24 text-center">
                          <Box className="w-12 h-12 text-white/5 mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[0.4em]">Aucune mission détectée</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
               {currentOrders.length > 0 ? (
                  currentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onPrint={handlePrint} />
                  ))
               ) : (
                  <div className="py-20 text-center bg-card/40 border border-white/5 rounded-3xl">
                     <Box className="w-10 h-10 text-white/5 mx-auto mb-4" />
                     <p className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-[0.3em]">Aucune mission</p>
                  </div>
               )}
            </div>
          </>
        )}

        {/* Pagination HUD */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10 relative z-10">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-12 h-12 rounded-2xl bg-card/40 border-white/5 text-foreground hover:bg-primary/10 transition-all p-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="px-6 py-3 rounded-2xl bg-card/40 border border-white/5 font-black text-[10px] tracking-widest text-foreground">
              PAGE <span className="text-primary mx-1">{currentPage}</span> / <span className="mx-1">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-12 h-12 rounded-2xl bg-card/40 border-white/5 text-foreground hover:bg-primary/10 transition-all p-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;