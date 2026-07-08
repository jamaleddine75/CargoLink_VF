import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, RefreshCw, AlertCircle, Search, Building2, ChevronLeft, ChevronRight, Activity, Landmark, Clock, ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Shared Components
import StatCard from '@/components/wallet/StatCard';

interface WalletOverview {
  id: string;
  agencyName: string;
  balance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  status: 'ACTIVE' | 'FROZEN';
  lastTransactionAt: string;
}

interface PayoutRequest {
  id: string;
  agencyId: string;
  agencyName: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  bankDetails: string;
}

export default function GlobalWallets() {
  const [wallets, setWallets] = useState<WalletOverview[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'payouts' | 'platform'>('wallets');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchFinancialData();
  }, [page]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(false);
      const [walletsRes, payoutsRes] = await Promise.all([
        adminService.getAllWallets(page, 10),
        adminService.getAllPayoutRequests(0, 50, 'PENDING')
      ]);
      
      setWallets(walletsRes.content || []);
      setPayouts(payoutsRes.content || []);
      setTotalPages(walletsRes.totalPages || 0);
    } catch (error) {
      setError(true);
      toast.error("Échec de la synchronisation financière");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approvePayout(id);
      toast.success("Virement approuvé");
      fetchFinancialData();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredWallets = wallets.filter((wallet) =>
    (wallet.agencyName ?? "").toLowerCase().includes(normalizedSearch)
  );
  const filteredPayouts = payouts.filter((payout) =>
    (payout.agencyName ?? "").toLowerCase().includes(normalizedSearch)
  );

  const totalPlatformBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalPendingPayouts = payouts.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Portefeuille Plateforme</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Surveillance financière et gestion des règlements globaux</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchFinancialData} className="h-10 text-xs gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Synchroniser
          </Button>
          <Button className="h-10 text-xs gap-2">
            <Download className="w-4 h-4" /> Exporter le grand livre
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <div>
            <h3 className="text-sm font-bold text-destructive">Impossible de charger les portefeuilles</h3>
            <p className="text-xs text-muted-foreground mt-1">Veuillez vérifier votre connexion ou réessayer plus tard.</p>
          </div>
          <Button size="sm" onClick={fetchFinancialData}>
            Réessayer
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Solde Total" value={totalPlatformBalance} icon={Landmark} />
            <StatCard label="Paiements en Attente" value={totalPendingPayouts} icon={Clock} />
            <StatCard label="Revenu Total" value={14520.00} icon={Activity} />
            <StatCard label="Marge Plateforme" value={726.00} icon={ShieldCheck} />
          </div>

          {/* Ledger Management Module */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-1 bg-muted p-1 rounded-lg w-full md:w-auto">
                {[
                  { id: 'wallets', label: 'Grand Livre Agences' },
                  { id: 'payouts', label: 'File d\'Attente Retraits' },
                  { id: 'platform', label: 'Portefeuilles Système' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                      activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher une agence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-9 rounded-lg bg-muted border-border text-xs uppercase"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border border-border bg-card rounded-lg overflow-hidden">
                  <div className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {activeTab === 'wallets' ? (
                            <>
                              <TableHead className="px-6 text-xs text-muted-foreground">Entité Agence</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Solde</TableHead>
                              <TableHead className="text-xs text-muted-foreground">En attente</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Statut</TableHead>
                              <TableHead className="text-right px-6 text-xs text-muted-foreground">Action</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="px-6 text-xs text-muted-foreground">Demandeur</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Montant</TableHead>
                              <TableHead className="text-xs text-muted-foreground">Date de demande</TableHead>
                              <TableHead className="text-right px-6 text-xs text-muted-foreground">Action</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTab === 'wallets' && filteredWallets.map((wallet) => (
                          <TableRow key={wallet.id} className="hover:bg-muted/30">
                            <TableCell className="px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <Building2 size={20} />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{wallet.agencyName}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">ID: #{wallet.id.slice(-8).toUpperCase()}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-sm">{wallet.balance.toLocaleString()} MAD</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{wallet.pendingBalance.toLocaleString()} MAD</TableCell>
                            <TableCell>
                              <Badge className={cn("border-none text-[8px] font-bold uppercase px-2 py-0.5", wallet.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                                {wallet.status === 'ACTIVE' ? 'ACTIF' : 'GELÉ'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 text-right">
                              <Button variant="outline" size="sm" className="h-8">
                                Gérer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {activeTab === 'payouts' && filteredPayouts.map((payout) => (
                          <TableRow key={payout.id} className="hover:bg-muted/30">
                            <TableCell className="px-6 font-semibold text-sm">{payout.agencyName}</TableCell>
                            <TableCell className="font-semibold text-sm text-primary">+{payout.amount.toLocaleString()} MAD</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {payout.requestedAt ? formatDistanceToNow(new Date(payout.requestedAt), { locale: fr, addSuffix: true }) : '—'}
                            </TableCell>
                            <TableCell className="px-6 text-right">
                              <Button size="sm" onClick={() => handleApprove(payout.id)} className="h-9 px-4">Autoriser</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {activeTab === 'wallets' && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Page {page + 1} sur {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="h-9 text-xs"
                        >
                          <ChevronLeft size={14} /> Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                          className="h-9 text-xs"
                        >
                          Suivant <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
