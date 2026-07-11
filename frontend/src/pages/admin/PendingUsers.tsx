import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Eye,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { SecureImage } from '@/components/common/SecureImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import UserAvatar from '@/components/common/UserAvatar';
import adminService from '@/services/api/adminService';
import { User } from '@/types';


export default function PendingUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<unknown>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      toast.error('Error loading requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (type: 'APPROVE' | 'REJECT') => {
    setConfirmAction(type);
    setRejectionReason('');
    setIsConfirmOpen(true);
  };

  const confirmProcess = async () => {
    if (!selectedUser) return;

    try {
      if (confirmAction === 'APPROVE') {
        await adminService.activateUser(selectedUser.id);
        toast.success(`✅ ${selectedUser.firstName}'s account has been approved. Email sent.`);
      } else {
        await adminService.rejectUser(selectedUser.id, rejectionReason || undefined);
        toast.warning(`❌ ${selectedUser.firstName}'s request has been rejected.`);
      }
      setUsers(users.filter(u => u.id !== selectedUser.id));
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Unable to process request.');
    } finally {
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pending Approval</h1>
          <p className="text-muted-foreground/70 mt-1">Review and validate new registrations on the platform.</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-4 py-1 font-bold">
          {users.length} Pending Requests
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email..." className="pl-9 rounded-xl border-slate-200 dark:border-slate-800" />
        </div>
        <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 gap-2">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
              <TableHead className="font-bold py-4">User</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Registration Date</TableHead>
              <TableHead className="font-bold">Documents</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground/70 font-medium italic">
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : users.length > 0 ? users.map((user) => (
              <TableRow key={user.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={user} 
                      className="h-10 w-10 border border-slate-200 dark:border-slate-800" 
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-muted-foreground/70 font-medium">{user.email} {user.phoneNumber && `• ${user.phoneNumber}`}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full px-3 font-bold text-[10px] tracking-wider uppercase border-none ${user.role === 'DRIVER' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                    {user.role === 'DRIVER' ? 'DRIVER' : user.role === 'CUSTOMER' ? 'CUSTOMER' : user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground/70 font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : 'N/A'}
                </TableCell>
                <TableCell>
                  {user.documents && user.documents.length > 0 ? (
                    <div className="flex -space-x-2">
                      {user.documents.map((doc, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-muted-foreground" title={doc.name}>
                          <FileText className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No documents</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                      onClick={() => { setSelectedUser(user); handleAction('APPROVE'); }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => { setSelectedUser(user); handleAction('REJECT'); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground/70 font-medium italic">
                  No pending requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full profile and documents for {selectedUser?.firstName} {selectedUser?.lastName}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Profile Bar */}
              <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800/50 p-8 flex flex-col items-center text-center gap-4">
                <UserAvatar 
                  user={selectedUser} 
                  className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-xl" 
                  fallbackClassName="text-2xl"
                />
                <div>
                  <h2 className="text-xl font-black tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <Badge variant="outline" className="mt-2 rounded-full uppercase text-[10px] font-black border-primary text-primary px-3">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/70 font-medium px-4 py-2 bg-white dark:bg-slate-900 rounded-xl">
                    <Mail className="w-4 h-4 text-primary" /> {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/70 font-medium px-4 py-2 bg-white dark:bg-slate-900 rounded-xl">
                    <Phone className="w-4 h-4 text-primary" /> {selectedUser.phoneNumber || 'No phone'}
                  </div>
                  {selectedUser.role === 'DRIVER' && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground/70 font-medium px-4 py-2 bg-white dark:bg-slate-900 rounded-xl">
                      <Truck className="w-4 h-4 text-primary" /> {selectedUser.vehicleInfo || 'No vehicle data'}
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Area */}
              <div className="flex-1 p-8 bg-white dark:bg-slate-950">
                <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Provided documents
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedUser.documents && selectedUser.documents.length > 0 ? selectedUser.documents.map((doc: unknown, i: number) => (
                    <div key={i} className="group relative rounded-2xl border border-slate-100 dark:border-slate-800 p-4 hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
                      {doc.type === 'IMAGE' ? (
                        <div className="h-32 mb-3 rounded-lg bg-slate-50 overflow-hidden relative">
                          <SecureImage fileEndpoint={doc.url} alt={doc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-8 h-8 text-foreground" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 mb-3 rounded-lg bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-red-500" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">{doc.type}</p>
                    </div>
                  )) : (
                    <div className="col-span-2 py-12 text-center text-muted-foreground italic bg-slate-50 dark:bg-slate-900 rounded-3xl">
                      No documents have been uploaded by the user.
                    </div>
                  )}
                </div>

                <div className="mt-12 flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleAction('REJECT')}>
                    Reject Access
                  </Button>
                  <Button className="flex-1 rounded-2xl h-12 font-bold shadow-xl shadow-primary/20" onClick={() => handleAction('APPROVE')}>
                    Approve Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="items-center text-center">
            {confirmAction === 'APPROVE' ? (
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
            )}
            <DialogTitle className="text-xl font-black">
              {confirmAction === 'APPROVE' ? 'Approve this user?' : 'Reject this request?'}
            </DialogTitle>
            <DialogDescription className="font-medium">
              {confirmAction === 'APPROVE'
                ? `The user ${selectedUser?.firstName} will be able to log in and use all features of the platform.`
                : `Are you sure you want to reject ${selectedUser?.firstName}'s request? This action is irreversible.`}
            </DialogDescription>
          </DialogHeader>
          {/* Rejection reason field */}
          {confirmAction === 'REJECT' && (
            <div className="mt-2 pb-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 block mb-2">
                Rejection reason (optional — sent to user via email)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete documents, unable to verify license..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm p-3 text-foreground resize-none outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          )}
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button
              variant={confirmAction === 'APPROVE' ? 'default' : 'destructive'}
              onClick={confirmProcess}
              className="rounded-xl px-8 font-bold shadow-lg"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
