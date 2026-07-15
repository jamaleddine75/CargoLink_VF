import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, CheckCircle2, CheckCircle, RefreshCw, 
  User, Package, MoreHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AnimatePresence } from 'framer-motion';
import { Order } from '@/Types';
import { formatTimestamp } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';
import EntityCard from '@/components/shared/EntityCard';
import { 
  DataTable, 
  DataTableHeader, 
  DataTableBody, 
  DataTableRow, 
  DataTableHead, 
  DataTableCell 
} from '@/components/shared/DataTable';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
}

export const OrdersTable = ({ orders, loading }: OrdersTableProps) => {
  const navigate = useNavigate();

  if (loading && orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden p-6 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable>
          <DataTableHeader>
            <DataTableRow hover={false}>
              <DataTableHead className="w-[180px] pl-6">Tracking No</DataTableHead>
              <DataTableHead>Date de création</DataTableHead>
              <DataTableHead>Client</DataTableHead>
              <DataTableHead>Chauffeur</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>COD Amount</DataTableHead>
              <DataTableHead className="text-right pr-6">Actions</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <DataTableRow
                  key={order.id}
                  onClick={() => navigate(`/agency/orders/${order.id}`)}
                  className="cursor-pointer"
                >
                  <DataTableCell className="pl-6 py-4 font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="uppercase text-sm">{order.trackingNumber}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground/80">{formatTimestamp(order.createdAt).split(' at ')[0]}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{formatTimestamp(order.createdAt).split(' at ')[1]}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground/80">{order.receiverName || '—'}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{order.receiverPhone || '—'}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    {order.driverName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80">{order.driverName}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-rose-500/5 text-rose-500 border-rose-500/10 text-[9px] font-semibold uppercase tracking-wider">
                        Non Assigné
                      </Badge>
                    )}
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <StatusBadge status={order.valiDated ? 'VALIDateD' : order.status} />
                  </DataTableCell>
                  <DataTableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary">{order.codAmount || 0} <span className="text-[9px] opacity-60 ml-0.5">MAD</span></span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-md"
                        onClick={() => navigate(`/agency/orders/${order.id}`)}
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                          <DropdownMenuItem onClick={() => navigate(`/agency/orders/${order.id}`)}>
                            Voir Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Imprimer l'étiquette
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </AnimatePresence>
          </DataTableBody>
        </DataTable>
      </div>

      {/* Mobile/Tablet List View */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <EntityCard
            key={order.id}
            onClick={() => navigate(`/agency/orders/${order.id}`)}
            avatar={
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Package className="w-5 h-5" />
              </div>
            }
            title={order.trackingNumber}
            subtitle={formatTimestamp(order.createdAt)}
            statusBadge={<StatusBadge status={order.valiDated ? 'VALIDateD' : order.status} />}
            details={
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Receiver</p>
                  <p className="font-semibold">{order.receiverName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-muted-foreground">Ville</p>
                  <p className="font-semibold">{order.receiverCity || order.deliveryAddress?.split(',')[0]}</p>
                </div>
              </div>
            }
            footer={
              <>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-muted-foreground">COD Amount</span>
                  <span className="text-base font-semibold text-primary">{order.codAmount || 0} MAD</span>
                </div>

              </>
            }
          />
        ))}
      </div>
    </div>
  );
};
export default OrdersTable;
