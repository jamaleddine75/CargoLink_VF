import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Package, Search, PlusCircle, RefreshCw, 
  Box, Eye, Printer, MoreVertical,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn, formatTimestamp } from '@/lib/utils';
import customerService from '@/services/api/customerService';
import StatusBadge from '@/components/shared/StatusBadge';
import { printShippingLabel } from '@/utils/printUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import { ListSkeleton } from '@/pages/agency/shared';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => { 
    fetchOrders(); 
  }, [fetchOrders]);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, activeTab]);

  const handlePrint = (order: Order) => {
    printShippingLabel(order);
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Suivi des Expéditions"
        description="Suivi en temps réel de vos commandes et livraisons"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/client/create-order')}
              className="gap-2"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Créer une Mission
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-80 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher (N°, Nom, Ville)..."
            className="pl-9 h-10 rounded-lg bg-card border-border text-xs focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:flex-1 overflow-x-auto">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-muted/40 border border-border p-1 rounded-lg h-10 justify-start w-full md:w-auto gap-1">
              <TabsTrigger value="all" className="rounded-md px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Tout ({getCount('all')})
              </TabsTrigger>
              <TabsTrigger value="in_transit" className="rounded-md px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Transit ({getCount('in_transit')})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="rounded-md px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Livré ({getCount('delivered')})
              </TabsTrigger>
              <TabsTrigger value="issue" className="rounded-md px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Incident ({getCount('issue')})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Table */}
      <div>
        {error ? (
          <Card className="border border-destructive/20 bg-destructive/5 p-12 text-center rounded-lg">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-semibold text-destructive mb-4">{error}</p>
            <Button size="sm" onClick={fetchOrders}>Réessayer</Button>
          </Card>
        ) : loading ? (
          <ListSkeleton />
        ) : (
          <Card className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border">
                    <TableHead className="py-3 pl-6 font-semibold text-xs text-foreground uppercase tracking-tight">Expédition</TableHead>
                    <TableHead className="font-semibold text-xs text-foreground uppercase tracking-tight">Destinataire</TableHead>
                    <TableHead className="font-semibold text-xs text-foreground uppercase tracking-tight">Adresse</TableHead>
                    <TableHead className="font-semibold text-xs text-foreground uppercase tracking-tight">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-xs text-foreground uppercase tracking-tight">Montant</TableHead>
                    <TableHead className="w-[80px] pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => navigate(`/client/orders/${order.id}`)}
                        >
                          <TableCell className="py-3 pl-6">
                            <p className="font-mono text-xs font-semibold text-foreground">{order.trackingNumber}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {order.createdAt ? formatTimestamp(order.createdAt) : '—'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-semibold text-foreground">{order.receiverName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{order.receiverCity}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {order.deliveryAddress || '—'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs">
                            {order.codAmount || 0} MAD
                          </TableCell>
                          <TableCell className="text-right pr-6" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground/60" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-card border border-border p-1 mt-1 rounded-lg">
                                <DropdownMenuItem onClick={() => navigate(`/client/orders/${order.id}`)} className="rounded-md cursor-pointer text-xs flex items-center gap-2">
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                  <span>Détails</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(order)} className="rounded-md cursor-pointer text-xs flex items-center gap-2">
                                  <Printer className="w-4 h-4 text-muted-foreground" />
                                  <span>Étiquette</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-xs text-muted-foreground font-medium">Aucune mission trouvée</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-lg p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-semibold">
              Page {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-lg p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;