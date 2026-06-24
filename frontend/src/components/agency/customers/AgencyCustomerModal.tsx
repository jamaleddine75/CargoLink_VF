import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgencyCustomerForm } from './AgencyCustomerForm';
import { AgencyCustomerRequest } from '@/services/api/agencyCustomerService';

interface AgencyCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgencyCustomerRequest) => void;
  initialData?: Partial<AgencyCustomerRequest>;
  loading?: boolean;
  title: string;
}

export function AgencyCustomerModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading,
  title 
}: AgencyCustomerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0f172a] border-white/10 text-white rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-black">
            Fill in the details below to manage your customer relationship.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <AgencyCustomerForm 
            initialData={initialData} 
            onSubmit={onSubmit} 
            loading={loading} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
