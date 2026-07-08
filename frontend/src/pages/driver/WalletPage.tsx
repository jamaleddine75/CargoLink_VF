import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight, Download, Loader2,
  AlertCircle, Banknote, CreditCard,
  ArrowRight, Check, CheckCircle2,
  History, Clock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import driverWalletService from '../../services/api/driverWalletService';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { paymentAccountService } from '../../services/api/paymentAccountService';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

// Shared Wallet Components
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';
import BalanceHero from '@/components/wallet/BalanceHero';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import TransactionList from '@/components/wallet/TransactionList';
import StatCard from '@/components/wallet/StatCard';
import StatusBadge from '@/components/wallet/StatusBadge';

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

const WalletPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'earnings' | 'remittances'>('all');
  const [remitModalOpen, setRemitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [remitting, setRemitting] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '' });
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  
  const { data: paymentAccounts, isLoading: paymentAccountsLoading } = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: () => paymentAccountService.getMyPaymentAccounts(),
    enabled: withdrawModalOpen,
  });

  const paypalAccount = paymentAccounts?.find(acc => acc.provider === 'PAYPAL' && acc.status === 'ACTIVE');

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
      activeTab === 'all' ? 'all' : activeTab === 'earnings' ? 'EARNING' : 'COD_COLLECTION'
    ),
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
    onError: (err: any) => {
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
    },
    onError: (err: any) => {
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
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) return toast.error(`Montant minimum: ${MIN_WITHDRAWAL_AMOUNT} MAD`);
    if (amount > (stats?.balance || 0)) return toast.error('Solde insuffisant');
    if ((stats?.debtToSystem || 0) > 0) return toast.error('Remettez vos COD avant de retirer');
    
    withdrawMutation.mutate({ amount, paymentAccountId: paypalAccount.id });
  };

  const hasCodDebt = (stats?.debtToSystem || 0) > 0;

  const mappedTransactions = React.useMemo(() => {
    return (transactions?.content || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.createdAt || t.date,
      status: t.status,
    }));
  }, [transactions]);

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
            title="Historique des retraits"
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
          microcopy="Vos gains sont transférés vers votre compte PayPal. Vous devez d'abord remettre le cash COD collecté."
        />
      )}

      {/* COD Debt Warning Banner */}
      {hasCodDebt && (
        <div className={cn("p-4 rounded-lg border flex flex-col sm:flex-row items-center gap-4 text-left bg-amber-500/5 border-amber-500/20")}>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-600">Retrait Bloqué</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vous détenez <span className="font-semibold text-foreground">{stats?.debtToSystem?.toFixed(2)} MAD</span> de cash non remis. Veuillez déclarer un dépôt pour débloquer les retraits.
            </p>
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
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={!stats?.balance || stats.balance <= 0 || hasCodDebt}
          className="h-14 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          <ArrowUpRight size={18} />
          Demander un Retrait
        </Button>

        <Button
          variant="outline"
          onClick={() => setRemitModalOpen(true)}
          disabled={!pendingCod?.length}
          className="h-14 rounded-lg border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 font-semibold flex items-center justify-center gap-2"
        >
          <Banknote size={18} />
          Déclarer un Dépôt Cash
        </Button>
      </div>

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

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawModalOpen}
        onOpenChange={(open) => {
          if (!withdrawMutation.isPending) {
            setWithdrawModalOpen(open);
            if (!open) {
              withdrawMutation.reset();
              setWithdrawForm({ amount: '' });
            }
          }
        }}
        availableBalance={stats?.balance || 0}
        paypalAccount={paypalAccount}
        paymentAccountsLoading={paymentAccountsLoading}
        isConnectingPaypal={isConnectingPaypal}
        setIsConnectingPaypal={setIsConnectingPaypal}
        paypalEmail={paypalEmail}
        setPaypalEmail={setPaypalEmail}
        onConnectPaypal={async (e) => {
          e.preventDefault();
          if (!paypalEmail) return;
          try {
            await paymentAccountService.createPaymentAccount({
              provider: 'PAYPAL',
              accountIdentifier: paypalEmail,
              isDefault: true,
              preferredCurrency: 'MAD'
            });
            toast.success('Compte PayPal connecté avec succès');
            setIsConnectingPaypal(false);
            setPaypalEmail('');
            queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erreur lors de la connexion');
          }
        }}
        withdrawAmount={withdrawForm.amount}
        setWithdrawAmount={(val) => setWithdrawForm({ amount: val })}
        onWithdraw={handleWithdrawSubmit}
        isSubmitting={withdrawMutation.isPending}
        isSuccess={withdrawMutation.isSuccess}
        isError={withdrawMutation.isError}
        errorMessage={(withdrawMutation.error as any)?.response?.data?.message}
        successData={withdrawMutation.data}
        onReset={() => { 
          withdrawMutation.reset(); 
          setWithdrawForm({ amount: '' }); 
        }}
        blockedReason={hasCodDebt ? `Vous devez d'abord remettre vos espèces en main (${stats?.debtToSystem?.toFixed(2)} MAD) pour débloquer les retraits.` : undefined}
      />

      {/* Withdrawal History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History size={18} className="text-primary" /> Historique des Retraits
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto py-2 text-left">
            {withdrawalHistory?.length ? (
              withdrawalHistory.map(req => (
                <div key={req.id} className="p-4 rounded-lg bg-muted border border-border flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{req.amount.toFixed(2)} MAD</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate font-mono mt-1">
                      PayPal: {req.paypalEmail || req.bankAccount || 'N/A'}
                    </p>
                    {req.rejectionReason && (
                      <p className="text-[10px] text-rose-500 mt-1">Raison: {req.rejectionReason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(req.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs">
                Aucun retrait effectué
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
                      ((pendingCod as any[]) || [])
                        .filter((o: any) => selectedOrders.includes(o.orderId))
                        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) as number
                    ).toFixed(2)} <span className="text-sm font-semibold text-primary">MAD</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrders(
                    (pendingCod || []).filter((o: any) => !lockedOrderIds.has(o.orderId)).map((o: any) => o.orderId)
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
    </div>
  );
};

export default WalletPage;
