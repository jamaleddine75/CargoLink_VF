import React, { useState, useEffect, useMemo } from 'react';
import {
  Check, X, Eye, FileText, Search, Mail, Phone, Calendar, AlertTriangle, Truck, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { SecureImage } from '@/components/common/SecureImage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import UserAvatar from '@/components/common/UserAvatar';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export interface PendingApprovalService {
  fetchPending: () => Promise<User[]>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason?: string) => Promise<void>;
}

interface Props {
  service: PendingApprovalService;
  title: string;
  description: string;
  emptyMessage?: string;
}

export default function PendingApprovals({ service, title, description, emptyMessage = 'Aucune demande en attente' }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await service.fetchPending();
      setUsers(data);
    } catch {
      toast.error('Erreur lors du chargement des demandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return users.filter(u => {
      const nameMatch = !term
        || `${u.firstName} ${u.lastName}`.toLowerCase().includes(term)
        || u.email?.toLowerCase().includes(term)
        || u.phoneNumber?.includes(term);
      const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;
      return nameMatch && roleMatch;
    });
  }, [users, debouncedSearch, roleFilter]);

  const paginatedUsers = useMemo(() =>
    filteredUsers.slice(page * pageSize, (page + 1) * pageSize),
  [filteredUsers, page]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const handleAction = (type: 'APPROVE' | 'REJECT') => {
    setConfirmAction(type);
    setRejectionReason('');
    setIsConfirmOpen(true);
  };

  const confirmProcess = async () => {
    if (!selectedUser) return;
    try {
      if (confirmAction === 'APPROVE') {
        await service.approve(selectedUser.id);
        toast.success(`Compte de ${selectedUser.firstName} approuvé.`);
      } else {
        await service.reject(selectedUser.id, rejectionReason || undefined);
        toast.warning(`Demande de ${selectedUser.firstName} rejetée.`);
      }
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    } catch {
      toast.error('Impossible de traiter la demande.');
    } finally {
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            placeholder="Rechercher par nom, email..."
            className="pl-9 rounded-md border-border bg-card"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full md:w-36 h-10 border-border bg-card text-xs">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            <SelectItem value="DRIVER">Livreur</SelectItem>
            <SelectItem value="CUSTOMER">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-accent/10">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="font-bold py-4">Utilisateur</TableHead>
              <TableHead className="font-bold">Rôle</TableHead>
              <TableHead className="font-bold">Date d'inscription</TableHead>
              <TableHead className="font-bold">Documents</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-4 px-6">
                    <Skeleton className="h-12 w-full bg-muted/40 rounded-lg animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
              <TableRow key={user.id} className="border-border/40 hover:bg-accent/5 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} className="h-10 w-10 border border-border" />
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-muted-foreground font-medium">{user.email} {user.phoneNumber && `• ${user.phoneNumber}`}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-md px-3 py-1 font-black text-[9px] tracking-widest uppercase border-none ${user.role === 'DRIVER' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-MA') : 'N/A'}
                </TableCell>
                <TableCell>
                  {user.documents && user.documents.length > 0 ? (
                    <div className="flex -space-x-2">
                      {user.documents.map((doc, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center text-muted-foreground" title={doc.name}>
                          <FileText className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic font-semibold">AUCUN DOCUMENT</span>
                  )}
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                      onClick={() => { setSelectedUser(user); handleAction('APPROVE'); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                      onClick={() => { setSelectedUser(user); handleAction('REJECT'); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <Users className="w-8 h-8 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-muted-foreground">{filteredUsers.length} résultat{(filteredUsers.length > 1 ? 's' : '')}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border bg-card"
            disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(0, Math.min(page - 2, totalPages - 5));
            const pn = start + i;
            if (pn >= totalPages) return null;
            return (
              <Button key={pn} variant={pn === page ? 'default' : 'outline'} size="sm"
                className={cn('h-8 min-w-[32px] px-2 text-xs', pn === page ? '' : 'border-border bg-card')}
                onClick={() => setPage(pn)}>{pn + 1}</Button>
            );
          })}
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-border bg-card"
            disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl bg-card border border-border rounded-lg p-0 overflow-hidden shadow-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>Profil et documents de {selectedUser?.firstName} {selectedUser?.lastName}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-1/3 bg-muted/30 p-8 flex flex-col items-center text-center gap-4 border-r border-border/40">
                <UserAvatar user={selectedUser} className="h-24 w-24 border-4 border-background shadow-sm" fallbackClassName="text-2xl" />
                <div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <Badge variant="outline" className="mt-2 rounded-md uppercase text-[9px] font-black tracking-widest border-primary/20 bg-primary/10 text-primary px-3 py-1">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium px-4 py-3 bg-background border border-border/40 rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" /> {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground font-medium px-4 py-3 bg-background border border-border/40 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground" /> {selectedUser.phoneNumber || 'Pas de téléphone'}
                  </div>
                  {selectedUser.role === 'DRIVER' && (
                    <div className="flex items-center gap-3 text-sm text-foreground font-medium px-4 py-3 bg-background border border-border/40 rounded-lg">
                      <Truck className="w-4 h-4 text-muted-foreground" /> {selectedUser.vehicleInfo || 'Aucun véhicule'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 p-8 bg-card">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Documents fournis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.documents?.length ? selectedUser.documents.map((doc, i) => (
                    <div key={i} className="group relative rounded-lg border border-border p-4 hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-muted/10">
                      {doc.type === 'IMAGE' ? (
                        <div className="h-32 mb-3 rounded-md bg-accent/20 overflow-hidden relative">
                          <SecureImage fileEndpoint={doc.url} alt={doc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 mb-3 rounded-md bg-rose-500/10 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-rose-500" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">{doc.type}</p>
                    </div>
                  )) : (
                    <div className="col-span-2 py-12 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/10">
                      <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">AUCUN DOCUMENT</span>
                    </div>
                  )}
                </div>
                <div className="mt-8 flex gap-3 pt-6 border-t border-border/40">
                  <Button variant="outline" className="flex-1 rounded-lg h-11 text-xs font-bold bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => handleAction('REJECT')}>
                    Refuser
                  </Button>
                  <Button className="flex-1 rounded-lg h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('APPROVE')}>
                    Approuver
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="bg-card border border-border rounded-lg max-w-md p-6">
          <DialogHeader className="items-center text-center">
            {confirmAction === 'APPROVE' ? (
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
            <DialogTitle className="text-lg font-black text-foreground">
              {confirmAction === 'APPROVE' ? 'Approuver cet utilisateur ?' : 'Refuser cette demande ?'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              {confirmAction === 'APPROVE'
                ? `${selectedUser?.firstName} pourra se connecter et utiliser toutes les fonctionnalités.`
                : `Êtes-vous sûr de vouloir refuser la demande de ${selectedUser?.firstName} ? Cette action est irréversible.`}
            </DialogDescription>
          </DialogHeader>
          {confirmAction === 'REJECT' && (
            <div className="mt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2 px-1">
                Motif du refus (envoyé par email)
              </label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documents incomplets, licence non vérifiable..." rows={3}
                className="w-full rounded-md border border-border bg-card text-sm p-3 text-foreground resize-none outline-none focus:border-rose-500/50" />
            </div>
          )}
          <DialogFooter className="gap-2 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={confirmProcess}
              className={confirmAction === 'APPROVE' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
