import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Truck,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Download,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Ban,
  MoreVertical,
  ArrowRight,
  Globe,
  FileText,
  ExternalLink,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import UserAvatar from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminBreadcrumb from '@/components/shared/AdminBreadcrumb';
import type { User, PagedResponse } from '@/types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
type TabId = 'ALL' | 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'PENDING';

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'ALL', label: 'All', icon: Users },
  { id: 'CUSTOMER', label: 'Customers', icon: Users },
  { id: 'DRIVER', label: 'Drivers', icon: Truck },
  { id: 'ADMIN', label: 'Admins', icon: Shield },
  { id: 'PENDING', label: 'Pending', icon: ShieldCheck },
];

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BLACKLISTED', label: 'Blacklisted' },
];

const UsersManagement = () => {
  const [usersData, setUsersData] = useState<PagedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { page, limit, totalPages, totalItems, nextPage, prevPage, setPage, updatePaginationData } = usePagination(0, 10);
  const debouncedSearch = useDebounce(searchTerm, 350);

  const handleInvite = useCallback(() => {
    toast.success('Invitation link copied to clipboard');
  }, []);

  const handleExport = useCallback(() => {
    toast.success('Exporting...');
  }, []);

  const handleViewProfile = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const role = activeTab === 'ALL' || activeTab === 'PENDING' ? undefined : activeTab;
      const status = activeTab === 'PENDING' ? 'PENDING' : statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await adminService.getAllUsers(page, limit, role, status, debouncedSearch);
      setUsersData(data);
      updatePaginationData(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, activeTab, statusFilter, debouncedSearch]);

  const stats = useMemo(() => {
    const items = usersData?.content || [];
    return {
      total: totalItems || items.length,
      active: items.filter((user) => user.status === 'ACTIVE').length,
      pending: items.filter((user) => user.status === 'PENDING').length,
      drivers: items.filter((user) => user.role === 'DRIVER').length,
    };
  }, [usersData, totalItems]);

  const handleApprove = async (user: User) => {
    try {
      setActionLoading(true);
      await adminService.activateUser(user.id);
      toast.success(`Account for ${user.firstName} approved.`);
      await fetchUsers();
    } catch {
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (user: User) => {
    try {
      setActionLoading(true);
      await adminService.rejectUser(user.id);
      toast.success(`Account for ${user.firstName} rejected.`);
      await fetchUsers();
    } catch {
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (user: User, suspend: boolean) => {
    try {
      setActionLoading(true);
      await adminService.suspendUser(user.id, suspend);
      toast.success(suspend ? 'User suspended' : 'Suspension lifted');
      await fetchUsers();
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setActionLoading(true);
      await adminService.deleteUser(userId, false);
      toast.success('User removed');
      await fetchUsers();
    } catch {
      toast.error('Failed to remove user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative z-10 pb-8">
      <AdminBreadcrumb items={[{ label: 'Administration' }, { label: 'Users' }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Users</p>
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Management des <span className="text-primary">Users</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage accounts, roles and platform access.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:flex items-center gap-3 md:gap-4 w-full lg:w-auto">
          <Button onClick={handleInvite} className="rounded-full border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 md:px-6 h-11 md:h-12 shadow-sm transition-all active:scale-95">
            <UserPlus className="w-4 h-4 mr-2" /> Inviter
          </Button>
          <Button onClick={handleExport} variant="outline" className="rounded-full border-border/60 bg-background/80 hover:bg-accent/10 font-semibold px-5 md:px-6 h-11 md:h-12 transition-all">
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <UserStatCard title="Total" value={stats.total} icon={Users} tone="indigo" delay={0.1} />
        <UserStatCard title="Actives" value={stats.active} icon={CheckCircle2} tone="emerald" delay={0.2} />
        <UserStatCard title="Pending" value={stats.pending} icon={ShieldAlert} tone="amber" delay={0.3} />
        <UserStatCard title="Drivers" value={stats.drivers} icon={Truck} tone="violet" delay={0.4} />
      </div>

      <Card className="border-border/60 bg-card/70 backdrop-blur-2xl rounded-[1.75rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="h-11 md:h-12 pl-11 pr-4 rounded-full border-border/60 bg-background/80 focus:ring-0 focus:border-primary/40"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-full overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(0);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                    activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(0);
                }}
                className="w-full h-11 md:h-12 px-4 rounded-full border border-border/60 bg-background/80 text-[10px] font-bold uppercase tracking-widest outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" onClick={fetchUsers} className="h-11 w-11 md:h-12 md:w-12 rounded-full border-border/60 bg-background/80 hover:bg-accent/10 shrink-0">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin text-primary')} />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.2)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background/60">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Utilisateur</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inscrit le</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="px-6 py-6">
                      <Skeleton className="h-14 w-full rounded-2xl bg-accent/20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : usersData?.content?.length ? (
                usersData.content.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-accent/10 transition-colors"
                  >
                    <TableCell className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <UserAvatar user={user} className="h-12 w-12 rounded-2xl border border-border/60" />
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5 text-primary/50" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <Badge className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <StatusBadge user={user} />
                    </TableCell>
                    <TableCell className="px-6 py-6 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-6 text-right">
      <UserActionMenu
        user={user}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
        onViewProfile={() => handleViewProfile(user)}
        disabled={actionLoading}
      />
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Users className="w-12 h-12" />
                      <p className="text-xs font-bold uppercase tracking-widest">No user found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Showing <span className="text-foreground">{page * limit + 1}</span> to <span className="text-foreground">{Math.min((page + 1) * limit, totalItems)}</span> of <span className="text-foreground">{totalItems}</span>
        </p>
        {usersData && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevPage} disabled={page === 0} className="h-11 w-11 rounded-full border-border/60 bg-background/80">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index)}
                  className={cn(
                    'h-10 w-10 rounded-full text-xs font-bold transition-all',
                    page === index ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background/80 text-muted-foreground hover:text-foreground border border-border/60'
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={nextPage} disabled={page === totalPages - 1} className="h-11 w-11 rounded-full border-border/60 bg-background/80">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!userToSuspend} onOpenChange={(open) => !open && setUserToSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit le statut</AlertDialogTitle>
            <AlertDialogDescription>
              {userToSuspend?.status === 'SUSPENDED' ? 'Reactivate ce compte ?' : 'Suspend ce compte ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToSuspend) {
                  void handleSuspend(userToSuspend, userToSuspend.status !== 'SUSPENDED');
                  setUserToSuspend(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retire l'utilisateur de la liste active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  void handleDelete(userToDelete.id);
                  setUserToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="w-full sm:max-w-[700px] bg-card border border-border text-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {selectedUser && (
            <>
              <DialogHeader className="p-6 pb-4 border-b border-border/60">
                <DialogTitle className="text-xl font-black">User Details</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Complete account information
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-col items-center mb-8">
                  <UserAvatar user={selectedUser} className="h-24 w-24 rounded-2xl border-4 border-background shadow-xl mb-4" />
                  <h3 className="text-2xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {selectedUser.email}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations Generales */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> General
                    </h4>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Role</span>
                        <Badge className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Status</span>
                        <StatusBadge user={selectedUser} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Inscrit le</span>
                        <span className="text-sm font-semibold">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Phone</span>
                        <span className="text-sm font-semibold">{selectedUser.phoneNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Date de Naissance</span>
                        <span className="text-sm font-semibold">{selectedUser.dateOfBirth || 'Not providede'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">Sexe</span>
                        <span className="text-sm font-semibold capitalize">{selectedUser.gender || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-muted-foreground">City</span>
                        <span className="text-sm font-semibold">{selectedUser.city || selectedUser.agencyCity || 'Not providede'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations Professionnelles */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" /> Professionnel
                    </h4>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      {(selectedUser.companyName || selectedUser.agencyName) ? (
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-muted-foreground">Entreprise</span>
                          <span className="text-sm font-semibold">{selectedUser.companyName || selectedUser.agencyName}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic text-center py-2">No company provided</div>
                      )}
                      
                      {selectedUser.taxId && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-muted-foreground">ID Fiscal</span>
                          <span className="text-sm font-semibold">{selectedUser.taxId}</span>
                        </div>
                      )}
                      {selectedUser.agencyAddress && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-muted-foreground">Adresse</span>
                          <span className="text-sm font-semibold text-right max-w-[150px] truncate" title={selectedUser.agencyAddress}>{selectedUser.agencyAddress}</span>
                        </div>
                      )}
                      {selectedUser.role === 'DRIVER' && (
                        <>
                          {selectedUser.vehicleType && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-muted-foreground">Vehicle</span>
                              <span className="text-sm font-semibold">{selectedUser.vehicleType}</span>
                            </div>
                          )}
                          {selectedUser.vehiclePlate && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-muted-foreground">Immatriculation</span>
                              <span className="text-sm font-semibold">{selectedUser.vehiclePlate}</span>
                            </div>
                          )}
                          {selectedUser.licenseNumber && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-muted-foreground">Permit</span>
                              <span className="text-sm font-semibold">{selectedUser.licenseNumber}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {selectedUser.documents && (typeof selectedUser.documents === 'string' ? selectedUser.documents.length > 0 : selectedUser.documents.length > 0) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(typeof selectedUser.documents === 'string' ? selectedUser.documents.split(',').map(d => ({ name: d.trim(), url: '' })) : selectedUser.documents).map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/60">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-semibold truncate">{doc.name || `Document ${idx + 1}`}</span>
                          </div>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noreferrer" className="shrink-0 p-2 hover:bg-background rounded-lg transition-colors">
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions Wrap for Pending */}
                {selectedUser.status === 'PENDING' && (
                  <div className="mt-8 flex gap-4 pt-6 border-t border-border/60">
                    <Button onClick={() => { handleApprove(selectedUser); setIsDrawerOpen(false); }} variant="outline" className="flex-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-xl h-12">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button onClick={() => { handleReject(selectedUser); setIsDrawerOpen(false); }} variant="outline" className="flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl h-12">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UserStatCard = ({
  title,
  value,
  icon: Icon,
  tone,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'indigo' | 'emerald' | 'amber' | 'violet';
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card/70 backdrop-blur-2xl border border-border/60 p-4 md:p-6 rounded-2xl shadow-sm relative overflow-hidden"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${tone === 'indigo' ? 'bg-indigo-500' : tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-violet-500'}`} />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 rounded-2xl border ${tone === 'indigo' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/15' : tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15' : tone === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' : 'bg-violet-500/10 text-violet-500 border-violet-500/15'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</p>
      <h3 className="text-xl md:text-3xl font-black tracking-tight text-foreground">
        <AnimatedCounter value={value} />
      </h3>
    </div>
  </motion.div>
);

const StatusBadge = ({ user }: { user: User }) => {
  const status = user.status || (user.isActive ? 'ACTIVE' : 'PENDING');
  const statusClass =
    status === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-600'
      : status === 'SUSPENDED'
        ? 'bg-rose-500/10 text-rose-600'
        : status === 'BLACKLISTED'
          ? 'bg-slate-500/10 text-slate-600'
          : 'bg-amber-500/10 text-amber-600';

  return (
    <Badge className={cn('rounded-full border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest', statusClass)}>
      {status}
    </Badge>
  );
};

const UserActionMenu = ({
  user,
  onApprove,
  onReject,
  onSuspend,
  onDelete,
  onViewProfile,
  disabled,
}: {
  user: User;
  onApprove: (u: User) => void;
  onReject: (u: User) => void;
  onSuspend: (u: User, suspend: boolean) => void;
  onDelete: (id: string) => void;
  onViewProfile: (u: User) => void;
  disabled?: boolean;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full hover:bg-accent/20">
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] border-border/60 bg-background/95 backdrop-blur-2xl p-2 shadow-2xl">
      <DropdownMenuLabel className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Actions administratives
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer" onClick={() => onApprove(user)} disabled={disabled}>
        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approve
      </DropdownMenuItem>
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer" onClick={() => onReject(user)} disabled={disabled}>
        <XCircle className="w-4 h-4 text-amber-500" /> Reject
      </DropdownMenuItem>
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer" onClick={() => onSuspend(user, true)} disabled={disabled}>
        <ShieldAlert className="w-4 h-4 text-rose-500" /> Suspend
      </DropdownMenuItem>
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer" onClick={() => onSuspend(user, false)} disabled={disabled}>
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Reactivate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer text-rose-500" onClick={() => onDelete(user.id)} disabled={disabled}>
        <Ban className="w-4 h-4" /> Delete
      </DropdownMenuItem>
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer" onClick={() => onViewProfile(user)}>
        <ExternalLink className="w-4 h-4 text-primary" /> Voir profil
      </DropdownMenuItem>
      <DropdownMenuItem className="rounded-xl gap-3 p-3 text-sm cursor-pointer">
        <FileText className="w-4 h-4 text-primary" /> Access Log
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default UsersManagement;
