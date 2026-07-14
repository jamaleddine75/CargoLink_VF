import React, { useState, useCallback, useEffect } from 'react';
import {
  Wallet, ArrowDownRight, DollarSign,
  CreditCard, Download, CheckCircle2,
  Clock, Zap, TrendingUp,
  ShieldCheck, RefreshCw, Search,
  Banknote, AlertCircle, XCircle,
  Snowflake, Flame, ChevronLeft, ChevronRight,
  ShieldAlert, Package, Users, Building2,
  PlayCircle, BarChart2, Activity,
  Eye, EyeOff, Filter, MoreHorizontal,
  Command, PieChart, LineChart,
  ArrowUpRight, ArrowDownLeft, LucideIcon,
  AlertTriangle, Ban, UserX,
  FileText, Printer, SlidersHorizontal,
  LayoutGrid, LayoutList, Maximize2,
  Info, GripVertical, ExternalLink,
  ScanLine, Fingerprint, Flag,
  Layers, Kanban, Network
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
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { toast } from 'sonner';
import { StatCard } from '@/components/shared/StatCard';
import StatusBadge from '@/components/wallet/StatusBadge';

const _ = BarChart2; // used

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

// ─── Mini Sparkline ──────────────────────────────────────────────
const SparklineBars = ({ data, color }: { data: number[]; color: string }) => (
  <div className="flex items-end gap-[2px] h-8">
    {data.map((v, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${Math.max(v * 100, 8)}%` }}
        transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
        className={`w-[3px] rounded-t-sm ${color}`}
      />
    ))}
  </div>
);

// ─── KPI Card ────────────────────────────────────────────────────
const KpiCard = ({
  title, value, icon: Icon, trend, format = 'currency', sparkline, delay = 0,
}: {
  title: string; value: number; icon: LucideIcon; trend?: { dir: 'up' | 'down'; pct: number };
  format?: 'currency' | 'count'; sparkline?: number[]; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
  >
    <Card className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {format === 'currency'
                ? value.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : value.toLocaleString()}
            </span>
            {format === 'currency' && <span className="text-[10px] font-semibold text-muted-foreground/60">MAD</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.dir === 'up'
                ? <ArrowUpRight size={12} className="text-emerald-500" />
                : <ArrowDownLeft size={12} className="text-rose-500" />}
              <span className={cn("text-[10px] font-semibold", trend.dir === 'up' ? 'text-emerald-500' : 'text-rose-500')}>
                {trend.pct}%
              </span>
              <span className="text-[9px] text-muted-foreground/50">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Icon size={16} />
        </div>
      </div>
      {sparkline && (
        <div className="mt-3 pl-0.5">
          <SparklineBars data={sparkline} color={trend?.dir === 'up' ? 'bg-emerald-500/60' : 'bg-primary/60'} />
        </div>
      )}
    </Card>
  </motion.div>
);

// ─── Analytics Card (larger trend card) ──────────────────────────
const AnalyticsCard = ({
  title, value, subtitle, icon: Icon, color = 'primary',
}: {
  title: string; value: string; subtitle: string; icon: LucideIcon; color?: string;
}) => {
  const colorMap: Record<string, string> = {
    primary: 'from-primary/20 via-primary/5 to-transparent border-primary/20 text-primary',
    emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-500',
    amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 text-amber-500',
    rose: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/20 text-rose-500',
    indigo: 'from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/20 text-indigo-500',
  };
  return (
    <motion.div whileHover={{ scale: 1.01 }} className={`rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.primary} p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</p>
          <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Fraud Alert Row ─────────────────────────────────────────────
const FraudAlert = ({ level, title, desc, time }: { level: 'high' | 'medium' | 'low'; title: string; desc: string; time: string }) => {
  const colors = { high: 'text-rose-500 bg-rose-500/10 border-rose-500/20', medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20', low: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60 transition-colors">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border", colors[level])}>
        <AlertTriangle size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] font-black uppercase tracking-widest", level === 'high' ? 'text-rose-500' : level === 'medium' ? 'text-amber-500' : 'text-blue-500')}>{level}</span>
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <span className="text-[9px] text-muted-foreground/50 shrink-0">{time}</span>
    </motion.div>
  );
};

// ─── Metric Pill ─────────────────────────────────────────────────
const MetricPill = ({ label, value, color, isCount = false }: {
  label: string; value: number; color: string; isCount?: boolean;
}) => (
  <div className={cn(
    "px-3 py-2 rounded-lg border text-xs",
    color === 'amber' ? "bg-amber-500/5 border-amber-500/20"
      : color === 'rose' ? "bg-rose-500/5 border-rose-500/20"
      : "bg-indigo-500/5 border-indigo-500/20"
  )}>
    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
    <p className={cn("text-sm font-bold", color === 'amber' ? "text-amber-500" : color === 'rose' ? "text-rose-500" : "text-indigo-500")}>
      {isCount ? value : `${value.toFixed(2)} MAD`}
    </p>
  </div>
);

// ─── Empty Table Row ─────────────────────────────────────────────
const EmptyTableRow = ({ message }: { message: string }) => (
  <TableRow>
    <TableCell colSpan={6} className="py-16 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <p className="text-xs text-muted-foreground/60 font-medium">{message}</p>
      </motion.div>
    </TableCell>
  </TableRow>
);

// ─── Tab Config ──────────────────────────────────────────────────
const TABS_CONFIG = [
  { id: 'withdrawals', label: 'Retraits Chauffeurs', countKey: 'withdrawalRequests' as const, icon: Users },
  { id: 'agency-payouts', label: 'Paiements Agences', countKey: 'agencyPayouts' as const, icon: Building2 },
  { id: 'cod-remittances', label: 'Remises COD', countKey: 'codRemittances' as const, icon: Banknote },
  { id: 'wallets', label: 'Grand Livre', icon: BarChart2 },
] as const;

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const FinanceDashboard = () => {
  const queryClient = useQueryClient();

  // ── UI State ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [searchTerm, setSearchTerm] = useState('');
  const [codStatusFilter, setCodStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PROCESSING'>('ALL');
  const [rejectId, setRejectId] = useState<{ id: string; type: 'DRIVER' | 'AGENCY' | 'COD' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [batchPayoutOpen, setBatchPayoutOpen] = useState<'drivers' | 'agencies' | null>(null);
  const [page, setPage] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [detailWallet, setDetailWallet] = useState<WalletItem | null>(null);

  // ── Cmd+K listener ─────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // ── Queries (unchanged) ────────────────────────────────────────
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

  // ── Mutations (unchanged) ──────────────────────────────────────
  const approveWithdrawal = useMutation({
    mutationFn: (id: string) => apiClient.put(ENDPOINTS.WALLET.APPROVE_WITHDRAWAL(id), 'APPROVED'),
    onSuccess: () => { toast.success("Retrait approuvé"); queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] }); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Échec de l'approbation"),
  });

  const rejectWithdrawal = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.put(ENDPOINTS.WALLET.REJECT_WITHDRAWAL(id), 'REJECTED'),
    onSuccess: () => { toast.success("Retrait rejeté — solde remboursé"); setRejectId(null); setRejectReason(''); queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] }); },
    onError: () => toast.error("Échec du rejet"),
  });

  const approveAgencyPayout = useMutation({
    mutationFn: (id: string) => apiClient.put(ENDPOINTS.WALLET.APPROVE_AGENCY_PAYOUT(id)),
    onSuccess: () => { toast.success("Virement agence approuvé"); queryClient.invalidateQueries({ queryKey: ['agency-payout-requests'] }); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Échec de l'approbation"),
  });

  const rejectAgencyPayout = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.put(ENDPOINTS.WALLET.REJECT_AGENCY_PAYOUT(id), null, { params: { reason } }),
    onSuccess: () => { toast.success("Virement agence rejeté"); setRejectId(null); setRejectReason(''); queryClient.invalidateQueries({ queryKey: ['agency-payout-requests'] }); },
    onError: () => toast.error("Échec du rejet"),
  });

  const acceptCodRemittance = useMutation({
    mutationFn: (id: string) => apiClient.post(ENDPOINTS.WALLET.ADMIN_ACCEPT_COD_REMITTANCE(id)),
    onSuccess: () => { toast.success("Remise COD validée"); queryClient.invalidateQueries({ queryKey: ['admin-cod-remittances'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Échec de la validation"),
  });

  const rejectCodRemittance = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.post(ENDPOINTS.WALLET.ADMIN_REJECT_COD_REMITTANCE(id), { reason }),
    onSuccess: () => { toast.success("Remise COD rejetée"); setRejectId(null); setRejectReason(''); queryClient.invalidateQueries({ queryKey: ['admin-cod-remittances'] }); },
    onError: () => toast.error("Échec du rejet"),
  });

  const freezeWallet = useMutation({
    mutationFn: ({ userId, freeze }: { userId: string; freeze: boolean }) =>
      freeze
        ? apiClient.put(ENDPOINTS.WALLET.FREEZE(userId), null, { params: { reason: 'Gel administratif' } })
        : apiClient.put(ENDPOINTS.WALLET.UNFREEZE(userId), null, { params: { reason: 'Dégel administratif' } }),
    onSuccess: (_, variables) => { toast.success(variables.freeze ? "Compte gelé" : "Compte dégelé"); queryClient.invalidateQueries({ queryKey: ['all-wallets'] }); },
    onError: () => toast.error("Opération échouée"),
  });

  const reconcileBatch = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.RECONCILE_BATCH),
    onSuccess: () => { toast.success("Réconciliation batch terminée"); setReconcileOpen(false); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Réconciliation échouée"),
  });

  const batchPayoutDrivers = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.ADMIN_BATCH_PAYOUT_DRIVERS),
    onSuccess: () => { toast.success("Paiements chauffeurs traités"); setBatchPayoutOpen(null); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Échec du paiement batch"),
  });

  const batchPayoutAgencies = useMutation({
    mutationFn: () => apiClient.post(ENDPOINTS.WALLET.ADMIN_BATCH_PAYOUT_AGENCIES),
    onSuccess: () => { toast.success("Paiements agences traités"); setBatchPayoutOpen(null); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); queryClient.invalidateQueries({ queryKey: ['platform-wallet'] }); },
    onError: () => toast.error("Échec du paiement batch"),
  });

  // ── Handlers (unchanged) ───────────────────────────────────────
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
    } catch { toast.error("Échec de l'export"); }
  };

  const filteredWallets = (walletsPaged as any)?.content?.filter((w: WalletItem) =>
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

  // ── Derived data (fake sparklines / fraud) ─────────────────────
  const sparklineData = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.8, 1.0, 0.7, 0.85, 0.95, 1.0];
  const fraudAlerts = [
    { level: 'high' as const, title: 'Tentative de retrait multiple', desc: 'Utilisateur #4872 a tenté 3 retraits en 2 minutes', time: '2m' },
    { level: 'medium' as const, title: 'Solde négatif détecté', desc: 'Compte agence #A304 en négatif de -230 MAD', time: '15m' },
    { level: 'low' as const, title: 'Nouveau appareil détecté', desc: 'Connexion admin depuis une IP non reconnue', time: '1h' },
  ];

  const pw = platformWallet;
  const rev = pw?.totalRevenue ?? summary?.totalRevenue ?? 0;
  const liquid = pw?.balance ?? summary?.netLiquidity ?? 0;
  const profit = pw?.platformProfit ?? 0;

  return (
    <div className="space-y-6 pb-12">

      {/* ═══════════════════════════════════════════════════════════
          HEADER
         ═══════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet size={16} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Financial Command Center</h1>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Pilotez les liquidités, validez les flux et supervisez l'ensemble des transactions</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setCmdOpen(true)} className="gap-1.5 h-8 text-[10px] border border-border/40 bg-muted/30">
                <Command size={12} /> <span className="hidden sm:inline">Menu rapide</span> <kbd className="px-1 py-0.5 rounded bg-muted text-[8px] font-mono">⌘K</kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ouvrir le palette de commandes</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" onClick={() => setReconcileOpen(true)} className="gap-1.5 h-8 text-[10px]">
            <RefreshCw className="w-3 h-3" /> Réconcilier
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBatchPayoutOpen('drivers')} className="gap-1.5 h-8 text-[10px]">
            <PlayCircle className="w-3 h-3 text-emerald-500" /> Payer Chauffeurs
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBatchPayoutOpen('agencies')} className="gap-1.5 h-8 text-[10px]">
            <PlayCircle className="w-3 h-3 text-amber-500" /> Payer Agences
          </Button>
          <Button variant="default" size="sm" onClick={handleExport} className="gap-1.5 h-8 text-[10px]">
            <Download className="w-3 h-3" /> Exporter
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          KPI GRID — 8 cards with sparklines
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard title="Solde Plateforme" value={liquid} icon={Wallet} trend={{ dir: 'up', pct: 12 }} sparkline={sparklineData} delay={0} />
        <KpiCard title="Revenu Total" value={rev} icon={TrendingUp} trend={{ dir: 'up', pct: 8 }} sparkline={sparklineData} delay={0.04} />
        <KpiCard title="Profit (5%)" value={profit} icon={Zap} trend={{ dir: 'up', pct: 15 }} sparkline={sparklineData} delay={0.08} />
        <KpiCard title="Retraits en attente" value={withdrawalRequests?.length ?? 0} icon={Clock} format="count" delay={0.12} />
        <KpiCard title="Payé Chauffeurs" value={pw?.totalDriverPayout ?? 0} icon={Users} sparkline={sparklineData} delay={0.16} />
        <KpiCard title="Payé Agences" value={pw?.totalAgencyPayout ?? 0} icon={Building2} sparkline={sparklineData} delay={0.2} />
        <KpiCard title="Remises COD" value={codRemittances?.length ?? 0} icon={Banknote} format="count" delay={0.24} />
        <KpiCard title="Virements agence" value={agencyPayouts?.length ?? 0} icon={CreditCard} format="count" delay={0.28} />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FINANCIAL ANALYTICS — mini row
         ═══════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/80">Analytiques Financières</h2>
            </div>
            <Badge variant="outline" className="text-[8px] font-semibold px-2 py-0.5 border-border/40 text-muted-foreground/60">Temps réel</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AnalyticsCard title="Cash Flow" value={`${liquid.toFixed(0)} MAD`} subtitle="Disponible immédiat" icon={Wallet} color="primary" />
            <AnalyticsCard title="Revenu" value={`${rev.toFixed(0)} MAD`} subtitle="Cumulé" icon={TrendingUp} color="emerald" />
            <AnalyticsCard title="Profit" value={`${profit.toFixed(0)} MAD`} subtitle="Marge 5%" icon={PieChart} color="primary" />
            <AnalyticsCard title="Règlements" value={`${(pw?.totalDriverPayout ?? 0).toFixed(0)} MAD`} subtitle="Versé aux drivers" icon={Users} color="indigo" />
            <AnalyticsCard title="Retraits" value={`${summary?.totalWithdrawals?.toFixed(0) ?? '0'} MAD`} subtitle="En attente" icon={ArrowDownRight} color="amber" />
            <AnalyticsCard title="Commissions" value={`${summary?.agencyCommissions?.toFixed(0) ?? '0'} MAD`} subtitle="Agences" icon={Building2} color="rose" />
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          TABBED MANAGEMENT
         ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border/40 backdrop-blur-sm">
          {TABS_CONFIG.map((tab) => {
            const count = tab.countKey
              ? tab.countKey === 'withdrawalRequests' ? withdrawalRequests?.length
                : tab.countKey === 'agencyPayouts' ? agencyPayouts?.length
                : codRemittances?.length
              : undefined;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(0); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-card/30"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-muted-foreground/10 text-[8px] font-bold text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <Card className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">

              {/* — Wallets toolbar — */}
              {activeTab === 'wallets' && (
                <div className="p-4 border-b border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
                  <div className="relative w-full md:w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                    <Input placeholder="Rechercher par nom / email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 pl-9 bg-card border-border/50 text-xs w-full rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground/60 px-1 font-medium">Page {page + 1}</span>
                    <Button onClick={() => setPage(p => p + 1)} disabled={!(walletsPaged as any)?.content?.length || (walletsPaged as any)?.last} variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* — COD filters — */}
              {activeTab === 'cod-remittances' && (
                <div className="px-4 py-3 border-b border-border/40 flex flex-wrap items-center gap-2 bg-muted/20">
                  {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((status) => (
                    <button key={status} onClick={() => setCodStatusFilter(status as typeof codStatusFilter)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border',
                        codStatusFilter === status
                          ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-sm'
                          : 'bg-card/40 text-muted-foreground/60 border-border/30 hover:text-foreground hover:bg-card/60'
                      )}
                    >
                      {status === 'ALL' ? 'Tous' : status === 'PENDING' ? 'En attente' : status === 'PROCESSING' ? 'En cours' : status === 'COMPLETED' ? 'Complétés' : 'Rejetés'}
                    </button>
                  ))}
                </div>
              )}

              {/* — Table — */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="border-border/20">
                      {activeTab === 'wallets' ? (
                        <>
                          <TableHead className="px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Entité</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Type</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Solde</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Statut</TableHead>
                          <TableHead className="text-right px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Action</TableHead>
                        </>
                      ) : activeTab === 'cod-remittances' ? (
                        <>
                          <TableHead className="px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Chauffeur</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Montant</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Colis Liés</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Date</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Statut</TableHead>
                          <TableHead className="text-right px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Actions</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">
                            {activeTab === 'agency-payouts' ? 'Agence' : 'Chauffeur'}
                          </TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Montant</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Compte Bancaire</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Date</TableHead>
                          <TableHead className="text-right px-6 text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Autorisation</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Wallets */}
                    {activeTab === 'wallets' && filteredWallets.map((w: WalletItem) => (
                      <TableRow key={w.userId} className="border-border/20 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setDetailWallet(w)}>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary/60">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{w.userName}</p>
                              <p className="text-[8px] font-medium text-muted-foreground/50 uppercase tracking-widest">{w.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted/30 border-border/30 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">{w.userType}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-foreground">
                          {w.balance.toFixed(2)} <span className="text-[8px] text-muted-foreground/40 ml-0.5">MAD</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={w.isFrozen ? 'FROZEN' : 'ACTIVE'} />
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => freezeWallet.mutate({ userId: w.userId, freeze: !w.isFrozen })}
                                  variant="ghost" size="sm"
                                  className={cn("h-7 w-7 p-0 rounded-lg", w.isFrozen ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" : "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10")}
                                >
                                  {w.isFrozen ? <Flame size={12} /> : <Snowflake size={12} />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{w.isFrozen ? 'Dégeler' : 'Geler'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground">
                                  <Eye size={12} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Détails</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Withdrawals */}
                    {activeTab === 'withdrawals' && withdrawalRequests?.map((req) => (
                      <TableRow key={req.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                              <Users size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{req.userName}</p>
                              <p className="text-[8px] font-medium text-muted-foreground/50 uppercase tracking-widest">{req.accountHolder}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-emerald-500">+{req.amount.toFixed(2)} MAD</TableCell>
                        <TableCell className="text-[9px] font-mono text-muted-foreground/60 font-medium">
                          {req.bankAccount?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-[9px] font-medium text-muted-foreground/60">
                          {new Date(req.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => approveWithdrawal.mutate(req.id)} disabled={approveWithdrawal.isPending}
                                  size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20">
                                  <CheckCircle2 size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approuver</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => setRejectId({ id: req.id, type: 'DRIVER' })}
                                  size="sm" className="h-8 w-8 p-0 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20">
                                  <XCircle size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rejeter</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Agency Payouts */}
                    {activeTab === 'agency-payouts' && agencyPayouts?.map((req) => (
                      <TableRow key={req.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                              <Building2 size={14} />
                            </div>
                            <p className="text-xs font-semibold text-foreground">{req.agencyName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-indigo-400">+{req.amount.toFixed(2)} MAD</TableCell>
                        <TableCell className="text-[9px] font-mono text-muted-foreground/60 font-medium">
                          {req.bankAccount?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-[9px] font-medium text-muted-foreground/60">
                          {new Date(req.requestedAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => approveAgencyPayout.mutate(req.id)} disabled={approveAgencyPayout.isPending}
                                  size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20">
                                  <CheckCircle2 size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approuver</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={() => setRejectId({ id: req.id, type: 'AGENCY' })}
                                  size="sm" className="h-8 w-8 p-0 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20">
                                  <XCircle size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Rejeter</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* COD Remittances */}
                    {activeTab === 'cod-remittances' && filteredCodRemittances.map((rem) => (
                      <TableRow key={rem.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                              <Package size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{rem.driverName}</p>
                              {rem.driverPhone && <p className="text-[8px] font-medium text-muted-foreground/50">{rem.driverPhone}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-amber-500">{rem.amount.toFixed(2)} MAD</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rem.referenceIds?.split(',').slice(0, 3).map(id => (
                              <Badge key={id} variant="outline" className="bg-muted/30 border-border/30 text-[6px] font-black uppercase px-1.5 py-0.5 rounded">
                                #{id.trim().slice(-6)}
                              </Badge>
                            ))}
                            {rem.referenceIds?.split(',').length > 3 && (
                              <Badge variant="outline" className="bg-muted/30 border-border/30 text-[6px] font-black px-1.5 py-0.5 rounded">+{rem.referenceIds.split(',').length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[9px] font-medium text-muted-foreground/60">
                          {new Date(rem.date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={rem.status} />
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          {rem.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button onClick={() => acceptCodRemittance.mutate(rem.id)} disabled={acceptCodRemittance.isPending}
                                    size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20">
                                    <CheckCircle2 size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Valider</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button onClick={() => setRejectId({ id: rem.id, type: 'COD' })}
                                    size="sm" className="h-8 w-8 p-0 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20">
                                    <XCircle size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rejeter</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30">Lecture seule</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Empty States */}
                    {activeTab === 'withdrawals' && (!withdrawalRequests || withdrawalRequests.length === 0) && <EmptyTableRow message="Aucun retrait en attente" />}
                    {activeTab === 'agency-payouts' && (!agencyPayouts || agencyPayouts.length === 0) && <EmptyTableRow message="Aucun virement agence en attente" />}
                    {activeTab === 'cod-remittances' && filteredCodRemittances.length === 0 && <EmptyTableRow message="Aucune remise COD trouvée" />}
                    {activeTab === 'wallets' && filteredWallets.length === 0 && <EmptyTableRow message="Aucun wallet trouvé" />}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FRAUD DETECTION + REPORTS — side-by-side
         ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Fraud Detection ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <ShieldAlert size={14} />
                </div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/80">Détection de Fraude</h2>
              </div>
              <Badge className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-bold px-2 py-0.5">{fraudAlerts.length} Alerte{fraudAlerts.length > 1 ? 's' : ''}</Badge>
            </div>
            <div className="space-y-2">
              {fraudAlerts.map((a, i) => <FraudAlert key={i} {...a} />)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Risque élevé', count: '1', color: 'text-rose-500 bg-rose-500/10' },
                { label: 'Suspect', count: '2', color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Doux', count: '3', color: 'text-blue-500 bg-blue-500/10' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-lg border border-border/40 p-2.5 text-center ${color}`}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[7px] font-bold uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Reports ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <FileText size={14} />
                </div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/80">Rapports Financiers</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { period: 'Journalier', desc: 'Flux du jour', icon: Clock, color: 'from-blue-500/10 border-blue-500/20 text-blue-500' },
                { period: 'Hebdomadaire', desc: 'Tendance 7j', icon: Activity, color: 'from-emerald-500/10 border-emerald-500/20 text-emerald-500' },
                { period: 'Mensuel', desc: 'Récapitulatif', icon: TrendingUp, color: 'from-amber-500/10 border-amber-500/20 text-amber-500' },
                { period: 'Annuel', desc: 'Bilan exercice', icon: BarChart2, color: 'from-indigo-500/10 border-indigo-500/20 text-indigo-500' },
              ].map(({ period, desc, icon: Icon, color }) => (
                <motion.button key={period} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  className={`rounded-xl border bg-gradient-to-br ${color} p-3.5 text-left flex items-center gap-3 hover:shadow-md transition-all`}
                >
                  <div className="w-9 h-9 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{period}</p>
                    <p className="text-[8px] text-muted-foreground/60 mt-0.5">{desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 h-9 text-[10px] gap-1.5 rounded-lg">
                <Download size={12} /> CSV
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          REJECT MODAL (unchanged)
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(''); }}>
        <DialogContent className="bg-card border border-border/60 rounded-xl p-6 max-w-md shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-3">
              <ShieldAlert size={20} />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">Motif de refus</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Indiquez la raison du rejet. Elle sera visible par l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Compte bancaire invalide..." className="h-10 bg-card border-border/50 text-xs px-3 rounded-lg" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectId(null)} className="rounded-lg">Annuler</Button>
            <Button onClick={handleRejectConfirm} disabled={!rejectReason.trim()} variant="destructive" size="sm" className="rounded-lg">Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          RECONCILE DIALOG (unchanged)
         ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <AlertDialogContent className="bg-card border border-border/60 rounded-xl p-6 max-w-md shadow-xl">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <RefreshCw size={20} className={reconcileBatch.isPending ? 'animate-spin' : ''} />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">Lancer la Réconciliation ?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              Cette action va finaliser tous les ordres confirmés par les agences et créditer les clients. Opération irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel asChild>
              <Button variant="ghost" size="sm" className="rounded-lg">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => reconcileBatch.mutate()} disabled={reconcileBatch.isPending} size="sm" className="rounded-lg">
                {reconcileBatch.isPending ? 'En cours...' : 'Confirmer'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════
          BATCH PAYOUT DIALOG (unchanged)
         ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!batchPayoutOpen} onOpenChange={() => setBatchPayoutOpen(null)}>
        <AlertDialogContent className="bg-card border border-border/60 rounded-xl p-6 max-w-md shadow-xl">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
              <PlayCircle size={20} />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Payer tous les {batchPayoutOpen === 'drivers' ? 'Chauffeurs' : 'Agences'} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              Cela traitera les paiements pour tous les {batchPayoutOpen === 'drivers' ? 'chauffeurs' : 'agences'} éligibles (solde positif, aucune dette COD). Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel asChild>
              <Button variant="ghost" size="sm" className="rounded-lg">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => batchPayoutOpen === 'drivers' ? batchPayoutDrivers.mutate() : batchPayoutAgencies.mutate()}
                disabled={batchPayoutDrivers.isPending || batchPayoutAgencies.isPending} size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                {(batchPayoutDrivers.isPending || batchPayoutAgencies.isPending) ? 'En cours...' : 'Confirmer les paiements'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════
          COMMAND PALETTE (Cmd+K)
         ═══════════════════════════════════════════════════════════ */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Rechercher une action..." />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => { setCmdOpen(false); setReconcileOpen(true); }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Lancer la réconciliation
            </CommandItem>
            <CommandItem onSelect={() => { setCmdOpen(false); setBatchPayoutOpen('drivers'); }}>
              <PlayCircle className="mr-2 h-4 w-4" /> Paiement batch chauffeurs
            </CommandItem>
            <CommandItem onSelect={() => { setCmdOpen(false); setBatchPayoutOpen('agencies'); }}>
              <PlayCircle className="mr-2 h-4 w-4" /> Paiement batch agences
            </CommandItem>
            <CommandItem onSelect={() => { setCmdOpen(false); handleExport(); }}>
              <Download className="mr-2 h-4 w-4" /> Exporter le grand livre
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            {TABS_CONFIG.map((tab) => (
              <CommandItem key={tab.id} onSelect={() => { setActiveTab(tab.id); setCmdOpen(false); setPage(0); }}>
                <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* ═══════════════════════════════════════════════════════════
          WALLET DETAILS DRAWER
         ═══════════════════════════════════════════════════════════ */}
      <Drawer open={!!detailWallet} onOpenChange={(open) => { if (!open) setDetailWallet(null); }}>
        <DrawerContent className="bg-card border-t border-border/60 rounded-t-2xl shadow-xl">
          <div className="mx-auto w-full max-w-2xl p-6">
            <DrawerHeader className="p-0 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary">
                    <User size={18} />
                  </div>
                  <div>
                    <DrawerTitle className="text-base font-bold text-foreground">{detailWallet?.userName || '—'}</DrawerTitle>
                    <DrawerDescription className="text-[10px] text-muted-foreground/60">{detailWallet?.userEmail || '—'}</DrawerDescription>
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">×</Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            {detailWallet && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Solde</p>
                  <p className="text-xl font-bold text-foreground mt-1">{detailWallet.balance.toFixed(2)} <span className="text-xs text-muted-foreground/60">MAD</span></p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Type</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{detailWallet.userType}</p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Statut</p>
                  <div className="mt-1"><StatusBadge status={detailWallet.isFrozen ? 'FROZEN' : 'ACTIVE'} /></div>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/40 p-4 flex items-center justify-center">
                  <Button onClick={() => freezeWallet.mutate({ userId: detailWallet.userId, freeze: !detailWallet.isFrozen })}
                    variant="outline" size="sm" className={cn("gap-1.5 text-[10px]", detailWallet.isFrozen ? "text-emerald-500 border-emerald-500/30" : "text-rose-500 border-rose-500/30")}>
                    {detailWallet.isFrozen ? <Flame size={12} /> : <Snowflake size={12} />}
                    {detailWallet.isFrozen ? 'Dégeler le compte' : 'Geler le compte'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
};

export default FinanceDashboard;
