import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Banknote, CheckCircle2, Loader2, AlertCircle, 
  ChevronRight, ArrowRight, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import driverWalletService from '@/services/api/driverWalletService';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CODRemittanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CODRemittanceModal: React.FC<CODRemittanceModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const { data: pendingOrders, isLoading } = useQuery({
    queryKey: ['pending-cod-orders'],
    queryFn: () => driverWalletService.getPendingCod(),
    enabled: isOpen
  });

  const remitMutation = useMutation({
    mutationFn: (data: { orderIds: string[]; totalAmount: number }) =>
      driverWalletService.submitCodRemittance(data.orderIds, data.totalAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['pending-cod-orders'] });
      toast.success('Demande de remise envoyée avec succès !');
      onClose();
      setSelectedOrders([]);
    },
    onError: () => toast.error('Échec de la remise')
  });

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const totalSelected = (pendingOrders || [])
    .filter((o: any) => selectedOrders.includes(o.orderId))
    .reduce((sum: number, o: any) => sum + o.amount, 0);

  const handleRemit = () => {
    if (selectedOrders.length === 0) return;
    remitMutation.mutate({
      orderIds: selectedOrders,
      totalAmount: totalSelected
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#020617] border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full" />
        </div>

        <DialogHeader className="p-8 border-b border-white/5 relative z-10 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Banknote size={24} />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase">Remit Cash</DialogTitle>
                <DialogDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Select orders to hand over to agency</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto relative z-10 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Scanning pending COD nodes...</p>
            </div>
          ) : pendingOrders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
               <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={32} />
               </div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">All COD assets cleared</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders?.map((order: any) => (
                <motion.div
                  key={order.orderId}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleOrder(order.orderId)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                    selectedOrders.includes(order.orderId)
                    ? 'bg-blue-600/10 border-blue-600/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      selectedOrders.includes(order.orderId)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-white/20'
                    }`}>
                      {selectedOrders.includes(order.orderId) && <ArrowRight size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white uppercase tracking-tight">#{order.orderId?.slice(-8)}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{order.description || 'COD Collection'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white tracking-tighter">{order.amount.toLocaleString()} <span className="text-[10px] opacity-30">MAD</span></p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-white/[0.03] border-t border-white/5 relative z-10">
          <div className="flex justify-between items-center mb-6">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Selection</span>
                <span className="text-3xl font-black text-blue-500 tracking-tighter">{totalSelected.toLocaleString()} <span className="text-xs opacity-50">MAD</span></span>
             </div>
             <Badge className="bg-white/5 text-white/40 border-none font-black text-[10px] uppercase tracking-widest h-8 px-4">{selectedOrders.length} Node(s)</Badge>
          </div>

          <Button
            onClick={handleRemit}
            disabled={selectedOrders.length === 0 || remitMutation.isPending}
            className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-600/20 active:scale-95 transition-all group"
          >
            {remitMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              <>
                Confirm Remittance
                <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CODRemittanceModal;
