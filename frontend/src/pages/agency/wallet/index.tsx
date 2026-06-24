import React, { useState, useEffect, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { StatCard, EmptyState, LoaderPulse } from './components/WalletComponents';

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
  orderId: string;
  amount: number;
  commissionRate: number;
  deliveryFee: number;
  driverShare: number;
  status: 'PENDING' | 'CREDITED' | 'WITHDRAWN';
  earnedAt: string;
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
  bankAccount?: string;
  rejectionReason?: string;
}

const PAGE_SIZE = 10;

export default function AgencyWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<AgencyWalletData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [iban, setIban] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [commPage, setCommPage] = useState(0);
  const [remitPage, setRemitPage] = useState(0);
  const [payoutPage, setPayoutPage] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, commRes, remitRes, payoutRes] = await Promise.all([
        apiClient.get<AgencyWalletData>(ENDPOINTS.WALLET.AGENCY_BALANCE),
        apiClient.get<Commission[]>(ENDPOINTS.WALLET.AGENCY_COMMISSIONS),
        apiClient.get<Remittance[]>(ENDPOINTS.WALLET.AGENCY_REMITTANCES),
        apiClient.get<Payout[]>(ENDPOINTS.WALLET.AGENCY_PAYOUTS)
      ]);
      setWallet(walletRes.data);
      setCommissions(commRes.data);
      setRemittances(remitRes.data);
      setPayouts(payoutRes.data);
    } catch {
      toast.error("Erreur de synchronisation financière");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemittance = async (id: string) => {
    try {
      setProcessing(true);
      await apiClient.post(ENDPOINTS.WALLET.CONFIRM_COD(id));
      toast.success("Remise confirmée — solde crédité");
      setConfirmId(null);
      fetchData();
    } catch {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Montant invalide");
    if (amount > (wallet?.balance || 0)) return toast.error("Solde insuffisant");
    if (!iban.trim()) return toast.error("IBAN requis");
    try {
      setProcessing(true);
      await apiClient.post(ENDPOINTS.WALLET.AGENCY_PAYOUT_REQUEST, { amount, bankAccount: iban.trim() });
      toast.success("Demande de virement soumise");
      setPayoutAmount('');
      setIban('');
      fetchData();
    } catch {
      toast.error("Échec de la demande");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED': case 'CREDITED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED': case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'En attente', PROCESSING: 'En cours', COMPLETED: 'Complété',
      CREDITED: 'Crédité', FAILED: 'Échoué', REJECTED: 'Rejeté',
    };
    return map[status] ?? status;
  };

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c =>
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (searchQuery === '' || c.orderId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [commissions, statusFilter, searchQuery]);

  const pagedCommissions = filteredCommissions.slice(commPage * PAGE_SIZE, (commPage + 1) * PAGE_SIZE);
  const pagedRemittances = remittances.slice(remitPage * PAGE_SIZE, (remitPage + 1) * PAGE_SIZE);
  const pagedPayouts = payouts.slice(payoutPage * PAGE_SIZE, (payoutPage + 1) * PAGE_SIZE);

  const pendingRemittances = remittances.filter(r => r.status === 'PENDING');
  const totalEarnedThisMonth = useMemo(() => {
    const now = new Date();
    return commissions
      .filter(c => {
        const d = new Date(c.earnedAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, c) => acc + c.amount, 0);
  }, [commissions]);

  if (loading && !wallet) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <LoaderPulse />
        <p className="text-sm text-muted-foreground">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Financial overview and transactions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {wallet?.isFrozen && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Account frozen
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exportingCsv} className="gap-2">
            <Download className="w-4 h-4" />
            {exportingCsv ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 h-9 overflow-x-auto w-full justify-start">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'commissions', label: 'Commissions' },
            { value: 'remittances', label: 'COD Remittances' },
            { value: 'payouts', label: 'Payouts' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5 whitespace-nowrap">
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Solde Disponible" value={wallet?.balance || 0} icon={Wallet} color="blue" />
                <StatCard label="Total Commissions" value={wallet?.totalCommissionEarned || 0} icon={ShieldCheck} color="emerald" />
                <StatCard label="Commission en Attente" value={wallet?.pendingCommission || 0} icon={Clock} color="amber" />
                <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 bg-violet-600" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Ce mois-ci</p>
                    <h3 className="text-3xl font-black tracking-tighter text-foreground">
                      {totalEarnedThisMonth.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                      <span className="text-sm opacity-30 italic ml-2">MAD</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Commissions du mois</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mt-4 border bg-violet-500/10 text-violet-400 border-violet-500/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Commission rate info */}
              <Card className="bg-accent/5 border-border/40 rounded-[2rem] p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Taux de Commission</p>
                  <p className="font-black text-foreground">
                    {wallet?.commissionRate !== undefined
                      ? `${(wallet.commissionRate * 100).toFixed(0)}%`
                      : '15%'
                    } <span className="text-[10px] text-muted-foreground/50 font-medium">de chaque frais de livraison</span>
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Total collecté COD</p>
                  <p className="font-black text-foreground">
                    {(wallet?.totalCollected || 0).toFixed(2)} <span className="text-[10px] opacity-30">MAD</span>
                  </p>
                </div>
              </Card>

              {/* Pending Remittances */}
              <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-6 border-b border-border/40">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base font-black uppercase italic">Remises COD en Attente</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                        Confirmez la réception physique du cash
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-500 border-none font-black px-4 py-1.5">
                      {pendingRemittances.length} alerte{pendingRemittances.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {pendingRemittances.length === 0 ? (
                    <EmptyState icon={CheckCircle2} message="Aucune remise en attente" />
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto">
                      {pendingRemittances.map(remit => (
                        <div key={remit.id}
                          className="p-5 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-accent/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                              <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground uppercase">{remit.description}</p>
                              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-0.5">
                                {new Date(remit.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                                {' '}&mdash;{' '}
                                {remit.referenceIds.split(',').length} colis
                              </p>
                              {remit.driverName && (
                                <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                                  {remit.driverName}{remit.driverPhone && ` · ${remit.driverPhone}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-5 ml-auto">
                            <p className="text-xl font-black">{remit.amount.toFixed(2)} <span className="text-[10px] opacity-30">MAD</span></p>
                            <Button size="sm" onClick={() => setConfirmId(remit.id)}
                              className="rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-[9px] uppercase tracking-widest h-9 px-5">
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
              <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-6 border-b border-border/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-base font-black uppercase italic">Historique des Commissions</h3>
                      <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">
                        {filteredCommissions.length} entrée{filteredCommissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                        <Input
                          placeholder="Chercher un ordre..."
                          value={searchQuery}
                          onChange={e => { setSearchQuery(e.target.value); setCommPage(0); }}
                          className="h-9 pl-9 text-[10px] font-bold rounded-xl bg-accent/20 border-border/40 w-full sm:w-48"
                        />
                      </div>
                      <div className="flex gap-1 bg-accent/20 p-1 rounded-xl">
                        {['ALL', 'PENDING', 'CREDITED'].map(f => (
                          <button key={f} onClick={() => { setStatusFilter(f); setCommPage(0); }}
                            className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              statusFilter === f ? 'bg-blue-600 text-white' : 'text-muted-foreground/60 hover:text-foreground'
                            )}>
                            {f === 'ALL' ? 'Tout' : f === 'PENDING' ? 'En attente' : 'Crédité'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {pagedCommissions.length === 0 ? (
                    <EmptyState icon={TrendingUp} message="Aucune commission" />
                  ) : (
                    <>
                      <Table>
                        <TableHeader className="bg-accent/20">
                          <TableRow className="border-border/40">
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50 px-6">Order ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Frais Livr.</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Taux</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Part Driver</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Ma Commission</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Statut</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/50 pr-6">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedCommissions.map((c, i) => (
                            <TableRow key={i} className="border-border/40 hover:bg-accent/10">
                              <TableCell className="font-bold text-xs px-6">#{c.orderId.slice(-8)}</TableCell>
                              <TableCell className="font-bold text-sm">{c.deliveryFee.toFixed(2)} MAD</TableCell>
                              <TableCell className="text-muted-foreground/60 text-[10px] font-black">
                                {(c.commissionRate * 100).toFixed(0)}%
                              </TableCell>
                              <TableCell className="text-rose-400/80 font-bold text-sm">-{c.driverShare.toFixed(2)}</TableCell>
                              <TableCell className="text-emerald-400 font-black text-sm">+{c.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={cn("border-none text-[8px] font-black uppercase", getStatusBadgeClass(c.status))}>
                                  {getStatusLabel(c.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-[10px] text-muted-foreground/50 font-bold pr-6">
                                {new Date(c.earnedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredCommissions.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                            {commPage * PAGE_SIZE + 1}–{Math.min((commPage + 1) * PAGE_SIZE, filteredCommissions.length)} / {filteredCommissions.length}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setCommPage(p => Math.max(0, p - 1))} disabled={commPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setCommPage(p => p + 1)} disabled={(commPage + 1) * PAGE_SIZE >= filteredCommissions.length}
                              variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
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
              <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-6 border-b border-border/40">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-black uppercase italic">Flux des Remises COD</h3>
                    <Badge className="bg-accent/30 border-border/40 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                      {remittances.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {remittances.length === 0 ? (
                    <EmptyState icon={Banknote} message="Aucune remise reçue" />
                  ) : (
                    <>
                      <Table>
                        <TableHeader className="bg-accent/20">
                          <TableRow className="border-border/40">
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50 px-6">Description</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Chauffeur</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Montant</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Colis</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Statut</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50 pr-6">Date</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/50 pr-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedRemittances.map((r, i) => (
                            <TableRow key={i} className="border-border/40 hover:bg-accent/10">
                              <TableCell className="font-bold text-xs uppercase px-6">{r.description}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-xs font-bold">{r.driverName || 'N/A'}</p>
                                  {r.driverPhone && <p className="text-[9px] text-muted-foreground/50">{r.driverPhone}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="font-black text-blue-400">{r.amount.toFixed(2)} MAD</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    const refs = r.referenceIds.split(',').map(s => s.trim()).filter(Boolean);
                                    return (
                                      <>
                                        {refs.slice(0, 3).map((id, idx) => (
                                          <Badge key={`${r.id}-${id}-${idx}`} variant="outline" className="bg-accent/20 border-border/40 text-[7px] font-black uppercase">
                                            #{id.slice(-6)}
                                          </Badge>
                                        ))}
                                        {refs.length > 3 && (
                                          <Badge key={`${r.id}-more`} variant="outline" className="bg-accent/20 border-border/40 text-[7px] font-black">
                                            +{refs.length - 3}
                                          </Badge>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("border-none text-[8px] font-black uppercase", getStatusBadgeClass(r.status))}>
                                  {getStatusLabel(r.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[10px] text-muted-foreground/50 font-bold pr-6">
                                {new Date(r.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                {r.status === 'PENDING' && (
                                  <Button size="sm" onClick={() => setConfirmId(r.id)}
                                    className="rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-[9px] uppercase tracking-widest h-8 px-4">
                                    Confirmer
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {remittances.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                            {remitPage * PAGE_SIZE + 1}–{Math.min((remitPage + 1) * PAGE_SIZE, remittances.length)} / {remittances.length}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setRemitPage(p => Math.max(0, p - 1))} disabled={remitPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setRemitPage(p => p + 1)} disabled={(remitPage + 1) * PAGE_SIZE >= remittances.length}
                              variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Payout Form */}
              <div className="lg:col-span-4">
                <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-6 border-b border-border/40 bg-blue-600/5">
                    <CardTitle className="text-base font-black uppercase italic flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-400" /> Demande de Virement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="p-5 rounded-2xl bg-accent/20 border border-border/40">
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Disponible</p>
                      <h4 className="text-3xl font-black">{(wallet?.balance || 0).toFixed(2)} <span className="text-xs opacity-30">MAD</span></h4>
                    </div>
                    {wallet?.isFrozen ? (
                      <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center">
                        <p className="text-xs font-bold text-rose-400">Compte gelé — virements bloqués</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePayoutRequest} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Montant (MAD)</Label>
                          <Input
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="1"
                            className="h-12 rounded-xl bg-accent/20 border-border/40 font-black text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">IBAN / RIB de l'Agence</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                            <Input
                              value={iban}
                              onChange={(e) => setIban(e.target.value)}
                              placeholder="MA64 ..."
                              className="h-12 pl-10 rounded-xl bg-accent/20 border-border/40 font-mono text-xs uppercase"
                            />
                          </div>
                        </div>
                        <Button disabled={processing} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase text-[10px] tracking-widest">
                          {processing ? <RefreshCw className="animate-spin w-4 h-4" /> : "Demander le virement"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payout History */}
              <div className="lg:col-span-8">
                <Card className="bg-accent/10 border-border/40 rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-6 border-b border-border/40">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-black uppercase italic flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground/50" /> Historique des Virements
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {payouts.length === 0 ? (
                      <EmptyState icon={CreditCard} message="Aucun virement effectué" />
                    ) : (
                      <>
                        <Table>
                          <TableHeader className="bg-accent/20">
                            <TableRow className="border-border/40">
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50 px-6">ID</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Montant</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Compte</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-muted-foreground/50">Statut</TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/50 pr-6">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pagedPayouts.map((p, i) => (
                              <TableRow key={i} className="border-border/40 hover:bg-accent/10">
                                <TableCell className="font-bold text-[10px] px-6 font-mono">#{p.id.slice(0, 8)}</TableCell>
                                <TableCell className="font-black text-foreground">{p.amount.toFixed(2)} MAD</TableCell>
                                <TableCell className="text-[10px] font-mono text-muted-foreground/50">
                                  {p.bankAccount ? `${p.bankAccount.slice(0, 8)}...` : '—'}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <Badge className={cn("border-none text-[8px] font-black uppercase", getStatusBadgeClass(p.status))}>
                                      {getStatusLabel(p.status)}
                                    </Badge>
                                    {p.rejectionReason && (
                                      <p className="text-[8px] text-rose-400 mt-1 font-medium">{p.rejectionReason}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-[10px] text-muted-foreground/50 font-bold pr-6">
                                  {new Date(p.requestedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {payouts.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                              {payoutPage * PAGE_SIZE + 1}–{Math.min((payoutPage + 1) * PAGE_SIZE, payouts.length)} / {payouts.length}
                            </p>
                            <div className="flex gap-2">
                              <Button onClick={() => setPayoutPage(p => Math.max(0, p - 1))} disabled={payoutPage === 0}
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => setPayoutPage(p => p + 1)} disabled={(payoutPage + 1) * PAGE_SIZE >= payouts.length}
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-border/40">
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
        <AlertDialogContent className="bg-background border-border/40 rounded-[2rem] p-8">
          <AlertDialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-5 border border-blue-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-foreground tracking-tighter uppercase italic">
              Confirmer la réception ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 font-medium leading-relaxed mt-2">
              En confirmant, vous attestez avoir reçu physiquement les fonds COD. Cela créditera votre solde et marquera les commandes associées comme réglées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl border-border/40 text-[10px] font-black uppercase tracking-widest">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && handleConfirmRemittance(confirmId)}
              disabled={processing}
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-8"
            >
              {processing ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Valider la remise'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
