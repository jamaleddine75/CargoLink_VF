import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import StatusBadge from './StatusBadge';
import ActionDropdown from './ActionDropdown';
import { format } from 'date-fns';
import { Mail, Building2, Calendar } from 'lucide-react';

interface AdminTableProps {
  admins: User[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string, suspend: boolean) => void;
  onViewDetails: (admin: User) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
  admins,
  isLoading,
  onApprove,
  onReject,
  onSuspend,
  onViewDetails,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
              <TableHead className="w-[80px] py-6 px-6">Avatar</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Name</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Email</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Agency</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Created At</TableHead>
              <TableHead className="text-right py-6 px-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-b border-border/20">
                <TableCell className="py-5 px-6"><Skeleton className="h-12 w-12 rounded-2xl" /></TableCell>
                <TableCell className="py-5"><Skeleton className="h-5 w-40 rounded-lg" /></TableCell>
                <TableCell className="py-5"><Skeleton className="h-5 w-56 rounded-lg" /></TableCell>
                <TableCell className="py-5"><Skeleton className="h-5 w-28 rounded-lg" /></TableCell>
                <TableCell className="py-5"><Skeleton className="h-7 w-24 rounded-full" /></TableCell>
                <TableCell className="py-5"><Skeleton className="h-5 w-32 rounded-lg" /></TableCell>
                <TableCell className="text-right py-5 px-6"><Skeleton className="h-10 w-10 ml-auto rounded-xl" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const adminList = Array.isArray(admins) ? admins : [];

  if (adminList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/10 backdrop-blur-sm mx-4 md:mx-0">
        <div className="h-20 w-20 md:h-24 md:w-24 bg-muted/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner animate-float">
          <Avatar className="h-10 w-10 md:h-14 md:w-14 opacity-30 grayscale" />
        </div>
        <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">No Nodes Found</h3>
        <p className="text-muted-foreground max-w-xs text-center mt-2 font-medium text-xs md:text-sm">
          The administrative matrix is currently clear for the selected parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View: Card Stacking */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {adminList.map((admin) => (
          <div 
            key={admin?.id || Math.random()} 
            className="bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0">
                 <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-lg">
                    <AvatarImage src={admin?.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-black uppercase">
                       {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                    </AvatarFallback>
                 </Avatar>
                 <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${admin?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              <div className="min-w-0 flex-1">
                 <h3 className="font-black text-foreground uppercase tracking-tight text-lg truncate">
                    {admin?.firstName} {admin?.lastName}
                 </h3>
                 <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">{admin?.email}</p>
              </div>
              <ActionDropdown
                  admin={admin}
                  onApprove={onApprove}
                  onReject={onReject}
                  onSuspend={onSuspend}
                  onViewDetails={onViewDetails}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
               <div>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Agency</p>
                  <p className="text-[10px] font-bold text-foreground/80 truncate">
                     {admin?.agencyName || 'Independent'}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Joined</p>
                  <p className="text-[10px] font-bold text-foreground/80">
                     {admin?.createdAt ? format(new Date(admin.createdAt), 'dd MMM yyyy') : 'Recently'}
                  </p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md shadow-inner">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
              <TableHead className="w-[100px] py-6 px-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Admin</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Full Name</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Contact Info</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Agency Profile</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground text-center">Status</TableHead>
              <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Joined Date</TableHead>
              <TableHead className="text-right py-6 px-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminList.map((admin) => (
              <TableRow key={admin?.id || Math.random()} className="hover:bg-primary/[0.03] transition-colors border-b border-border/20 group">
                <TableCell className="py-5 px-6">
                  <div className="relative">
                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-lg transition-transform group-hover:scale-105 group-hover:rotate-2">
                      <AvatarImage src={admin?.avatarUrl} alt={`${admin?.firstName} ${admin?.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-black uppercase">
                        {admin?.firstName ? admin.firstName.charAt(0).toUpperCase() : ''}
                        {admin?.lastName ? admin.lastName.charAt(0).toUpperCase() : ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background shadow-sm ${admin?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <p className="font-black text-foreground tracking-tight text-base uppercase">
                    {admin?.firstName || ''} {admin?.lastName || ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                      ID: {admin?.id ? admin.id.slice(0, 8).toUpperCase() : 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium group/mail cursor-pointer hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{admin?.email || 'N/A'}</span>
                    </div>
                    {admin?.phoneNumber && (
                      <span className="text-xs text-muted-foreground/70 font-bold tracking-tight">
                        + {admin.phoneNumber}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center border border-border/40">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-sm text-foreground/80 tracking-tight">
                      {admin?.agencyName || (
                        <span className="text-muted-foreground/40 italic font-medium">Independent</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-5 text-center">
                  <StatusBadge status={admin?.status || 'PENDING'} />
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {admin?.createdAt ? format(new Date(admin.createdAt), 'MMM dd, yyyy') : 'Recently'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-5 px-6">
                  <ActionDropdown
                    admin={admin}
                    onApprove={onApprove}
                    onReject={onReject}
                    onSuspend={onSuspend}
                    onViewDetails={onViewDetails}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTable;
