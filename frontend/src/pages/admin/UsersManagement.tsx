import { GenericDataTable, Column } from '@/components/admin/GenericDataTable';
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, Mail, Phone, 
  Calendar, Shield, Truck, User as UserIcon, 
  CheckCircle2, XCircle, FileText, RotateCcw, 
  ShieldAlert, ShieldCheck, Ban, Users, SearchX, 
  PlusCircle, UserCheck, Trash2, Download, 
  ExternalLink, MoreVertical, ChevronRight,
  MoreHorizontal as MoreCircle,
  LayoutGrid, List, SlidersHorizontal, 
  UserPlus, UserMinus, ShieldQuestion, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import adminService from '@/services/api/adminService';
import { User, PagedResponse } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import UserAvatar from '@/components/common/UserAvatar';

const UsersManagement = () => {
  const [usersData, setUsersData] = useState<PagedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const { 
    page, limit, totalPages, totalItems, setPage, 
    nextPage, prevPage, resetPage, updatePaginationData 
  } = usePagination(0, 10);

  const handleApprove = async (user: User) => {
    try {
      await adminService.activateUser(user.id);
      toast.success(`Compte de ${user.firstName} approuvé avec succès.`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de l\'approbation.');
    }
  };

  const handleReject = async (user: User) => {
    try {
      await adminService.rejectUser(user.id);
      toast.warning(`Compte de ${user.firstName} rejeté.`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors du rejet.');
    }
  };

  const handleSuspend = async (user: User, suspend: boolean) => {
    try {
      await adminService.suspendUser(user.id, suspend);
      toast.success(suspend ? 'Utilisateur suspendu.' : 'Suspension levée.');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la modification du statut.');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminService.deleteUser(userId, false); // Default soft delete
      toast.success("Utilisateur supprimé avec succès.");
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    try {
      for (const id of selectedUsers) {
        await adminService.deleteUser(id, false);
      }
      toast.success(`${selectedUsers.length} utilisateurs supprimés.`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la suppression en masse.");
    }
  };

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const role = activeTab === 'ALL' || activeTab === 'PENDING' ? undefined : activeTab;
      const status = activeTab === 'PENDING' ? 'PENDING' : (statusFilter === 'ALL' ? undefined : statusFilter);
      
      const data = await adminService.getAllUsers(
        page, limit, role, status, debouncedSearch
      );
      setUsersData(data);
      updatePaginationData(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, activeTab, statusFilter, debouncedSearch]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === usersData?.content.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData?.content.map(u => u.id) || []);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: 'ALL', label: 'All Users', icon: Users },
    { id: 'CUSTOMER', label: 'Customers', icon: UserIcon },
    { id: 'DRIVER', label: 'Drivers', icon: Truck },
    { id: 'ADMIN', label: 'Admins', icon: Shield },
    { id: 'PENDING', label: 'Pending', icon: ShieldQuestion },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground space-y-4 md:space-y-10 font-sans selection:bg-primary/30 relative z-10 pb-10">
      {/* Mesh Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[5%] w-[35%] h-[35%] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Security & Governance</p>
            </div>
          </div>
          <h1 className="text-2xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            User <span className="text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">Registry</span>
          </h1>
          <p className="text-foreground/40 mt-4 md:mt-6 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] flex items-center gap-2 md:gap-3">
             <Globe className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-400" /> Managing <span className="text-foreground"><AnimatedCounter value={totalItems} /></span> identities
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:flex items-center gap-3 md:gap-4 w-full lg:w-auto">
          <Button 
            className="rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-foreground font-black text-[9px] md:text-[10px] uppercase tracking-widest px-6 md:px-8 h-12 md:h-16 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 group"
          >
            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-3 group-hover:scale-110 transition-transform" /> <span className="hidden md:inline">Invite User</span>
          </Button>
          <Button 
            variant="outline"
            className="rounded-xl md:rounded-2xl border-border/40 bg-accent/30 hover:bg-accent/40 text-foreground font-black text-[9px] md:text-[10px] uppercase tracking-widest px-4 md:px-6 h-12 md:h-16 transition-all"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-3 text-foreground/40" /> <span className="hidden md:inline">Export Data</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 flex items-center gap-1 md:gap-2 p-1 bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-2xl md:rounded-[24px] overflow-x-auto no-scrollbar">
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
                "flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-[18px] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-foreground shadow-[0_10px_20px_rgba(79,70,229,0.2)]" 
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-accent/30"
              )}
            >
              <Icon className={cn("w-3 md:w-3.5 h-3 md:h-3.5", activeTab === tab.id ? "text-foreground" : "text-foreground/20")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter HUD */}
      <Card className="border-none bg-accent/10 backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-4 md:p-6 border border-border/40 shadow-2xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-3.5 md:h-4 w-3.5 md:w-4 text-foreground/20 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by name, email, or unique ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 md:h-14 pl-12 md:pl-14 pr-4 md:pr-6 rounded-2xl md:rounded-3xl border-border/40 bg-accent/30 focus:border-indigo-500/50 focus:ring-0 transition-all font-bold text-xs md:text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
             <div className="flex-1 lg:flex-none">
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="w-full h-11 md:h-14 px-4 md:px-6 rounded-2xl md:rounded-3xl border-border/40 bg-accent/30 text-[9px] md:text-[10px] font-black uppercase tracking-widest focus:border-indigo-500/50 outline-none appearance-none cursor-pointer"
               >
                 <option value="ALL">All Statuses</option>
                 <option value="ACTIVE">Active</option>
                 <option value="SUSPENDED">Suspended</option>
                 <option value="BLACKLISTED">Blacklisted</option>
               </select>
             </div>
             <Button 
                variant="outline" 
                onClick={fetchUsers}
                className="h-11 md:h-14 w-11 md:w-14 rounded-2xl md:rounded-3xl border-border/40 bg-accent/30 hover:bg-accent/40 transition-all shrink-0"
              >
                <RefreshCw className={cn("w-3.5 md:w-4 h-3.5 md:h-4 text-foreground/40", loading && "animate-spin text-indigo-500")} />
              </Button>
          </div>
        </div>
      </Card>

      {/* Selection Actions Bar */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 lg:bottom-10 lg:left-1/2 lg:-translate-x-1/2 z-[100] bg-indigo-600 rounded-[2rem] p-3 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 ml-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                {selectedUsers.length}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Selected Nodes</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <Button variant="ghost" className="flex-1 md:flex-none rounded-xl h-12 text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest">
                  Activate
               </Button>
               <Button variant="ghost" className="flex-1 md:flex-none rounded-xl h-12 text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest">
                  Suspend
               </Button>
               <Button 
                 onClick={handleBulkDelete}
                 className="flex-1 md:flex-none rounded-xl h-12 px-6 bg-white text-indigo-600 hover:bg-white/90 text-[9px] font-black uppercase tracking-widest transition-all"
               >
                 Delete
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List / Table Content */}
      <div className="relative z-10">
        {/* Mobile View: Card Stacking */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {loading ? (
             [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full bg-accent/10 rounded-[2.5rem]" />)
          ) : usersData?.content.length === 0 ? (
            <div className="py-24 text-center bg-accent/10 rounded-[2.5rem] border border-dashed border-border/40">
               <SearchX className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">No units detected in this sector</p>
            </div>
          ) : (
            usersData?.content.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "bg-accent/10 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-5 md:p-6 shadow-xl relative overflow-hidden",
                  selectedUsers.includes(user.id) && "border-indigo-500/50 bg-indigo-500/5"
                )}
              >
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <Checkbox 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleSelectUser(user.id)}
                    className="border-border/60 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 h-4 w-4"
                  />
                  <UserAvatar 
                    user={user} 
                    className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl border-2 border-border/40" 
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-foreground uppercase tracking-tight text-base md:text-lg truncate">
                       {user.firstName} {user.lastName}
                    </h3>
                    <div className="scale-90 origin-left mt-0.5">
                       <StatusBadge user={user} />
                    </div>
                  </div>
                  <UserActionMenu user={user} onApprove={handleApprove} onReject={handleReject} onSuspend={handleSuspend} onDelete={handleDelete} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                   <div>
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Access Role</p>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{user.role}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Registered</p>
                      <p className="text-[10px] font-bold text-foreground/60">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <Card className="hidden lg:block border-none bg-accent/10 backdrop-blur-3xl rounded-[40px] border border-border/40 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-accent/10">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-[80px] px-10 py-6 text-center">
                    <Checkbox 
                      checked={selectedUsers.length === usersData?.content.length && usersData?.content.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-border/60 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                  </TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black text-foreground/20 uppercase tracking-widest">Identity</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black text-foreground/20 uppercase tracking-widest">Access Node</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black text-foreground/20 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black text-foreground/20 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {usersData?.content.map((user, idx) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group hover:bg-accent/20 transition-all border-border/40",
                      selectedUsers.includes(user.id) && "bg-indigo-600/5"
                    )}
                  >
                    <TableCell className="px-10 py-8 text-center">
                      <Checkbox 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        className="border-border/60 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-8">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <UserAvatar 
                            user={user} 
                            className="h-14 w-14 rounded-2xl border-2 border-border/40 shadow-2xl group-hover:scale-110 transition-transform" 
                          />
                          {user.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#020617] rounded-full" />
                          )}
                        </div>
                        <div>
                          <span className="font-black text-foreground uppercase tracking-tight text-sm block group-hover:text-indigo-400 transition-colors">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-1 flex items-center gap-2">
                             <Mail className="w-3 h-3 text-indigo-500/50" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-8">
                      <div className="flex flex-col gap-2">
                        <Badge className="w-fit bg-accent/30 border-border/40 text-foreground/40 font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 rounded-lg">
                           {user.role}
                        </Badge>
                        <span className="text-[9px] font-bold text-foreground/10 uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-8 text-center">
                       <StatusBadge user={user} />
                    </TableCell>
                    <TableCell className="px-10 py-8 text-right">
                       <UserActionMenu user={user} onApprove={handleApprove} onReject={handleReject} onSuspend={handleSuspend} onDelete={handleDelete} />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

        {/* Pagination HUD */}
        {usersData && totalPages > 1 && (
          <div className="px-10 py-10 bg-accent/10 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 order-2 md:order-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevPage}
                disabled={page === 0}
                className="h-12 w-12 rounded-2xl border-border/40 bg-accent/30 hover:bg-accent/40 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              
              <div className="flex items-center gap-2">
                 {[...Array(totalPages)].map((_, i) => (
                   <button
                     key={i}
                     onClick={() => setPage(i)}
                     className={cn(
                       "w-10 h-10 rounded-xl font-black text-xs transition-all",
                       page === i ? "bg-indigo-600 text-foreground shadow-lg" : "text-foreground/20 hover:text-foreground"
                     )}
                   >
                     {i + 1}
                   </button>
                 ))}
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextPage}
                disabled={page === totalPages - 1}
                className="h-12 w-12 rounded-2xl border-border/40 bg-accent/30 hover:bg-accent/40 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 order-1 md:order-2">
              Viewing <span className="text-foreground">{page * limit + 1}</span> to <span className="text-foreground">{Math.min((page + 1) * limit, totalItems)}</span> of <span className="text-foreground">{totalItems}</span> Units
            </p>
          </div>
        )}
      </div>
  );
};

