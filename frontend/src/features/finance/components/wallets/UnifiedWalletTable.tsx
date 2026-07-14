import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, WalletOverviewDTO } from '../../api/financialService';
import {
  Search,
  Lock,
  Unlock,
  Edit3,
  History,
  MoreVertical,
  Download,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Snowflake,
  ShieldCheck,
  Building2,
  Truck,
  User,
  Wallet,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// shadcn UI components
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

// Shared wallet components
import StatusBadge from '@/components/wallet/StatusBadge';

// ─────────────────────────── Helpers ───────────────────────────

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'AGENCY': return Building2;
    case 'DRIVER': return Truck;
    case 'CUSTOMER': return User;
    default: return Wallet;
  }
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    AGENCY: 'Agence',
    DRIVER: 'Chauffeur',
    CUSTOMER: 'Client',
    PLATFORM: 'Plateforme',
  };
  return labels[role] || role;
};

const getRoleBadgeVariant = (role: string): string => {
  const styles: Record<string, string> = {
    AGENCY: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    DRIVER: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    CUSTOMER: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    PLATFORM: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  };
  return styles[role] || styles['PLATFORM'];
};

// ─────────────────────────── Hook: useDebounce ───────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ═══════════════════════════ Main Component ═══════════════════════════

export const UnifiedWalletTable = () => {
  const queryClient = useQueryClient();

  // ──── State ────
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [walletTypeFilter, setWalletTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeAction, setFreezeAction] = useState<'freeze' | 'unfreeze'>('freeze');

  // Adjust balance form
  const [selectedWallet, setSelectedWallet] = useState<WalletOverviewDTO | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('');

  // Freeze form
  const [freezeReason, setFreezeReason] = useState('');

  // ──── Active filter count ────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (walletTypeFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [walletTypeFilter, statusFilter, searchTerm]);

  // ──── Query ────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['financialWallets', page, size, walletTypeFilter, statusFilter, debouncedSearch],
    queryFn: () =>
      financialService.getWallets(
        page,
        size,
        walletTypeFilter === 'ALL' ? undefined : walletTypeFilter,
        statusFilter === 'ALL' ? undefined : statusFilter,
        debouncedSearch || undefined
      ),
  });

  // ──── Mutations ────
  const freezeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      financialService.freezeWallet(id, reason),
    onSuccess: () => {
      toast.success('Portefeuille gelé avec succès');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
      closeFreezeModal();
    },
    onError: () => toast.error('Échec du gel du portefeuille'),
  });

  const unfreezeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      financialService.unfreezeWallet(id, reason),
    onSuccess: () => {
      toast.success('Portefeuille dégelé avec succès');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
      closeFreezeModal();
    },
    onError: () => toast.error('Échec du dégel du portefeuille'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, amount, direction, reason }: { id: string; amount: number; direction: 'CREDIT' | 'DEBIT'; reason: string }) =>
      financialService.adjustWalletBalance(id, amount, direction, reason),
    onSuccess: () => {
      toast.success('Solde ajusté avec succès');
      queryClient.invalidateQueries({ queryKey: ['financialWallets'] });
      closeAdjustModal();
    },
    onError: () => toast.error("Échec de l'ajustement du solde"),
  });

  // ──── Computed values ────
  const parsedAdjustAmount = useMemo(() => {
    const n = parseFloat(adjustAmount);
    return isNaN(n) ? 0 : n;
  }, [adjustAmount]);

  const previewBalance = useMemo(() => {
    if (!selectedWallet) return 0;
    return adjustDirection === 'CREDIT'
      ? selectedWallet.balance + parsedAdjustAmount
      : selectedWallet.balance - parsedAdjustAmount;
  }, [selectedWallet, parsedAdjustAmount, adjustDirection]);

  const adjustFormValid = useMemo(() => {
    return parsedAdjustAmount > 0 && adjustReason.trim().length >= 3;
  }, [parsedAdjustAmount, adjustReason]);

  const freezeFormValid = useMemo(() => {
    return freezeReason.trim().length >= 3;
  }, [freezeReason]);

  // Total items & pages
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  // ──── Actions ────
  const openAdjustModal = useCallback((wallet: WalletOverviewDTO) => {
    setSelectedWallet(wallet);
    setAdjustAmount('');
    setAdjustDirection('CREDIT');
    setAdjustReason('');
    setAdjustModalOpen(true);
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustModalOpen(false);
    setSelectedWallet(null);
    setAdjustAmount('');
    setAdjustReason('');
  }, []);

  const openFreezeModal = useCallback((wallet: WalletOverviewDTO, action: 'freeze' | 'unfreeze') => {
    setSelectedWallet(wallet);
    setFreezeAction(action);
    setFreezeReason('');
    setFreezeModalOpen(true);
  }, []);

  const closeFreezeModal = useCallback(() => {
    setFreezeModalOpen(false);
    setSelectedWallet(null);
    setFreezeReason('');
  }, []);

  const submitAdjust = useCallback(() => {
    if (!selectedWallet || !adjustFormValid) return;
    adjustMutation.mutate({
      id: selectedWallet.walletId,
      amount: parsedAdjustAmount,
      direction: adjustDirection,
      reason: adjustReason.trim(),
    });
  }, [selectedWallet, adjustFormValid, parsedAdjustAmount, adjustDirection, adjustReason]);

  const submitFreeze = useCallback(() => {
    if (!selectedWallet || !freezeFormValid) return;
    const reason = freezeReason.trim();
    if (freezeAction === 'freeze') {
      freezeMutation.mutate({ id: selectedWallet.walletId, reason });
    } else {
      unfreezeMutation.mutate({ id: selectedWallet.walletId, reason });
    }
  }, [selectedWallet, freezeFormValid, freezeReason, freezeAction]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setWalletTypeFilter('ALL');
    setStatusFilter('ALL');
    setPage(0);
  }, []);

  // ──── Skeleton rows ────
  const SkeletonRows = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-muted animate-pulse" /><div className="space-y-2"><div className="h-4 w-28 bg-muted animate-pulse rounded" /><div className="h-3 w-20 bg-muted animate-pulse rounded" /></div></div></TableCell>
          <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
          <TableCell className="text-right"><div className="h-5 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
          <TableCell className="text-right"><div className="h-5 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
          <TableCell className="text-center"><div className="h-5 w-12 bg-muted animate-pulse rounded-full mx-auto" /></TableCell>
          <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // ═══════════════════════════ RENDER ═══════════════════════════

  return (
    <TooltipProvider>
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        {/* ──── Header: search + filters ──── */}
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Chercher par nom, email, tél..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="pl-10 h-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={walletTypeFilter}
              onValueChange={(v) => { setWalletTypeFilter(v); setPage(0); }}
            >
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="DRIVER">Chauffeurs</SelectItem>
                <SelectItem value="CUSTOMER">Clients</SelectItem>
                <SelectItem value="AGENCY">Agences</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous statuts</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="FROZEN">Gelé</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{activeFilterCount}</Badge>
              </Button>
            )}
          </div>
        </div>

        {/* ──── Agency filter warning ──── */}
        {walletTypeFilter === 'AGENCY' && !isLoading && (data?.content?.length === 0) && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-300">Données agence limitées</p>
              <p className="text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                Les portefeuilles d'agence (table agency_wallets) sont en cours d'intégration dans cette vue. Consultez la page dédiée de chaque agence pour le moment.
              </p>
            </div>
          </div>
        )}

        {/* ──── Table ──── */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px]">Propriétaire</TableHead>
                <TableHead className="w-[120px]">Rôle</TableHead>
                <TableHead className="text-right w-[180px]">Solde disponible</TableHead>
                <TableHead className="text-right w-[140px]">Solde gelé</TableHead>
                <TableHead className="text-center w-[100px]">Statut</TableHead>
                <TableHead className="text-right w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading skeleton */}
              {isLoading && <SkeletonRows />}

              {/* Error state */}
              {isError && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-3 text-destructive">
                      <AlertCircle className="w-8 h-8" />
                      <p className="font-medium">Erreur de chargement</p>
                      <p className="text-sm text-muted-foreground">Impossible de récupérer les portefeuilles.</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-1">
                        <RotateCcw className="w-4 h-4 mr-2" /> Réessayer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty state */}
              {!isLoading && !isError && data?.content?.length === 0 && walletTypeFilter !== 'AGENCY' && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Wallet className="w-8 h-8 opacity-40" />
                      <p className="font-medium">Aucun portefeuille trouvé</p>
                      {activeFilterCount > 0 && (
                        <Button variant="link" size="sm" onClick={resetFilters} className="mt-1 gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser les filtres
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!isLoading && !isError && data?.content?.map((wallet: WalletOverviewDTO) => {
                const RoleIcon = getRoleIcon(wallet.userType);
                return (
                  <TableRow key={wallet.walletId} className="group">
                    {/* Owner identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                          {wallet.ownerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{wallet.ownerName}</div>
                          {wallet.ownerEmail && (
                            <div className="text-xs text-muted-foreground truncate">{wallet.ownerEmail}</div>
                          )}
                          {wallet.agencyName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" /> {wallet.agencyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Role badge */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeVariant(wallet.userType)}`}>
                        <RoleIcon className="w-3 h-3" />
                        {getRoleLabel(wallet.userType)}
                      </span>
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(wallet.balance)}
                      </div>
                      {(wallet.cashInHand != null && wallet.cashInHand > 0) || (wallet.debtToSystem != null && wallet.debtToSystem > 0) ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {wallet.cashInHand != null && wallet.cashInHand > 0 && (
                            <span>Cash: {formatCurrency(wallet.cashInHand)}</span>
                          )}
                          {wallet.debtToSystem != null && wallet.debtToSystem > 0 && (
                            <span className="text-destructive ml-2">Dette: {formatCurrency(wallet.debtToSystem)}</span>
                          )}
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Frozen balance */}
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">
                        {formatCurrency(wallet.frozenBalance)}
                      </span>
                    </TableCell>

                    {/* Status - uses shared StatusBadge */}
                    <TableCell className="text-center">
                      <StatusBadge status={wallet.status} />
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 data-[state=open]:bg-muted"
                          >
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => toast.info('Consultez l\'onglet Transactions pour l\'historique complet', { icon: '📋' })}
                          >
                            <History className="w-4 h-4 mr-2" />
                            Voir transactions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openAdjustModal(wallet)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Ajuster le solde
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {wallet.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              onClick={() => openFreezeModal(wallet, 'freeze')}
                              className="text-destructive focus:text-destructive"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              Geler le portefeuille
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => openFreezeModal(wallet, 'unfreeze')}
                              className="text-emerald-600 focus:text-emerald-600"
                            >
                              <Unlock className="w-4 h-4 mr-2" />
                              Dégeler le portefeuille
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* ──── Pagination ──── */}
        <div className="px-4 sm:px-6 py-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalElements === 0
              ? 'Aucun résultat'
              : <>Affichage <span className="font-medium text-foreground">{startItem}–{endItem}</span> sur <span className="font-medium text-foreground">{totalElements}</span></>
            }
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={data?.last || page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ═══════════ ADJUST BALANCE MODAL ═══════════ */}
      <Dialog open={adjustModalOpen} onOpenChange={(open) => { if (!open) closeAdjustModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Ajustement de solde
            </DialogTitle>
            <DialogDescription>
              {selectedWallet
                ? `Portefeuille de ${selectedWallet.ownerName} (${getRoleLabel(selectedWallet.userType)})`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current balance display */}
            {selectedWallet && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Solde actuel</div>
                <div className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(selectedWallet.balance)}
                </div>
              </div>
            )}

            {/* Direction */}
            <div className="space-y-2">
              <Label htmlFor="adjust-direction">Direction</Label>
              <Select value={adjustDirection} onValueChange={(v) => setAdjustDirection(v as 'CREDIT' | 'DEBIT')}>
                <SelectTrigger id="adjust-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Crédit (+)
                    </span>
                  </SelectItem>
                  <SelectItem value="DEBIT">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Débit (−)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="adjust-amount">Montant (MAD) <span className="text-destructive">*</span></Label>
              <Input
                id="adjust-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 500.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">Raison <span className="text-destructive">*</span></Label>
              <Input
                id="adjust-reason"
                type="text"
                placeholder="Ex: Correction erreur facturation #1234"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
              {adjustReason.length > 0 && adjustReason.trim().length < 3 && (
                <p className="text-xs text-destructive">La raison doit contenir au moins 3 caractères.</p>
              )}
            </div>

            {/* Preview */}
            {parsedAdjustAmount > 0 && selectedWallet && (
              <div className={`p-3 rounded-lg border ${adjustDirection === 'CREDIT' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Aperçu du solde après ajustement
                </div>
                <div className={`text-xl font-bold mt-1 ${previewBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(previewBalance)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(selectedWallet.balance)}
                  {' '}{adjustDirection === 'CREDIT' ? '+' : '−'}{' '}
                  {formatCurrency(parsedAdjustAmount)}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAdjustModal}>Annuler</Button>
            <Button
              onClick={submitAdjust}
              disabled={!adjustFormValid || adjustMutation.isPending}
              className={adjustDirection === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustMutation.isPending
                ? 'Ajustement...'
                : adjustDirection === 'CREDIT' ? 'Créditer' : 'Débiter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ FREEZE / UNFREEZE MODAL ═══════════ */}
      <Dialog open={freezeModalOpen} onOpenChange={(open) => { if (!open) closeFreezeModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {freezeAction === 'freeze' ? (
                <><Snowflake className="w-5 h-5 text-blue-500" /> Geler le portefeuille</>
              ) : (
                <><ShieldCheck className="w-5 h-5 text-emerald-500" /> Dégeler le portefeuille</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedWallet
                ? `${selectedWallet.ownerName} — Solde: ${formatCurrency(selectedWallet.balance)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {freezeAction === 'freeze' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Le gel empêchera toute transaction sur ce portefeuille. L'utilisateur sera notifié.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="freeze-reason">Raison <span className="text-destructive">*</span></Label>
              <Input
                id="freeze-reason"
                type="text"
                placeholder={freezeAction === 'freeze'
                  ? 'Ex: Fraude suspectée — ticket #5678'
                  : 'Ex: Vérification terminée — levée de restriction'}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                autoFocus
              />
              {freezeReason.length > 0 && freezeReason.trim().length < 3 && (
                <p className="text-xs text-destructive">La raison doit contenir au moins 3 caractères.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFreezeModal}>Annuler</Button>
            <Button
              onClick={submitFreeze}
              disabled={!freezeFormValid || freezeMutation.isPending || unfreezeMutation.isPending}
              variant={freezeAction === 'freeze' ? 'destructive' : 'default'}
              className={freezeAction === 'unfreeze' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {(freezeMutation.isPending || unfreezeMutation.isPending)
                ? 'Traitement...'
                : freezeAction === 'freeze' ? 'Confirmer le gel' : 'Confirmer le dégel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
