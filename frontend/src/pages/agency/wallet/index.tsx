import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet, Clock, Download, RefreshCw, CheckCircle2,
  CreditCard, ShieldCheck, Banknote, ChevronLeft, ChevronRight,
  TrendingUp, Search, Building2, AlertCircle, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { paymentAccountService, PaymentAccountResponse } from '@/services/api/paymentAccountService';

// Shared Wallet Components
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';
import StatCard from '@/components/wallet/StatCard';
import StatusBadge from '@/components/wallet/StatusBadge';
import { PagedResponse } from '@/types';

interface AgencyWalletData {
  balance: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  commissionRate: number;
  totalCollected: number;
  totalPaidOut: number;
  isFrozen: boolean;
}

interface Commission {
  orderId?: string;
  amount: number;
  status: string;
  date: string;
  createdAt?: string;
  description?: string;
  driverName?: string;
  driverPhone?: string;
  referenceIds?: string;
}

interface Remittance {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  referenceIds: string;
  driverName?: string;
  driverPhone?: string;
  driverUserId?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  receiverEmailSnapshot?: string;
  provider?: string;
  rejectionReason?: string;
}

const PAGE_SIZE = 10;

export default function AgencyWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [commPage, setCommPage] = useState(0);
  const [remitPage, setRemitPage] = useState(0);
  const [payoutPage, setPayoutPage] = useState(0);

  const { data: wallet, isLoading: walletLoading } = useQuery<AgencyWalletData>({
    queryKey: ['agency-wallet'],
    queryFn: () => apiClient.get<AgencyWalletData>(ENDPOINTS.WALLET.AGENCY_BALANCE).then(r => r.data),
  });

  const commPageRes = useQuery<PagedResponse<Commission>>({
    queryKey: ['agency-commissions', commPage],
    queryFn: () => apiClient.get<PagedResponse<Commission>>(ENDPOINTS.WALLET.AGENCY_COMMISSIONS, {
      params: { page: commPage, size: PAGE_SIZE }
    }).then(r => r.data),
  });
  const commissions = commPageRes.data?.content ?? [];
  const commLoading = commPageRes.isLoading;
  const commTotalPages = commPageRes.data?.totalPages ?? 0;

  const remitPageRes = useQuery<PagedResponse<Remittance>>({
    queryKey: ['agency-remittances', remitPage],
    queryFn: () => apiClient.get<PagedResponse<Remittance>>(ENDPOINTS.WALLET.AGENCY_REMITTANCES, {
      params: { page: remitPage, size: PAGE_SIZE }
    }).then(r => r.data),
  });
  const remittances = remitPageRes.data?.content ?? [];
  const remitLoading = remitPageRes.isLoading;
  const remitTotalPages = remitPageRes.data?.totalPages ?? 0;

  const payoutPageRes = useQuery<PagedResponse<Payout>>({
    queryKey: ['agency-payouts', payoutPage],
    queryFn: () => apiClient.get<PagedResponse<Payout>>(ENDPOINTS.WALLET.AGENCY_PAYOUTS, {
      params: { page: payoutPage, size: PAGE_SIZE }
    }).then(r => r.data),
  });
  const payouts = payoutPageRes.data?.content ?? [];
  const payoutLoading = payoutPageRes.isLoading;
  const payoutTotalPages = payoutPageRes.data?.totalPages ?? 0;

  const { data: paymentAccounts = [], isLoading: accountsLoading } = useQuery<PaymentAccountResponse[]>({
    queryKey: ['agency-payment-accounts'],
    queryFn: () => paymentAccountService.getMyPaymentAccounts(),
  });

  const loading = walletLoading || commLoading || remitLoading || payoutLoading || accountsLoading;

  const handleExport = async () => {
    try {
      setExportingCsv(true);
      const response = await apiClient.get(ENDPOINTS.WALLET.STATEMENT_CSV, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `releve-agence-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Échec de l'export");
    } finally {
      setExportingCsv(false);
    }
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user?.agencyId) throw new Error("Agence introuvable");
      return apiClient.post(ENDPOINTS.AGENCIES.CONFIRM_REMITTANCE(user.agencyId, id));
    },
    onSuccess: () => {
      toast.success("Remise confirmée — solde crédité");
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['agency-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['agency-remittances'] });
      queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['driver-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-cod'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-remittances'] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur lors de la confirmation"),
  });

  const payoutMutation = useMutation({
    mutationFn: (params: { amount: number; paymentAccountId: string }) =>
      apiClient.post(ENDPOINTS.WALLET.AGENCY_PAYOUT_REQUEST, params),
    onSuccess: () => {
      toast.success("Demande de virement soumise");
      setPayoutAmount('');
      queryClient.invalidateQueries({ queryKey: ['agency-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['agency-payouts'] });
    },
    onError: () => toast.error("Échec de la demande"),
  });

  const connectPaypalMutation = useMutation({
    mutationFn: (email: string) =>
      paymentAccountService.createPaymentAccount({
        provider: 'PAYPAL',
        accountIdentifier: email,
        isDefault: true,
        preferredCurrency: 'MAD',
      }),
    onSuccess: () => {
      toast.success("Compte PayPal connecté");
      setIsConnectingPaypal(false);
      setPaypalEmail('');
      queryClient.invalidateQueries({ queryKey: ['agency-payment-accounts'] });
    },
    onError: () => toast.error("Impossible de connecter le compte PayPal"),
  });

  const paypalAccount = useMemo<PaymentAccountResponse | null>(() => {
    return paymentAccounts.find((account) => account.provider === 'PAYPAL' && account.status === 'ACTIVE') || null;
  }, [paymentAccounts]);

  const handleConfirmRemittance = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handlePayoutRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) return toast.error(`Montant minimum: ${MIN_WITHDRAWAL_AMOUNT} MAD`);
    if (amount > (wallet?.balance || 0)) return toast.error("Solde insuffisant");
    if (!paypalAccount) return toast.error("Compte PayPal requis");
    payoutMutation.mutate({ amount, paymentAccountId: paypalAccount.id });
  };

  const handleConnectPaypal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalEmail.trim()) {
      toast.error("E-mail PayPal requis");
      return;
    }
    connectPaypalMutation.mutate(paypalEmail.trim());
  };

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c =>
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (searchQuery === '' || (c.orderId && c.orderId.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [commissions, statusFilter, searchQuery]);

  const pendingRemittances = remittances.filter(r => r.status === 'PENDING');
  const pendingRemittanceAmount = useMemo(
    () => pendingRemittances.reduce((sum, remit) => sum + (remit.amount || 0), 0),
    [pendingRemittances]
  );
  const totalEarnedThisMonth = useMemo(() => {
    const now = new Date();
    return commissions
      .filter(c => {
        const d = new Date(c.date || c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, c) => acc + c.amount, 0);
  }, [commissions]);
  const estimatedMerchantDue = useMemo(() => {
    return Math.max((wallet?.totalCollected || 0) - (wallet?.totalCommissionEarned || 0), 0);
  }, [wallet?.totalCollected, wallet?.totalCommissionEarned]);

  if (loading && !wallet) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement du portefeuille...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Portefeuille Agence</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Validez les remises COD, pilotez les soldes et préparez les paiements marchands</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {wallet?.isFrozen && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Compte gelé
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['agency-wallet'] });
            queryClient.invalidateQueries({ queryKey: ['agency-commissions'] });
            queryClient.invalidateQueries({ queryKey: ['agency-remittances'] });
            queryClient.invalidateQueries({ queryKey: ['agency-payouts'] });
            queryClient.invalidateQueries({ queryKey: ['agency-payment-accounts'] });
          }} disabled={loading} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Rafraîchir
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exportingCsv} className="gap-2">
            <Download className="w-4 h-4" />
            {exportingCsv ? 'Exportation...' : 'Exporter CSV'}
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {[
              { label: 'Solde disponible', value: (wallet?.balance || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sub: 'Montant prêt pour les virements et validations', isCount: false },
              { label: 'Remises en attente', value: pendingRemittances.length.toString(), sub: 'Cash déjà collecté mais pas encore validé', isCount: true },
              { label: 'Commission du mois', value: totalEarnedThisMonth.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sub: "Ce que l'agence a déjà sécurisé ce mois-ci", isCount: false },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card p-5 hover:bg-muted/20 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {item.value}{!item.isCount && <span className="text-sm text-muted-foreground"> MAD</span>}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 h-9 overflow-x-auto w-full justify-start border-b border-border bg-transparent p-0 gap-4">
          {[
            { value: 'overview', label: 'Vue d\'ensemble' },
            { value: 'commissions', label: 'Commissions' },
            { value: 'remittances', label: 'Remises COD' },
            { value: 'payouts', label: 'Virements' },
          ].map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="text-xs gap-1.5 whitespace-nowrap px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              {tab.label}
              {tab.value === 'remittances' && pendingRemittances.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingRemittances.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Solde Disponible" value={wallet?.balance || 0} icon={Wallet} />
                <StatCard label="Total Commissions" value={wallet?.totalCommissionEarned || 0} icon={ShieldCheck} />
                <StatCard label="Commission en Attente" value={wallet?.pendingCommission || 0} icon={Clock} />
                <Card className="border border-border bg-card p-6 rounded-lg relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ce mois-ci</p>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                      {totalEarnedThisMonth.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-muted-foreground ml-1">MAD</span>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-medium text-muted-foreground">Commissions du mois</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-border bg-card p-5 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cash en attente de validation</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{pendingRemittanceAmount.toFixed(2)} MAD</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{pendingRemittances.length} remise(s) driver à confirmer</p>
                </Card>
                <Card className="border border-border bg-card p-5 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total dû aux marchands</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{estimatedMerchantDue.toFixed(2)} MAD</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Montant COD collecté moins la commission agence</p>
                </Card>
              </div>

              {/* Commission rate info */}
              <Card className="border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Taux de Commission</p>
                  <p className="font-semibold text-foreground">
                    {wallet?.commissionRate !== undefined
                      ? `${(wallet.commissionRate * 100).toFixed(0)}%`
                      : '15%'
                    } <span className="text-xs text-muted-foreground font-normal">de chaque frais de livraison</span>
                  </p>
                </div>
                <div className="sm:ml-auto text-left sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Total collecté COD</p>
                  <p className="font-semibold text-foreground">
                    {(wallet?.totalCollected || 0).toFixed(2)} <span className="text-xs opacity-50">MAD</span>
                  </p>
                </div>
              </Card>

              {/* Pending Remittances */}
              <Card className="border border-border bg-card rounded-lg overflow-hidden">
                <CardHeader className="p-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-semibold">Remises COD en Attente</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Confirmez la réception physique du cash
                      </CardDescription>
                    </div>
                    {pendingRemittances.length > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold px-3 py-1">
                        {pendingRemittances.length} Alerte{pendingRemittances.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingRemittances.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                      <p className="text-xs text-muted-foreground">Aucune remise en attente</p>
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
                      {pendingRemittances.map(remit => (
                        <div key={remit.id}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shrink-0">
                              <Banknote className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-semibold text-foreground">{remit.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(remit.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                                {' '}&mdash;{' '}
                                {remit.referenceIds.split(',').length} colis
                              </p>
                              {remit.driverName && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {remit.driverName}{remit.driverPhone && ` · ${remit.driverPhone}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 ml-auto">
                            <p className="text-lg font-bold">{remit.amount.toFixed(2)} <span className="text-xs opacity-50">MAD</span></p>
                            <Button 
                              size="sm" 
                              onClick={() => setConfirmId(remit.id)}
                              className="rounded-lg text-xs font-semibold px-4 h-9 bg-primary"
                            >
                              Confirmer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* COMMISSIONS TAB */}
          <TabsContent value="commissions">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border border-border bg-card rounded-lg overflow-hidden">
                <CardHeader className="p-6 border-b border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-semibold">Historique des Commissions</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un ordre..."
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setCommPage(0); }}
                          className="h-9 pl-9 text-xs bg-muted border-border w-full sm:w-48"
                        />
                      </div>
                      <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        {['ALL', 'PENDING', 'CREDITED'].map(f => (
                          <button key={f} onClick={() => { setStatusFilter(f); setCommPage(0); }}
                            className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all",
                              statusFilter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            )}>
                            {f === 'ALL' ? 'Tout' : f === 'PENDING' ? 'En attente' : 'Crédité'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredCommissions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">Aucune commission</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="px-6 text-xs text-muted-foreground">Order ID</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Description</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Commission</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Statut</TableHead>
                            <TableHead className="text-right px-6 text-xs text-muted-foreground">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCommissions.map((c, i) => (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-medium text-xs px-6">#{c.orderId ? c.orderId.slice(-8) : '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {c.description || 'Commission'}
                              </TableCell>
                              <TableCell className="text-emerald-600 font-semibold text-xs">+{c.amount.toFixed(2)} MAD</TableCell>
                              <TableCell>
                                <StatusBadge status={c.status} />
                              </TableCell>
                              <TableCell className="text-right px-6 text-xs text-muted-foreground font-medium">
                                {new Date(c.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {commTotalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Page {commPage + 1} sur {commTotalPages}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setCommPage(p => Math.max(0, p - 1))} disabled={commPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setCommPage(p => p + 1)} disabled={commPage + 1 >= commTotalPages}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* REMITTANCES TAB */}
          <TabsContent value="remittances">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border border-border bg-card rounded-lg overflow-hidden">
                <CardHeader className="p-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Flux des Remises COD</h3>
                    <Badge variant="outline" className="text-xs">
                      {remittances.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {remittances.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">Aucune remise reçue</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="px-6 text-xs text-muted-foreground">Description</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Livreur</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Montant</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Colis</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Statut</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                            <TableHead className="text-right px-6 text-xs text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remittances.map((r, i) => (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-medium text-xs px-6">{r.description}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-xs font-semibold">{r.driverName || 'N/A'}</p>
                                  {r.driverPhone && <p className="text-[10px] text-muted-foreground">{r.driverPhone}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-xs text-primary">{r.amount.toFixed(2)} MAD</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    const refs = r.referenceIds.split(',').map(s => s.trim()).filter(Boolean);
                                    return (
                                      <>
                                        {refs.slice(0, 3).map((id, idx) => (
                                          <Badge key={`${r.id}-${id}-${idx}`} variant="outline" className="text-[10px]">
                                            #{id.slice(-6)}
                                          </Badge>
                                        ))}
                                        {refs.length > 3 && (
                                          <Badge key={`${r.id}-more`} variant="outline" className="text-[10px]">
                                            +{refs.length - 3}
                                          </Badge>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={r.status} />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-medium">
                                {new Date(r.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                              </TableCell>
                              <TableCell className="text-right px-6">
                                {r.status === 'PENDING' && (
                                  <Button size="sm" onClick={() => setConfirmId(r.id)}
                                    className="rounded-lg text-xs font-semibold h-8 px-3">
                                    Confirmer
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {remitTotalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Page {remitPage + 1} sur {remitTotalPages}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setRemitPage(p => Math.max(0, p - 1))} disabled={remitPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setRemitPage(p => p + 1)} disabled={remitPage + 1 >= remitTotalPages}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* PAYOUTS TAB */}
          <TabsContent value="payouts">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Payout Form */}
              <div className="lg:col-span-4">
                <Card className="border border-border bg-card rounded-lg overflow-hidden">
                  <CardHeader className="p-6 border-b border-border bg-primary/5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Demande de Virement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-4 rounded-lg bg-muted border border-border text-left">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Disponible</p>
                      <h4 className="text-2xl font-bold text-foreground">{(wallet?.balance || 0).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">MAD</span></h4>
                    </div>
                    <div className="p-4 rounded-lg bg-muted border border-border text-left">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Compte de paiement</p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {paypalAccount?.accountIdentifier || 'Aucun compte PayPal actif'}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Les virements agence utilisent le compte PayPal connecté côté backend.
                      </p>
                    </div>
                    {wallet?.isFrozen ? (
                      <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-xs font-semibold text-rose-600">Compte gelé — virements bloqués</p>
                      </div>
                    ) : !paypalAccount ? (
                      <div className="space-y-4 text-left">
                        {isConnectingPaypal ? (
                          <form onSubmit={handleConnectPaypal} className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground">E-mail PayPal</Label>
                              <Input
                                value={paypalEmail}
                                onChange={(e) => setPaypalEmail(e.target.value)}
                                placeholder="name@example.com"
                                type="email"
                                className="h-10 rounded-lg bg-muted border-border text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-10 rounded-lg text-xs"
                                onClick={() => {
                                  setIsConnectingPaypal(false);
                                  setPaypalEmail('');
                                }}
                              >
                                Annuler
                              </Button>
                              <Button disabled={connectPaypalMutation.isPending} className="flex-1 h-10 rounded-lg text-xs font-semibold">
                                {connectPaypalMutation.isPending ? <RefreshCw className="animate-spin w-4 h-4" /> : "Connecter PayPal"}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs font-semibold text-amber-700">Compte PayPal requis avant de demander un virement.</p>
                            <Button
                              variant="outline"
                              className="w-full mt-3 h-10 rounded-lg text-xs"
                              onClick={() => setIsConnectingPaypal(true)}
                            >
                              Connecter un compte PayPal
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handlePayoutRequest} className="space-y-4 text-left">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Montant (MAD)</Label>
                          <Input
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="1"
                            className="h-10 rounded-lg bg-muted border-border font-bold text-sm"
                          />
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-muted/50 flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Destination</p>
                            <p className="text-xs font-semibold text-foreground mt-1 truncate">{paypalAccount.accountIdentifier}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Le backend enregistrera ce compte via son `paymentAccountId`.</p>
                          </div>
                        </div>
                        <Button disabled={payoutMutation.isPending} className="w-full h-11 rounded-lg text-xs font-semibold">
                          {payoutMutation.isPending ? <RefreshCw className="animate-spin w-4 h-4" /> : "Demander le virement"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payout History */}
              <div className="lg:col-span-8">
                <Card className="border border-border bg-card rounded-lg overflow-hidden">
                  <CardHeader className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" /> Historique des Virements
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {payouts.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">Aucun virement effectué</div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-6 text-xs text-muted-foreground">ID</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Montant</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Compte</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Statut</TableHead>
                              <TableHead className="text-right px-6 text-xs text-muted-foreground">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payouts.map((p, i) => (
                              <TableRow key={i} className="hover:bg-muted/30">
                                <TableCell className="font-semibold text-xs px-6 font-mono">#{p.id.slice(0, 8)}</TableCell>
                              <TableCell className="font-semibold text-xs text-foreground">{p.amount.toFixed(2)} MAD</TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                  {p.receiverEmailSnapshot || '—'}
                              </TableCell>
                                <TableCell>
                                  <div>
                                    <StatusBadge status={p.status} />
                                    {p.rejectionReason && (
                                      <p className="text-[10px] text-rose-500 mt-1">{p.rejectionReason}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right px-6 text-xs text-muted-foreground font-medium">
                                  {new Date(p.requestedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {payoutTotalPages > 1 && (
                          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              Page {payoutPage + 1} sur {payoutTotalPages}
                            </p>
                            <div className="flex gap-2">
                              <Button onClick={() => setPayoutPage(p => Math.max(0, p - 1))} disabled={payoutPage === 0}
                                variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => setPayoutPage(p => p + 1)} disabled={payoutPage + 1 >= payoutTotalPages}
                                variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent className="rounded-lg p-6 text-left">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Confirmer la réception ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-2">
              En confirmant, vous attestez avoir reçu physiquement les fonds COD. Cela créditera votre solde et marquera les commandes associées comme réglées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-10 rounded-lg text-xs font-semibold">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && handleConfirmRemittance(confirmId)}
              disabled={confirmMutation.isPending}
              className="h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-4"
            >
              {confirmMutation.isPending ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Valider la remise'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