const UserActionMenu = ({ user, onApprove, onReject, onSuspend, onDelete }: { 
  user: User, 
  onApprove: (u: User) => void, 
  onReject: (u: User) => void, 
  onSuspend: (u: User, s: boolean) => void, 
  onDelete: (id: string) => void 
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-accent/30 group/btn transition-all">
        <MoreVertical className="w-5 h-5 text-foreground/20 group-hover/btn:text-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 bg-background border-border/40 text-foreground rounded-[24px] p-2 shadow-2xl backdrop-blur-3xl">
       <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 p-4">Administrative Console</DropdownMenuLabel>
       <DropdownMenuSeparator className="bg-accent/30" />
       <DropdownMenuItem className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-accent/30 transition-all">
          <FileText className="w-4 h-4 text-indigo-400" /> View Profile
       </DropdownMenuItem>
       <DropdownMenuItem className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-accent/30 transition-all">
          <ExternalLink className="w-4 h-4 text-indigo-400" /> Access Logs
       </DropdownMenuItem>
       <DropdownMenuSeparator className="bg-accent/30" />
       
        {user.status === 'PENDING' && (
          <>
            <DropdownMenuItem 
              onClick={() => onApprove(user)}
              className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-all"
            >
               <ShieldCheck className="w-4 h-4" /> Approve Account
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onReject(user)}
              className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer text-amber-500 hover:bg-amber-500/10 transition-all"
            >
               <XCircle className="w-4 h-4" /> Reject Request
            </DropdownMenuItem>
          </>
        )}

        {user.status === 'APPROVED' || user.status === 'ACTIVE' ? (
          <DropdownMenuItem 
            onClick={() => onSuspend(user, true)}
            className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer text-rose-500 hover:bg-rose-500/10 transition-all"
          >
             <ShieldAlert className="w-4 h-4" /> Suspend Account
          </DropdownMenuItem>
        ) : user.status === 'SUSPENDED' ? (
          <DropdownMenuItem 
            onClick={() => onSuspend(user, false)}
            className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer text-emerald-500 hover:bg-emerald-500/10 transition-all"
          >
             <ShieldCheck className="w-4 h-4" /> Unsuspend Account
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem 
          onClick={() => onDelete(user.id)}
          className="rounded-xl gap-3 p-3 text-[10px] font-black uppercase tracking-widest cursor-pointer text-rose-500 hover:bg-rose-500/10 transition-all"
        >
           <Ban className="w-4 h-4" /> Terminate Access
        </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default UsersManagement;
