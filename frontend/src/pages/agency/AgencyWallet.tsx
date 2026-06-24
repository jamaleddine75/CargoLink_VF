import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Activity,
  History,
  Zap,
  ChevronRight,
  Banknote,
  Search,
  Check,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

interface AgencyWalletData {
  balance: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  commissionRate: number;
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
}

interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
  bankAccount?: string;
}

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

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (error) {
      toast.error("Erreur de synchronisation financière");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemittance = async (id: string) => {
    try {
      setProcessing(true);
      await apiClient.post(ENDPOINTS.WALLET.CONFIRM_COD(id));
      toast.success("Remise confirmée avec succès");
      setConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return toast.error("Montant invalide");
    if (parseFloat(payoutAmount) > (wallet?.balance || 0)) return toast.error("Solde insuffisant");
    if (!iban) return toast.error("IBAN requis");

    try {
      setProcessing(true);
      await apiClient.post(ENDPOINTS.WALLET.AGENCY_PAYOUT_REQUEST, { amount: parseFloat(payoutAmount), bankAccount: iban });
      toast.success("Demande de paiement envoyée");
      setPayoutAmount('');
      setIban('');
      fetchData();
    } catch (error) {
      toast.error("Échec de la demande");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED': case 'CREDITED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED': case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (loading && !wallet) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <LoaderPulse />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60">Sync Treasury Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#060607] text-slate-900 dark:text-primary-foreground pb-28 font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* HUD Header - Refined */}
        <div className="pt-12 md:pt-20 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80">Nexus Node — Agency Ledger</p>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-primary-foreground leading-none">
              Nexus <span className="text-blue-500">Ledger</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchData} className="h-12 px-6 rounded-2xl bg-accent/30 border-border/40 hover:bg-accent/40 text-[10px] font-black uppercase tracking-widest gap-2 transition-all">
              <RefreshCw className={cn("w-4 h-4", processing && "animate-spin")} />
              Sync Node
            </Button>
            <Button className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-600/20 border-none transition-all">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-accent/30 border border-border/40 p-1 h-14 rounded-2xl w-full lg:w-fit justify-start mb-10 overflow-x-auto custom-scrollbar text-foreground">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest px-8 h-full transition-all">Overview</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest px-8 h-full transition-all">Commissions</TabsTrigger>
            <TabsTrigger value="remittances" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest px-8 h-full transition-all">COD Flow</TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-primary-foreground text-[10px] font-black uppercase tracking-widest px-8 h-full transition-all">Withdrawals</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {/* Stat Cards - Balanced Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    label="Current Balance" 
                    value={wallet?.balance || 0} 
                    icon={Wallet} 
                    color="blue" 
                    description="Net commissions post-protocol"
                  />
                  <StatCard 
                    label="Validated Yield" 
                    value={wallet?.totalCommissionEarned || 0} 
                    icon={ShieldCheck} 
                    color="emerald" 
                    description="Lifetime successfully settled"
                  />
                  <StatCard 
                    label="Transit Buffer" 
                    value={wallet?.pendingCommission || 0} 
                    icon={Clock} 
                    color="amber" 
                    description="Awaiting driver-agency sync"
                  />
                </div>

                {/* Quick Remittance List - Tailored Style */}
                <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-8 border-b border-border/40 bg-gradient-to-r from-amber-500/[0.03] to-transparent">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground">Awaiting Sync</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Verify physical assets before digital ledger update</CardDescription>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-black px-4 py-1.5 text-[10px] rounded-lg">{remittances.filter(r => r.status === 'PENDING').length} ALERTS</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      {remittances.filter(r => r.status === 'PENDING').length === 0 ? (
                        <div className="py-20 text-foreground">
                          <EmptyState icon={CheckCircle2} message="Global ledger synchronized" />
                        </div>
                      ) : (
                        remittances.filter(r => r.status === 'PENDING').map(remit => (
                          <div key={remit.id} className="p-8 border-b border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-accent/10 transition-all group">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500 border border-amber-500/10 group-hover:scale-105 transition-transform">
                                <Banknote className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-primary-foreground uppercase tracking-tight">{remit.description}</p>
                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-1 tracking-widest">{new Date(remit.date).toLocaleDateString()} — {remit.referenceIds.split(',').length} Nodes</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-2xl font-black text-primary-foreground tracking-tighter">{remit.amount.toFixed(2)} <span className="text-xs opacity-20 italic ml-1">MAD</span></p>
                              </div>
                              <Button size="sm" onClick={() => setConfirmId(remit.id)} className="rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-[9px] uppercase tracking-widest h-10 px-6 shadow-lg shadow-blue-600/20 transition-all border-none">Sync Node</Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="commissions">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-8 border-b border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Commission Ledger</h3>
                    <div className="flex gap-2 bg-accent/30 p-1 rounded-xl">
                      {['ALL', 'PENDING', 'CREDITED'].map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", statusFilter === f ? 'bg-blue-600 text-primary-foreground' : 'text-muted-foreground/40 hover:text-muted-foreground/60')}>{f}</button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto text-foreground">
                    <Table>
                      <TableHeader className="bg-accent/10">
                        <TableRow className="border-border/40 h-16">
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60 px-8">Reference</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Total Fee</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Yield</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Status</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/60 px-8">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.filter(c => statusFilter === 'ALL' || c.status === statusFilter).map((c, i) => (
                          <TableRow key={i} className="border-border/40 h-20 hover:bg-accent/10 transition-colors">
                            <TableCell className="font-black text-xs px-8 text-foreground/80">#{c.orderId.slice(-10).toUpperCase()}</TableCell>
                            <TableCell className="font-bold text-sm">{c.deliveryFee.toFixed(2)} MAD</TableCell>
                            <TableCell className="text-emerald-400 font-black text-lg">+{c.amount.toFixed(2)}</TableCell>
                            <TableCell><Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-md", getStatusBadge(c.status))}>{c.status}</Badge></TableCell>
                            <TableCell className="text-right text-[10px] text-muted-foreground/40 font-bold px-8">{new Date(c.earnedAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="remittances">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-8 border-b border-border/40">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Remittance Pipeline</h3>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto text-foreground">
                    <Table>
                      <TableHeader className="bg-accent/10">
                        <TableRow className="border-border/40 h-16">
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60 px-8">Description</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Volume</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Nodes</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">State</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/60 px-8">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {remittances.map((r, i) => (
                          <TableRow key={i} className="border-border/40 h-20 hover:bg-accent/10">
                            <TableCell className="font-black text-xs px-8 text-foreground/80 uppercase">{r.description}</TableCell>
                            <TableCell className="font-black text-blue-400 text-base">{r.amount.toFixed(2)} MAD</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {r.referenceIds.split(',').slice(0, 3).map(id => <Badge key={id} variant="outline" className="bg-accent/30 border-border/40 text-[7px] font-black uppercase">{id.slice(-6)}</Badge>)}
                                {r.referenceIds.split(',').length > 3 && <span className="text-[8px] text-muted-foreground/40 font-black">+{r.referenceIds.split(',').length - 3}</span>}
                              </div>
                            </TableCell>
                            <TableCell><Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-md", getStatusBadge(r.status))}>{r.status}</Badge></TableCell>
                            <TableCell className="text-right px-8">
                              {r.status === 'PENDING' && (
                                <Button size="sm" onClick={() => setConfirmId(r.id)} className="rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-foreground font-black text-[8px] uppercase tracking-widest h-8 px-4">Authorize</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="payouts">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-foreground">
                <div className="lg:col-span-4 space-y-6">
                  <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <CardHeader className="p-8 border-b border-border/40 bg-blue-600/[0.03]">
                      <CardTitle className="text-lg font-black uppercase italic flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-blue-500" /> Funds Extraction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="p-6 rounded-2xl bg-accent/10 border border-border/40">
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Available for extraction</p>
                        <h4 className="text-3xl font-black">{wallet?.balance.toFixed(2)} <span className="text-xs opacity-20 italic">MAD</span></h4>
                      </div>
                      <form onSubmit={handlePayoutRequest} className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Volume (MAD)</Label>
                          <Input value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="0.00" className="h-14 rounded-xl bg-accent/30 border-border/40 font-black text-xl px-6" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Target IBAN</Label>
                          <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="MA64 ..." className="h-14 rounded-xl bg-accent/30 border-border/40 font-bold text-xs uppercase px-6" />
                        </div>
                        <Button disabled={processing} className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase text-[10px] tracking-[0.2em] mt-4 shadow-xl shadow-blue-600/20">
                          {processing ? <RefreshCw className="animate-spin" /> : "Initialize Transfer"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-8">
                  <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <CardHeader className="p-8 border-b border-border/40">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">Extraction Timeline</h3>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-accent/10">
                          <TableRow className="border-border/40 h-16">
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60 px-8">ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Volume</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">Target</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-muted-foreground/60">State</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase text-muted-foreground/60 px-8">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payouts.map((p, i) => (
                            <TableRow key={i} className="border-border/40 h-20 hover:bg-accent/10">
                              <TableCell className="font-bold text-[10px] px-8 text-muted-foreground/60">#{p.id.slice(0, 8).toUpperCase()}</TableCell>
                              <TableCell className="font-black text-primary-foreground text-base">{p.amount.toFixed(2)} MAD</TableCell>
                              <TableCell className="text-[10px] font-bold text-muted-foreground/60 uppercase">{p.bankAccount?.slice(0, 6)}...</TableCell>
                              <TableCell><Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-md", getStatusBadge(p.status))}>{p.status}</Badge></TableCell>
                              <TableCell className="text-right text-[10px] text-muted-foreground/40 font-bold px-8">{new Date(p.requestedAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent className="bg-[#060607] border-border/40 rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 shadow-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-primary-foreground tracking-tighter uppercase italic">Confirm Reception?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60 font-medium leading-relaxed text-sm">
              By authorizing this sync, you confirm physical possession of the COD assets. This action will update the digital ledger and credit your node immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl bg-accent/30 border-border/40 text-[10px] font-black uppercase tracking-widest text-foreground/60">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && handleConfirmRemittance(confirmId)} className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-primary-foreground text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-600/20 border-none">
              Authorize Sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, color, description }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-[#0a0a0b] border border-border/40 rounded-[2.5rem] p-8 relative overflow-hidden group backdrop-blur-3xl shadow-2xl"
  >
    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-opacity group-hover:opacity-20", 
      color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
    )} />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl", 
          color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
          'bg-amber-500/10 text-amber-500 border-amber-500/20'
        )}>
          <Icon className="w-7 h-7" />
        </div>
        <Badge variant="outline" className="border-border/40 bg-accent/30 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">Sync Live</Badge>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{label}</p>
      <h3 className="text-3xl font-black tracking-tighter text-foreground">
        {value.toLocaleString()} <span className="text-sm opacity-20 italic ml-1">MAD</span>
      </h3>
      {description && <p className="text-[9px] font-medium text-muted-foreground/40 mt-4 flex items-center gap-2 uppercase tracking-widest"><Info className="w-3 h-3 text-blue-500" /> {description}</p>}
    </div>
  </motion.div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="py-20 text-center opacity-20">
    <Icon className="w-12 h-12 mx-auto mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
  </div>
);

const LoaderPulse = () => (
  <div className="flex gap-1">
    {[1, 2, 3].map(i => <div key={i} className="w-2 h-8 bg-blue-500/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
  </div>
);
