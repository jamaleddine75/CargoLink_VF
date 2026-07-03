import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight, Download, Loader2, XCircle,
  AlertCircle, Banknote, CreditCard,
  ArrowRight, Check, CheckCircle2, User, Building2,
  History, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import driverWalletService from '../../services/api/driverWalletService';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { paymentAccountService, PaymentAccountResponse } from '../../services/api/paymentAccountService';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import {
  BalanceCard,
  CodSummaryCard,
  CodUrgentAlert,
  WeeklyChart,
  TransactionItem
} from './wallet/components/WalletComponents';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../components/ui/dialog';

interface WithdrawalRequest {
  id: string;
  amount: number;
  paypalEmail?: string;
  paymentAccountId?: string;
  provider?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  rejectionReason?: string;
  paypalBatchId?: string;
  bankAccount?: string;
}

const WITHDRAWAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-500/10 text-amber-500' },
  COMPLETED: { label: 'Traité', color: 'bg-emerald-500/10 text-emerald-500' },
  REJECTED: { label: 'Rejeté', color: 'bg-rose-500/10 text-rose-500' },
  FAILED: { label: 'Échoué', color: 'bg-rose-500/10 text-rose-500' },
  PROCESSING: { label: 'En cours', color: 'bg-blue-500/10 text-blue-500' },
};

const WalletPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'earnings' | 'remittances'>('all');
  const [remitModalOpen, setRemitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [remitting, setRemitting] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '' });
  
  const { data: paymentAccounts, isLoading: paymentAccountsLoading } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: () => paymentAccountService.getMyPaymentAccounts(),
    enabled: withdrawModalOpen,
  });

  const paypalAccount = paymentAccounts?.find(acc => acc.provider === 'PAYPAL' && acc.status === 'ACTIVE');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['driver-wallet-balance'],
    queryFn: () => driverWalletService.getBalance(),
    refetchInterval: 30000,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['driver-transactions', activeTab],
    queryFn: () => driverWalletService.getTransactions(
      0, 20,
      activeTab === 'all' ? 'all' : activeTab === 'earnings' ? 'EARNING' : 'COD_COLLECTION'
    ),
  });

  const { data: dailyEarnings } = useQuery({
    queryKey: ['driver-daily-earnings'],
    queryFn: () => driverWalletService.getDailyEarnings(7),
  });

  const { data: pendingCod } = useQuery({
    queryKey: ['driver-pending-cod'],
    queryFn: () => driverWalletService.getPendingCod(),
  });

  const { data: pendingRemittances } = useQuery({
    queryKey: ['driver-active-remittances'],
    queryFn: () => apiClient.get(ENDPOINTS.WALLET.PENDING_COD_REMITTANCES).then(r => r.data),
  });

  const { data: withdrawalHistory } = useQuery({
    queryKey: ['driver-withdrawal-history'],
    queryFn: () => apiClient.get<WithdrawalRequest[]>(ENDPOINTS.WALLET.MY_WITHDRAWALS).then(r => r.data),
    enabled: historyOpen,
  });

  const lockedOrderIds = React.useMemo(() => {
    const ids = new Set<string>();
    pendingRemittances?.forEach((tx: { referenceIds?: string }) => {
      if (tx.referenceIds) tx.referenceIds.split(',').forEach((id: string) => ids.add(id.trim()));
    });
    return ids;
  }, [pendingRemittances]);

  const declareRemitMutation = useMutation({
    mutationFn: ({ orderIds, total }: { orderIds: string[]; total: number }) =>
      driverWalletService.declareCodRemittance(orderIds, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['driver-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-cod'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-remittances'] });
      toast.success('Déclaration envoyée ! Remettez le cash à votre agence.');
      setRemitModalOpen(false);
      setSelectedOrders([]);
    },
    onError: (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      const msg = err?.response?.data?.message || 'Échec de la déclaration';
      toast.error(msg);
      if (err?.response?.status === 400) {
        setSelectedOrders([]);
        queryClient.invalidateQueries({ queryKey: ['driver-pending-cod'] });
      }
    },
    onSettled: () => setRemitting(false),
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; paymentAccountId: string }) =>
      driverWalletService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['driver-withdrawal-history'] });
      toast.success('Demande de retrait soumise avec succès');
      setWithdrawForm({ amount: '' });
      // We will handle showing success state within the modal itself later, or just keep it closed as before.
      // But the prompt wants an animated success screen. Let's add a state for it.
    },
    onError: (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      toast.error(err?.response?.data?.message || 'Échec de la demande de retrait');
    },
  });

  const handleRemit = () => {
    if (selectedOrders.length === 0) return;
    const total = ((pendingCod as { orderId: string, amount: number }[]) || [])
      .filter(o => selectedOrders.includes(o.orderId))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setRemitting(true);
    declareRemitMutation.mutate({ orderIds: selectedOrders, total });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalAccount) return toast.error('Compte PayPal requis');
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount < 200) return toast.error('Montant minimum: 200 MAD');
    if (amount > (stats?.balance || 0)) return toast.error('Solde insuffisant');
    if ((stats?.debtToSystem || 0) > 0) return toast.error('Remettez vos COD avant de retirer');
    
    withdrawMutation.mutate({ amount, paymentAccountId: paypalAccount.id });
  };

  const balanceCardData = {
    balance: stats?.balance || 0,
    todayEarnings: stats?.todayEarnings || 0,
    weekEarnings: stats?.weeklyEarnings || 0,
    cashInHand: stats?.cashInHand || 0,
    pendingCOD: stats?.debtToSystem || 0,
    rating: null,
    accountStatus: (stats?.debtToSystem || 0) > 0 ? 'DEBT' : 'VERIFIED',
    nextPayoutDate: null,
  };

  const chartData = dailyEarnings?.map(d => ({
    day: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    gains: d.earnings,
  })) || [];

  const hasCodDebt = (stats?.debtToSystem || 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 font-sans overflow-x-hidden selection:bg-primary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="pt-10 md:pt-16 pb-6 md:pb-8">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-5">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <CreditCard size={28} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic leading-none">
                  Cargo<span className="text-primary">Finance</span>
                </h1>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
                  Treasury Command — Driver Node
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHistoryOpen(true)}
                className="rounded-xl h-10 w-10 md:h-12 md:w-12"
                title="Historique des retraits"
              >
                <History size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => driverWalletService.exportStatementCsv().catch(() => toast.error("Export échoué"))}
                className="rounded-xl h-10 w-10 md:h-12 md:w-12"
                title="Exporter le relevé CSV"
              >
                <Download size={18} />
              </Button>
            </div>
          </div>

          {statsLoading ? (
            <Skeleton className="h-[350px] md:h-[420px] w-full rounded-[2.5rem]" />
          ) : (
            <BalanceCard data={balanceCardData} />
          )}
        </div>

        <div className="space-y-6 md:space-y-10">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 400 }}>
              <Button
                onClick={() => setWithdrawModalOpen(true)}
                disabled={!stats?.balance || stats.balance <= 0 || hasCodDebt}
                className="h-16 md:h-20 w-full rounded-2xl md:rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 border-none group"
              >
                <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Demander un Retrait
              </Button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 400 }}>
              <Button
                variant="outline"
                onClick={() => setRemitModalOpen(true)}
                disabled={!pendingCod?.length}
                className="h-16 md:h-20 w-full rounded-2xl md:rounded-3xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-3 shadow-lg transition-all disabled:opacity-40"
              >
                Déclarer une Remise <ArrowRight size={20} />
              </Button>
            </motion.div>
          </div>

          {/* COD Debt Warning */}
          <AnimatePresence>
            {hasCodDebt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn("p-6 md:p-8 rounded-3xl border flex flex-col md:flex-row items-center gap-6",
                  pendingCod?.length 
                    ? "bg-rose-500/5 border-rose-500/20" 
                    : "bg-amber-500/5 border-amber-500/20"
                )}
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                  pendingCod?.length 
                    ? "bg-rose-500/10 text-rose-500" 
                    : "bg-amber-500/10 text-amber-500"
                )}>
                  {pendingCod?.length ? <AlertCircle size={28} /> : <Clock size={28} />}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h4 className={cn("text-lg font-black uppercase tracking-tight",
                    pendingCod?.length ? "text-rose-500" : "text-amber-500"
                  )}>
                    {pendingCod?.length ? "Retrait bloqué" : "Validation en attente"}
                  </h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">
                    {pendingCod?.length ? (
                      <>
                        Vous avez <span className="text-rose-500 font-black">{stats?.debtToSystem?.toFixed(2)} MAD</span> de COD non remis.
                        Déclarez une remise à votre agence pour débloquer les retraits.
                      </>
                    ) : (
                      <>
                        Vous avez <span className="text-amber-500 font-black">{stats?.debtToSystem?.toFixed(2)} MAD</span> de remises en attente de validation par l'agence. Les retraits seront débloqués dès confirmation.
                      </>
                    )}
                  </p>
                </div>
                {pendingCod?.length > 0 && (
                  <Button
                    onClick={() => setRemitModalOpen(true)}
                    className="shrink-0 h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-widest border-none"
                  >
                    Déclarer maintenant
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* COD Section + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            <div className="lg:col-span-5 space-y-6">
              <CodUrgentAlert
                urgentOrders={pendingCod?.filter((o: { deliveredAt: string | Date }) => {
                  const days = (Date.now() - new Date(o.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
                  return days > 2;
                })}
                onRemit={() => setRemitModalOpen(true)}
              />
              <CodSummaryCard
                pendingOrders={pendingCod || []}
                onRemit={() => setRemitModalOpen(true)}
              />
            </div>
            <div className="lg:col-span-7">
              <WeeklyChart data={chartData} />
            </div>
          </div>

          {/* Transaction History */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Historique des Transactions
              </h3>
              <div className="flex gap-1 bg-accent/20 p-1 rounded-xl">
                {(['all', 'earnings', 'remittances'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === 'all' ? 'Tout' : tab === 'earnings' ? 'Gains' : 'Remises'}
                  </button>
                ))}
              </div>
            </div>

            <Card className="bg-card/80 border border-border/60 rounded-[2.5rem] overflow-hidden">
              {txLoading ? (
                [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full border-b border-border/20" />)
              ) : transactions?.content?.length ? (
                <div className="divide-y divide-border/20">
                  {transactions.content.map((tx: any) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucune transaction</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal - PayPal Redesign */}
      <Dialog open={withdrawModalOpen} onOpenChange={(open) => {
        if (!withdrawMutation.isPending) {
          setWithdrawModalOpen(open);
          if (!open) {
            withdrawMutation.reset();
            setWithdrawForm({ amount: '' });
          }
        }
      }}>
        <DialogContent className="bg-[#121212] border-white/10 rounded-[2rem] p-0 overflow-hidden max-w-lg shadow-2xl">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/10 flex flex-col items-center text-center relative">
            <DialogTitle className="sr-only">Retrait PayPal</DialogTitle>
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setWithdrawModalOpen(false)} disabled={withdrawMutation.isPending} className="text-white/50 hover:text-white rounded-full">
                <XCircle size={24} />
              </Button>
            </div>
            
            <div className="w-16 h-16 rounded-2xl bg-[#0070E0]/10 flex items-center justify-center mb-4 text-[#0070E0]">
              {/* PayPal icon placeholder */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM15.441 5.918c-.023-.143-.047-.288-.077-.437C15.012 3.82 14.7 2.65 13.79 1.6 12.788.434 10.98 0 8.618 0H1.631a.641.641 0 0 0-.633.74L4.1 20.43c.082.518.53.9 1.054.9h4.606l1.12-7.106c.082-.518.53-.9 1.054-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Withdraw to PayPal</h2>
            <p className="text-white/60 text-sm mt-2 max-w-xs mx-auto">
              Transfer your available balance securely to your verified PayPal account.
            </p>
          </div>

          {paymentAccountsLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-[#0070E0] w-8 h-8" />
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Chargement de votre compte...</p>
            </div>
          ) : !paypalAccount ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                <AlertCircle size={40} className="text-white/40" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">No PayPal Account Connected</h3>
                <p className="text-white/50 text-sm mt-2">You need to connect a verified PayPal account before requesting a withdrawal.</p>
              </div>
              <Button onClick={() => { setWithdrawModalOpen(false); /* navigation logic to settings */ }} className="w-full h-14 bg-[#0070E0] hover:bg-[#0070E0]/90 text-white rounded-xl font-black">
                Connect PayPal
              </Button>
            </div>
          ) : withdrawMutation.isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Withdrawal Submitted</h3>
                <p className="text-white/60 text-sm mt-2">Your funds are being transferred to your PayPal account.</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/40 text-xs font-bold uppercase">Amount</span>
                  <span className="text-white font-bold">{parseFloat(withdrawForm.amount).toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-xs font-bold uppercase">Account</span>
                  <span className="text-white font-bold text-xs truncate max-w-[150px]">{paypalAccount.accountIdentifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-xs font-bold uppercase">Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none">PROCESSING</Badge>
                </div>
              </div>
              <Button onClick={() => setWithdrawModalOpen(false)} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold">
                Done
              </Button>
            </motion.div>
          ) : withdrawMutation.isError ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 text-center space-y-6">
               <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
                <XCircle size={40} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Withdrawal Failed</h3>
                <p className="text-rose-400 text-sm mt-2 font-medium">
                  {/* @ts-ignore */}
                  {withdrawMutation.error?.response?.data?.message || 'An unexpected error occurred.'}
                </p>
              </div>
              <Button onClick={() => withdrawMutation.reset()} className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold">
                Try Again
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-6">
              {/* Connected Account */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#0070E0]/20 flex items-center justify-center">
                    <User size={18} className="text-[#0070E0]" />
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-white truncate">{paypalAccount.accountIdentifier}</p>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] px-1.5 py-0">Verified</Badge>
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-0.5">PAYPAL</p>
                 </div>
                 <Button type="button" variant="ghost" className="text-xs text-[#0070E0] hover:bg-[#0070E0]/10 px-2 h-8 rounded-lg">Change</Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-black uppercase tracking-widest text-white/50">Withdraw Amount</Label>
                  <span className="text-xs font-bold text-emerald-400">Available: {(stats?.balance || 0).toFixed(2)} MAD</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white/30">MAD</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="200"
                    max={stats?.balance}
                    placeholder="0.00"
                    value={withdrawForm.amount}
                    onChange={e => setWithdrawForm({ amount: e.target.value })}
                    disabled={withdrawMutation.isPending}
                    className="h-16 pl-16 rounded-2xl bg-white/5 border-white/10 font-black text-3xl text-white placeholder:text-white/20 focus-visible:ring-[#0070E0]"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[200, 500, 1000, 'MAX'].map(val => (
                    <button
                      key={val}
                      type="button"
                      disabled={withdrawMutation.isPending || (val !== 'MAX' && (stats?.balance || 0) < Number(val))}
                      onClick={() => setWithdrawForm({ amount: val === 'MAX' ? String(stats?.balance || 0) : String(val) })}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors disabled:opacity-30"
                    >
                      {val === 'MAX' ? 'MAX' : `${val} MAD`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Platform Fee</span>
                  <span className="text-emerald-400 font-bold">0.00 MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">PayPal Fee</span>
                  <span className="text-white/50 italic">Calculated by PayPal</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between">
                  <span className="text-white font-bold">Estimated Arrival</span>
                  <span className="text-white font-bold text-right">Usually within minutes</span>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-start gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-500/90 leading-relaxed font-medium">
                  Your withdrawal is securely processed through PayPal. Funds are transferred only after PayPal confirms the payout.
                </p>
              </div>

              <Button
                type="submit"
                disabled={withdrawMutation.isPending || !withdrawForm.amount}
                className="w-full h-14 rounded-2xl bg-[#0070E0] hover:bg-[#0070E0]/90 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#0070E0]/20 transition-all relative overflow-hidden"
              >
                {withdrawMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> PROCESSING...</span>
                ) : (
                  `Withdraw ${(parseFloat(withdrawForm.amount) || 0).toFixed(2)} MAD`
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal History Drawer */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="bg-background border-border/40 rounded-[2rem] p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <History size={20} className="text-primary" /> Historique des Retraits
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-4">
            {withdrawalHistory?.length ? (
              withdrawalHistory.map(req => {
                const statusInfo = WITHDRAWAL_STATUS_MAP[req.status] ?? { label: req.status, color: 'bg-muted text-muted-foreground' };
                return (
                  <div key={req.id} className="p-5 rounded-2xl bg-accent/10 border border-border/40 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-foreground">{req.amount.toFixed(2)} MAD</span>
                        <Badge className={cn("border-none text-[8px] font-black uppercase px-2 py-0.5", statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase truncate font-mono mt-1">
                        PayPal: {req.paypalEmail || req.bankAccount || 'N/A'}
                      </p>
                      {req.rejectionReason && (
                        <p className="text-[9px] text-rose-500 mt-1 font-medium">Motif: {req.rejectionReason}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(req.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center opacity-30">
                <History className="w-10 h-10 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aucun retrait effectué</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* COD Remittance Modal */}
      <AnimatePresence>
        {remitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-2xl flex flex-col p-6 pt-16"
          >
            <div className="relative flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Déclaration de Remise</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Sélectionnez les colis à remettre</p>
              </div>
              <button
                onClick={() => setRemitModalOpen(false)}
                className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center"
              >
                <XCircle size={22} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-6">
              {(pendingCod || []).map((order: any) => {
                const isLocked = lockedOrderIds.has(order.orderId);
                const isSelected = selectedOrders.includes(order.orderId);
                return (
                  <div
                    key={order.id}
                    onClick={() => !isLocked && setSelectedOrders(prev =>
                      prev.includes(order.orderId) ? prev.filter(id => id !== order.orderId) : [...prev, order.orderId]
                    )}
                    className={cn(
                      "p-5 rounded-3xl border transition-all flex items-center justify-between",
                      isLocked ? "opacity-40 cursor-not-allowed bg-muted/20 border-border" : "cursor-pointer",
                      !isLocked && isSelected ? "bg-primary/10 border-primary" : !isLocked ? "bg-card border-border hover:border-primary/30" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        isLocked ? "bg-muted border-border" : isSelected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isSelected && <Check size={13} className="text-white" />}
                        {isLocked && <AlertCircle size={13} className="text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-foreground">
                          {order.trackingNumber}
                          {isLocked && <span className="text-muted-foreground text-[10px] ml-2 font-bold">(En transit)</span>}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{order.receiverName || order.description}</p>
                      </div>
                    </div>
                    <p className="font-black text-base">{(order.amount || 0).toFixed(2)} <span className="text-[10px] text-muted-foreground">MAD</span></p>
                  </div>
                );
              })}

              {(!pendingCod || pendingCod.length === 0) && (
                <div className="py-20 text-center opacity-30">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Tout est déjà remis !</p>
                </div>
              )}
            </div>

            <div className="bg-card rounded-[2rem] p-6 border border-border/60 mt-auto">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total sélectionné</p>
                  <p className="text-3xl font-black">
                    {(
                      ((pendingCod as any[]) || [])
                        .filter((o: any) => selectedOrders.includes(o.orderId))
                        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) as number
                    ).toFixed(2)} <span className="text-sm font-bold text-primary">MAD</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrders(
                    (pendingCod || []).filter((o: any) => !lockedOrderIds.has(o.orderId)).map((o: any) => o.orderId)
                  )}
                  className="text-[10px] font-black text-primary uppercase tracking-widest"
                >
                  Tout sélectionner
                </Button>
              </div>
              <Button
                disabled={selectedOrders.length === 0 || remitting}
                onClick={handleRemit}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              >
                {remitting ? <Loader2 className="animate-spin" /> : `Confirmer la déclaration (${selectedOrders.length} colis)`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
