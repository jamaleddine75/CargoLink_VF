import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Download,
  Search, TrendingUp, ShieldCheck, RefreshCw,
  Loader2, AlertCircle, History, Banknote,
  Receipt, Package, Clock, ChevronLeft, ChevronRight,
  Filter, X, CreditCard, Landmark, DollarSign,
  PieChart, Activity, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import customerWalletService, { WalletTransaction, CustomerWalletStats } from '@/services/api/customerWalletService';

const TX_TYPE_MAP: Record<string, { label: string; icon: React.ElementType; positive: boolean; color: string }> = {
  cod_collected: { label: 'Crédit COD', icon: Banknote, positive: true, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  delivery_payment: { label: 'Frais Envoi', icon: Receipt, positive: false, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  withdraw: { label: 'Retrait', icon: Landmark, positive: false, color: 'bg-primary/10 text-primary border-primary/20' },
  withdrawal: { label: 'Retrait', icon: Landmark, positive: false, color: 'bg-primary/10 text-primary border-primary/20' },
  refund: { label: 'Refund', icon: RefreshCw, positive: true, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  credit: { label: 'Crédit', icon: ArrowDownLeft, positive: true, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  debit: { label: 'Débit', icon: ArrowUpRight, positive: false, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

const getTxConfig = (type: string, amount: number) => {
  const key = type.toLowerCase();
  return TX_TYPE_MAP[key] ?? {
    label: type.replace(/_/g, ' '),
    icon: amount >= 0 ? ArrowDownLeft : ArrowUpRight,
    positive: amount >= 0,
    color: amount >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };
};

const CustomerWallet = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustomerWalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 15;

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Fetch stats and transactions independently to avoid full failure if one fails
      const statsPromise = customerWalletService.getStats()
        .then(s => setStats(s))
        .catch(err => {
          console.error("Wallet stats fetch error:", err);
          // Non-blocking error
        });

      const txPromise = customerWalletService.getTransactions(0, PAGE_SIZE)
        .then(t => {
          setTransactions(t.content || []);
          setTotalPages(t.totalPages || 0);
        })
        .catch(err => {
          console.error("Wallet transactions fetch error:", err);
          toast.error("Impossible de charger l'historique");
        });

      await Promise.allSettled([statsPromise, txPromise]);
    } catch (err) {
      console.error("Critical wallet sync error:", err);
      toast.error('Erreur de synchronisation financière');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > (stats?.availableBalance || 0)) return toast.error('Montant invalide');
    try {
      setIsSubmitting(true);
      await customerWalletService.requestWithdrawal({
        amount,
        bankAccount: withdrawAccount.trim(),
        accountHolder: `${user?.firstName} ${user?.lastName}`,
      });
      toast.success('Demande de retrait transmise');
      setIsWithdrawModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du retrait');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTx = txSearch
    ? transactions.filter(tx => tx.description?.toLowerCase().includes(txSearch.toLowerCase()))
    : transactions;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 space-y-10 relative z-10">
        
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <div className="flex items-center gap-2 mb-2">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/80">Gestion de Trésorerie</p>
                <div className="w-1 h-1 rounded-full bg-amber-500" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
               Flux <span className="text-amber-500">Financier</span>
             </h1>
          </motion.div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" onClick={fetchData} className="h-10 rounded-xl bg-accent/20 dark:bg-white/[0.03] border border-border/40 dark:border-white/5 text-[9px] font-black uppercase tracking-widest gap-2">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Synchroniser
             </Button>
             <Button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={(stats?.availableBalance || 0) <= 0}
                className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-amber-500/20 gap-2 transition-all active:scale-95"
             >
                <ArrowUpRight className="w-4 h-4" /> Demander un Retrait
             </Button>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Balance Hero (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
             <Card className="border-none bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                   <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Solde Net Disponible</p>
                      <div className="flex items-baseline gap-3">
                         <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic">
                           {loading ? '---' : (stats?.availableBalance || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                         </h2>
                         <span className="text-2xl font-black text-amber-500">MAD</span>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Frais de livraison déduits</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">COD en Transit</p>
                         <p className="text-xl font-black italic">{(stats?.pendingCOD || 0).toLocaleString()} <span className="text-xs opacity-30">MAD</span></p>
                         <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                            <div className="w-2/3 h-full bg-amber-500/50" />
                         </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                         <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Total Collecté</p>
                         <p className="text-xl font-black italic text-emerald-400">{(stats?.totalCOD || 0).toLocaleString()} <span className="text-xs opacity-30">MAD</span></p>
                      </div>
                   </div>
                </div>
             </Card>

             {/* Transaction Feed */}
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 border border-white/5 flex items-center justify-center">
                         <History className="w-5 h-5 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Historique des flux</h3>
                   </div>
                   <div className="relative w-48 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      <Input 
                        placeholder="Filtrer..." 
                        className="h-9 pl-9 bg-card/40 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        value={txSearch}
                        onChange={e => setTxSearch(e.target.value)}
                      />
                   </div>
                </div>

                <div className="bg-card/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
                   {loading ? (
                      <div className="p-4 space-y-4">
                         {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-2xl bg-white/5" />)}
                      </div>
                   ) : filteredTx.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {filteredTx.map((tx, idx) => (
                           <TransactionItem key={tx.id} tx={tx} idx={idx} />
                        ))}
                      </div>
                   ) : (
                      <div className="py-20 text-center">
                         <DollarSign className="w-12 h-12 text-white/10 mx-auto mb-4" />
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Aucune transaction détectée</p>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* SIDEBAR ANALYTICS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
             {/* Payout Summary */}
             <Card className="border-none bg-accent/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-xl relative overflow-hidden">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-500" /> Santé Financière
                </h4>
                <div className="space-y-6">
                   <StatRow label="Frais de livraison total" value={(stats?.totalFees || 0).toLocaleString()} suffix="MAD" color="rose" />
                   <StatRow label="Missions livrées" value={stats?.totalOrders || 0} suffix="COLIS" color="blue" />
                   <StatRow label="Moyenne COD / Mission" value={stats?.totalOrders ? Math.round((stats?.totalCOD || 0) / stats.totalOrders) : 0} suffix="MAD" color="amber" />
                </div>
             </Card>

             {/* Withdrawal Notice */}
             <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                   <PieChart className="w-20 h-20 text-amber-500" />
                </div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Rappel Sécurité</h5>
                <p className="text-xs font-bold text-foreground/60 leading-relaxed italic">
                  Les demandes de retrait sont auditées et traitées sous 48h ouvrables. Assurez-vous que vos coordonnées bancaires sont à jour.
                </p>
             </div>

             {/* Export Widget */}
             <Button 
                onClick={() => customerWalletService.downloadStatement().catch(() => toast.error("Export échoué"))}
                className="w-full h-16 bg-card/40 hover:bg-card/60 border border-white/5 rounded-[2rem] flex items-center justify-between px-8 group transition-all"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                      <Download className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Relevé de compte</p>
                      <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Format CSV / Excel</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all" />
             </Button>
          </div>
        </div>
      </div>

      {/* MODAL RETRAIT */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 rounded-[2.5rem] p-8 max-w-md text-white">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
              <Landmark size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Retrait de fonds</DialogTitle>
            <DialogDescription className="text-white/40 text-xs mt-2">
              Le montant sera transféré sur votre compte bancaire enregistré.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-6 py-4">
             <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Montant Maximum</p>
                <p className="text-2xl font-black">{(stats?.availableBalance || 0).toFixed(2)} <span className="text-xs opacity-30">MAD</span></p>
             </div>
             <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Montant à retirer</Label>
                <Input 
                  type="number" step="0.01" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 rounded-xl font-black text-lg focus:ring-amber-500/20"
                  placeholder="0.00"
                  required
                />
             </div>
             <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">RIB / Compte Bancaire</Label>
                <Input 
                  value={withdrawAccount} 
                  onChange={e => setWithdrawAccount(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 rounded-xl font-mono text-xs uppercase tracking-widest"
                  placeholder="MA64..."
                  required
                />
             </div>
             <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-amber-500/10">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer la transaction'}
             </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Sub-components */

const TransactionItem = ({ tx, idx }: { tx: WalletTransaction, idx: number }) => {
  const config = getTxConfig(tx.type, tx.amount);
  const Icon = config.icon;
  const isPositive = config.positive;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: idx * 0.05 }}
      className="flex items-center justify-between p-4 md:p-6 hover:bg-white/[0.02] transition-colors group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs md:text-sm text-foreground truncate">{tx.description}</p>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 bg-white/5 text-muted-foreground/40 px-1.5 py-0">
                {config.label}
             </Badge>
             <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
             </span>
          </div>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <p className={cn("font-black text-sm md:text-xl tracking-tighter italic", isPositive ? 'text-emerald-500' : 'text-rose-500')}>
           {isPositive ? '+' : ''}{tx.amount.toFixed(2)}
        </p>
        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1">{tx.status.split('_').pop()}</p>
      </div>
    </motion.div>
  );
};

const StatRow = ({ label, value, suffix, color }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-none">
     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{label}</span>
     <span className={cn("text-sm font-black italic", 
       color === 'rose' ? 'text-rose-500' : 
       color === 'blue' ? 'text-blue-500' : 'text-amber-500'
     )}>
       {value} <span className="text-[8px] opacity-30">{suffix}</span>
     </span>
  </div>
);

export default CustomerWallet;
