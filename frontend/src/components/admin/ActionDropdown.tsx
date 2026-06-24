import React from 'react';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Slash, 
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User } from '@/types';

interface ActionDropdownProps {
  admin: User;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string, suspend: boolean) => void;
  onViewDetails: (admin: User) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  admin,
  onApprove,
  onReject,
  onSuspend,
  onViewDetails,
}) => {
  const isPending = admin.status === 'PENDING';
  const isSuspended = admin.status === 'SUSPENDED';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(admin)} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-blue-500" />
          <span>View details</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {isPending && (
          <>
            <DropdownMenuItem 
              onClick={() => onApprove(admin.id)}
              className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Approve</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onReject(admin.id)}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              <span>Reject</span>
            </DropdownMenuItem>
          </>
        )}

        {!isPending && (
          <DropdownMenuItem 
            onClick={() => onSuspend(admin.id, !isSuspended)}
            className="cursor-pointer"
          >
            {isSuspended ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Unsuspend</span>
              </>
            ) : (
              <>
                <Slash className="mr-2 h-4 w-4 text-red-600" />
                <span className="text-red-600">Suspend</span>
              </>
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionDropdown;
