import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download, Loader2,
  AlertCircle, Banknote,
  Check,
  History, Clock, X, PackageCheck, Landmark
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import driverWalletService, { PendingCodOrder } from '../../services/api/driverWalletService';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

// Shared Wallet Components
import BalanceHero from '@/components/wallet/BalanceHero';
import TransactionList from '@/components/wallet/TransactionList';
import StatusBadge from '@/components/wallet/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { paymentAccountService, PaymentAccountResponse } from '@/services/api/paymentAccountService';
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'earnings' | 'remittances'>('all');
  const [remitModalOpen, setRemitModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [remitting, setRemitting] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState('');
  const [withdrawSuccessData, setWithdrawSuccessData] = useState<any>(null);

  const { data: paymentAccounts, isLoading: paymentAccountsLoading } = useQuery({
    queryKey: ['driver-payment-accounts', user?.id],
    queryFn: () => paymentAccountService.getMyPaymentAccounts(),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1,
  });

  const paypalAccount = React.useMemo<PaymentAccountResponse | null>(() => {
    if (!paymentAccounts) return null;
    return paymentAccounts.find(a => a.provider === 'PAYPAL' && a.status === 'ACTIVE') || null;
  }, [paymentAccounts]);

  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');

  const connectPaypalMutation = useMutation({
    mutationFn: (email: string) =>
      paymentAccountService.createPaymentAccount({
        provider: 'PAYPAL',
        accountIdentifier: email,
        isDefault: true,
        preferredCurrency: 'MAD'
      }),
    onSuccess: () => {
      toast.success('Compte PayPal connecté avec succès');
      setIsConnectingPaypal(false);
      setPaypalEmail('');
      queryClient.invalidateQueries({ queryKey: ['driver-payment-accounts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la connexion');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, paymentAccountId }: { amount: number; paymentAccountId: string }) =>
      driverWalletService.requestWithdrawal({ amount, paymentAccountId }),
    onSuccess: (res) => {
      setWithdrawSuccessData(res);
      setWithdrawSuccess(true);
      toast.success('Demande de retrait transmise');
      queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['driver-transactions'] });
    },
    onError: (err: any) => {
      setWithdrawError(true);
      const msg = err.response?.data?.message || 'Erreur lors du retrait';
      setWithdrawErrorMessage(msg);
      toast.error(msg);
    },
  });

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT || amount > (stats?.balance || 0)) {
      return toast.error(`Montant de retrait invalide (Minimum ${MIN_WITHDRAWAL_AMOUNT} MAD)`);
    }
    if (!paypalAccount) return toast.error('Compte PayPal requis');
    withdrawMutation.mutate({ amount, paymentAccountId: paypalAccount.id });
  };

  const handleConnectPaypal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalEmail) return;
    connectPaypalMutation.mutate(paypalEmail);
  };

  const handleWithdrawReset = () => {
    setWithdrawSuccess(false);
    setWithdrawError(false);
    setWithdrawErrorMessage('');
    setWithdrawAmount('');
    setWithdrawSuccessData(null);
  };

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['driver-wallet-balance'],
    queryFn: () => driverWalletService.getBalance(),
    refetchInterval: 30000,
    retry: 1,
    staleTime: 15000,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['driver-transactions', activeTab],
    queryFn: () => driverWalletService.getTransactions(
      0, 20,
      activeTab === 'all' ? 'all' : activeTab === 'earnings' ? 'GAIN' : 'COD_REMIS',
      'ALL'
    ),
  });

  const { data: pendingCod } = useQuery({
    queryKey: ['driver-pending-cod'],
    queryFn: () => driverWalletService.getPendingCod(),
  });

  const { data: pendingRemittances } = useQuery({
    queryKey: ['driver-active-remittances'],
    queryFn: () => driverWalletService.getPendingCodRemittances(),
  });

  const { data: settlementTransactions } = useQuery({
    queryKey: ['driver-settlement-history'],
    queryFn: () => driverWalletService.getTransactions(0, 100, 'all', 'ALL'),
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
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string }, status?: number } };
      const msg = error?.response?.data?.message || 'Échec de la déclaration';
      toast.error(msg);
      if (error?.response?.status === 400) {
        setSelectedOrders([]);
        queryClient.invalidateQueries({ queryKey: ['driver-pending-cod'] });
      }
    },
    onSettled: () => setRemitting(false),
  });

  const handleRemit = () => {
    if (selectedOrders.length === 0) return;
    const total = ((pendingCod as PendingCodOrder[]) || [])
      .filter(o => selectedOrders.includes(o.orderId))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setRemitting(true);
    declareRemitMutation.mutate({ orderIds: selectedOrders, total });
  };

  const hasCodDebt = (stats?.debtToSystem || 0) > 0;

  const mappedTransactions = React.useMemo(() => {
    return (transactions?.content || []).map((t: { id: string; type: string; amount: number; description: string; createdAt?: string; date?: string; status: string }) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.createdAt || t.date,
      status: t.status,
    }));
  }, [transactions]);

  const settlementHistory = React.useMemo(() => {
    return (settlementTransactions?.content || [])
      .filter(tx => ['COD_REMIS', 'COD_SETTLED', 'COD_COLLECTION', 'COD_COLLECTED'].includes(tx.type))
      .map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.createdAt || t.date,
        status: t.status,
      }));
  }, [settlementTransactions]);

  const pendingCodOrders = React.useMemo(() => (pendingCod as PendingCodOrder[] | undefined) || [], [pendingCod]);
  const selectedPendingOrders = React.useMemo(
    () => pendingCodOrders.filter((order) => selectedOrders.includes(order.orderId)),
    [pendingCodOrders, selectedOrders]
  );
  const pendingCodSummary = React.useMemo(() => {
    const totalRemit = pendingCodOrders.reduce((acc, order) => acc + (order.amount || 0), 0);
    const totalCod = pendingCodOrders.reduce((acc, order) => acc + (order.codAmount || 0), 0);
    return {
      totalRemit,
      totalCod,
      orderCount: pendingCodOrders.length,
      driverKept: Math.max((stats?.cashInHand || 0) - totalRemit, 0),
    };
  }, [pendingCodOrders, stats?.cashInHand]);

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mon Portefeuille</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de vos gains et de vos encaissements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            className="rounded-md"
            title="Historique des remises"
          >
            <History size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => driverWalletService.exportStatementCsv().catch(() => toast.error("Échec de l'export"))}
            className="rounded-md"
            title="Exporter en CSV"
          >
            <Download size={16} />
          </Button>
          <Button 
            size="sm"
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={(stats?.balance || 0) <= 0}
            className="gap-2"
          >
            <Landmark className="w-3.5 h-3.5" /> Demander un Retrait
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : statsError ? (
        <Card className="p-6 border border-destructive/20 bg-destructive/5 text-center text-destructive flex flex-col items-center justify-center gap-3">
          <AlertCircle size={28} />
          <p className="text-sm font-semibold">Impossible de charger le solde</p>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] })}>
            Réessayer
          </Button>
        </Card>
      ) : (
        <BalanceHero
          title="Solde Disponible"
          balance={stats?.balance || 0}
          secondaryStats={[
            { label: 'Cash en Main', value: stats?.cashInHand || 0 },
            { label: 'Dette au Système', value: stats?.debtToSystem || 0, className: hasCodDebt ? 'text-amber-600' : '' },
          ]}
          microcopy="Vos gains restent dans votre solde. Remettez uniquement le cash COD et les frais à votre agence."
        />
      )}

      {/* COD Debt Section */}
      {hasCodDebt && (
        <div className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-amber-600">Dette au Système</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Vous devez remettre <span className="font-semibold text-foreground">{(stats?.debtToSystem || 0).toFixed(2)} MAD</span> de cash non encore reversé à l'agence. Les retraits sont temporairement suspendus jusqu'à régularisation.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-md border border-border bg-background/60 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Dette totale</p>
                  <p className="mt-0.5 text-sm font-bold text-amber-600">{(stats?.debtToSystem || 0).toFixed(2)} MAD</p>
                </div>
                <div className="rounded-md border border-border bg-background/60 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cash en main</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{(stats?.cashInHand || 0).toFixed(2)} MAD</p>
                </div>
                <div className="rounded-md border border-border bg-background/60 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Solde dispo.</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{(stats?.balance || 0).toFixed(2)} MAD</p>
                </div>
                <div className="rounded-md border border-border bg-background/60 p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Impact</p>
                  <p className="mt-0.5 text-sm font-bold text-rose-500">Retraits gelés</p>
                </div>
              </div>
            </div>
            {pendingCod?.length > 0 && (
              <Button
                onClick={() => setRemitModalOpen(true)}
                className="shrink-0 rounded-lg text-xs"
              >
                Déclarer maintenant
              </Button>
            )}
          </div>
          <div className="border-t border-amber-500/10 px-4 py-2.5 bg-amber-500/[0.02]">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <AlertCircle size={10} className="text-amber-500" />
              Après validation de la remise par l'agence, votre dette sera soldée et les retraits seront automatiquement débloqués.
            </p>
          </div>
        </div>
      )}

      {/* Settlement Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <Card className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card p-5">
          <div className="absolute inset-y-0 right-0 w-32 bg-amber-500/5 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-600">Règle de règlement</p>
                <h3 className="text-sm font-semibold text-foreground">Le driver garde ses gains, puis remet le cash COD et les frais à l’agence.</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cash Collecté</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{(stats?.cashInHand || 0).toFixed(2)} MAD</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gain de Course</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{(stats?.totalEarned || 0).toFixed(2)} MAD</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dû à la Plateforme</p>
                <p className="mt-1 text-sm font-semibold text-amber-600">{(stats?.cashInHand || 0).toFixed(2)} MAD</p>
              </div>
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">En attente de remise</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{(stats?.cashInHand || 0).toFixed(2)} MAD</p>
              </div>
            </div>
          </div>
        </Card>

        <Button
          variant="outline"
          onClick={() => setRemitModalOpen(true)}
          disabled={!pendingCod?.length}
          className="h-full min-h-[128px] rounded-xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 font-semibold flex flex-col items-center justify-center gap-2 px-4"
        >
          <Banknote size={20} />
          <span>Déclarer un Dépôt Cash</span>
          <span className="text-[10px] text-muted-foreground font-normal text-center">Sélectionnez les colis à remettre à l’agence</span>
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <Card className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">COD en attente</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">Commandes à remettre à l'agence</h3>
            </div>
            <StatusBadge status={pendingCodSummary.orderCount > 0 ? 'PENDING' : 'COMPLETED'} />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">À remettre</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{pendingCodSummary.totalRemit.toFixed(2)} MAD</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">COD inclus</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{pendingCodSummary.totalCod.toFixed(2)} MAD</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Part gardée</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">{pendingCodSummary.driverKept.toFixed(2)} MAD</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {pendingCodOrders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center flex flex-col items-center gap-2">
                <PackageCheck className="w-6 h-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Aucune commande COD en attente de remise.</p>
              </div>
            ) : (
              pendingCodOrders.map((order) => {
                const checked = selectedOrders.includes(order.orderId);
                return (
                  <label key={order.orderId} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={lockedOrderIds.has(order.orderId)}
                      onChange={(e) => {
                        setSelectedOrders((prev) => e.target.checked
                          ? [...prev, order.orderId]
                          : prev.filter((id) => id !== order.orderId));
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-foreground">{order.trackingNumber || order.orderId}</p>
                        <p className="text-xs font-semibold text-amber-600">{(order.amount || 0).toFixed(2)} MAD</p>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground truncate">{order.deliveryAddress || 'Adresse indisponible'}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        <span>COD {Number(order.codAmount || 0).toFixed(2)} MAD</span>
                        {lockedOrderIds.has(order.orderId) && <span className="text-amber-600">Déjà dans une remise en attente</span>}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Récap remise</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">Ce que vous allez déclarer</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Commandes sélectionnées</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{selectedPendingOrders.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Montant à remettre</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {selectedPendingOrders.reduce((acc, order) => acc + (order.amount || 0), 0).toFixed(2)} MAD
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Règle appliquée</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">Votre part reste avec vous</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Le système exclut automatiquement votre gain du montant à remettre.</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Affichage indicatif: le backend recalcule toujours le montant final à la confirmation agence.</p>
            </div>
          </div>
          <Button
            onClick={() => setRemitModalOpen(true)}
            disabled={selectedPendingOrders.length === 0}
            className="mt-5 w-full rounded-lg"
          >
            Déclarer la remise sélectionnée
          </Button>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Historique des Transactions</h3>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {(['all', 'earnings', 'remittances'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === 'all' ? 'Tout' : tab === 'earnings' ? 'Gains' : 'Dépôts'}
              </button>
            ))}
          </div>
        </div>

        <TransactionList transactions={mappedTransactions} loading={txLoading} />
      </div>

      {/* Settlement History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History size={18} className="text-primary" /> Historique des Remises
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto py-2 text-left">
            {settlementHistory.length ? (
              settlementHistory.map(tx => (
                <div key={tx.id} className="p-4 rounded-lg bg-muted border border-border flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{Math.abs(tx.amount).toFixed(2)} MAD</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate font-mono mt-1">
                      {tx.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(tx.date || Date.now()).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <History size={24} className="text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Aucune remise enregistrée</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* COD Remittance Modal */}
      <AnimatePresence>
        {remitModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 flex flex-col p-6 pt-16">
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
              <div>
                <h2 className="text-lg font-bold">Déclaration de Dépôt Cash</h2>
                <p className="text-xs text-muted-foreground">Sélectionnez les colis à remettre</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRemitModalOpen(false)}
                className="w-10 h-10 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-6 max-w-2xl mx-auto w-full text-left">
              {(pendingCod || []).map((order: PendingCodOrder) => {
                const isLocked = lockedOrderIds.has(order.orderId);
                const isSelected = selectedOrders.includes(order.orderId);
                return (
                  <div
                    key={order.id}
                    onClick={() => !isLocked && setSelectedOrders(prev =>
                      prev.includes(order.orderId) ? prev.filter(id => id !== order.orderId) : [...prev, order.orderId]
                    )}
                    className={cn(
                      "p-4 rounded-lg border flex items-center justify-between",
                      isLocked ? "opacity-40 cursor-not-allowed bg-muted" : "cursor-pointer",
                      !isLocked && isSelected ? "bg-primary/5 border-primary" : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {order.trackingNumber}
                          {isLocked && <span className="text-muted-foreground text-[10px] ml-2 font-normal">(En cours de validation)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.receiverName || order.description}</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm">{(order.amount || 0).toFixed(2)} MAD</p>
                  </div>
                );
              })}

              {(!pendingCod || pendingCod.length === 0) && (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  Tout a déjà été déposé !
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg p-6 border border-border mt-auto max-w-2xl mx-auto w-full">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total sélectionné</p>
                  <p className="text-2xl font-bold">
                    {(
                      (((pendingCod as { amount?: number; orderId: string }[]) || [])
                        .filter((o) => selectedOrders.includes(o.orderId))
                        .reduce((acc: number, curr) => acc + (curr.amount || 0), 0))
                    ).toFixed(2)} <span className="text-sm font-semibold text-primary">MAD</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrders(
                    (pendingCod || []).filter((o: { orderId: string }) => !lockedOrderIds.has(o.orderId)).map((o: { orderId: string }) => o.orderId)
                  )}
                  className="text-xs"
                >
                  Tout sélectionner
                </Button>
              </div>
              <Button
                disabled={selectedOrders.length === 0 || remitting}
                onClick={handleRemit}
                className="w-full h-12 text-sm font-semibold"
              >
                {remitting ? <Loader2 className="animate-spin w-4 h-4" /> : `Confirmer la déclaration (${selectedOrders.length} colis)`}
              </Button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onOpenChange={setIsWithdrawModalOpen}
        availableBalance={stats?.balance || 0}
        paypalAccount={paypalAccount}
        paymentAccountsLoading={paymentAccountsLoading}
        isConnectingPaypal={isConnectingPaypal}
        setIsConnectingPaypal={setIsConnectingPaypal}
        paypalEmail={paypalEmail}
        setPaypalEmail={setPaypalEmail}
        onConnectPaypal={handleConnectPaypal}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        onWithdraw={handleWithdraw}
        isSubmitting={withdrawMutation.isPending || connectPaypalMutation.isPending}
        isSuccess={withdrawSuccess}
        isError={withdrawError}
        errorMessage={withdrawErrorMessage}
        successData={withdrawSuccessData}
        onReset={handleWithdrawReset}
      />
    </div>
  );
};

export default WalletPage;
