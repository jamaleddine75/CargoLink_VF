import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download, RefreshCw, History, Landmark, Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import customerWalletService, { WalletTransaction, CustomerWalletStats } from '@/services/api/customerWalletService';
import { paymentAccountService, PaymentAccountResponse } from '@/services/api/paymentAccountService';

// Shared components
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';
import BalanceHero from '@/components/wallet/BalanceHero';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import TransactionList from '@/components/wallet/TransactionList';
import PageHeader from '@/components/shared/PageHeader';

const PAGE_SIZE = 15;

const CustomerWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [txSearch, setTxSearch] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState('');
  const [withdrawSuccessData, setWithdrawSuccessData] = useState<any>(null);

  const queryKey = {
    stats: ['customer-wallet-stats', user?.id],
    transactions: ['customer-wallet-transactions', user?.id],
    paymentAccounts: ['customer-payment-accounts', user?.id],
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKey.stats,
    queryFn: () => customerWalletService.getStats(),
    enabled: !!user?.id,
    staleTime: 15000,
    retry: 1,
  });

  const { data: txPage, isLoading: txLoading } = useQuery({
    queryKey: queryKey.transactions,
    queryFn: () => customerWalletService.getTransactions(0, PAGE_SIZE),
    enabled: !!user?.id,
    staleTime: 15000,
    retry: 1,
  });

  const { data: paymentAccounts, isLoading: paymentAccountsLoading } = useQuery({
    queryKey: queryKey.paymentAccounts,
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
      queryClient.invalidateQueries({ queryKey: queryKey.paymentAccounts });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la connexion');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, paymentAccountId }: { amount: number; paymentAccountId: string }) =>
      customerWalletService.requestWithdrawal({ amount, paymentAccountId }),
    onSuccess: (res) => {
      setWithdrawSuccessData(res);
      setWithdrawSuccess(true);
      toast.success('Demande de retrait transmise');
      queryClient.invalidateQueries({ queryKey: queryKey.stats });
      queryClient.invalidateQueries({ queryKey: queryKey.transactions });
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
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT || amount > (stats?.availableBalance || 0)) {
      return toast.error(`Montant de retrait invalide (Minimum ${MIN_WITHDRAWAL_AMOUNT} MAD)`);
    }
    if (!paypalAccount) return toast.error('Compte PayPal requis');
    withdrawMutation.mutate({ amount, paymentAccountId: paypalAccount.id });
  };

  const isRefetching = statsLoading || txLoading || paymentAccountsLoading;
  const transactions = txPage?.content || [];
  const filteredTx = React.useMemo(() => {
    const list = txSearch
      ? transactions.filter((tx: WalletTransaction) => tx.description?.toLowerCase().includes(txSearch.toLowerCase()))
      : transactions;
    return list.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date || (t as any).createdAt,
      status: t.status,
    }));
  }, [transactions, txSearch]);

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Page Header */}
      <PageHeader
        title="Mon Portefeuille Marchand"
        description="Suivez votre solde, vos montants en attente et vos prochains versements"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['customer-wallet-stats'] })} className="gap-2">
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Synchroniser
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={(stats?.availableBalance || 0) <= 0}
              className="gap-2"
            >
              <Landmark className="w-3.5 h-3.5" /> Demander un Retrait
            </Button>
          </div>
        }
      />

      {statsLoading && !stats ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : (
        <BalanceHero
          title="Solde Net Disponible"
          balance={stats?.availableBalance || 0}
          secondaryStats={[
            { label: 'COD en Transit', value: stats?.pendingCOD || 0 },
            { label: 'Total Collecté', value: stats?.totalCOD || 0, className: 'text-emerald-600' },
          ]}
          microcopy="Vous recevez : montant COD encaissé − frais de livraison, crédité automatiquement dès confirmation par l'agence."
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transaction History (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Historique des flux</h3>
            </div>
            <Input 
              placeholder="Rechercher une transaction..." 
              className="h-9 w-48 text-xs bg-muted border-border"
              value={txSearch}
              onChange={e => setTxSearch(e.target.value)}
            />
          </div>

          <TransactionList transactions={filteredTx} loading={txLoading} />
        </div>

        {/* Sidebar Statistics (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-border bg-card p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Compte de paiement</p>
                <h4 className="text-sm font-semibold text-foreground">Versement marchand</h4>
              </div>
              <Badge className={cn(
                "text-[10px] font-semibold",
                paypalAccount ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {paypalAccount ? 'Connecté' : 'À connecter'}
              </Badge>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destinataire</p>
              <p className="mt-1 text-sm font-semibold text-foreground truncate">
                {paypalAccount?.accountIdentifier || 'Aucun compte PayPal lié'}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Les fonds disponibles partent selon le cycle de paiement configuré par l'agence.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 h-11 text-xs"
              onClick={() => setIsWithdrawModalOpen(true)}
            >
              {paypalAccount ? 'Gérer le compte' : 'Connecter PayPal'}
            </Button>
          </Card>

          <Card className="border border-border bg-card p-6 rounded-lg shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Santé Financière
            </h4>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Frais de livraison total</span>
                <span className="font-semibold text-rose-600">{(stats?.totalFees || 0).toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Missions livrées</span>
                <span className="font-semibold text-primary">{stats?.totalOrders || 0} Colis</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Moyenne COD / Mission</span>
                <span className="font-semibold text-amber-600">
                  {stats?.totalOrders ? Math.round((stats?.totalCOD || 0) / stats.totalOrders) : 0} MAD
                </span>
              </div>
            </div>
          </Card>

          {/* Export Button */}
          <Button 
            variant="outline"
            onClick={() => customerWalletService.downloadStatement().catch(() => toast.error("Export échoué"))}
            className="w-full h-14 rounded-lg flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <div className="text-left">
                <p className="text-xs font-semibold">Exporter l'historique</p>
                <p className="text-[10px] text-muted-foreground">Format CSV / Excel</p>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onOpenChange={(open) => {
          if (!withdrawMutation.isPending) {
            setIsWithdrawModalOpen(open);
            if (!open) {
              setWithdrawAmount('');
              setWithdrawSuccess(false);
              setWithdrawError(false);
              setWithdrawErrorMessage('');
              setWithdrawSuccessData(null);
            }
          }
        }}
        availableBalance={stats?.availableBalance || 0}
        paypalAccount={paypalAccount as any}
        paymentAccountsLoading={paymentAccountsLoading}
        isConnectingPaypal={isConnectingPaypal}
        setIsConnectingPaypal={setIsConnectingPaypal}
        paypalEmail={paypalEmail}
        setPaypalEmail={setPaypalEmail}
        onConnectPaypal={(e) => {
          e.preventDefault();
          if (!paypalEmail) return;
          connectPaypalMutation.mutate(paypalEmail);
        }}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        onWithdraw={handleWithdraw}
        isSubmitting={withdrawMutation.isPending || connectPaypalMutation.isPending}
        isSuccess={withdrawSuccess}
        isError={withdrawError}
        errorMessage={withdrawErrorMessage}
        successData={withdrawSuccessData}
        onReset={() => {
          setWithdrawAmount('');
          setWithdrawSuccess(false);
          setWithdrawError(false);
          setWithdrawErrorMessage('');
          setWithdrawSuccessData(null);
        }}
      />
    </div>
  );
};

export default CustomerWallet;
