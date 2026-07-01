import React, { useState } from 'react';
import {
  Wallet, ArrowDownRight, DollarSign,
  CreditCard, Download, CheckCircle2,
  Clock, Zap, TrendingUp,
  ShieldCheck, RefreshCw, Search,
  Banknote, AlertCircle, XCircle,
  Snowflake, Flame, ChevronLeft, ChevronRight,
  ShieldAlert, Package, Users, Building2,
  PlayCircle, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { toast } from 'sonner';

interface FinanceSummary {
  totalRevenue: number;
  netLiquidity: number;
  pendingPayouts: number;
  totalWithdrawals: number;
  agencyCommissions: number;
}

interface PlatformWallet {
  balance: number;
  totalRevenue: number;
  platformProfit: number;
  totalDriverPayout: number;
  totalAgencyPayout: number;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankAccount: string;
  accountHolder: string;
  status: string;
  createdAt: string;
}

interface AgencyPayoutRequest {
  id: string;
  agencyName: string;
  amount: number;
  bankAccount: string;
  status: string;
  requestedAt: string;
}

interface WalletItem {
  userId: string;
  userName: string;
  userEmail: string;
  userType: string;
  balance: number;
  isFrozen: boolean;
}

interface CodRemittance {
  id: string;
  driverName: string;
  driverPhone?: string;
  amount: number;
  referenceIds: string;
  description: string;
  date: string;
  status: string;
}

const FinanceDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [searchTerm, setSearchTerm] = useState('');
  const [codStatusFilter, setCodStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PROCESSING'>('ALL');
  const [rejectId, setRejectId] = useState<{ id: string; type: 'DRIVER' | 'AGENCY' | 'COD' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [batchPayoutOpen, setBatchPayoutOpen] = useState<'drivers' | 'agencies' | null>(null);
  const [page, setPage] = useState(0);

  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => apiClient.get<FinanceSummary>(ENDPOINTS.WALLET.FINANCE_SUMMARY).then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: platformWallet } = useQuery({
    queryKey: ['platform-wallet'],
    queryFn: () => apiClient.get<PlatformWallet>(ENDPOINTS.WALLET.ADMIN_PLATFORM_WALLET).then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: withdrawalRequests } = useQuery({
    queryKey: ['withdrawal-requests'],
    queryFn: () => apiClient.get<WithdrawalRequest[]>(`${ENDPOINTS.WALLET.WITHDRAWAL_REQUESTS}?status=PENDING`).then(r => r.data),
  });

  const { data: agencyPayouts } = useQuery({
    queryKey: ['agency-payout-requests'],
    queryFn: () => apiClient.get<AgencyPayoutRequest[]>(`${ENDPOINTS.WALLET.AGENCY_PAYOUT_REQUESTS}?status=PENDING`).then(r => r.data),
  });

  const { data: codRemittances } = useQuery({
    queryKey: ['admin-cod-remittances'],
    queryFn: () => apiClient.get<CodRemittance[]>(ENDPOINTS.WALLET.ADMIN_COD_REMITTANCES).then(r => r.data),
  });

  const { data: walletsPaged } = useQuery({
    queryKey: ['all-wallets', page],
    queryFn: () => apiClient.get<unknown>(`${ENDPOINTS.WALLET.ALL}?page=${page}&size=10`).then(r => r.data),
  });

  const approveWithdrawal = useMutation({
    mutationFn: (id: string) => apiClient.post(ENDPOINTS.WALLET.APPROVE_WITHDRAWAL(id)),
    onSuccess: () => {
      toast.success("Retrait approuvé");
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Échec de l'approbation"),
  });

  const rejectWithdrawal = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(ENDPOINTS.WALLET.REJECT_WITHDRAWAL(id), { reason }),
    onSuccess: () => {
      toast.success("Retrait rejeté — solde remboursé");
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
    onError: () => toast.error("Échec du rejet"),
  });

  const approveAgencyPayout = useMutation({
    mutationFn: (id: string) => apiClient.post(ENDPOINTS.WALLET.APPROVE_AGENCY_PAYOUT(id)),
    onSuccess: () => {
      toast.success("Virement agence approuvé");
      queryClient.invalidateQueries({ queryKey: ['agency-payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Échec de l'approbation"),
  });

  const rejectAgencyPayout = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(ENDPOINTS.WALLET.REJECT_AGENCY_PAYOUT(id), { reason }),
    onSuccess: () => {
      toast.success("Virement agence rejeté");
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['agency-payout-requests'] });
    },
    onError: () => toast.error("Échec du rejet"),
  });

  const acceptCodRemittance = useMutation({
    mutationFn: (id: string) => apiClient.post(ENDPOINTS.WALLET.ADMIN_ACCEPT_COD_REMITTANCE(id)),
    onSuccess: () => {
      toast.success("Remise COD validée");
      queryClient.invalidateQueries({ queryKey: ['admin-cod-remittances'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Échec de la validation"),
  });

  const rejectCodRemittance = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(ENDPOINTS.WALLET.ADMIN_REJECT_COD_REMITTANCE(id), { reason }),
    onSuccess: () => {
      toast.success("Remise COD rejetée");
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-cod-remittances'] });
    },
    onError: () => toast.error("Échec du rejet"),
  });

  const freezeWallet = useMutation({
    mutationFn: ({ userId, freeze }: { userId: string; freeze: boolean }) =>
      apiClient.put(`${ENDPOINTS.WALLET.FREEZE(userId)}?freeze=${freeze}`),
    onSuccess: (_, variables) => {
      toast.success(variables.freeze ? "Compte gelé" : "Compte dégelé");
      queryClient.invalidateQueries({ queryKey: ['all-wallets'] });
    },
    onError: () => toast.error("Opération échouée"),
  });

  const reconcileBatch = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.RECONCILE_BATCH),
    onSuccess: () => {
      toast.success("Réconciliation batch terminée");
      setReconcileOpen(false);
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Réconciliation échouée"),
  });

  const batchPayoutDrivers = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.ADMIN_BATCH_PAYOUT_DRIVERS),
    onSuccess: () => {
      toast.success("Paiements chauffeurs traités");
      setBatchPayoutOpen(null);
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Échec du paiement batch"),
  });

  const batchPayoutAgencies = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.ADMIN_BATCH_PAYOUT_AGENCIES),
    onSuccess: () => {
      toast.success("Paiements agences traités");
      setBatchPayoutOpen(null);
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['platform-wallet'] });
    },
    onError: () => toast.error("Échec du paiement batch"),
  });

  const handleExport = async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.WALLET.STATEMENT_CSV, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'global_ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Échec de l'export");
    }
  };

  const filteredWallets = walletsPaged?.content?.filter((w: WalletItem) =>
    w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredCodRemittances = codRemittances?.filter((rem) =>
    codStatusFilter === 'ALL' || rem.status === codStatusFilter
  ) || [];

  const handleRejectConfirm = () => {
    if (!rejectId || !rejectReason.trim()) return;
    if (rejectId.type === 'DRIVER') rejectWithdrawal.mutate({ id: rejectId.id, reason: rejectReason });
    else if (rejectId.type === 'AGENCY') rejectAgencyPayout.mutate({ id: rejectId.id, reason: rejectReason });
    else if (rejectId.type === 'COD') rejectCodRemittance.mutate({ id: rejectId.id, reason: rejectReason });
  };

  const tabs = [
    { id: 'withdrawals', label: 'Retraits Chauffeurs', count: withdrawalRequests?.length, icon: Users },
    { id: 'agency-payouts', label: 'Paiements Agences', count: agencyPayouts?.length, icon: Building2 },
    { id: 'cod-remittances', label: 'Remises COD', count: codRemittances?.length, icon: Banknote },
    { id: 'wallets', label: 'Grand Livre', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 font-sans overflow-x-hidden selection:bg-primary/30">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="pt-8 md:pt-24 pb-8 md:pb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-10">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shadow-[0_0_20px_#6366f1]" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400/80">Nexus Global Treasury Command</p>
            </div>
            <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              Financial <span className="text-indigo-500">Core</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => setReconcileOpen(true)}
              className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-1.5 md:gap-2 flex-1 md:flex-none"
            >
              <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" /> Réconcilier
            </Button>
            <Button
              variant="outline"
              onClick={() => setBatchPayoutOpen('drivers')}
              className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-1.5 md:gap-2 flex-1 md:flex-none"
            >
              <PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Payer Chauffeurs
            </Button>
            <Button
              variant="outline"
              onClick={() => setBatchPayoutOpen('agencies')}
              className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-1.5 md:gap-2 flex-1 md:flex-none"
            >
              <PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Payer Agences
            </Button>
            <Button
              onClick={handleExport}
              className="h-10 md:h-12 px-6 md:px-8 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-1.5 md:gap-2 shadow-xl shadow-indigo-600/30 border-none w-full md:w-auto"
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
            </Button>
          </div>
        </div>

        <div className="space-y-6 md:space-y-12 pb-10">
          {/* KPI Grid — real platform wallet data */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <KpiCard
              label="Liquidités Plateforme"
              value={platformWallet?.balance ?? summary?.netLiquidity ?? 0}
              icon={Wallet}
              color="indigo"
              sub="Solde opérationnel actuel"
            />
            <KpiCard
              label="Profit Plateforme (5%)"
              value={platformWallet?.platformProfit ?? 0}
              icon={Zap}
              color="emerald"
              sub="Commission cumulée"
            />
            <KpiCard
              label="Total Payé Chauffeurs"
              value={platformWallet?.totalDriverPayout ?? 0}
              icon={Users}
              color="amber"
              sub="Sorties vers chauffeurs"
            />
            <KpiCard
              label="Total Payé Agences"
              value={platformWallet?.totalAgencyPayout ?? 0}
              icon={Building2}
              color="rose"
              sub="Sorties vers agences"
            />
          </div>

          {/* Revenue card */}
          <Card className="bg-card border border-border/40 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/3 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 mb-2 md:mb-3">Revenu Total de la Plateforme</p>
                <div className="flex items-baseline gap-2 md:gap-4">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground italic leading-none">
                    {(platformWallet?.totalRevenue ?? summary?.totalRevenue ?? 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                  </h2>
                  <span className="text-base md:text-xl font-black text-indigo-400">MAD</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6">
                <MetricPill
                  label="Retraits en attente"
                  value={withdrawalRequests?.length ?? 0}
                  color="amber"
                  isCount
                />
                <MetricPill
                  label="Virements agences"
                  value={agencyPayouts?.length ?? 0}
                  color="rose"
                  isCount
                />
                <MetricPill
                  label="Remises COD"
                  value={codRemittances?.length ?? 0}
                  color="indigo"
                  isCount
                />
              </div>
            </div>
          </Card>

          {/* Management Tabs */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-6 md:mb-8 bg-accent/20 p-1 md:p-1.5 rounded-2xl md:rounded-[2rem] w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(0); }}
                  className={cn(
                    "px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px]">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <Card className="bg-card border-border/40 rounded-[2.5rem] overflow-hidden shadow-xl">

                  {/* Wallets search + pagination header */}
                  {activeTab === 'wallets' && (
                    <div className="p-6 border-b border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="relative w-full md:w-[380px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                          placeholder="Rechercher par nom / email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-12 pl-12 bg-accent/20 border-border/40 text-xs font-bold rounded-xl uppercase tracking-widest"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} variant="outline" className="h-10 w-10 p-0 rounded-xl border-border/40">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-2">Page {page + 1}</span>
                        <Button onClick={() => setPage(p => p + 1)} disabled={!walletsPaged?.content?.length || walletsPaged.last} variant="outline" className="h-10 w-10 p-0 rounded-xl border-border/40">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-accent/10">
                        <TableRow className="border-border/40">
                          {activeTab === 'wallets' ? (
                            <>
                              <TableHead className="px-8 text-[10px] font-black uppercase text-muted-foreground/50">Entité</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Type</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Solde</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Statut</TableHead>
                              <TableHead className="text-right px-8 text-[10px] font-black uppercase text-muted-foreground/50">Action</TableHead>
                            </>
                          ) : activeTab === 'cod-remittances' ? (
                            <>
                              <TableHead className="px-8 text-[10px] font-black uppercase text-muted-foreground/50">Chauffeur</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Montant</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Colis Liés</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Date</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Statut</TableHead>
                              <TableHead className="text-right px-8 text-[10px] font-black uppercase text-muted-foreground/50">Actions</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="px-8 text-[10px] font-black uppercase text-muted-foreground/50">
                                {activeTab === 'agency-payouts' ? 'Agence' : 'Chauffeur'}
                              </TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Montant</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Compte Bancaire</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Date</TableHead>
                              <TableHead className="text-right px-8 text-[10px] font-black uppercase text-muted-foreground/50">Autorisation</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTab === 'wallets' && filteredWallets.map((wallet: WalletItem) => (
                          <TableRow key={wallet.userId} className="border-border/40 hover:bg-accent/5 transition-colors">
                            <TableCell className="px-8 py-5">
                              <div>
                                <p className="font-black text-sm text-foreground">{wallet.userName}</p>
                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">{wallet.userEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-accent/20 border-border/40 text-[8px] font-black uppercase px-2 py-0.5">
                                {wallet.userType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-black text-base text-foreground">
                              {wallet.balance.toFixed(2)} <span className="text-[10px] opacity-30 ml-1">MAD</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1",
                                wallet.isFrozen ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-400"
                              )}>
                                {wallet.isFrozen ? "GELÉ" : "ACTIF"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 text-right">
                              <Button
                                onClick={() => freezeWallet.mutate({ userId: wallet.userId, freeze: !wallet.isFrozen })}
                                variant="outline"
                                size="sm"
                                className={cn("h-9 px-4 rounded-xl text-[9px] font-black uppercase gap-2",
                                  wallet.isFrozen ? "text-emerald-400 border-emerald-500/20" : "text-rose-500 border-rose-500/20"
                                )}
                              >
                                {wallet.isFrozen ? <Flame className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
                                {wallet.isFrozen ? "Dégeler" : "Geler"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {activeTab === 'withdrawals' && withdrawalRequests?.map((req) => (
                          <TableRow key={req.id} className="border-border/40 hover:bg-accent/5">
                            <TableCell className="px-8 py-5">
                              <div>
                                <p className="font-black text-sm text-foreground">{req.userName}</p>
                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">{req.accountHolder}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-lg text-emerald-400">+{req.amount.toFixed(2)} MAD</TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                              {req.bankAccount?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                              {new Date(req.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="px-8 text-right space-x-2">
                              <Button
                                onClick={() => approveWithdrawal.mutate(req.id)}
                                disabled={approveWithdrawal.isPending}
                                size="sm"
                                className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 p-0 hover:bg-emerald-500 hover:text-white border border-emerald-500/20"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setRejectId({ id: req.id, type: 'DRIVER' })}
                                size="sm"
                                className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 p-0 hover:bg-rose-500 hover:text-white border border-rose-500/20"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {activeTab === 'agency-payouts' && agencyPayouts?.map((req) => (
                          <TableRow key={req.id} className="border-border/40 hover:bg-accent/5">
                            <TableCell className="px-8 py-5">
                              <p className="font-black text-sm text-foreground">{req.agencyName}</p>
                            </TableCell>
                            <TableCell className="font-black text-lg text-indigo-400">+{req.amount.toFixed(2)} MAD</TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                              {req.bankAccount?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                              {new Date(req.requestedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="px-8 text-right space-x-2">
                              <Button
                                onClick={() => approveAgencyPayout.mutate(req.id)}
                                disabled={approveAgencyPayout.isPending}
                                size="sm"
                                className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 p-0 hover:bg-emerald-500 hover:text-white border border-emerald-500/20"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setRejectId({ id: req.id, type: 'AGENCY' })}
                                size="sm"
                                className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 p-0 hover:bg-rose-500 hover:text-white border border-rose-500/20"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {activeTab === 'cod-remittances' && (
                          <TableRow className="border-border/40 bg-transparent hover:bg-transparent">
                            <TableCell colSpan={6} className="px-8 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => setCodStatusFilter(status as typeof codStatusFilter)}
                                    className={cn(
                                      'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border',
                                      codStatusFilter === status
                                        ? 'bg-indigo-600 text-white border-indigo-500/30'
                                        : 'bg-accent/20 text-muted-foreground/60 border-border/40 hover:text-foreground'
                                    )}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {activeTab === 'cod-remittances' && filteredCodRemittances.map((rem) => (
                          <TableRow key={rem.id} className="border-border/40 hover:bg-accent/5">
                            <TableCell className="px-8 py-5">
                              <div>
                                <p className="font-black text-sm text-foreground">{rem.driverName}</p>
                                {rem.driverPhone && (
                                  <p className="text-[9px] font-bold text-muted-foreground/50">{rem.driverPhone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-lg text-amber-400">{rem.amount.toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rem.referenceIds?.split(',').slice(0, 3).map(id => (
                                  <Badge key={id} variant="outline" className="bg-accent/20 border-border/40 text-[7px] font-black uppercase">
                                    #{id.trim().slice(-6)}
                                  </Badge>
                                ))}
                                {rem.referenceIds?.split(',').length > 3 && (
                                  <Badge variant="outline" className="bg-accent/20 border-border/40 text-[7px] font-black">
                                    +{rem.referenceIds.split(',').length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                              {new Date(rem.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('border-none text-[8px] font-black uppercase px-3 py-1 rounded-md',
                                rem.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                                rem.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                rem.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                                'bg-blue-500/10 text-blue-400'
                              )}>
                                {rem.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 text-right space-x-2">
                              {rem.status === 'PENDING' ? (
                                <>
                                  <Button
                                    onClick={() => acceptCodRemittance.mutate(rem.id)}
                                    disabled={acceptCodRemittance.isPending}
                                    size="sm"
                                    className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 p-0 hover:bg-emerald-500 hover:text-white border border-emerald-500/20"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => setRejectId({ id: rem.id, type: 'COD' })}
                                    size="sm"
                                    className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 p-0 hover:bg-rose-500 hover:text-white border border-rose-500/20"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Lecture seule</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Empty states */}
                        {activeTab === 'withdrawals' && !withdrawalRequests?.length && <EmptyTableRow message="Aucun retrait en attente" />}
                        {activeTab === 'agency-payouts' && !agencyPayouts?.length && <EmptyTableRow message="Aucun virement agence en attente" />}
                        {activeTab === 'cod-remittances' && !filteredCodRemittances.length && <EmptyTableRow message="Aucune remise COD trouvée" />}
                        {activeTab === 'wallets' && !filteredWallets.length && <EmptyTableRow message="Aucun wallet trouvé" />}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(''); }}>
        <DialogContent className="bg-background border-border/40 rounded-[2rem] p-8 max-w-md">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-5">
              <ShieldAlert size={28} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Motif de refus</DialogTitle>
            <DialogDescription className="text-muted-foreground/60 text-sm mt-2">
              Indiquez la raison du rejet. Elle sera visible par l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Compte bancaire invalide..."
              className="h-12 bg-accent/20 border-border/40 rounded-xl text-sm font-bold px-5"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setRejectId(null)} className="h-11 rounded-xl border-border/40 uppercase text-[10px] font-black tracking-widest">
              Annuler
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim()}
              className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 uppercase text-[10px] font-black tracking-widest border-none shadow-lg shadow-rose-600/20"
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <AlertDialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <AlertDialogContent className="bg-background border-border/40 rounded-[2rem] p-8 max-w-md">
          <AlertDialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-5">
              <RefreshCw size={28} className={reconcileBatch.isPending ? 'animate-spin' : ''} />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Lancer la Réconciliation ?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 text-sm mt-2">
              Cette action va finaliser tous les ordres confirmés par les agences et créditer les clients. Opération irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl border-border/40 text-[10px] font-black uppercase tracking-widest">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reconcileBatch.mutate()}
              disabled={reconcileBatch.isPending}
              className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest border-none shadow-lg shadow-indigo-600/20"
            >
              {reconcileBatch.isPending ? 'En cours...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Payout Dialog */}
      <AlertDialog open={!!batchPayoutOpen} onOpenChange={() => setBatchPayoutOpen(null)}>
        <AlertDialogContent className="bg-background border-border/40 rounded-[2rem] p-8 max-w-md">
          <AlertDialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-5">
              <PlayCircle size={28} />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
              Payer tous les {batchPayoutOpen === 'drivers' ? 'Chauffeurs' : 'Agences'} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 text-sm mt-2">
              Cela traitera les paiements pour tous les {batchPayoutOpen === 'drivers' ? 'chauffeurs' : 'agences'} éligibles (solde positif, aucune dette COD). Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl border-border/40 text-[10px] font-black uppercase tracking-widest">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchPayoutOpen === 'drivers' ? batchPayoutDrivers.mutate() : batchPayoutAgencies.mutate()}
              disabled={batchPayoutDrivers.isPending || batchPayoutAgencies.isPending}
              className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest border-none shadow-lg shadow-emerald-600/20"
            >
              {(batchPayoutDrivers.isPending || batchPayoutAgencies.isPending) ? 'En cours...' : 'Confirmer les paiements'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const KpiCard = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: unknown; color: string; sub: string;
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-card border border-border/40 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-7 relative overflow-hidden group shadow-lg"
  >
    <div className={cn(
      "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-[0.06] transition-opacity group-hover:opacity-[0.12]",
      color === 'indigo' ? "bg-indigo-600" : color === 'emerald' ? "bg-emerald-600"
        : color === 'amber' ? "bg-amber-600" : "bg-rose-600"
    )} />
    <div className="relative z-10">
      <div className={cn(
        "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 border",
        color === 'indigo' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
          : color === 'emerald' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : color === 'amber' ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
      )}>
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">{label}</p>
      <h3 className="text-3xl font-black tracking-tighter text-foreground leading-none">
        {value.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
        <span className="text-sm opacity-20 ml-2">MAD</span>
      </h3>
      <p className="text-[10px] font-medium text-muted-foreground/40 mt-3 uppercase tracking-wider">{sub}</p>
    </div>
  </motion.div>
);

const MetricPill = ({ label, value, color, isCount = false }: {
  label: string; value: number; color: string; isCount?: boolean;
}) => (
  <div className={cn(
    "px-5 py-3 rounded-2xl border",
    color === 'amber' ? "bg-amber-500/5 border-amber-500/20"
      : color === 'rose' ? "bg-rose-500/5 border-rose-500/20"
      : "bg-indigo-500/5 border-indigo-500/20"
  )}>
    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
    <p className={cn(
      "text-2xl font-black",
      color === 'amber' ? "text-amber-400" : color === 'rose' ? "text-rose-400" : "text-indigo-400"
    )}>
      {isCount ? value : `${value.toFixed(2)} MAD`}
    </p>
  </div>
);

const EmptyTableRow = ({ message }: { message: string }) => (
  <TableRow>
    <TableCell colSpan={5} className="py-16 text-center">
      <div className="flex flex-col items-center gap-3 opacity-30">
        <CheckCircle2 className="w-10 h-10" />
        <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
      </div>
    </TableCell>
  </TableRow>
);

export default FinanceDashboard;
