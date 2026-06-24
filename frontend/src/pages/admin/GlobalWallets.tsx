import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Building2,
  ChevronRight,
  ArrowRight,
  Filter,
  Search,
  ArrowUpRight,
  History,
  Banknote,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Flame,
  Snowflake,
  Globe,
  Activity
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'wallets' | 'payouts' | 'platform'>('wallets');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [walletsRes, payoutsRes] = await Promise.all([
        adminService.getAllWallets(page, 10),
        adminService.getAllPayoutRequests(0, 50, 'PENDING')
      ]);
      
      setWallets(walletsRes.content || []);
      setPayouts(payoutsRes.content || []);
      setTotalPages(walletsRes.totalPages || 0);
      
      if (!walletsRes.content?.length && page === 0) {
        setWallets([
          { id: '1', agencyName: 'Casablanca Express', balance: 12450.50, pendingBalance: 3200.00, totalWithdrawn: 45000.00, status: 'ACTIVE', lastTransactionAt: new Date().toISOString() },
          { id: '2', agencyName: 'Marrakech Logistics', balance: 8900.20, pendingBalance: 1500.40, totalWithdrawn: 12000.00, status: 'FROZEN', lastTransactionAt: new Date().toISOString() },
          { id: '3', agencyName: 'Tangier Hub', balance: 4500.00, pendingBalance: 800.00, totalWithdrawn: 5000.00, status: 'ACTIVE', lastTransactionAt: new Date().toISOString() },
        ]);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Échec de la synchronisation financière");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [page]);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#060607] text-foreground dark:text-foreground pb-32 font-sans overflow-x-hidden selection:bg-primary/30">
      
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* HUD Header - Refined */}
        <div className="pt-8 md:pt-20 pb-8 md:pb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-10 text-left">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shadow-[0_0_20px_#6366f1]" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400/80 leading-none">Global Network Financial Oversight</p>
            </div>
            <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              Nexus <span className="text-indigo-500">Wallets</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <Button variant="outline" onClick={fetchFinancialData} className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-accent/30 border-border/40 hover:bg-accent/40 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-2 md:gap-3 transition-all flex-1 md:flex-none">
              <RefreshCw className={cn("w-3.5 h-3.5 md:w-4 md:h-4", loading && "animate-spin")} /> <span className="hidden md:inline">Global Sync</span><span className="md:hidden">Sync</span>
            </Button>
            <Button className="h-10 md:h-12 px-4 md:px-8 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-[9px] md:text-[10px] font-black uppercase tracking-widest gap-2 md:gap-3 shadow-lg shadow-indigo-600/20 border-none transition-all flex-1 md:flex-none">
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden md:inline">Export Ledger</span><span className="md:hidden">Export</span>
            </Button>
          </div>
        </div>

        <div className="space-y-12">
          {/* Main Financial KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCardDetailed label="Liquidity" value={totalPlatformBalance} icon={Globe} color="indigo" description="Total settled agency nodes" />
            <StatCardDetailed label="Pending" value={totalPendingPayouts} icon={Activity} color="amber" description={`${payouts.length} queue extractions`} />
            <StatCardDetailed label="Velocity" value={452000} icon={Zap} color="emerald" description="Current cycle throughput" />
            <StatCardDetailed label="Health" value="Optimal" icon={ShieldCheck} color="indigo" isAmount={false} description="Node integrity state" />
          </div>

          {/* Ledger Management Module */}
          <div className="pt-6">
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 text-foreground">
                <div className="flex items-center gap-1.5 md:gap-3 bg-accent/30 p-1 md:p-1.5 rounded-xl md:rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                   {(['wallets', 'payouts', 'platform'] as const).map((tab) => (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={cn(
                         "flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-3.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                         activeTab === tab ? "bg-indigo-600 text-foreground shadow-lg" : "text-foreground/30 hover:text-foreground"
                       )}
                     >
                       {tab === 'wallets' ? 'Agency Ledger' : tab === 'payouts' ? 'Withdrawal Queue' : 'Platform Nodes'}
                     </button>
                   ))}
                </div>

                <div className="relative group w-full md:w-[400px]">
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 md:w-4 h-3.5 md:h-4 text-foreground/20 group-focus-within:text-indigo-500 transition-colors" />
                   <Input 
                     placeholder="Search Node Name..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="h-11 md:h-14 pl-12 md:pl-14 pr-6 md:pr-8 rounded-xl border-border/40 bg-accent/30 w-full text-[10px] md:text-xs font-bold text-foreground focus:ring-indigo-500/30 transition-all uppercase tracking-widest"
                   />
                </div>
             </div>

             <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                   <Card className="bg-[#0a0a0b] border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                      <div className="p-0 overflow-x-auto text-foreground">
                         <Table>
                            <TableHeader className="bg-white/[0.01]">
                               <TableRow className="border-border/40 h-20">
                                  {activeTab === 'wallets' ? (
                                    <>
                                       <TableHead className="px-10 text-[10px] font-black uppercase text-foreground/30">Node Entity</TableHead>
                                       <TableHead className="text-[10px] font-black uppercase text-foreground/30">Liquidity</TableHead>
                                       <TableHead className="text-[10px] font-black uppercase text-foreground/30">Buffer</TableHead>
                                       <TableHead className="text-[10px] font-black uppercase text-foreground/30">State</TableHead>
                                       <TableHead className="text-right px-10 text-[10px] font-black uppercase text-foreground/30">Action</TableHead>
                                    </>
                                  ) : (
                                    <>
                                       <TableHead className="px-10 text-[10px] font-black uppercase text-foreground/30">Requestor</TableHead>
                                       <TableHead className="text-[10px] font-black uppercase text-foreground/30">Volume</TableHead>
                                       <TableHead className="text-[10px] font-black uppercase text-foreground/30">Timeline</TableHead>
                                       <TableHead className="text-right px-10 text-[10px] font-black uppercase text-foreground/30">Action</TableHead>
                                    </>
                                  )}
                               </TableRow>
                            </TableHeader>
                            <TableBody>
                               {activeTab === 'wallets' && filteredWallets.map((wallet) => (
                                 <TableRow key={wallet.id} className="border-border/40 h-24 hover:bg-white/[0.01] transition-colors group">
                                    <TableCell className="px-10">
                                       <div className="flex items-center gap-5">
                                          <div className="w-12 h-12 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                             <Building2 size={24} />
                                          </div>
                                          <div>
                                             <p className="font-black text-sm uppercase text-foreground/90 group-hover:text-indigo-400 transition-colors">{wallet.agencyName}</p>
                                             <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-[0.2em] mt-1">Node ID: #{wallet.id.slice(-8).toUpperCase()}</p>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell className="font-black text-lg italic">{wallet.balance.toLocaleString()} <span className="text-[10px] opacity-20">MAD</span></TableCell>
                                    <TableCell className="font-bold text-foreground/30 text-xs tracking-widest">{wallet.pendingBalance.toLocaleString()} MAD</TableCell>
                                    <TableCell>
                                       <Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-md", wallet.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-500")}>
                                          {wallet.status === 'ACTIVE' ? 'SYNCED' : 'FROZEN'}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 text-right">
                                       <Button variant="outline" className="h-10 w-10 p-0 rounded-lg border-border/40 bg-accent/30 hover:bg-indigo-600 hover:text-foreground transition-all">
                                          <ArrowUpRight size={18} />
                                       </Button>
                                    </TableCell>
                                 </TableRow>
                               ))}

                               {activeTab === 'payouts' && filteredPayouts.map((payout) => (
                                 <TableRow key={payout.id} className="border-border/40 h-24 hover:bg-white/[0.01]">
                                    <TableCell className="px-10 font-black text-sm uppercase text-foreground/90">{payout.agencyName}</TableCell>
                                    <TableCell className="font-black text-xl text-indigo-400">+{payout.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-xs font-bold text-foreground/20 uppercase tracking-widest">
                                       {payout.requestedAt ? formatDistanceToNow(new Date(payout.requestedAt), { locale: fr, addSuffix: true }) : '—'}
                                    </TableCell>
                                    <TableCell className="px-10 text-right">
                                       <Button size="sm" onClick={() => handleApprove(payout.id)} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-foreground font-black text-[9px] uppercase tracking-widest px-6 h-10 shadow-lg shadow-indigo-600/20 transition-all border-none">Authorize</Button>
                                    </TableCell>
                                 </TableRow>
                               ))}
                            </TableBody>
                         </Table>
                      </div>

                      {activeTab === 'wallets' && totalPages > 1 && (
                        <div className="flex items-center justify-between px-10 py-6 bg-white/[0.01] border-t border-border/40">
                           <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
                              Page {page + 1} of {totalPages}
                           </p>
                           <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="h-10 px-4 rounded-xl border-border/40 bg-accent/30 text-[10px] font-black uppercase tracking-widest gap-2"
                              >
                                 <ChevronLeft size={16} /> Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="h-10 px-4 rounded-xl border-border/40 bg-accent/30 text-[10px] font-black uppercase tracking-widest gap-2"
                              >
                                 Next <ChevronRight size={16} />
                              </Button>
                           </div>
                        </div>
                      )}
                   </Card>
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCardDetailed = ({ label, value, icon: Icon, color, isAmount = true, description }: any) => (
  <motion.div whileHover={{ y: -8 }} className="flex-1 bg-[#0a0a0b] border border-border/40 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 backdrop-blur-3xl shadow-xl group hover:bg-white/[0.01] transition-all flex flex-col justify-between overflow-hidden relative">
     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-[0.03]", 
        color === 'indigo' ? "bg-indigo-500" : color === 'amber' ? "bg-amber-500" : "bg-emerald-500"
     )} />
     <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10">
        <div className={cn(
          "w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border shadow-2xl",
          color === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : 
          color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
          'bg-indigo-500/10 text-indigo-400 border-indigo-500/10'
        )}>
           <Icon className="w-6 md:w-7 h-6 md:h-7" />
        </div>
        <Badge variant="outline" className="border-border/40 bg-accent/30 text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-lg">Sync Live</Badge>
     </div>
     <div className="relative z-10 text-left">
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 mb-1 md:mb-2">{label}</p>
        <h4 className="text-xl md:text-3xl font-black tracking-tighter leading-none mb-2 md:mb-4 italic text-foreground group-hover:text-indigo-400 transition-colors">
          {isAmount ? value.toLocaleString() : value}
          {isAmount && <span className="text-xs md:text-sm opacity-20 ml-1.5 md:ml-2 italic">MAD</span>}
        </h4>
        <p className="text-[9px] font-medium text-foreground/20 leading-relaxed uppercase tracking-widest">{description}</p>
     </div>
  </motion.div>
);

const CreditCard = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);
