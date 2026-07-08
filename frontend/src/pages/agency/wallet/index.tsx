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

// Shared Wallet Components
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants/walletConstants';
import StatCard from '@/components/wallet/StatCard';
import StatusBadge from '@/components/wallet/StatusBadge';
import TransactionList from '@/components/wallet/TransactionList';

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
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) return toast.error(`Montant minimum: ${MIN_WITHDRAWAL_AMOUNT} MAD`);
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
          <p className="text-xs text-muted-foreground mt-0.5">Vue d'ensemble financière et transactions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {wallet?.isFrozen && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Compte gelé
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Rafraîchir
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exportingCsv} className="gap-2">
            <Download className="w-4 h-4" />
            {exportingCsv ? 'Exportation...' : 'Exporter CSV'}
          </Button>
        </div>
      </div>

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
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Aucune remise en attente
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
                  {pagedCommissions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">Aucune commission</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="px-6 text-xs text-muted-foreground">Order ID</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Frais Livr.</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Taux</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Part Livreur</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Ma Commission</TableHead>
                            <TableHead className="text-xs text-muted-foreground">Statut</TableHead>
                            <TableHead className="text-right px-6 text-xs text-muted-foreground">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedCommissions.map((c, i) => (
                            <TableRow key={i} className="hover:bg-muted/30">
                              <TableCell className="font-medium text-xs px-6">#{c.orderId.slice(-8)}</TableCell>
                              <TableCell className="font-medium text-xs">{c.deliveryFee.toFixed(2)} MAD</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {(c.commissionRate * 100).toFixed(0)}%
                              </TableCell>
                              <TableCell className="text-rose-500 font-medium text-xs">-{c.driverShare.toFixed(2)} MAD</TableCell>
                              <TableCell className="text-emerald-600 font-semibold text-xs">+{c.amount.toFixed(2)} MAD</TableCell>
                              <TableCell>
                                <StatusBadge status={c.status} />
                              </TableCell>
                              <TableCell className="text-right px-6 text-xs text-muted-foreground font-medium">
                                {new Date(c.earnedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredCommissions.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {commPage * PAGE_SIZE + 1}–{Math.min((commPage + 1) * PAGE_SIZE, filteredCommissions.length)} sur {filteredCommissions.length}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setCommPage(p => Math.max(0, p - 1))} disabled={commPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setCommPage(p => p + 1)} disabled={(commPage + 1) * PAGE_SIZE >= filteredCommissions.length}
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
                          {pagedRemittances.map((r, i) => (
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
                      {remittances.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {remitPage * PAGE_SIZE + 1}–{Math.min((remitPage + 1) * PAGE_SIZE, remittances.length)} sur {remittances.length}
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setRemitPage(p => Math.max(0, p - 1))} disabled={remitPage === 0}
                              variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setRemitPage(p => p + 1)} disabled={(remitPage + 1) * PAGE_SIZE >= remittances.length}
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
                    {wallet?.isFrozen ? (
                      <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-xs font-semibold text-rose-600">Compte gelé — virements bloqués</p>
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
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">IBAN / RIB de l'Agence</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={iban}
                              onChange={(e) => setIban(e.target.value)}
                              placeholder="MA64 ..."
                              className="h-10 pl-10 rounded-lg bg-muted border-border font-mono text-xs uppercase"
                            />
                          </div>
                        </div>
                        <Button disabled={processing} className="w-full h-11 rounded-lg text-xs font-semibold">
                          {processing ? <RefreshCw className="animate-spin w-4 h-4" /> : "Demander le virement"}
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
                            {pagedPayouts.map((p, i) => (
                              <TableRow key={i} className="hover:bg-muted/30">
                                <TableCell className="font-semibold text-xs px-6 font-mono">#{p.id.slice(0, 8)}</TableCell>
                                <TableCell className="font-semibold text-xs text-foreground">{p.amount.toFixed(2)} MAD</TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">
                                  {p.bankAccount ? `${p.bankAccount.slice(0, 8)}...` : '—'}
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
                        {payouts.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              {payoutPage * PAGE_SIZE + 1}–{Math.min((payoutPage + 1) * PAGE_SIZE, payouts.length)} sur {payouts.length}
                            </p>
                            <div className="flex gap-2">
                              <Button onClick={() => setPayoutPage(p => Math.max(0, p - 1))} disabled={payoutPage === 0}
                                variant="outline" size="sm" className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button onClick={() => setPayoutPage(p => p + 1)} disabled={(payoutPage + 1) * PAGE_SIZE >= payouts.length}
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
              disabled={processing}
              className="h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-4"
            >
              {processing ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Valider la remise'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
